# Relatório do gate da Fase 6

**Veredito proposto:** pronto para o GATE 6, com uma pendência de evidência que só a CI fecha (E2E da cartilha nos
três navegadores) e as pendências do dono da seção 8. A revisão de XSS do Markdown renderizado não achou CRITICAL
nem HIGH. Nada foi publicado, nenhuma tag foi criada e nada foi enviado ao remoto.

Medição: Node v26, Linux, `corepack pnpm verify` de 23/10/2026 depois do último commit de código. Os números vêm de
uma execução.

## 1. Unidades e commits

Os commits não carregam o número da unidade no título; o agrupamento é pelo assunto.

| Unidade | Commits |
| --- | --- |
| U6-01 motor de lições | 37197f7, f6074f2 (contrato e brechas) |
| U6-03a lições 1 a 4 | 6f16121 |
| U6-03b lições 5 a 8 | fc7053c |
| U6-03c lições 9 a 11 | 875c962 |
| U6-02 interface `/cartilha` e correção | e983466, 84dbb07 (teto de tempo da correção), 7ad4eb7 (E2E só na CI) |
| U6-04 diagnósticos e termos ligados às lições | 4bdb371, bef1c4f (página "o que mudou" e prebuild) |
| U6-05 kit do piloto | def0962, 0a33a62 |
| U6-06 retorno do piloto | 9bff999 |
| U6-07 este gate | commit deste relatório (E2E da lição 11 e teste de `data:`) |

## 2. Cobertura (`vitest run --coverage`)

| Alvo | Linhas | Ramos | Funções |
| --- | --- | --- | --- |
| `apps/playground/config` | 92,86% (104/112) | 88,31% (68/77) | 96,55% (28/29) |
| `apps/playground/lib` | 92,68% (810/874) | 91,36% (539/590) | 89,64% (277/309) |
| `apps/playground/sandbox` | 86,15% (56/65) | 70,45% (31/44) | 75,00% (12/16) |
| `apps/playground/{config,lib,sandbox}` junto (a conta do piso) | 92,29% (970/1051) | 89,73% (638/711) | 89,55% (317/354) |
| Repositório inteiro (cobertura do `verify`) | 97,69% (5123/5244) | 93,09% (3517/3778) | 96,79% (1509/1559) |

O piso de 80% vale pelo conjunto `apps/playground/{config,lib,sandbox}` e passa. Em separado, `sandbox` fica abaixo de
80% em ramos e funções (o código que só roda dentro do iframe do navegador é coberto pelo E2E, que não entra nesta
conta); o conjunto fecha em 89,73% de ramos.

Total do `verify`: 2.695 testes passando e 7 ignorados em 235 arquivos (mais 1 arquivo ignorado); o projeto `compiler`
à parte: 966 testes em 65 arquivos.

## 3. Conteúdo da cartilha rodando no CI

`apps/playground/tests/cartilha-content.test.ts` carrega as lições reais e executa, com o compilador e um processo
Node de verdade, cada bloco e cada solução. Medido agora:

| Item | Quantidade |
| --- | --- |
| Lições carregadas, sem nenhum problema | 11 (`licao-01` a `licao-11`) |
| Blocos de código | 31 (11 `exemplo`, 15 estáticos, 5 `erro-esperado`) |
| Soluções de exercício executadas contra a saída esperada | 11 |
| Exercícios com `stdin` preparado | 1 (lição 11, resposta `10,50`) |

Os blocos `erro-esperado` precisam emitir exatamente o código marcado; os demais não podem emitir nenhum diagnóstico.

**Segurança da execução (revisão independente do Engoianador, achado M3, corrigido em 9f7f43e).** O processo Node que
roda o programa da lição sobe com o modelo de permissão (`--permission`) e leitura restrita à pasta temporária do
programa (`--allow-fs-read`); rede, processo filho e escrita ficam negados por padrão. Testes em
`run-lesson-program.test.ts`: leitura fora da pasta falha, escrita e processo filho falham, leitura do próprio programa
continua funcionando. Conferido que `check-cartilha` passa nos Node 22.23, 24.21 e 26 (engines `>=22.22.1`).

## 4. E2E da cartilha por navegador

Os testes rodam só na CI porque o disco local não comporta os navegadores do Playwright (ver
`docs/fase-6/e2e-cartilha-ci.md`). Localmente foi feita a listagem (`test:e2e:list`: 174 testes em 13 arquivos, nos três
projetos) e a checagem do comportamento por baixo de cada teste novo, sem navegador.

| Arquivo | Testes | Chromium | Firefox | WebKit |
| --- | --- | --- | --- | --- |
| `cartilha-lesson.spec.ts` | 4 | pendente de CI | pendente de CI | pendente de CI |
| `cartilha-progress.spec.ts` | 3 | pendente de CI | pendente de CI | pendente de CI |
| `cartilha-pergunta.spec.ts` (novo) | 2 | pendente de CI | pendente de CI | pendente de CI |

O RED do navegador não pôde ser observado aqui. O que foi observado, rodando o compilador e o programa de verdade:

- starter da lição 11 (frete `1.000,50`): compila com o aviso `GS0805` e imprime `Quanto custa? Preço: 10.5 Frete: 1 50`,
  diferente do esperado, então o veredito é `wrong`;
- solução da lição 11 com `10,50` no stdin: nenhum diagnóstico e `Quanto custa? Preço: 10.5 Frete: 1000.5`, igual ao esperado.

A CI deve confirmar o verde nos três navegadores, olhando em especial o teste "sem localStorage a lição continua
funcionando" no Firefox e no WebKit e a espera por `data-verdict` em `exercise-verdict`.

## 5. Revisão de XSS do Markdown renderizado

Perímetro: `LessonProse.tsx` (react-markdown 10.1.0, `skipHtml`, sem plugin de HTML bruto, `img` descartada, `urlTransform`
e `a` filtrando por `isSafeLessonHref`). Não há `dangerouslySetInnerHTML` nem `innerHTML` em `components/`, `app/` nem
`lib/` do playground.

| Entrada no corpo | Resultado | Teste |
| --- | --- | --- |
| `<script>alert(1)</script>` | descartado, nenhuma tag nem texto executável | `lesson-prose.test.ts` |
| `<img src=x onerror=alert(1)>` | descartado (`<img` e `onerror` ausentes) | `lesson-prose.test.ts` |
| `[x](javascript:alert(1))`, também com caixa mista | o texto fica, o `href` cai fora | `lesson-prose.test.ts` |
| `[x](data:text/html;base64,...)` e `![x](data:image/svg+xml;base64,...)` | `href` e imagem caem fora | `lesson-prose.test.ts` (caso `data:` acrescentado neste gate) |
| `[x](http://exemplo.org)` | `href` cai fora (só `https:` e caminho interno) | `lesson-prose.test.ts` |
| `[x](//outro.site)` e `[x](/\outro.site)` | recusado pelo padrão de caminho interno | `markdown-urls.test.ts` |
| `<b>` dentro de bloco de código | sai escapado (`&lt;b&gt;`) | `lesson-prose.test.ts` |

Achados: nenhum CRITICAL, nenhum HIGH. A revisão foi feita pelo executor do gate, não por agente em contexto fresco. Os
arquivos de conteúdo são do repositório (revisados em PR), não entrada de usuário; o `localStorage` guarda só a lista de
ids concluídos, e toda leitura e escrita passa por `try/catch`.

## 6. Piloto e meta S8

- Aprendizes com as lições 1 a 5 concluídas: `0/3`.
- Estado: `pendente do dono`. O kit está em `docs/piloto/` e `docs/piloto/relatorio-piloto.md` registra "nenhuma
  mensagem nem lição alterada" por falta de retorno. Nenhum número foi inventado.

## 7. Rastreabilidade da Fase 6

| Promessa | Prova |
| --- | --- |
| Cada diagnóstico aponta para a lição certa | `apps/playground/tests/lesson-catalog.test.ts` (verde no `verify`) |
| Os blocos e as soluções das lições rodam no CI | `apps/playground/tests/cartilha-content.test.ts` (verde no `verify`) |
| O Markdown da lição nunca vira HTML bruto | `apps/playground/tests/cartilha/lesson-prose.test.ts` (verde no `verify`) |
| A lição funciona sem armazenamento | `cartilha-progress.spec.ts`, "sem localStorage a lição continua funcionando" (pendente de CI) |
| A lição 11 responde `pergunta` com o `stdin` e corrige | `cartilha-pergunta.spec.ts` (pendente de CI) |

## 8. Pendências do dono

| Item | Unidade | O que está pronto | Comando ou ação do dono | Evidência esperada | Estado |
| --- | --- | --- | --- | --- | --- |
| Rodar o piloto com 3 a 5 aprendizes (um de fora de Goiás) | U6-05 | roteiro, formulário, modelo de relatório e `summarize-pilot` | conduzir as sessões e salvar `docs/piloto/respostas/AN.json` | resumo com `3/3` ou mais | pendente do dono |
| Meta S8 (3 aprendizes com as lições 1 a 5) | U6-06 | `relatorio-piloto.md` com `0/3` | rodar `corepack pnpm --filter playground exec node scripts/summarize-pilot.ts` e atualizar o relatório | `3/3` ou mais no resumo | pendente do dono |
| Domínio da cartilha e `goiasscript.lessonBaseUrl` | U6-04 | links `/cartilha/<id>` e a configuração `lessonBaseUrl` da extensão (https, restrita no Modo Restrito) | definir o domínio e apontar a configuração para ele | link de um erro abrindo a lição certa | pendente do dono |
| Projeto na Vercel e deploy do playground | U6-02 | `vercel.json`, cabeçalhos de segurança e build testado | criar o projeto, ligar o repositório e implantar | URL implantada servindo `/cartilha` | pendente do dono |
| `docs/spec` publicado como página "o que mudou" | U6-04 | `/cartilha/o-que-mudou` lê `docs/spec/o-que-mudou.md` | conferir o texto final do spec e a página implantada | página implantada igual ao spec | pendente do dono |
| E2E da cartilha nos três navegadores | U6-02, U6-07 | seis testes mais os dois da lição 11 | abrir o PR e ler a execução do workflow do playground | Chromium, Firefox e WebKit verdes | pendente de CI |

## 9. Limites desta medição

1. O E2E em navegador não rodou localmente (seção 4); o RED dele foi substituído pela observação do comportamento por baixo.
2. A revisão de XSS foi feita pelo executor, sem agente em contexto fresco (seção 5).
3. O piloto não tem retorno (seção 6): S8 fica em `0/3`.
