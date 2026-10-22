# GoiásScript 3 — Design

| Campo | Valor |
|---|---|
| Status | Aprovado pelo dono em 2026-10-14 (D9, D10); propostas P8–P13, P15 e P16 pendentes da RFC-0001 (§3.1) |
| Data | 2026-10-14 |
| Dono | Gefferson Souza |
| Branch | `docs/goiasscript-3-design` |
| Substitui | Toda a implementação 1.5 (`packages/core`, `vscode-extension/`) e a 2.0.0 publicada no npm |
| Evidência | [`docs/auditoria/2026-10-13/`](../../auditoria/2026-10-13/) · [`docs/pesquisa/2026-10-13-arquitetura-compilador/relatorio.md`](../../pesquisa/2026-10-13-arquitetura-compilador/relatorio.md) |

Este documento é o design do GoiásScript 3, aprovado pelo dono (D9, D10). Onde o texto traz uma escolha de linguagem
ainda pendente, ela vem marcada "(P#)" e consta na §3.1. Ele é o contrato que o plano de implementação segue; tudo que
aqui é decisão vale até ser mudado por RFC (§9.3).

---

## 1. Contexto

A auditoria completa de 2026-10-13 (5 frentes, A–E, mais o scanner quantitativo, F) encontrou **2 CRITICAL, 44 HIGH,
62 MEDIUM e 34 LOW** (soma de A–E; o scanner F não classifica por severidade). Os fatos que motivam a reconstrução:

1. **A tradução é regex sobre o texto cru.** 104 de 173 casos adversariais falham e `{ de: "SP" }` vira
   `{ "of": "SP" }` sem erro ([A-nucleo F01–F06](../../auditoria/2026-10-13/A-nucleo-compilador.md)); 9 de 15 `.gs`
   versionados geram JS inválido com `success: true` ([C QA-02](../../auditoria/2026-10-13/C-testes-ci-gates.md);
   10 de 20 contando os 5 exemplos do playground, que não são versionados:
   [relatório §1](../../pesquisa/2026-10-13-arquitetura-compilador/relatorio.md)).
2. **O runtime injetado são 5.464 B, 92,9% da saída de `lista-mapeamento.gs` (5.884 B)**, altera protótipos nativos
   com 52 propriedades enumeráveis e deixa `for...in` 11–18x mais lento
   ([relatório §1](../../pesquisa/2026-10-13-arquitetura-compilador/relatorio.md)).
3. **O CLI apaga o fonte** (`filePath.replace('.gs', …)`) e a extensão tem injeção de comando no shell
   ([B F01](../../auditoria/2026-10-13/B-cli-repl-pacote.md), [E F01](../../auditoria/2026-10-13/E-governanca-extensao-historico.md)).
4. **Os testes não protegem:** 58% dos 85 exercitam código inalcançável; cobertura real 36%; mutação 28/119
   ([C QA-01..03](../../auditoria/2026-10-13/C-testes-ci-gates.md)).
5. **As regras do dono não são cumpridas nem impostas:** 6/52 arquivos conformes, 283 identificadores em português,
   nenhum hook, `main` sem proteção ([F](../../auditoria/2026-10-13/F-conformidade-quantitativa.md)).
6. **O ecossistema prometido no vídeo de lançamento não está disponível:** playground sem deploy, extensão não
   publicada, Engoianador chamando modelo desligado, npm com a 2.0.0 arquivada
   ([D](../../auditoria/2026-10-13/D-apps.md), [KNOWN-FACTS](../../auditoria/2026-10-13/KNOWN-FACTS.md)).

**Veredito:** manter o repositório, o nome e o pacote `goiasscript` no npm; **recomeçar o núcleo** (compilador,
CLI, REPL, casca da extensão); refatorar playground e Worker do Engoianador; reaproveitar dados e UX.

---

## 2. Objetivos, público e critérios de sucesso

### 2.1 Objetivo

GoiásScript é uma **linguagem educacional** para iniciantes brasileiros e uma **brincadeira cultural/viral** de humor
goiano. Ela compila para JavaScript, mas **GoiásScript não é JavaScript**: tem vocabulário, biblioteca padrão e
mensagens próprios, 100% em goianês.

### 2.2 Não-objetivos

- Não é vitrine técnica nem linguagem de produção: não há interop com o ecossistema JS (npm, DOM, APIs nativas).
- Não há módulos, sistema de tipos, gerenciador de balaios (`gs-balaio`) nem debugger (`gs-fuçá`) na v3.
- Não há IR própria (CFG/SSA) nem otimizador escrito do zero além do descrito em §5.8.

### 2.3 Critérios de sucesso (mensuráveis, todos verificados por máquina)

| # | Critério | Como se prova |
|---|---|---|
| S1 | Toda afirmação pública (README, docs, vídeo, descrição do GitHub, cartilha) é provada por um teste | Gate de promessas públicas (§8.5) + tabela de rastreabilidade (§11) |
| S2 | Os 173 casos da auditoria estão triados e verdes (bug corrigido ou mudança intencional com golden) | Corpus de conformidade (§8.2) |
| S3 | Zero achado CRITICAL/HIGH da auditoria aberto no lançamento | Checklist de achados no PR de release, com os dois CRITICAL ([B F01](../../auditoria/2026-10-13/B-cli-repl-pacote.md), [E F01](../../auditoria/2026-10-13/E-governanca-extensao-historico.md)) ligados aos testes de regressão da §8.2; as palavras aposentadas ([E F02](../../auditoria/2026-10-13/E-governanca-extensao-historico.md), [A F12](../../auditoria/2026-10-13/A-nucleo-compilador.md)) fecham pela §4.2, com um golden de GS0306 por palavra |
| S4 | Programa que só usa operações nativas sai, no alvo `module` (o padrão), com **0 bytes de runtime** (a diretiva `'use strict'` e a trava de laço dos alvos `repl` e `playground` não contam) | Orçamento no CI (§8.4) |
| S5 | Código novo (pacote novo, ou arquivo criado ou alterado a partir da Fase 1) sem violação das regras bloqueantes do dono; as heurísticas só avisam e o que depende de julgamento passa pela revisão do agente revisor (§8.3). Única exceção, delimitada e a confirmar pelo dono (§10.3): mutação local no estado do lexer, do parser e do analisador (ADR-0004) | Matriz da §8.1: ESLint, scanner e dependency-cruiser bloqueantes, com baseline vazio |
| S6 | Cobertura ≥ 80% por pacote e nota de mutação ≥ limiar fixado ao fim da Fase 2 | Vitest + Stryker no CI (§8.2) |
| S7 | CLI no npm, playground no ar, extensão no Marketplace e Open VSX, Engoianador no ar | Smoke pós-publicação |
| S8 | Piloto: ≥ 3 aprendizes concluem as lições 1–5 da cartilha; retorno sobre as mensagens registrado | Relatório do piloto (Fase 6) |

Os tetos absolutos (S4, §5.11) valem desde a Fase 2; os tetos relativos e o limiar de mutação são fixados ao fim da
Fase 2 (§5.11).

---

## 3. Decisões do dono (registro)

| # | Decisão | Data |
|---|---|---|
| D1 | Objetivo: educacional + cultural/viral | 2026-10-13 |
| D2 | Superfície: goianês puro num subconjunto didático; keyword em inglês dá erro amigável | 2026-10-13 |
| D3 | Relançamento inclui CLI + REPL no npm, playground + cartilha, extensão VS Code, Engoianador | 2026-10-13 |
| D4 | Abordagem B: lexer e parser próprios, escritos à mão; emissão por edições; acorn só como oráculo de teste | 2026-10-13 |
| D5 | `trem` → `let` | 2026-10-14 |
| D6 | `super` em goianês é **`a_raiz`** | 2026-10-14 |
| D7 | Reservar as palavras do GoiásScript **e** do JavaScript; GoiásScript não acessa JS nativo | 2026-10-14 |
| D8 | Biblioteca padrão com nomes **bem goianos** (tabela aprovada nome a nome na RFC-0001) | 2026-10-14 |
| D9 | Seções 1–5 do design aprovadas como apresentadas, com os ajustes D5–D8 | 2026-10-14 |
| D10 | Spec aprovado por inteiro (§1–§12), com as propostas P1–P7, P14 e P17 | 2026-10-14 |
| D11 | Reescrever o histórico público no primeiro passo da Fase 1, antes da tag `legacy/1.5` (ADR-0011) | 2026-10-14 |
| D12 | Plano 1 executado como grafo de unidades: worktree, TDD e revisor independente por unidade, gate humano por fase | 2026-10-14 |
| D13 | PR de fase entra na `main` por rebase (um commit por unidade, histórico linear); os demais PRs, por squash | 2026-10-14 |

### 3.1 Propostas pendentes de aprovação do dono

As propostas abaixo são escolhas de linguagem ou de processo. As da coluna "Spec" foram aprovadas pelo dono em
2026-10-14 (D10); as da coluna "RFC-0001" são decididas na aprovação da RFC-0001 (Fase 0).
Cada uma está escrita no ponto de uso, marcada "(P#)", e só vale depois de aprovada pelo dono (na revisão deste spec ou na
RFC-0001, conforme a coluna). Recusada, o texto volta para a alternativa indicada.

| # | Proposta | Alternativa se recusada | Onde aprova |
|---|---|---|---|
| P1 | Mundo fechado também para membros: `x.nome` só vale se `nome` foi declarado no arquivo ou é da biblioteca; membro nativo do JS dá erro (`lista.some` → GS0406) | Só identificadores verificados; membros nativos sem nome goiano passam (contraria D7) | Spec |
| P2 | Palavra do JavaScript (§4.4) não serve de nome em posição nenhuma, inclusive propriedade (`{ new: 1 }`, `obj.public`) | Aceitar palavra do JS como nome de propriedade | Spec |
| P3 | Reserva de membro da biblioteca por forma: propriedade (`.tamanho`, `.mensagem`) reservada sempre; método só como membro chamável; campo de dado livre (`{ ano: 2026 }`); membro de `Conta`/`Coisa` não reserva | Reservar todo nome da biblioteca como membro | Spec |
| P4 | Nome global da biblioteca (`prosa`, `pergunta`, `Conta`, `Data`, `Erro`…) pode ser declarado pelo aluno e esconde o da biblioteca, com aviso GS0804 | Reservar esses nomes como identificador (GS0303) | Spec |
| P5 | Alfabeto fixo de identificador: `A–Z`, `a–z`, letras acentuadas do português, dígitos e `_` | `ID_Start`/`ID_Continue` de uma versão fixa do Unicode | Spec |
| P6 | Função como valor só com seta (`=>`); `faz_trem` sem nome fica fora; seta assíncrona `vai_na_frente (x) => {…}` entra | Aceitar `faz_trem(…) {…}` anônimo como expressão | Spec |
| P7 | Corpo de condicional, laço, `tenta_aí`/`se_der_ruim`/`por_fim`, função e classe sempre entre `{ }` | Aceitar corpo de uma instrução sem chaves | Spec |
| P8 | `vixe` é instrução; `vixe(erro)` com o parâmetro do `se_der_ruim` relança o mesmo erro | `vixe` sempre embrulha em `Error` | RFC-0001 |
| P9 | `.ordenar()` sem comparador, ordem total e estável (números, depois textos pt-BR, depois o resto) | `.ordenar(comparador?)` | RFC-0001 |
| P10 | `.mensagem` didática: erro do motor chega em português do catálogo GS07xx | `.mensagem` nativa (texto do motor, em inglês) | RFC-0001 |
| P11 | `vira_número` didática (aceita vírgula decimal; texto vazio dá `NaN`) e `é_número(x)` no lugar de `num_é_número` | `vira_número` = `Number`; `num_é_número` = `Number.isNaN` | RFC-0001 |
| P12 | Números à brasileira: `1.000.000` é erro léxico; `10,50` onde a vírgula não cabe é erro com a correção; `1.000,50` em argumentos é aviso | Sem diagnóstico específico | RFC-0001 |
| P13 | Palavras aposentadas (1.0/1.5/CLAUDE.md antigo) não são reservadas; só melhoram a mensagem de erro (GS0306) | Reservar as palavras aposentadas | RFC-0001 |
| P14 | No REPL, declarar de novo um nome da sessão substitui o anterior (como no console do navegador); reatribuir um `uai` da sessão continua GS0302 | Redeclaração no REPL é GS0304 | Spec |
| P15 | `Conta.arredondar` na grafia do dono, com `arredondar_pra_baixo`/`arredondar_pra_cima`; `Conta` × `GoianoMath` decidido na RFC-0001 | `Conta.arredonda` | RFC-0001 |
| P16 | `.trocar` mantém o `$` especial do JavaScript no texto de substituição, com aviso GS0808 | Substituição 100% literal via ajudante | RFC-0001 |
| P17 | SemVer da linguagem (§9.5): crescer o conjunto de nomes reservados, inclusive entrada nova na biblioteca, é MAJOR | Tratar entrada nova na biblioteca como MINOR | Spec |

---

## 4. A linguagem GoiásScript 3

### 4.1 Princípios

1. **Goianês puro.** Tudo que o aluno escreve com significado de linguagem é goianês: keywords, atribuição, igualdade,
   lógica e biblioteca padrão. Aritmética e ordem (`+ - * / %`, `< > <= >=`) aceitam o símbolo ou a palavra (§4.5).
   `=`, `==`, `===`, `!=`, `!==`, `&&`, `||` e `!` dão erro amigável com a forma goiana.
2. **Subconjunto pequeno e fechado.** Só é aceito o que a §4.7 lista; cada construção fora da v3 tem um diagnóstico que
   ensina a alternativa goiana.
3. **Mundo fechado.** O compilador conhece todo nome que existe: as declarações do programa mais a biblioteca padrão.
   Vale também para o nome depois de `.` (P1): `x.nome` só vale se `nome` foi declarado no arquivo ou é da biblioteca, e
   membro nativo do JavaScript dá erro (§4.4). É verificação por censo de nomes, sem tipos, e não fronteira de
   segurança: a barreira do playground é a CSP (§6.3).
4. **Semântica previsível.** O que é aceito tem a semântica do JavaScript estrito: sintaxe ES2022 e métodos nativos
   até ES2023 (`.toReversed()` e `.toSorted()`, da §4.9). Exceção: onde a biblioteca padrão declara semântica didática
   própria (marcada na tabela da §4.9).
5. **Uma fonte da verdade.** Toda palavra, apelido e mensagem vive na tabela de `@goiasscript/language` (§5.2).

### 4.2 Vocabulário (keywords, operadores e literais)

Classificação: **R** = reservada (não pode ser nome de variável, função, parâmetro nem classe); **C** = contextual: só
é keyword na posição indicada e, em qualquer outra, é identificador comum (`uai de é 1` e `uai em é 5` são válidos).
`de` e `em` são C porque são nomes comuns de variável e a v3 não tem os operadores `in` e `of` em expressão; a posição
é logo depois do nome declarado no cabeçalho de `vai_indo`: `vai_indo (uai x de lista)`, `vai_indo (uai k em coisa)`.
Os nomes globais da biblioteca (`prosa`, `Conta`…) não são R (P4, §4.9).

**Nome de propriedade.** Depois de `.`, antes de `:` em coisa e como nome de método de classe, qualquer palavra goiana
(R ou C) é aceita como nome, com a grafia original preservada na saída (`obj.mais`, `obj.de`, `{ de: "SP" }`).
Exceções: os nomes reservados da biblioteca (P3, §4.9) e as palavras do JavaScript (§4.4), que não servem de nome em
posição nenhuma, nem de propriedade (P2).

| Categoria | GoiásScript | JavaScript | Classe |
|---|---|---|---|
| Declaração | `uai` | `const` | R |
| Declaração | `trem` | `let` | R |
| Atribuição | `é` | `=` | R |
| Função | `faz_trem` | `function` | R |
| Função | `faz_favor` | `return` | R |
| Função | `vai_na_frente` | `async` | R |
| Função | `vai_na_frente_faz_trem` | `async function` | R |
| Função | `espera_um_cadim` | `await` | R |
| Controle | `se_ocê_quiser` | `if` | R |
| Controle | `se_num_for` | `else if` | R |
| Controle | `se_não` | `else` | R |
| Controle | `vai_indo` | `for` | R |
| Controle | `enquanto_tiver` | `while` | R |
| Controle | `para_com_isso` | `break` | R |
| Controle | `continua_aí` | `continue` | R |
| Controle | `de` | `of` (em `vai_indo`) | C |
| Controle | `em` | `in` (em `vai_indo`) | C |
| Classe | `arruma_trem` | `class` | R |
| Classe | `inherda_de` | `extends` | R |
| Classe | `aprepara_trem` | `constructor` | R |
| Classe | `num_muda` | `static` | R |
| Classe | `a_raiz` | `super` | R |
| Classe | `ocê` | `this` | R |
| Classe | `faz_um` | `new` | R |
| Classe | `é_tipo_de` | `instanceof` | R |
| Erro | `tenta_aí` | `try` | R |
| Erro | `se_der_ruim` | `catch` | R |
| Erro | `por_fim` | `finally` | R |
| Erro | `vixe` | `throw` ou `throw new Error(…)` (instrução, §4.8) | R |
| Literal | `certeza` | `true` | R |
| Literal | `de_jeito_nenhum` | `false` | R |
| Literal | `nada` | `null` | R |
| Literal | `indefinido` | `undefined` | R |
| Operador | `é_igualim` | `===` | R |
| Operador | `diferente` | `!==` | R |
| Operador | `maior_que` | `>` | R |
| Operador | `menor_que` | `<` | R |
| Operador | `pelo_menos` | `>=` | R |
| Operador | `no_máximo` | `<=` | R |
| Operador | `e_mais` | `&&` | R |
| Operador | `ou_então` | `\|\|` | R |
| Operador | `num_é` | `!` | R |
| Operador | `mais` | `+` | R |
| Operador | `menos` | `-` (binário e unário) | R |
| Operador | `vezes` | `*` | R |
| Operador | `dividido` | `/` | R |
| Operador | `sobrou` | `%` | R |

Das 53 entradas da 1.5, as que não estão acima (`prosa`, `reclama`, `promessa`, `quando_resolver`,
`se_der_pobrema`, `resolve_aí`, `rejeita_isso`) passam para a **biblioteca padrão** (§4.9): são nomes de API, não
keywords. `resolve_aí` e `rejeita_isso` são nomes convencionais de parâmetro (identificadores válidos).

**Palavras aposentadas (P13).** Palavras que o 1.0.x ou a documentação da 1.5 usavam e que não existem na v3 não são
keywords, não são reservadas e não têm alias: `uai fazer é 3` continua válido. A tabela `retiredWords` de
`@goiasscript/language` (§5.2) só melhora um erro que já ocorreria, nome não declarado (GS0301) ou erro de sintaxe no
início de instrução: o diagnóstico vira GS0306, com a forma da v3. Ela nunca muda se um programa é aceito.

| Aposentada | Forma na v3 |
|---|---|
| `presta_serviço` / `vai_na_frente_presta_serviço` | `faz_trem` / `vai_na_frente_faz_trem` |
| `mexe_assim nome(…)` | `nome(…) {…}` (método de classe não leva palavra; o construtor é `aprepara_trem`) |
| `vixe_que(msg)` | `vixe(msg)` |
| `vazio` / `sei_lá` | `nada` / `indefinido` |
| `se` / `senao` / `fazer` | `se_ocê_quiser` / `se_não` / `faz_trem` (documentadas na 1.5, nunca implementadas) |
| `é_igual_a` | `é_igualim` |
| `um_tanto_de`, `ninguem_fuça`, `só_da_famia`, `todo_mundo_vê` | sem equivalente: saíram da linguagem |

`lista`, `tem` e `fixo` seguem como nomes comuns, sem entrada na tabela. A página `docs/spec/o-que-mudou.md` é gerada
desta tabela (§5.2).

### 4.3 Grafia, acento e identificadores

- **Forma oficial acentuada.** Toda keyword com acento tem uma variante sem acento, registrada como entrada explícita
  da tabela (nunca por dobra de acentos): `oce`, `se_oce_quiser`, `se_nao`, `no_maximo`, `continua_ai`, `tenta_ai`,
  `e_igualim`, `e_tipo_de`, `ou_entao`, `num_e`. **`é` não tem variante** (`e` é nome comum de variável). A variante
  tem a mesma classe da forma oficial: sendo R, também é reservada e, usada como nome, dá o mesmo erro com sugestão
  (`oce` nunca vira `this` em silêncio). Na biblioteca padrão vale a mesma regra (`asciiName`, §5.2).
- **Normalização NFC só nos tokens identificadores** (nunca no arquivo inteiro: textos e comentários ficam intactos).
  O nome canônico de um identificador é o seu texto em NFC e vale para tudo (keyword, biblioteca, tabela de símbolos,
  propriedade e membro, mensagens); as posições (`range`) continuam no texto original. **A emissão escreve o nome
  canônico:** todo identificador cujo texto difere de NFC recebe uma edição de substituição pelo nome NFC (§5.7; pode
  mudar a coluna, nunca a linha). Assim `café` em NFD, colado de outro editor, é a mesma variável que `café` em NFC, e o
  JavaScript nunca vê dois nomes. Identificador só ASCII não é normalizado.
- **Identificador (P5): alfabeto fixo, independente do Unicode do motor.** Começa com letra ou `_` e continua com
  letra, dígito ou `_`. Letra é `A–Z`, `a–z` e as letras acentuadas do português em NFC (`á à â ã é ê í ó ô õ ú ü ç` e as
  maiúsculas); dígito é `0–9`. A pertinência é checada contra esse conjunto literal, nunca por `\p{ID_Start}` ou tabela
  Unicode do host, para que `compile()` dê o mesmo resultado em qualquer Node da matriz e no navegador. O lexer lê a
  corrida de letras, dígitos, `_` e marcas combinantes (U+0300 a U+036F), normaliza para NFC e valida contra o alfabeto;
  caractere fora dele (outro alfabeto, emoji, `$`) vira `Invalid` com GS0104. Comentários e textos aceitam qualquer
  Unicode. Ampliar o alfabeto só por RFC. Keyword reservada usada como nome dá GS0303, sugerindo outro nome
  (`"mais" é palavra da linguagem; que tal "total"?`).

### 4.4 Palavras do JavaScript (reservadas, D7)

São reservadas e geram diagnóstico, com o equivalente goiano quando existe e, quando não existe, com pedido de outro
nome. Nenhuma serve de nome em posição alguma, nem de propriedade ou de método (`{ new: 1 }`, `obj.public`) (P2).

1. **Keywords JS** (as `ReservedWord` do ES2022, as reservadas do modo estrito e as palavras que a v3 trata como
   keyword): `var let const function return if else for while do break continue switch case default class extends
   constructor static super this new instanceof typeof delete void in of try catch finally throw async await yield
   import export true false null undefined debugger with enum implements interface package private protected public`.
   Com equivalente goiano: GS0401. Sem equivalente (`public`, `enum`): GS0402, que não inventa keyword e pede outro nome
   (`"package" é palavra do JavaScript e não serve de nome; que tal "pacote"?`).
2. **Globais JS:** `console Math JSON Object Array String Number Boolean Promise Date Error RegExp Map Set Symbol
   setTimeout setInterval clearTimeout clearInterval parseInt parseFloat isNaN isFinite globalThis window document
   fetch require module process eval Function Reflect Proxy Intl NaN Infinity`. GS0403, com o equivalente quando houver.
3. **Nomes não ligáveis:** `arguments eval NaN Infinity`. O JS estrito rejeita `arguments` e `eval` como nome ligado e o
   alvo `repl` rejeita `NaN` e `Infinity`; são reservados igual em todos os alvos. Usados como nome (variável,
   parâmetro, função, classe, parâmetro de `se_der_ruim`, variável de `vai_indo`): GS0402.
4. **Membros nativos (P1)** (propriedades e métodos dos protótipos do JavaScript). A lista `jsMembers` é gerada no
   build a partir dos protótipos ES2023 e conferida no CI (§5.2). Em `x.nome` e em `x["nome"]` com texto literal, `nome`
   precisa ser da biblioteca (§4.9) ou ter sido declarado no arquivo: chave de coisa, método de classe ou alvo de
   `x.nome é …`; a pré-passada sobre o arquivo inteiro coleta os declarados (§5.6). Senão:
   - nativo com equivalente goiano (`map filter reduce forEach push pop shift unshift length toUpperCase toLowerCase
     includes indexOf split join trim slice replace replaceAll startsWith endsWith find sort reverse concat then catch
     message keys values entries`, gerada da §4.9): GS0405, com a sugestão (`em goianês é .mapear`);
   - nativo sem equivalente (`some every flat at padStart toString valueOf hasOwnProperty call apply bind`…):
     GS0406, com a alternativa goiana quando existir (`Coisa.tem`, `vai_indo`);
   - desconhecido: GS0305, com sugestão por distância de edição.

   Declarar membro com nome do primeiro grupo (`{ length: 3 }`) também é GS0405; `constructor`, `prototype` e
   `__proto__` são GS0406 em qualquer acesso ou declaração. A checagem é por nome, não por tipo do receptor
   (`lista.nome` passa se `nome` existe como chave em outro objeto), e `x[k]` não literal não é verificado.

### 4.5 Operadores

| Grupo | Aceito | Fora (erro com a forma goiana) |
|---|---|---|
| Aritmética | `+ - * / %` e palavras `mais menos vezes dividido sobrou` | `**` (use `Conta.elevado`), `++ --`, `+= -= *= /= %=` (use `i é i mais 1`) |
| Relacional | `< > <= >=` e `maior_que menor_que pelo_menos no_máximo` | — |
| Atribuição | `é` | `=` |
| Igualdade | `é_igualim diferente` | `== === != !==` |
| Lógica | `e_mais ou_então num_é` | `&& \|\| !` |
| Outros | `.` `,` `( )` `[ ]` `{ }` `=>` (arrow function) | `?:` (use `se_ocê_quiser`), `?.`, `??`, bit a bit, `,` como operador |

Precedência e associatividade são as do JavaScript para o operador equivalente. `é` é expressão de atribuição como o
`=` (associativa à direita, a mais baixa); o alvo é um nome ou um acesso de membro (`ocê.campo é 1`, `lista[0] é 2`), e
outro alvo é GS0209. `num_é` prende mais que qualquer comparação: `num_é a é_igualim b` é `(num_é a) é_igualim b`. Para
negar uma comparação, use `diferente` ou parênteses.

### 4.6 Fim de instrução

Uma regra só decide onde a instrução termina. O lexer sempre entrega a quebra de linha; o parser a consome ou a
descarta conforme o contexto mais interno.

- **Contextos.** O parser mantém uma pilha e só vale o topo:
  - *instrução*: o topo do programa e todo `{ }` de bloco (corpo de função, seta, método, condicional, laço,
    `tenta_aí`/`se_der_ruim`/`por_fim` e classe). A quebra de linha **termina** a instrução simples.
  - *agrupamento*: `( )`, `[ ]` e o `{ }` de coisa (objeto literal). A quebra de linha é **ignorada**.
  - Abrir `( )`, `[ ]` ou coisa empilha "agrupamento". Abrir `{` de bloco empilha "instrução", mesmo dentro de um
    agrupamento (callback em chamada, função dentro de coisa). O `}` que fecha o bloco desempilha e devolve o contexto
    anterior.
- **`{` é bloco** em posição de instrução, depois do `)` de um cabeçalho (`se_ocê_quiser (…)`, `se_num_for (…)`,
  `vai_indo (…)`, `enquanto_tiver (…)`, nome de função ou de método, `se_der_ruim (erro)`), depois de `=>`, depois de
  `se_não`, `tenta_aí`, `por_fim` e `se_der_ruim` sem parâmetro, e depois do nome da classe (ou de `inherda_de X`).
  Em qualquer posição que espera um operando (depois de `é`, `faz_favor`, `(`, `[`, `,`, `:`, operador,
  `espera_um_cadim`), `{` é coisa. Seta que devolve coisa pede parênteses: `x => ({ a: x })`.
- **Instrução simples:** declaração (`uai`, `trem`), expressão, `faz_favor`, `para_com_isso`, `continua_aí` e `vixe`.
  Termina na quebra de linha, no `;` (que também separa instruções numa linha), no `}` que fecha o bloco ou no fim do
  arquivo (`faz_trem soma(a, b) { faz_favor a mais b }`).
- **Instrução composta** (`se_ocê_quiser`, `enquanto_tiver`, `vai_indo`, `tenta_aí`, `faz_trem`, `arruma_trem`) termina
  no `}` do seu último bloco, sem `;` nem quebra depois dele. Os membros de classe não têm separador entre si.
- **A quebra de linha é ignorada, em qualquer contexto,** quando:
  1. o último token da linha é operador binário (símbolo ou palavra), `é`, `,`, `.`, `=>`, `(`, `[` ou `{`;
  2. a próxima linha começa com `.` (encadeamento de métodos);
  3. o próximo token é o `{` do corpo de uma construção que exige bloco (estilo Allman, inclusive
     `arruma_trem X inherda_de Y`);
  4. a próxima palavra, depois do `}` que fecha um bloco, continua a instrução: `se_num_for` ou `se_não` depois de
     `se_ocê_quiser`/`se_num_for`; `se_der_ruim` ou `por_fim` depois de `tenta_aí`; `por_fim` depois de `se_der_ruim`.
     Linhas em branco e comentários entre as duas não contam. Qualquer outra palavra deixa a quebra terminar a
     instrução.
- **Onde a quebra não continua a linha.** Próxima linha começando com operador binário, símbolo ou palavra (`mais b`,
  `e_mais x`): a instrução termina na linha de cima e o parser dá GS0203; só `.` continua a linha pelo início.
  `se_num_for`, `se_não`, `se_der_ruim` ou `por_fim` sem a instrução que continua é GS0205. Entre os parâmetros de uma
  seta e o `=>` a quebra é proibida mesmo dentro de `( )` (GS0204), e entre `vai_na_frente` e o que o segue também
  (GS0202): o JavaScript proíbe quebra nesses pontos e a saída preserva as linhas.
- **Detalhes.** Comentário `/* … */` com quebra de linha conta como quebra, como no JavaScript. `faz_favor` seguido de
  quebra devolve `indefinido`. Terminador de linha é `\n`, `\r\n` (conta uma vez) ou `\r`; U+2028 e U+2029 são proibidos
  (GS0105). No alvo `repl` a entrada termina no `}` seguido de quebra, e `se_não` ou `por_fim` em linha nova dá GS0205
  (§6.2).
- **Emissão de `;`.** A emissão insere `;` explícito no fim de cada instrução simples, escolhido pelo tipo da
  instrução e não pelo último caractere: `uai f é x => { … }`, `uai o é { a: 1 }` e uma expressão que termina em `}`
  recebem `;`. Nunca insere `;` depois do `}` de instrução composta nem dentro do cabeçalho de `vai_indo`, e não duplica
  o `;` do aluno. Assim a inserção automática do JavaScript nunca une linhas e o JS emitido é válido.

Callback em bloco, sem `;`:

```
lista.pra_cada(x => {
  prosa(x)
  prosa(x mais 1)
})
```

```js
lista.forEach(x => {
  console.log(x);
  console.log(x + 1);
});
```

O `{` depois de `=>` empilha "instrução": as duas quebras de dentro do callback terminam instruções, e a quebra depois
do `)` final termina a instrução externa. O mesmo vale para uma seta com bloco dentro de coisa em várias linhas
(`uai acoes é { dobra: x => { … } }`): no corpo de `dobra` volta a regra de instrução.

### 4.7 Subconjunto da v3

**Dentro:**

| Construção | Exemplo |
|---|---|
| Declarações | `uai nome é "Goiás"`, `trem i é 0` (`uai` sempre com valor inicial, GS0307) |
| Funções | `faz_trem soma(a, b) { faz_favor a mais b }`, `x => x vezes 2`, `(a, b) => { faz_favor a mais b }`, `vai_na_frente faz_trem busca() {…}`, `vai_na_frente (x) => {…}` |
| Condicionais | `se_ocê_quiser (…) {…} se_num_for (…) {…} se_não {…}` |
| Laços | `vai_indo (trem i é 0; i menor_que 10; i é i mais 1)`, `vai_indo (uai x de lista)`, `vai_indo (uai k em coisa)`, `enquanto_tiver (…)`, `para_com_isso`, `continua_aí` |
| Dados | números (`12`, `1.5`, `1e3`; decimal sempre com ponto), textos (`"…"` e `'…'` com escapes), `certeza`, `de_jeito_nenhum`, `nada`, `indefinido`, listas `[…]`, coisas (objetos) `{ chave: valor }` |
| Classes | `arruma_trem Pequi inherda_de Fruta { aprepara_trem(n) { a_raiz(n) } num_muda criar() {…} }`, `faz_um Pequi("verde")`, `ocê.campo`, `x é_tipo_de Pequi` |
| Erros | `tenta_aí {…} se_der_ruim (erro) {…} por_fim {…}`, `vixe("Deu ruim, sô!")` |
| Assíncrono | `vai_na_frente`, `espera_um_cadim` (inclusive no topo do programa), `faz_um promessa(…)` |
| Entrada | `pergunta("Cê chama como?")` (§4.10) |
| Comentários | `// …` e `/* … */` |

**Fora da v3** (cada item tem diagnóstico que ensina a alternativa: um código por item, `GS0501` em diante, numerados na
RFC-0001): template literals (junte com `mais`), regex literais, desestruturação e spread, `switch`, `do…while`,
rótulos, getters/setters, campos de classe declarados no corpo, campos privados `#x`, generators, `typeof`, `delete`,
`void`, módulos (`pega`/`troca_ideia`), anotações de tipo (`uai x: texto`), números com `_`, hexadecimais e BigInt,
texto multilinha, expressão de função (`faz_trem` sem nome como valor: use seta ou declaração nomeada), e, em coisa,
abreviação (`{ x }`), método abreviado (`{ f() {…} }`) e chave computada (`{ [k]: v }`).

**Regra de pertinência (lista de permissão).** A gramática da v3 é fechada: só é aceito o que está em "Dentro" e na
tabela de decisões abaixo. A EBNF (`docs/spec/gramatica.md`) é normativa e não aceita nada além disso. Toda outra
construção do JavaScript é fora da v3 e recebe `GS0500` ("isso do JavaScript ainda não existe em GoiásScript 3"), com
ajuda quando houver alternativa goiana. Texto que não é JavaScript válido continua sendo erro de sintaxe `GS02xx`. As
decisões da tabela ficam congeladas com a aprovação da RFC-0001 (§9.3); as marcadas "(P#)" dependem também da aprovação
do dono (§3.1).

| Construção | Decisão |
|---|---|
| Corpo de `se_ocê_quiser`, `se_num_for`, `se_não`, `vai_indo`, `enquanto_tiver`, `tenta_aí`, `se_der_ruim`, `por_fim`, função, método e classe | Sempre entre `{ }` (P7). Corpo sem chaves é GS0207, com a correção "bota as chaves". Única exceção: corpo-expressão de seta (`x => x vezes 2`). A trava de laço do playground insere o contador logo depois da `{` do corpo, na mesma linha (§5.7). |
| `se_num_for`, `se_não`, `se_der_ruim`, `por_fim` | Continuam a instrução anterior, na linha do `}` ou na seguinte (§4.6). |
| Função como valor | Só seta (`=>`) (P6): `faz_trem` sem nome fica fora. Corpo de seta com `{` é bloco; para devolver uma coisa direto, use parênteses: `x => ({ nome: x })`. Quando a primeira instrução desse bloco tem a forma `nome: valor`, o diagnóstico de rótulo acrescenta a dica dos parênteses. |
| Assíncrono | `vai_na_frente` vale antes de `faz_trem` nomeada, de seta (`vai_na_frente x => …`, `vai_na_frente (a, b) => {…}`) (P6) e de método de classe (`vai_na_frente busca() {…}`). `espera_um_cadim` e `pergunta` valem dentro de qualquer um deles. |
| Vírgula final | Aceita em lista, coisa, parâmetros e argumentos (`[1, 2,]`, `{ a: 1, }`). Passa para o JS sem edição. |
| Coisa (objeto literal) | Só `chave: valor`, com chave identificador (palavra do JS não serve, P2), texto ou número. |
| `tenta_aí` | Exige `se_der_ruim` ou `por_fim` (um dos dois ou ambos); sozinho é erro de sintaxe (GS0202). `se_der_ruim {…}` sem parâmetro é aceito. |
| `uai` sem valor inicial | GS0307, porque `const x;` não é JS válido. `trem x` sem valor inicial é aceito e vale `indefinido`. |
| `ocê` | Aceito em construtor, método e `faz_trem`; a seta usa o `ocê` de fora. Fora de qualquer função, método ou construtor é aviso pedagógico (`ocê` vale `indefinido` no alvo `module`; nos alvos que não são módulo ES vale o objeto global do contexto, §5.7; código fixado na RFC-0001). |
| `a_raiz` | `a_raiz(args)` só no `aprepara_trem` de classe que herda, antes de qualquer uso de `ocê`; `a_raiz.metodo(args)` em método ou construtor de classe que herda. Qualquer outro uso é GS0311. |

**Números e textos.** Decimal é com ponto e não há separador de milhar (`1.5`, `1000000`). Zero à esquerda (`08`,
`01310`) é GS0101, com a ajuda de usar texto para CEP e telefone. Os escapes de texto são os do JavaScript estrito;
octal, `\8`, `\9` e `\x`/`\u` incompletos são GS0102. **Números à brasileira (P12):** o compilador reconhece os
hábitos do pt-BR e ensina a forma certa, só onde não há ambiguidade. `1.000.000` (mais de um grupo de ponto) é GS0101,
com a correção `1000000`. `10,50` onde a vírgula não pode separar nada (fim do valor de `uai`/`trem`, depois de
`faz_favor`, instrução solta) é GS0208, com a correção `10.50`. `1.000,50` (a forma `\d{1,3}(\.\d{3})+,\d+`) em lista
de argumentos ou de elementos é aviso GS0805, porque compila como dois valores. Não há diagnóstico para `[1,2,3]`,
`soma(2,3)` nem `3.141`: são válidos e comuns.

### 4.8 Macros

- `vixe(expr)` é **instrução** (P8), não expressão (nó `ThrowStatement`, §5.5): exige exatamente um argumento e termina
  a instrução. O rebaixamento é uma única edição na keyword, escolhida nesta ordem:

  | Quando | Emite |
  |---|---|
  | `expr` é `faz_um X(…)` | `throw` (`vixe(faz_um Erro("a"))` vira `throw (new Error("a"));`) |
  | `expr` é exatamente o parâmetro do `se_der_ruim` envolvente (relança o mesmo erro, com classe e pilha) | `throw` (`vixe(erro)` vira `throw (erro);`) |
  | qualquer outro `expr` (a mensagem) | `throw new Error` (`vixe("Deu ruim, sô!")` vira `throw new Error("Deu ruim, sô!");`) |

  Em posição de expressão (corpo conciso de seta `x => vixe("…")`, operando de `ou_então`/`e_mais`, argumento de
  chamada, lado direito de `é`) ou com número de argumentos diferente de 1, o parser dá GS0206 com a ajuda `vixe é uma
  instrução; use bloco: x => { vixe("…") }`. A saída nunca tem `throw` fora de instrução.
- `vai_na_frente_faz_trem nome(…)` ≡ `vai_na_frente faz_trem nome(…)`.
- `d.mês()` e `Coisa.mistura(a, b)` são macros da biblioteca (§4.9), sem runtime: emitem `(d.getMonth() + 1)` e `Object.assign({}, a, b)` (§5.7).
- `pergunta(…)` recebe `await` automático (§4.10), por edição de inserção na mesma linha: `(await pergunta(…))` quando a
  chamada é objeto de membro ou de índice, callee de chamada ou callee de `faz_um`; em qualquer outro contexto, `await `
  sem parênteses. O `await` vale só para a chamada de `pergunta`: `pergunta("Nome?").gritando()` vira
  `(await $gs_pergunta("Nome?")).toUpperCase()` e `uai nome é pergunta("Nome?")` vira
  `const nome = await $gs_pergunta("Nome?");`.

### 4.9 Biblioteca padrão (proposta para a RFC-0001)

Estilo **bem goiano** (D8). Legenda: ✅ = grafia idêntica à escrita pelo dono no `CLAUDE.md` da 1.5 (conferida na tag
`legacy/1.5`); (1.5) = nome da tabela de 53 entradas da 1.5 (§4.2), fora do `CLAUDE.md`; sem marca = **proposta**;
(P#) = proposta pendente do dono (§3.1). O ✅ vale só para a grafia; forma e semântica estão na coluna "Semântica".
`Conta` (o dono escreveu `GoianoMath`) e `Coisa` são propostas, e num `Conta.x ✅` a marca vale só para o membro `x`.
Nenhum nome, ✅ ou não, entra sem aprovação nome a nome na RFC-0001 (Fase 0, §9.3).

A 1.5 tem vocabulários em conflito (o runtime define `.pra_maiusculo` e `.empurrar` onde o `CLAUDE.md` diz `.gritando` e
`.bota_no_final`); a v3 parte do `CLAUDE.md`. O de-para completo 1.5 → v3 (nome no `CLAUDE.md`, nome no runtime, nome
v3, forma, semântica, decisão) é anexo obrigatório da RFC-0001, que registra também, por apelido, a forma (propriedade
ou chamada) e se o nome é comum como dado do aluno.

Regra de inclusão: só entra apelido com **mesma semântica do nativo**, ou com semântica didática própria declarada aqui
(coluna "Semântica"). `nativa` é emitida por `rename`, `property`, `static`, `global` ou `macro` (0 bytes de runtime);
só `didática` pode exigir ajudante (`helper`).

**Critério de autenticidade (teste da prosa).** Todo nome sem ✅ responde a duas perguntas antes de entrar na RFC-0001:
(a) alguém de Goiás diria isso numa prosa, ou o nome é composição transparente de palavras que se dizem? (b) não é calco
de termo técnico do inglês ou do JavaScript (`sem_sinal` vem de *unsigned*)? Português neutro vale quando não há
expressão goiana natural, como nos nomes do dono (`.trocar`, `.dividir`, `.mapear`, `.filtrar`, `Conta.maior`). O plural
coloquial sem `s` no substantivo (`mostra_os_trem`) é estilo do dono, e `.tira_os_espaço` o segue. Nomes novos preferem o
imperativo coloquial (`.bota_no_começo`), salvo as transformações que acompanham o par do dono, no infinitivo; nomes ✅
não são uniformizados. A RFC-0001 registra, por nome, origem (dono, 1.5 ou proposta), forma verbal e resultado do teste.

| Área | GoiásScript | JavaScript | Semântica |
|---|---|---|---|
| Saída | `prosa(…)` ✅ | `console.log` | nativa |
| Saída | `reclama(…)` (1.5) | `console.error` | nativa |
| Saída | `avisa(…)` | `console.warn` | nativa |
| Entrada | `pergunta(texto)` | — | didática (§4.10) |
| Texto | `.gritando()` ✅ | `.toUpperCase()` | nativa |
| Texto | `.cochichando()` ✅ | `.toLowerCase()` | nativa |
| Texto/lista | `.tem_no_meio(x)` ✅ | `.includes(x)` | nativa |
| Texto | `.trocar(a, b)` ✅ | `.replaceAll(a, b)` | nativa: troca todas as ocorrências (a 1.5 tratava `a` como regex); `a` é texto literal; em `b`, `$$`, `$&`, `` $` `` e `$'` valem como no JavaScript (`"x".trocar("x", "US$$")` devolve `"US$"`, aviso GS0808) (P16) |
| Texto | `.dividir(sep)` ✅ | `.split(sep)` | nativa |
| Texto | `.tira_os_espaço()` | `.trim()` | nativa |
| Texto | `.começa_com(x)` | `.startsWith(x)` | nativa |
| Texto | `.termina_com(x)` | `.endsWith(x)` | nativa |
| Texto/lista | `.pedaço(i, f)` | `.slice(i, f)` | nativa |
| Texto/lista | `.onde_tá(x)` | `.indexOf(x)` | nativa |
| Texto/lista | `.tamanho` | `.length` | nativa (propriedade, sem parênteses; na 1.5 era `.tamanho()`; conta unidades UTF-16) |
| Texto | `.repete(n)` | `.repeat(n)` | nativa |
| Lista | `.bota_no_final(x)` ✅ | `.push(x)` | nativa |
| Lista | `.arranca_o_rabo()` ✅ | `.pop()` | nativa |
| Lista | `.bota_no_começo(x)` | `.unshift(x)` | nativa |
| Lista | `.arranca_a_cabeça()` | `.shift()` | nativa |
| Lista | `.mapear(f)` ✅ | `.map(f)` | nativa |
| Lista | `.filtrar(f)` ✅ | `.filter(f)` | nativa |
| Lista | `.amontoar(f, inicial)` | `.reduce(f, inicial)` | nativa; `inicial` obrigatório (evita o `NaN` da 1.5) |
| Lista | `.pra_cada(f)` | `.forEach(f)` | nativa |
| Lista | `.caça(f)` | `.find(f)` | nativa |
| Lista | `.juntar(sep)` | `.join(sep)` | nativa |
| Lista | `.emenda(outra)` | `.concat(outra)` | nativa |
| Lista | `.de_trás_pra_frente()` | `.toReversed()` | nativa, sem mutar (ES2023) |
| Lista | `.ordenar()` | `.toSorted($gs_ordem)` | **didática**, sem argumentos e sem mutar (ES2023). Ordem total e estável: números por valor (`NaN` por último), depois textos por `localeCompare('pt-BR')`, depois o resto (`nada`, `indefinido`, `certeza`, `de_jeito_nenhum`, lista, coisa) na ordem em que estava. `.ordenar(f)` é GS0604, com ajuda própria (P9) |
| Coisa | `Coisa.chaves(c)` | `Object.keys(c)` | nativa |
| Coisa | `Coisa.valores(c)` | `Object.values(c)` | nativa |
| Coisa | `Coisa.entradas(c)` | `Object.entries(c)` | nativa |
| Coisa | `Coisa.tem(c, k)` | `Object.hasOwn(c, k)` | nativa |
| Coisa | `Coisa.mistura(a, b)` | `Object.assign({}, a, b)` | nativa (macro: insere `{}` como primeiro argumento), sem mutar |
| Conta | `Conta.sorteia_um(min, max)` ✅ | — | **didática**: inteiro aleatório em `[min, max]` (o ✅ vale só para o nome; a semântica é nova) |
| Conta | `Conta.arredondar(x)` ✅ | `Math.round(x)` | nativa; o meio sobe (`Conta.arredondar(-2.5)` é -2) (P15) |
| Conta | `Conta.arredondar_pra_baixo(x)` | `Math.floor(x)` | nativa (P15) |
| Conta | `Conta.arredondar_pra_cima(x)` | `Math.ceil(x)` | nativa (P15) |
| Conta | `Conta.maior(…)` ✅ | `Math.max(…)` | nativa; recebe os números separados, não uma lista |
| Conta | `Conta.menor(…)` | `Math.min(…)` | nativa; recebe os números separados, não uma lista |
| Conta | `Conta.sem_sinal(x)` | `Math.abs(x)` | nativa |
| Conta | `Conta.raiz_quadrada(x)` | `Math.sqrt(x)` | nativa |
| Conta | `Conta.elevado(b, e)` | `Math.pow(b, e)` | nativa |
| Conta | `Conta.PI` | `Math.PI` | nativa (propriedade) |
| Conta | `Conta.E` | `Math.E` | nativa (propriedade) |
| Número | `vira_número(t)` | — | **didática**: ignora espaços nas pontas e aceita vírgula decimal (`"1,5"` vira 1.5); texto que não é número e texto vazio dão `NaN` (o `Number("")` nativo dá 0) (P11) |
| Número | `é_número(x)` | `typeof x === "number" && !Number.isNaN(x)` | **didática** (ajudante, avalia `x` uma vez): `certeza` só para número de verdade; `"12"` e o `NaN` de `vira_número("abc")` dão `de_jeito_nenhum`, então converta antes com `vira_número` (P11) |
| Número | `.com_casas(n)` | `.toFixed(n)` | nativa; ponto decimal; arredonda o valor binário (`(1.005).com_casas(2)` é `"1.00"`) |
| Texto | `vira_texto(x)` | `String(x)` | nativa |
| Tempo | `daqui_a_pouco(f, ms)` | `setTimeout(f, ms)` | nativa |
| Tempo | `toda_hora(f, ms)` | `setInterval(f, ms)` | nativa |
| Tempo | `deixa_pra_lá(id)` | `clearTimeout(id)` / `clearInterval(id)` | nativa |
| Tempo | `cochila(ms)` | — | **didática**: promessa que resolve depois de `ms` |
| Promessa | `faz_um promessa(f)` (1.5) | `new Promise(f)` | nativa |
| Promessa | `.quando_resolver(f)` (1.5) | `.then(f)` | nativa |
| Promessa | `.se_der_pobrema(f)` (1.5) | `.catch(f)` | nativa |
| Erro | `faz_um Erro(msg)` | `new Error(msg)` | nativa |
| Erro | `.mensagem` | `.message` (via `$gs_mensagem`) | **didática** (ajudante, só leitura): erro do motor (`TypeError`, `ReferenceError`, `RangeError`) devolve a frase em português do catálogo GS07xx; erro do programa (`vixe`, `faz_um Erro(msg)`) devolve `msg` intacta (P10) |
| Data | `faz_um Data()` e `.ano() .dia() .hora() .minuto() .segundo()` | `new Date()` e getters | nativa |
| Data | `.mês()` | `.getMonth() + 1` | **didática** (macro, 0 bytes): devolve 1–12; emitido como `(x.getMonth() + 1)` |

**Forma e aridade.** Propriedades (`.tamanho`, `.mensagem`, `Conta.PI`) não levam parênteses: chamá-las é GS0603 com a
correção. Método de instância usado como valor, sem chamada (`uai f é lista.mapear`), também é GS0603, porque perde o
receptor; entrada estática passada como callback (`lista.mapear(Conta.arredondar)`) vale. Número de argumentos fora da
aridade (`arity: { min, max? }`, §5.2) é GS0604, com a assinatura na ajuda. A RFC-0001 define a aridade nome a nome
(`.pedaço(i, f)` aceita 1 ou 2; `.amontoar(f, inicial)` e `.trocar(a, b)` exigem 2; `Conta.maior` e `Conta.menor` são
variádicas).

**Ressalvas das entradas nativas.** `nativa` herda as peculiaridades do JavaScript (§4.1, princípio 4); a RFC-0001 e a
cartilha as registram sem mudar a semântica: `.tamanho` conta unidades UTF-16 (`"🇧🇷".tamanho` é 4); `.com_casas` e
`Conta.arredondar` seguem as regras do motor (exemplos na tabela); `Conta.maior` e `Conta.menor` não aceitam lista;
`prosa`, `reclama`, `avisa` e `vira_texto` mostram os valores como o motor (`certeza` aparece `true`, `nada` aparece
`null`). Vírgula decimal, arredondamento "da escola" e a formatação em goianês dos valores impressos são decisões do
dono na RFC-0001; se aprovadas, entram como entradas didáticas com ajudante.

**Colisão com nomes do usuário (P3, P4).** O rebaixamento é por nome e o compilador não infere o tipo do receptor; a
reserva depende da forma da entrada (§5.2):

- **Propriedade de instância** (`.tamanho`, `.mensagem`): reescrita em todo `x.nome`. Declarar membro com esse nome, com
  qualquer valor, campo ou método, é GS0601 (P3).
- **Método de instância** (`.mapear(f)`, `.ano()`, `.hora()`…): reescrito só na chamada `x.nome(…)`. É GS0601 declarar
  membro **chamável** com esse nome: método de classe, atribuição `x.nome é <função>` ou
  propriedade cujo valor não é garantidamente não-função. Garantido: número, texto, `certeza`, `de_jeito_nenhum`, `nada`,
  `indefinido`, lista, coisa literal e `faz_um …`; não garantido: identificador, chamada, acesso a membro, seta e
  `faz_trem`. Campo de dado garantido é livre: `{ ano: 2026 }`, `filme.hora`.
- **Membros de `Conta` e `Coisa`** (`Conta.maior`, `Coisa.tem`) são resolvidos pelo receptor e não reservam o nome do
  membro: `{ maior: 10 }` e `fila.tem(x)` valem.
- **Globais e namespaces** (`prosa`, `reclama`, `avisa`, `pergunta`, `cochila`, `vira_texto`, `vira_número`, `é_número`,
  `daqui_a_pouco`, `toda_hora`, `deixa_pra_lá`, `promessa`, `Coisa`, `Conta`, `Erro`, `Data`) não são keywords: o
  programa pode declarar um deles (`arruma_trem Conta {…}`, `uai Data é …`), que esconde o da biblioteca no seu escopo,
  com o aviso GS0804 (P4). Rebaixamento, `await` automático de `pergunta` e ajudantes valem só para referência que
  resolve para a biblioteca (§5.6). As palavras do JavaScript (`Date`, `Error`, `Math`…) continuam reservadas (D7).

Acesso com texto literal a nome da biblioteca (`coisa["mapear"]`) não é rebaixado e dá o aviso GS0809; `x[k]` não
literal não é verificado. Todo `.nome` e `["nome"]` literal passa também pelo censo de membros (§5.6, P1). A RFC-0001
revê um a um, pensando em colisão com nomes de domínio, `tamanho`, `mensagem`, `ano`, `mês`, `dia`, `hora`, `minuto`,
`segundo`, `repete`, `caça` e `juntar` (`.tamanho` e `.mensagem` são os mais propensos): cada um fica com a justificativa
registrada ou ganha outra forma, a critério do dono. A cartilha não usa `Conta` nem `Data` como nome de classe (a lição 9
segue `Fruta`/`Pequi`), para não disparar o GS0804.

**Lacunas obrigatórias da RFC-0001.** Cada item vira entrada da tabela (com nome aprovado pelo dono) ou decisão
registrada de ficar fora da v3, o que significa GS0406 (membro) ou GS0403 (global do JS) com a alternativa na ajuda:
(a) coisa ↔ texto (`JSON.stringify` e `JSON.parse`), incluindo decidir se `vira_texto(lista)` e `vira_texto(coisa)`
devolvem o texto JSON em vez de `[object Object]`; (b) `Promise.all`; (c) `.some`; (d) `.every`; (e) `.splice`;
(f) `.findIndex`; (g) `Date.now`. Antes da Fase 0, os exemplos do playground e o `demo` do vídeo passam pelo mundo
fechado para achar outras lacunas.

**Alternativas de nome a submeter na RFC-0001** (o dono decide nome a nome): `Conta.sem_sinal` → `Conta.tira_o_sinal`
(a 1.5 tinha `absoluto`); `.caça` → `.acha` (a 1.5 tinha `achar`); `.emenda` → `.junta_com(outra)` (a 1.5 tinha `emendar`,
que era `splice`); `Conta.elevado` → `Conta.elevado_a`; `Conta.arredondar` → `Conta.arredonda` (P15); `faz_um promessa`
→ `faz_um Promessa`, como `Erro` e `Data`; o namespace `Conta` × `GoianoMath`, com a colisão de `Conta` e `Data` com
classes didáticas comuns (conta bancária, data) registrada. Se o dono preferir o neutro da 1.5, `.reduzir` e `absoluto`
continuam válidos.

### 4.10 Entrada do usuário

- `pergunta(texto)` devolve o texto digitado. No topo do programa e dentro de função assíncrona (`vai_na_frente faz_trem`
  ou seta `vai_na_frente`, P6), o compilador insere `await` automaticamente; dentro de função não assíncrona é erro
  (`GS0602`) com a correção sugerida. Quando a chamada é objeto de membro ou de índice, callee de chamada ou callee de
  `faz_um` (`pergunta("Nome?").gritando()`), a emissão é `(await $gs_pergunta("Nome?")).toUpperCase()`; nos demais contextos
  é `await ` simples, na mesma linha.
- **Ciclo de vida (alvo `module`).** O ajudante `$gs_pergunta` cria **uma única** interface de leitura
  (`node:readline/promises`, importado dinamicamente na primeira chamada) e a reaproveita, lendo pelo iterador
  assíncrono; uma interface por chamada perderia as linhas já bufferizadas com stdin em pipe. Chama `resume()` antes de
  perguntar e `pause()` depois da resposta, para o programa terminar assim que a última resposta chega, com terminal ou
  pipe aberto. O estado fica em `var` sem inicializador (içado; `let` daria zona morta temporal, porque o ajudante fica
  no fim do arquivo). O fim da entrada antes da resposta lança `GS0702` (raiz: `Acabou a entrada, sô: o programa pediu
  uma resposta e não veio mais nada.`); o ajudante testa o fim da iteração antes de `pause()` e o guarda, de modo que
  perguntas seguintes (por exemplo dentro de `tenta_aí`) relancem `GS0702`, nunca um erro do motor em inglês.
- Programa que fica esperando para sempre (promessa nunca resolvida) termina com `GS0703` (raiz: `O programa ficou
  esperando uma resposta que nunca veio, sô.`) e código de saída 2 (§6.1).
- Implementação por alvo (§5.7): terminal no CLI e no REPL, caixinha no playground.

### 4.11 Mensagens de erro

- Catálogo `GSnnnn`; cada entrada tem severidade (`error` ou `warning`), mensagem **em português claro** com camada de
  sotaque em dois tons (`raiz`, padrão; `neutro`), ajuda (correção sugerida) e link para a lição da cartilha.
- Faixas: `GS01xx` léxico · `GS02xx` sintaxe · `GS03xx` nomes, escopo e contexto · `GS04xx` palavras do JavaScript ·
  `GS05xx` fora do subconjunto · `GS06xx` uso da biblioteca · `GS07xx` erros de execução traduzidos · `GS08xx` avisos
  pedagógicos · `GS09xx` ferramentas (inclui `GS0901`, erro interno do compilador).
- Frases inteiras por diagnóstico (não templates genéricos), por causa da concordância em português
  ([pesquisa, front-end §4](../../pesquisa/2026-10-13-arquitetura-compilador/notas/front_end.md)).
- Vários diagnósticos por execução, ordenados por posição (o erro em cascata do parser na mesma instrução continua).
- `GS0306` (P13): palavra de versão anterior usada onde um nome não declarado daria `GS0301`, ou onde haveria erro de
  sintaxe no início de instrução (`presta_serviço soma(a, b)`). A mensagem diz o destino quando há (`faz_trem`) e "saiu da
  linguagem, sem substituto na v3" quando não há; sempre com `help`, `lesson` e link para a página "o que mudou". A
  palavra nunca é reservada: nome declarado pelo programa não dispara o código.

**Catálogo inicial** (os números são definitivos para o plano 1; mudança depois do lançamento só por RFC, e código nunca
é reutilizado, §9.5):

| Código | Quando |
|---|---|
| GS0101 | Número malformado: zero à esquerda (`08`, `01310`; a ajuda sugere texto para CEP e telefone) ou ponto de milhar (`1.000.000`, P12) |
| GS0102 | Escape inválido em texto (octal, `\8`, `\9`, `\x` ou `\u` incompletos) |
| GS0103 | Texto sem fechar na linha |
| GS0104 | Caractere que não vale em nome (fora do alfabeto de nomes, P5; `$`) |
| GS0105 | Caractere invisível proibido (U+2028, U+2029; U+FEFF fora do início) |
| GS0106 | Comentário de bloco sem fechar |
| GS0107 | Caractere desconhecido |
| GS0201 | Fim da entrada inesperado (liga `incomplete` no REPL) |
| GS0202 | Token inesperado ou instrução mal terminada (genérico, com ajuda) |
| GS0203 | Linha começando com operador binário (termine a conta na linha de cima ou use parênteses) |
| GS0204 | Quebra de linha entre os parâmetros e o `=>` |
| GS0205 | `se_num_for`, `se_não`, `se_der_ruim` ou `por_fim` sem a instrução que ele continua |
| GS0206 | `vixe` fora de posição de instrução ou com número de argumentos diferente de 1 |
| GS0207 | Corpo sem chaves (P7) |
| GS0208 | Vírgula decimal onde a vírgula não cabe (`uai preço é 10,50`) (P12) |
| GS0209 | Alvo de atribuição inválido (`1 é x`, `f() é 2`) |
| GS0301 | Nome não declarado, com sugestão |
| GS0302 | Reatribuição de `uai` |
| GS0303 | Palavra reservada do GoiásScript usada como nome |
| GS0304 | Redeclaração no mesmo escopo (inclui parâmetro repetido; parâmetros e topo do corpo contam como um escopo) |
| GS0305 | Membro não declarado no arquivo nem da biblioteca (P1), com sugestão |
| GS0306 | Palavra de versão anterior (P13), só onde daria GS0301 ou erro de sintaxe no início de instrução |
| GS0307 | `uai` sem valor inicial (exceto no cabeçalho de `vai_indo`) |
| GS0308 | `para_com_isso` ou `continua_aí` fora de laço |
| GS0309 | `faz_favor` fora de função |
| GS0310 | Mais de um `aprepara_trem` na classe |
| GS0311 | Uso inválido de `a_raiz`: `a_raiz(…)` fora do `aprepara_trem` de classe que herda ou depois de um uso de `ocê`; `a_raiz.nome(…)` fora de método ou construtor de classe que herda (§4.7) |
| GS0312 | `espera_um_cadim` fora de função assíncrona (exceto no topo) |
| GS0401 | Keyword do JS com equivalente goiano (`const` → `uai`) |
| GS0402 | Palavra reservada do JS sem equivalente usada como nome (`public`, `enum`, `arguments`, `NaN`) |
| GS0403 | Global do JS (`console`, `Math`, `setTimeout`), com o equivalente quando houver |
| GS0404 | Operador do JS com forma goiana (`=`, `==`, `===`, `!=`, `!==`, `&&`, `\|\|`, `!`, `++`, `--`, `+=`…) |
| GS0405 | Membro nativo do JS com equivalente goiano (`.map` → `.mapear`, `.length` → `.tamanho`) |
| GS0406 | Membro nativo do JS sem equivalente (`.some`, `.toString`, `constructor`, `prototype`, `__proto__`) |
| GS0500 | Construção do JS fora da v3 (genérico, com ajuda quando há alternativa) |
| GS0501+ | Um código por item da lista "Fora da v3" (§4.7), mais um para o aninhamento acima de `limits.maxNestingDepth` (§5.4), numerados na RFC-0001 |
| GS0601 | Membro declarado com nome reservado da biblioteca (P3) |
| GS0602 | `pergunta` fora de contexto assíncrono |
| GS0603 | Membro da biblioteca na forma errada: propriedade chamada (`x.tamanho()`, `Conta.PI()`) ou método sem chamada (`uai f é lista.mapear`) quando o arquivo não declara campo de dado com esse nome |
| GS0604 | Número de argumentos fora da aridade (`.amontoar(f)`, `.trocar("a")`, `.ordenar(f)`) |
| GS0701 | Laço passou do limite (playground) |
| GS0702 | Acabou a entrada antes da resposta de `pergunta` |
| GS0703 | O programa ficou esperando para sempre (promessa nunca resolvida) |
| GS0710–GS0799 | Erros do motor classificados (`TypeError`, `ReferenceError`, `RangeError`…), com um genérico por classe |
| GS0801 | `é` como condição (aviso) |
| GS0802 | Laço sem saída aparente (aviso) |
| GS0803 | Código depois de `faz_favor` (aviso) |
| GS0804 | Declaração que esconde nome global da biblioteca (P4) (aviso) |
| GS0805 | `1.000,50` em argumentos ou elementos: lido como dois valores (P12) (aviso) |
| GS0806 | Expressão sem efeito (`i mais 1`) (aviso) |
| GS0807 | `prosa`, `reclama` ou `avisa` recebendo direto o parâmetro do `se_der_ruim`; use `erro.mensagem` (aviso) |
| GS0808 | `.trocar` com `$$`, `$&`, `` $` `` ou `$'` no texto de substituição literal (P16) (aviso) |
| GS0809 | Acesso dinâmico a nome da biblioteca (`coisa["mapear"]`), não rebaixado (aviso) |
| GS0901 | Erro interno do compilador (capturado dentro de `compile()`, com pedido de relato) |
| GS0902 | Arquivo de entrada não termina em `.gs` |
| GS0903 | Saída igual à entrada, ou destino existente sem `--sobrescreve` |
| GS0904 | Node abaixo do mínimo (aviso) |
| GS0905 | Uso incorreto do CLI (comando ou opção desconhecidos) |

Exemplos:

| Código | Tom raiz | Tom neutro |
|---|---|---|
| GS0401 | `Ô sô, "const" é palavra do JavaScript. Aqui em GoiásScript a gente fala "uai".` | `"const" é do JavaScript. Em GoiásScript, use "uai".` |
| GS0301 | `Esse trem "nomi" não existe por aqui. Cê quis dizer "nome"?` | `O nome "nomi" não foi declarado. Você quis dizer "nome"?` |
| GS0801 | `Dentro do "se_ocê_quiser" cê usou "é", que guarda valor. Pra comparar é "é_igualim".` | `Na condição foi usado "é" (atribuição). Para comparar, use "é_igualim".` |
| GS0601 | `Ô sô, "tamanho" já é nome de trem da biblioteca (tamanho de texto e de lista). Pra esse campo, que tal "quantidade"?` | `"tamanho" é nome da biblioteca padrão (tamanho de texto e de lista). Para este campo, use outro nome, como "quantidade".` |
| GS0406 | `Ô sô, ".some" é do JavaScript e esse trem ainda não tem nome goiano por aqui.` | `".some" é um recurso do JavaScript que ainda não tem nome em GoiásScript.` |
| GS0208 | `Ô sô, número com vírgula não rola. Aqui o decimal é com ponto: 10.50.` | `Decimais usam ponto, não vírgula. Escreva 10.50.` |

A sugestão do GS0601 vem do campo opcional `alternatives` da entrada em `stdlib` (§5.2), com uma ou duas alternativas por
nome; são nomes de campo do aluno, não da biblioteca, e não dependem da RFC-0001. O GS0305 segue o formato do GS0301
(`Esse trem ".nomi" não existe por aqui. Cê quis dizer ".nome"?`), sem a pergunta quando não há sugestão. Nenhuma mensagem
cita a RFC.

---

## 5. Arquitetura do compilador

### 5.1 Pacotes

```
packages/
  language/    @goiasscript/language    tabela única + geradores        (sem dependências)
  compiler/    @goiasscript/compiler    lexer → parser → análise → emissão (depende só de language)
  optimizer/   @goiasscript/optimizer   modos otimizado/minificado      (terser)
  cli/         goiasscript              comandos goiasscript e goias     (único pacote público no npm)
  vscode/      goiasscript-vscode       extensão                         (embute compiler)
apps/
  playground/        Next.js 15 + Monaco + /cartilha
  playground-e2e/    Playwright
  engoianador-api/   Cloudflare Worker
```

- `language`, `compiler` e `optimizer` são pacotes privados do workspace; o `goiasscript` publicado os embute no build.
  O `goiasscript` também exporta a API (`import { compile } from 'goiasscript'`).
- **`@goiasscript/compiler` não tem dependência de runtime** (prova o "escrito à mão"; gate §8.5).
- Camadas (dependency-cruiser): `language` ← `compiler` ← `optimizer` ← `cli`/`vscode`/`apps`. `compiler` e
  `language` não importam `node:*` (isomórficos: Node e navegador).

### 5.2 Tabela da linguagem (`@goiasscript/language`)

Fonte única de verdade, em TypeScript como dados `as const`:

- `keywords`: grafia oficial, variantes sem acento, token JS, classe (R/C), categoria.
- `jsReserved`: `ReservedWord` do ES2022; reservadas do modo estrito (`enum implements interface package private
  protected public`); `let static async of constructor undefined`; nomes não ligáveis (`arguments eval NaN Infinity`);
  globais e nomes de API do JS (§4.4, inclui `Intl`). Cada entrada leva `suggestion` (equivalente goiano ou substantivo
  comum) e `hasEquivalent` (o código vem da categoria e de `hasEquivalent`: keyword do JS com equivalente é GS0401 e sem equivalente GS0402; global do JS é sempre GS0403, com a sugestão quando houver; nome não ligável é GS0402 e tem precedência sobre a regra de global, então `eval`, `NaN` e `Infinity` são GS0402).
- `jsMembers` (P1): membros de instância e estáticos nativos até o ES2023, cada um com o equivalente goiano quando existe
  (GS0405; sem equivalente, GS0406). Gerada no build a partir das declarações `lib.es2023.*.d.ts` do TypeScript fixado (ADR-0005), nunca dos protótipos do motor em execução, que mudam entre Node 22 e 24 (`Promise.try`, `RegExp.escape`) e quebrariam o diff vazio e o determinismo de `compile()`; conferida no CI por diff vazio.
- `retiredWords` (P13): `{ word, replacement?, note }`, palavras da 1.0, da 1.5 e da documentação antiga. Só o caminho de
  erro a consulta (GS0306); nunca reserva a palavra.
- `stdlib`: entradas da §4.9 com `{ name, asciiName?, receiver: 'global' | 'text' | 'list' | 'textOrList' | 'number' |
  'object' | 'promise' | 'error' | 'date' | 'namespace', kind, js, semantics: 'native' | 'didactic', helperName?, arity }`.
  `kind` é `rename`, `property`, `static` (reescrito pelo receptor: `Conta.maior` → `Math.max`), `global`, `macro` (edição
  com parênteses ou inserção: `.mês()`, `Coisa.mistura`) ou `helper`; só `helper` gera ajudante (§5.7) e
  `semantics: 'native'` nunca é `helper`. `helperName` é ASCII, único e obrigatório em `helper`.
  `arity: { min: number; max?: number }` (sem `max`, variádico como `Conta.maior`) alimenta GS0604 e, com
  `form: 'property'`, GS0603. `form: 'property' | 'method'` diz se o aluno escreve `x.nome` (`.tamanho`, `.mensagem`, `Conta.PI`) ou `x.nome(…)`; é independente de `kind` (`.mensagem` é `helper` e `Conta.PI` é `static`, ambos `property`) e decide a reserva de membro (§4.9, P3: propriedade reservada sempre, método só como membro chamável, entrada de `namespace` nunca) e o GS0603. A entrada ainda leva `alternatives?` (uma ou duas sugestões de nome de campo para o GS0601, §4.11), `origin: 'owner' | '1.5' | 'proposal'` (alimenta a legenda de origem da §4.9 e o anexo da RFC-0001) e, como as entradas de `keywords`, `since` e `deprecatedIn?` (§9.5); o gerador de `docs/spec/vocabulario.lock.json` lê esses campos e roda no CI com diff vazio, como os demais geradores.
- `limits`: constantes do compilador (`maxNestingDepth: 200`).
- `diagnostics`: catálogo `GSnnnn` (§4.11), com as frases nos dois tons. `stdlib` e `diagnostics` ficam em arquivos de dados por categoria, cada um com menos de 400 linhas (`stdlib/text.data.ts`, `stdlib/list.data.ts`, `diagnostics/lexical.data.ts`, `diagnostics/syntax.data.ts`…), reexportados por um índice que os geradores consomem; assim o `max-lines` de 800 da §8.1 vale para as tabelas sem isenção.
- **Geradores** (scripts do pacote, executados no build e verificados no CI por diff vazio): gramática TextMate,
  linguagem Monarch, snippets, referência da documentação, texto de ajuda do CLI, glossário da cartilha, lista de
  completions do editor, frases do ajudante de `.mensagem` e a página `docs/spec/o-que-mudou.md` (de `retiredWords`).

### 5.3 Lexer

- Escrito à mão; **sob demanda** (o parser pede o próximo token); **nunca lança**: entrada inválida vira token
  `Invalid` com diagnóstico `GS01xx`. A entrada é uma string UTF-16 que nunca é reescrita: offsets, linhas e colunas
  valem sobre o texto recebido.
- **Tokens:** palavra, número, texto, `Template`, pontuação/operador, `Newline`, `EndOfFile`, `Invalid`. Palavra: o lexer
  lê a corrida de nome, consulta a tabela pela grafia NFC e devolve `Keyword` (entrada da tabela, classe R/C, grafia
  original) ou `Identifier` (nome em NFC). Quem decide se a palavra é keyword ou nome é o parser, pela posição (§5.4).
  Trivia (espaços e comentários) fica anexada ao token seguinte, com posição.
- **Alfabeto do nome (P5):** letra `A–Z`, `a–z` ou acentuada do português na forma NFC (`á à â ã é ê í ó ô õ ú ü ç` e as
  maiúsculas), dígito ou `_`, checados contra esse conjunto literal e nunca por `\p{ID_Start}` ou tabela Unicode do motor,
  para `compile()` dar o mesmo resultado em qualquer Node e navegador. O lexer lê a corrida de letras, dígitos, `_` e marcas
  combinantes (U+0300–U+036F), normaliza para NFC e valida; fora do alfabeto (outro alfabeto, emoji, `$`) o token é
  `Invalid` com GS0104. Textos e comentários aceitam qualquer Unicode, menos o que o item seguinte proíbe.
- **Espaço e terminadores:** espaço é TAB, VT, FF, SP, NBSP e os separadores do ECMA-262 (U+1680, U+2000–U+200A, U+202F,
  U+205F, U+3000); outro caractere solto é GS0107. Quebra de linha é `\n`, `\r\n` (uma só) ou `\r`; todas encerram
  comentário `//` e a emissão as preserva. U+2028 e U+2029 não valem em posição nenhuma (código, comentário ou texto),
  GS0105: o JS os conta como quebra, o LSP não. `U+FEFF` no offset 0 (BOM) é trivia e a emissão o omite; em outro lugar é
  GS0105.
- **Posições:** `offset` em unidades UTF-16, base 0, é a fonte da verdade; `line` e `column` (base 1, coluna também em
  UTF-16) saem de uma tabela de inícios de linha. V8, LSP e ECMA-426 compartilham só a unidade, não a base; a conversão
  acontece só nas fronteiras, num único módulo `position-convert.ts` com teste de ida e volta:

  | Destino ou origem | Linha | Coluna | A partir de `SourcePosition` |
  |---|---|---|---|
  | API pública, mensagens (CLI, REPL, cartilha) e Monaco | 1 | 1 | direta |
  | LSP e API do VS Code | 0 | 0 | `line - 1`, `column - 1` |
  | `mappings` do source map (ECMA-426) | 0 | 0 | `line - 1`, `column - 1` |
  | Pilha de erro do V8 (entrada de `translateRuntimeError`) | 1 | 1 | direta; ao consultar o mapa, `column - 1` |

- **Números:** `0`, `0.5`, `1e3` e `3.141` valem. Número literal seguido de `.` e nome (`5.com_casas(2)`) é GS0202, com a ajuda de usar parênteses (`(5).com_casas(2)`): `5.toFixed(2)` não é JavaScript válido. Zero à esquerda (`08`, `01310`) e ponto de milhar (`1.000.000`, P12) são
  `Invalid` com GS0101; para CEP e telefone a ajuda sugere texto (`"01310"`). Hexadecimal, `_` e BigInt viram tokens
  próprios, para o parser dar o GS05xx.
- **Escapes em texto:** valem os do JS estrito: `\n \r \t \b \f \v \\ \' \"`, `\0` sem dígito depois, `\xHH`, `\uHHHH`,
  `\u{…}` e `\` seguido de caractere que não é dígito nem quebra de linha. Octal (`\07`, `\1` a `\7`), `\8`, `\9` e
  `\x`/`\u` incompletos são GS0102. Texto que não fecha na linha é GS0103; comentário de bloco sem fechar, GS0106.
- **Template e regex:** a crase abre um token `Template` até a crase de fechamento, contando `${…}` aninhado; sem fechar,
  vira `Invalid` (GS0103) até o fim do arquivo, e o parser dá um único GS05xx no token. Regex não tem token: no lexer `/`
  é sempre divisão (inclusive `/=`, `//` e `/*`); em posição de operando o parser pede a releitura (§5.4).
- **Aceitar mais:** os operadores do JS fora da v3 (`===`, `&&`, `++`, `**`, `?.`, `??`, `+=`…) são tokens próprios, para
  o parser dar o diagnóstico específico (estratégia "aceitar mais", do Hedy).

### 5.4 Parser

- Escrito à mão: **descendente recursivo** para instruções e **Pratt** para expressões (tabela de precedência
  derivada dos operadores JS equivalentes).
- **Resiliente:** produz nós `ErrorNode`, ressincroniza por conjuntos de sincronização (início de instrução,
  `Newline`, `}`), e **reporta vários erros por execução**; nunca lança.
- **Fim de instrução (§4.6):** o parser mantém uma pilha de contextos (instrução, agrupamento `( )`/`[ ]`, coisa
  literal, bloco) e só dá significado ao `Newline` em contexto de instrução; `{` abre bloco ou coisa literal conforme a
  §4.6 (depois de `=>` é bloco). Daqui saem GS0203, GS0204 e GS0205.
- **Keyword ou nome?** O parser decide pela posição. `Keyword` de classe R só vale onde a gramática a espera; depois de
  `.`, antes de `:` em coisa e como nome de método de classe vira `Identifier` de propriedade (`obj.mais`, `{ de: "SP" }`).
  `Keyword` de classe C vira `Identifier` em qualquer posição, exceto `de`/`em` logo depois do nome declarado em
  `vai_indo (uai nome …)`. Keyword R no lugar de nome de variável, função, parâmetro ou classe segue para GS0303. O
  parser só classifica o token; as reservas de nome (GS0303, GS04xx, GS0601; palavra do JS não serve de nome em posição
  nenhuma, P2) são da análise (§5.6).
- **Diagnósticos no próprio token:** keyword e operador do JS (GS0401, GS0404); construção fora do subconjunto (GS0500,
  GS0501+), inclusive `faz_trem` sem nome como expressão (P6); corpo sem chaves (GS0207, P7); `vixe` fora de posição de
  instrução ou com argumentos errados (GS0206, P8); vírgula decimal (`uai preço é 10,50`, GS0208, P12); alvo de atribuição
  inválido (GS0209); fim da entrada inesperado (GS0201, que liga `incomplete` no REPL).
- **Regex em posição de operando:** `/` ou `/=` onde se espera operando (início de expressão; depois de `é`, `(`, `,`,
  `[`, `faz_favor`, `=>` ou operador) é regex literal, fora da v3. O parser pede ao lexer `rescanAsRegex()`: releitura até a
  próxima `/` não escapada **na mesma linha** (respeitando `\` e classes `[…]`), mais as flags, sem validar o padrão. Dá um
  só GS05xx, e o lexer descarta os tokens e diagnósticos já lidos à frente no trecho (`/"/` não vaza GS01xx). Sem `/` de
  fechamento na linha, o GS05xx cobre só a `/` e o parser ressincroniza no `Newline`.
- **Profundidade limitada:** aninhamento sintático e profundidade da AST, inclusive cadeias à esquerda (`a mais b mais c…`,
  `a.b.c…`, `f()()()`), ficam limitados por `limits.maxNestingDepth`. Ao passar do limite o parser emite GS05xx ("trem muito
  aninhado") e devolve `ErrorNode` sem descer mais, o que protege também a análise, o rebaixamento e a emissão.
- Gramática EBNF com ids estáveis em `docs/spec/gramatica.md` (escrita na Fase 0 a partir do protótipo).

### 5.5 AST

- Tipos próprios em TypeScript (`readonly`, união discriminada por `type`), nomes de nó no formato ESTree
  (`VariableDeclaration`, `IfStatement`, `CallExpression`, `ThrowStatement` para `vixe`…) mais `ErrorNode`.
- Cada nó guarda `range` e referência ao token de keyword original (para a emissão por edições). Nome de propriedade não
  carrega referência a keyword: a emissão edita só tokens referenciados por nós como keyword, então `obj.mais` sai
  `obj.mais`, nunca `obj.+`. Identificador guarda o nome em NFC e o `range` do texto original.

### 5.6 Análise semântica (mundo fechado)

Passada separada sobre a AST, com tabela de símbolos e escopos léxicos. A tabela de símbolos e a cadeia de escopos são
estado privado da classe do analisador (coberta pela exceção do ADR-0004); a AST é só lida e o resultado sai como
`readonly`.

**Resolução de escopo (P4).** De fora para dentro: (1) o escopo global da biblioteca (`prosa`, `pergunta`, `Conta`,
`Data`, `Erro`… §4.9), externo ao arquivo; (2) o topo do arquivo (no REPL, a sessão); (3) funções e blocos. Uma declaração
vale no escopo inteiro em que foi feita, como em JavaScript, e cada referência resolve para o escopo mais interno que tem
o nome. Só a referência que resolve para o escopo (1) recebe rebaixamento (§5.7), `await` automático de `pergunta` e
ajudante; a que resolve para declaração do programa é emitida como está. Declarar nome do escopo (1) é GS0804, nunca
GS0304. `vixe(nome)` em que `nome` resolve para o parâmetro do `se_der_ruim` envolvente é relançamento (§4.8).

**Censo de membros (P1).** Uma pré-passada sobre o arquivo inteiro, sem depender da ordem, reúne o conjunto D dos nomes
de membro declarados, por nome e sem olhar o receptor: (a) chave de coisa literal (identificador ou texto); (b) método de
classe, inclusive `num_muda`; (c) alvo de atribuição `x.nome é …` ou `x["nome"] é …`, o que inclui
`ocê.nome é …`, único modo de declarar campo na v3. No REPL, D acumula na sessão. Todo acesso `.nome` ou `["nome"]` com
texto literal precisa estar em D ∪ membros de instância da biblioteca (∪ membros estáticos quando o receptor resolve para
`Conta` ou `Coisa`). Fora disso: GS0405 se o nome é nativo do JavaScript com equivalente goiano, GS0406 se é nativo sem
equivalente (lista `jsMembers`, §5.2), GS0305 nos demais, com sugestão por distância de edição sobre D ∪ biblioteca.
`constructor`, `prototype` e `__proto__` são GS0406 em qualquer acesso ou declaração; declarar nome nativo que tem
equivalente goiano (`{ length: 3 }`) é GS0405. A verificação é por nome, não por tipo (`p.nmoe` é pego e sugere `nome`,
mas `lista.nome` passa se `nome` existe em outro objeto); `x[k]` não literal não é verificado; membro criado só por chave
computada (`o[k] é 1`) e lido por `.gato` dá GS0305. A barreira de segurança do playground é a CSP (§6.3), não esta
verificação.

| Verificação | Código |
|---|---|
| Nome não declarado, com sugestão por distância de edição (declarações + biblioteca, nessa precedência; no alvo `repl`, também a sessão) | GS0301 |
| Reatribuição de `uai` (inclusive `uai` da sessão do REPL) | GS0302 |
| Keyword do GoiásScript usada como nome | GS0303 |
| Redeclaração no mesmo escopo. Contam como um escopo só: parâmetros e topo do corpo da função (inclusive seta); parâmetro de `se_der_ruim` e topo do seu bloco. Parâmetro repetido e `faz_trem` repetida também | GS0304 |
| Membro fora de D e da biblioteca, com sugestão (P1) | GS0305 |
| Palavra de versão anterior (`retiredWords`) onde daria GS0301 ou erro de sintaxe no início de instrução (P13); nome declarado pelo programa nunca dispara | GS0306 |
| `uai` sem valor inicial (exceto no cabeçalho de `vai_indo (uai x de …)` e `vai_indo (uai k em …)`) | GS0307 |
| `para_com_isso` ou `continua_aí` fora de laço (função aninhada, inclusive seta, reinicia o contexto) | GS0308 |
| `faz_favor` fora de função | GS0309 |
| Mais de um `aprepara_trem` na classe | GS0310 |
| `a_raiz(…)` fora do `aprepara_trem` de classe que herda ou depois de um uso de `ocê`; `a_raiz.nome(…)` fora de método ou construtor de classe que herda | GS0311 |
| `espera_um_cadim` fora de função assíncrona (exceto no topo) | GS0312 |
| Palavra reservada do JS sem equivalente usada como nome (`public`, `enum`, `arguments`, `NaN`) | GS0402 |
| Global do JS (`console`, `Math`, `setTimeout`), com o equivalente quando houver | GS0403 |
| Membro nativo do JS com equivalente goiano, em uso ou declarado (`lista.map`, `{ length: 3 }`) | GS0405 |
| Membro nativo do JS sem equivalente (`lista.some`, `x.toString`), e `constructor`, `prototype`, `__proto__` | GS0406 |
| Membro declarado com nome reservado da biblioteca: propriedade de instância (`.tamanho`, `.mensagem`) ou membro chamável com nome de método (P3) | GS0601 |
| `pergunta` fora de contexto assíncrono | GS0602 |
| Propriedade chamada (`x.tamanho()`, `Conta.PI()`) ou método de instância sem chamada (`uai f é lista.mapear`), quando o arquivo não declara campo de dado com esse nome | GS0603 |
| Número de argumentos fora da `arity` da entrada (`.amontoar(f)`, `.trocar("a")`, `.ordenar(f)`) | GS0604 |
| `é` como expressão inteira de condição (`se_ocê_quiser`, `se_num_for`, `enquanto_tiver`, meio do `vai_indo`), de argumento de chamada ou de corpo-expressão de seta cujo alvo é parâmetro da própria seta (`n => n é 2`): provável comparação | GS0801 (aviso) |
| Laço sem saída aparente (`enquanto_tiver (certeza)` sem `para_com_isso`) | GS0802 (aviso) |
| Código depois de `faz_favor` no mesmo bloco | GS0803 (aviso) |
| Declaração que esconde nome global da biblioteca (`Conta`, `Data`, `prosa`…) (P4) | GS0804 (aviso) |
| Forma `\d{1,3}(\.\d{3})+,\d+` em argumentos ou elementos de lista (P12) | GS0805 (aviso) |
| Expressão sem efeito: instrução isolada ou incremento de `vai_indo` cuja raiz é operador, identificador ou literal, sem chamada, atribuição, `faz_um` nem `espera_um_cadim` (`i mais 1`). Com identificador à esquerda e `mais`, `menos`, `vezes` ou `dividido`, a ajuda mostra `i é i mais 1` | GS0806 (aviso) |
| `prosa`, `reclama` ou `avisa` recebendo direto o parâmetro de `se_der_ruim` (use `erro.mensagem`) | GS0807 (aviso) |
| `.trocar(a, "…")` com `$$`, `$&`, `` $` `` ou `$'` no texto literal de substituição (P16) | GS0808 (aviso) |
| Acesso com texto literal a nome da biblioteca (`coisa["mapear"]`), não rebaixado | GS0809 (aviso) |

GS0401, GS0404, GS0209, os GS01xx, os demais GS02xx e os GS05xx saem do lexer e do parser (§5.3, §5.4); `vixe` fora de
posição de instrução é GS0206 no parser. GS0603 e GS0604 são sintáticos e sem falso positivo: membro chamável com nome da
biblioteca não pode ser declarado (GS0601) e a v3 não tem spread.

**Sessão do REPL (P14).** Com `options.session` (só no alvo `repl`), a análise começa com o escopo de topo povoado por
`session.bindings` e o censo D por `session.members`. Nome da sessão não dá GS0301; reatribuir `uai` da sessão é GS0302;
declarar de novo um nome da sessão (`uai`, `trem`, `faz_trem` ou `arruma_trem`) substitui o anterior e atualiza o `kind`,
sem GS0304 (redeclaração dentro da mesma entrada segue GS0304). A sessão devolvida soma à recebida as declarações do topo e
os membros declarados pela entrada; entrada que não compila não registra nada. No REPL, instrução de topo isolada sem
efeito (`a mais b`) não avisa GS0806, porque é consulta de valor; dentro de bloco ou de incremento de laço avisa.

**Garantia.** `compile()` com `ok: true` nunca emite JS que `acorn.parse` (`ecmaVersion: 2022`, `sourceType: 'module'`)
rejeite, no alvo `module`. Todo erro antecipado do JS estrito que o subconjunto consegue escrever tem diagnóstico: nesta
tabela, no léxico (§5.3) ou na regra de quebra de linha (§4.6).

### 5.7 Rebaixamento, emissão e alvos

- **Rebaixamento** produz uma lista imutável de edições `{ start, end, text }` sobre o texto original:
  - troca de keyword pelo token JS, só nos tokens que o nó referencia como keyword;
  - apelidos da biblioteca pelo nativo (`lista.mapear(f)` → `lista.map(f)`, `x.tamanho` → `x.length`, `Conta.maior` →
    `Math.max`); isso, o `await` automático e os ajudantes só valem quando o identificador resolve para a biblioteca, e
    não para um nome do aluno que a esconde (P4);
  - macros (§4.8): `vixe`, `.mês()`, `Coisa.mistura`, `vai_na_frente_faz_trem`;
  - `;` no fim de cada instrução simples (§4.6) e `await` automático em `pergunta`;
  - todo identificador do aluno cuja grafia difere de NFC recebe a edição que o grava em NFC (strings, comentários e
    trivia ficam intactos): o JS compara identificadores por pontos de código, e sem isso `café` em NFD daria
    `ReferenceError`.
- **`vixe` (P8):** uma edição só, na keyword. `vixe("x")` → `throw new Error("x")`; `vixe(faz_um Erro("x"))` →
  `throw (new Error("x"))`; `vixe(erro)`, com `erro` o parâmetro do `se_der_ruim` envolvente, → `throw (erro)`, que
  relança o mesmo erro.
- **`await` automático em `pergunta`:** `await` tem precedência menor que acesso a membro, índice e chamada. Quando a
  chamada é objeto de membro ou de índice, callee de outra chamada ou callee de `faz_um`, saem duas inserções, `(await `
  antes e `)` depois do `)` da chamada: `pergunta("a").gritando()` → `(await $gs_pergunta("a")).toUpperCase()`. Nos demais
  contextos sai só `await `: `uai n é vira_número(pergunta("Idade?")) mais 1` →
  `const n = $gs_vira_numero(await $gs_pergunta("Idade?")) + 1;`. As inserções ficam na linha da chamada.
- **Separação de tokens:** ao trocar palavra por símbolo, o emissor insere um espaço se o último caractere antes da edição
  e o primeiro depois formariam outro token (`+ +`, `- -`, `/ /`, `/ *`, símbolo seguido de `=`): `x menos-1` → `x - -1`,
  nunca `x --1`.
- **Ordem das edições:** por `start` crescente; no mesmo `start`, a inserção de largura zero vem antes da troca, e
  inserções na mesma posição seguem a ordem de emissão (percurso determinístico da AST). Edições nunca se sobrepõem;
  sobreposição é bug interno (GS0901).
- **Emissão** aplica as edições: **o token da linha N do `.gs` sai na linha N do JS**, com comentários, indentação e
  terminadores do `.gs`; source map v3 por token (posições base 1 convertidas para o índice base 0 do formato). A saída só
  ganha linhas depois da última linha do fonte.
- **Ajudantes** (só entradas `kind: 'helper'`: `pergunta`, `Conta.sorteia_um`, `.ordenar()`, `cochila`, `.mensagem`,
  `vira_número` e `é_número` (P11); entrada nativa nunca gera ajudante): emitidos **só se usados**, depois da última linha do
  `.gs`; `CompileSuccess.helperRange` informa as linhas deles.
  1. Cada ajudante é uma única declaração `function` (içada) chamada `$gs_<helperName>`; o prefixo é seguro porque `$` não
     vale em nome do aluno (GS0104).
  2. Estado compartilhado (leitor de `pergunta`, fim da entrada) vive em `var` sem inicializador ou em propriedade da
     própria função, nunca em `let` ou `const`: o topo chama o ajudante antes da declaração executar (zona morta
     temporal) e, no REPL, reemitir seria `SyntaxError`.
  3. Todo global que o ajudante cita (`Math`, `Number`, `Intl`, `Promise`, `Error`, `process`…) pertence a `jsReserved`,
     porque o aluno não pode sombreá-lo; uma varredura no CI confere o código dos ajudantes.
  4. `.ordenar()` (P9) é uma troca única de `ordenar()` por `toSorted($gs_ordem)`, sem tocar no receptor. `e.mensagem`
     (P10) vira `$gs_mensagem(e)` por duas edições (prefixo antes do receptor; `.mensagem` vira `)`): o ajudante é
     gerado do catálogo GS07xx, classifica por `name` (não por `instanceof`, que falha entre realms) e nunca devolve
     texto do motor. Atribuir a `.mensagem` é GS0601.
  5. Macros: `.mês()` insere `(` antes do receptor e troca `.mês()` por `.getMonth() + 1)` (parênteses sempre, porque a
     soma não é atômica); `Coisa.mistura(a, b)` insere `{}, ` como primeiro argumento de `Object.assign(`.
- Programa só com operações nativas, no alvo `module`: **0 bytes de runtime**. **Nenhum protótipo nativo é alterado, nunca.**
- **Alvos** (`CompileOptions.target`):

| Alvo | Uso | Forma da saída |
|---|---|---|
| `module` | `traduz`, `bota_pra_moer` | Módulo ES estrito (`.mjs`); `espera_um_cadim` no topo nativo; `pergunta` conforme o ciclo de vida da §4.10 |
| `repl` | `goias` | Script estrito (não módulo) executado com `vm.Script` num `vm.Context` persistente. A linha 1 começa com `'use strict'; let a, b;`, que lista **todos** os nomes que a entrada declara no topo (`uai`, `trem`, `faz_trem`, `arruma_trem`); cada declaração do topo vira atribuição: `uai x é 5` → `x = 5;`, `faz_trem f() {…}` → `f = function f() {…};`, `arruma_trem C {…}` → `C = class C {…};`. Nome que a sessão já conhece não entra no `let`. Entrada com `await` no topo vai inteira em `(async () => { … })()`, aberta na linha 1 e fechada em linha própria depois da última linha do `.gs`, e a última instrução-expressão recebe `return` (eco, §6.2) |
| `playground` | Worker do playground | Igual a `module`, mais trava de laço e `pergunta` via mensagem ao host; forma final de execução decidida no spike de sandbox (critério: isolamento real e linha exata) |

Todo alvo que não é módulo ES começa com `'use strict';` (inserção no offset 0, na linha 1; no `repl` é o prefixo acima),
para valer a semântica estrita do princípio 4. A diretiva, o prefixo e a trava de laço são instrumentação do alvo, não
ajudantes de runtime.

**Trava de laço (`playground`).** Um único orçamento de iterações por execução (`CompileOptions.loopLimit`): o contador é
global e monotônico, mora na função `$gs_tick` (emitida como os ajudantes, com o contador em propriedade dela) e nunca zera
entre laços, voltas de laço externo ou `tenta_aí`. A emissão insere `$gs_tick(<linha do .gs>)` logo depois da `{` do corpo
de cada `enquanto_tiver` e `vai_indo`, na mesma linha (os corpos sempre têm chaves, P7). Ao estourar, lança GS0701, e todo
tick seguinte relança, então um `tenta_aí` interno não retoma o laço.

**Regras do alvo `repl`:**

- **Contexto:** o `vm.Context` nasce só com `console`, `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval` e
  `pergunta`. Nenhuma saída usa `import()`, que no `vm.Context` falha com `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`.
  `pergunta` é função do hospedeiro (não é emitida como ajudante) e usa o único leitor de entrada do REPL: com pergunta
  pendente, a próxima linha digitada é a resposta. Ela cria os erros com o `Error` do próprio contexto, para
  `e é_tipo_de Erro` valer. `ocê` no topo da entrada é o objeto global do contexto.
- **Sessão e redeclaração (P14):** `uai` é `let` no motor; a imutabilidade é da análise (GS0302). Declarar de novo um
  nome da sessão substitui o anterior, e o tipo da sessão passa a ser o da nova declaração; dentro da mesma entrada a
  redeclaração continua GS0304. Como o nome fica no prefixo `let`, uma inicialização que lança deixa o nome `indefinido`,
  nunca preso. O hospedeiro adota a `session` devolvida assim que executa a entrada, mesmo se a execução lançar; com
  `ok: false` não adota nada. Uma função só existe depois da linha que a declara.

### 5.8 Otimização

- **Didático (padrão):** a saída da §5.7. Já entrega o ganho medido: zero prelúdio, estrito, chamadas nativas
  ([pesquisa, otimização](../../pesquisa/2026-10-13-arquitetura-compilador/notas/optimization.md)).
- **`--otimiza`:** `@goiasscript/optimizer` passa a saída pelo Terser (`compress`, `ecma: 2022`, `module: true`,
  sem mangle); `module: true` é obrigatório, sem ele o `await` de topo não compila. No navegador o Terser é carregado só
  quando o modo é ligado.
- **`--minifica`:** igual com `mangle`.
- Source map composto pelo próprio Terser (`sourceMap: { content: <mapa do .gs>, filename }`): `sources` aponta sempre
  para o `.gs` e `sourcesContent` é preservado.
- `bota_pra_moer` e a execução do playground usam sempre a saída didática. `--otimiza` e `--minifica` valem para `traduz`
  e para a visualização do JS gerado; o código otimizado não passa por `translateRuntimeError` na v3.
- Equivalência garantida por teste diferencial: mesmo stdout nos três modos no subconjunto **determinístico** do corpus
  (o executor semeia `Math.random` e `Date`). Ficam fora os programas que imprimem texto de erro do motor: o Terser inlina
  constantes e a mensagem muda (`conta is not a function` vira `5 is not a function`).
- Sem IR própria nem passes próprios na v3 (decisão aprovada; medições não justificam).

### 5.9 API pública

```ts
type CompileTarget = 'module' | 'repl' | 'playground';
type Tone = 'raiz' | 'neutro';
type Severity = 'error' | 'warning';
type BindingKind = 'uai' | 'trem' | 'faz_trem' | 'arruma_trem';

interface SourcePosition { readonly offset: number; readonly line: number; readonly column: number } // offset base 0; line/column base 1; unidades UTF-16
interface SourceRange { readonly start: SourcePosition; readonly end: SourcePosition }
interface LineRange { readonly startLine: number; readonly endLine: number } // linhas do JS gerado, base 1

interface Diagnostic { readonly code: string; readonly severity: Severity; readonly range: SourceRange; readonly message: string; readonly help?: string; readonly lesson?: string }

interface SessionBinding { readonly name: string; readonly kind: BindingKind }
interface ReplSession { readonly bindings: readonly SessionBinding[]; readonly members: readonly string[] }

interface CompileOptions {
  readonly fileName?: string;      // padrão 'programa.gs'
  readonly target?: CompileTarget; // padrão 'module'
  readonly tone?: Tone;            // padrão 'raiz'
  readonly sourceMap?: boolean;    // padrão true
  readonly session?: ReplSession;  // só no alvo 'repl'
  readonly loopLimit?: number;     // só no alvo 'playground'
}

interface CompileSuccess {
  readonly ok: true; readonly code: string; readonly map: SourceMapV3 | null;
  readonly diagnostics: readonly Diagnostic[];
  readonly helperRange: LineRange | null;
  readonly session: ReplSession | null; // 'repl': sessão recebida + o que esta entrada declarou; null nos outros alvos
  readonly echo: boolean;               // 'repl': a última instrução do topo é expressão; false nos outros alvos
}
interface CompileFailure { readonly ok: false; readonly diagnostics: readonly Diagnostic[]; readonly incomplete: boolean }
type CompileResult = CompileSuccess | CompileFailure;

interface OptimizeResult { readonly code: string; readonly map: SourceMapV3 | null }
interface DiagnosticExplanation { readonly code: string; readonly title: string; readonly explanation: string; readonly example: string; readonly lesson: string }
interface RuntimeErrorContext { readonly map: SourceMapV3 | null; readonly helperRange: LineRange | null; readonly fileName: string; readonly source: string }

declare function compile(source: string, options?: CompileOptions): CompileResult; // síncrono, nunca lança (bug interno vira GS0901)
declare function optimize(result: CompileSuccess, options: { readonly minify: boolean }): Promise<OptimizeResult>;
declare function explainDiagnostic(code: string, tone?: Tone): DiagnosticExplanation | null;
declare function translateRuntimeError(error: unknown, context: RuntimeErrorContext, tone?: Tone): Diagnostic;
```

`SourceMapV3` segue ECMA-426; os tipos ficam em `packages/compiler/src/api.types.ts`. Os valores de `Tone`
(`raiz`/`neutro`) ficam em goianês porque são os que o usuário digita em `--tom`, e os de `BindingKind` porque são a palavra de declaração que o `.mostra_os_trem` exibe (§6.2); os demais nomes ficam em inglês.

- **`compile()`** nunca lança: exceção interna (bug, inclusive `RangeError` de pilha) é capturada dentro dele e devolvida
  como `{ ok: false }` com um `GS0901` (com pedido de relato) e `range` de largura zero em 1:1. CLI, REPL, playground e
  extensão não repetem `try/catch`.
- **`incomplete`** é `true` só no alvo `repl` e só quando todo erro é `GS0201` ou `GS0106` (comentário de bloco sem fechar): `{`, `(` ou `[` abertos, comentário de
  bloco aberto, ou última linha terminando em operador, `é`, `,`, `.` ou `=>` (§4.6). Texto ou template sem fechar não é
  incompleto. Nos outros alvos, `GS0201` é erro comum.
- **`session`** é imutável: `bindings` são as declarações do topo e `members`, os nomes de membro declarados (P1),
  acumulados entre entradas. **`helperRange`** são as linhas do JS ocupadas por ajudantes.
- **`optimize()`** devolve `map: null` quando `map` é `null`; falha interna do Terser rejeita a Promise, e o chamador usa
  a saída didática.
- **`translateRuntimeError`:** `fileName` vem de `CompileOptions.fileName`; `source` é o texto do `.gs`, que converte
  linha e coluna do mapa em `offset`. Sem mapa, o `range` cobre a linha inteira do frame (§5.7). Regras na §5.10.

### 5.10 Tradução de erros de execução

O único ponto de mapeamento é `translateRuntimeError`. Nenhum executor liga o mapeamento de pilha do motor
(`process.setSourceMapsEnabled` e `--enable-source-maps` ficam desligados), então `error.stack` chega cru, em coordenadas
do JS gerado.

- **Frame:** vale o primeiro frame cuja linha gerada está fora de `helperRange`, posicionado no `.gs` pelo mapa; erro
  lançado dentro de ajudante aponta, portanto, a linha do `.gs` que o chamou. Na saída didática as linhas são
  preservadas, e só nesse caso a linha bate mesmo sem mapa. Se todos os frames caem em ajudante, o diagnóstico sai com
  `range` de largura zero em 1:1.
- **Classificação:** pelo construtor do erro (`TypeError`, `ReferenceError`, `RangeError`, `SyntaxError`) e pelo trecho do
  `.gs` no intervalo mapeado (token de chamada, acesso ou identificador), nunca por regex sobre `error.message`; a
  mensagem do motor nunca é exibida. Construtor desconhecido cai no `GS07xx` genérico em goianês (GS0710–GS0799).
- **Arquivo e mapa:** o nome exibido é sempre o `fileName` do contexto, nunca o caminho temporário. As linhas
  dos ajudantes nascem sem segmento de mapeamento e o mapa tem uma só fonte, então não emite `ignoreList`; o frame de
  ajudante é identificado só por `helperRange`.
- **Trava de laço (GS0701):** o erro carrega, como literal inserido pelo compilador na linha do laço, a linha do `.gs`;
  não depende da pilha nem de frame de ajudante.
- **`.mensagem` (P10):** o mesmo catálogo alimenta `.mensagem` (§4.9), então o erro do motor capturado por `tenta_aí`
  também chega em português. Diagnósticos, erros de execução e `.mensagem` nunca saem em inglês; imprimir o objeto de erro
  inteiro mostra a pilha do motor (limite documentado; `prosa(erro)` direto do `se_der_ruim` recebe o aviso GS0807).

### 5.11 Orçamentos de desempenho e tamanho

Dois grupos:

- **Tetos absolutos**, em vigor desde a Fase 2 e independentes de medição: bytes de runtime = 0 para programas só
  nativos (alvo `module`; programa com entrada `helper` paga só os bytes dos ajudantes usados); caso patológico de 100 mil
  espaços < 100 ms (hoje 11,6 s); `compile()` de 10 mil linhas ≤ 150 ms (Node 24, mediana de 20 execuções após 2 de
  aquecimento).
- **Catracas relativas** (só podem melhorar): tempo de `compile()` de 10 mil linhas e tamanho do compilador para
  navegador (brotli). Os valores são fixados ao fim da Fase 2, com o compilador completo, em 1,25x a medida do
  `compile()` estável (folga registrada no ADR-0001); até lá o CI só publica a medida. A Fase 0 apenas mede o PoC, sem
  catraca; o gate da Fase 0 usa limites a priori (§10.1).

---

## 6. Ferramentas

### 6.1 CLI (`goiasscript`)

| Comando | Faz |
|---|---|
| `goiasscript traduz arquivo.gs [-s saida.mjs] [--otimiza\|--minifica]` | Compila para `.mjs` |
| `goiasscript bota_pra_moer arquivo.gs` | Compila e executa |
| `goiasscript vê_se_tá_certo arquivo.gs` | Só verifica (todos os diagnósticos) |
| `goiasscript arma_o_barraco nome` | Cria projeto a partir do template único |
| `goiasscript explica GS0301` | Explica um erro com exemplo e lição |
| `goiasscript dedo_de_prosa` | Versão e informações |

- Variantes sem acento dos comandos (`ve_se_ta_certo`); **sem apelidos em inglês**; ajuda 100% goiana.
- `--json` (diagnósticos para ferramentas), `--tom neutro`, leitura de stdin com `-`.
- **Segurança:** saída derivada do `.gs` (extensão comparada sem diferenciar maiúsculas; entrada que não termina em
  `.gs` é GS0902); recusa saída igual à entrada e destino existente sem `--sobrescreve` (GS0903); nunca apaga o fonte;
  temporários em diretório próprio de `os.tmpdir()`. Comando ou opção desconhecidos são GS0905.
- **Exit codes:** `0` sucesso; `1` erro de compilação; `2` erro de execução (inclui GS0702, fim da entrada antes da
  resposta de `pergunta`, e GS0703, programa que não termina por promessa pendente); `3` uso incorreto do CLI (GS0902, GS0903 e GS0905).
- **`bota_pra_moer`:** compila (alvo `module`, sempre a saída didática), grava em diretório temporário e importa em
  processo, sem ligar o mapeamento de pilha do Node. Erros síncronos, assíncronos, `unhandledRejection` e
  `uncaughtException` entregam a pilha crua a `translateRuntimeError` (§5.10) e viram `GS07xx` com a linha do `.gs`. O CLI
  não usa `await` de topo para importar o programa (o Node imprimiria `Warning: Detected unsettled top-level await` em
  inglês e sairia com 13): usa `import(…).then(…)`, com uma flag `terminou` e um `process.on('exit')` síncrono. Se o
  programa não terminou, imprime GS0703 e define `process.exitCode = 2`. O ciclo de vida de `pergunta` é o da §4.10.
- **`arma_o_barraco`:** um template; o CI gera o projeto e roda os "próximos passos" impressos.
- Node ≥ 22.12 (`engines`); versão menor recebe aviso em goianês (GS0904).

### 6.2 REPL (`goias`, a Roda de Prosa)

- Alvo `repl` em `vm.Context` persistente (§5.7). O REPL guarda a `ReplSession` devolvida por `compile()` e a passa na
  entrada seguinte: `uai x é 5` e depois `prosa(x)` funciona. Declarar de novo um nome da sessão substitui o anterior,
  como no console do navegador (P14); reatribuir um `uai` da sessão continua GS0302.
- Multilinha: com `incomplete: true`, o REPL mostra o prompt de continuação, acumula as linhas e recompila o buffer
  inteiro com a sessão anterior à primeira linha; `ok: false` sem `incomplete` mostra o erro e descarta o buffer. Ctrl+C
  descarta a entrada pendente e só sai no segundo. Entrada com erro de compilação não registra nada na sessão.
- Fim da entrada: a entrada termina no `}` seguido de quebra, e `se_num_for`, `se_não`, `se_der_ruim` ou `por_fim` em linha nova dá GS0205 (§4.6); para continuar, o aluno escreve a palavra na linha do `}` (`} se_não {`).
- Uma entrada por vez: o REPL não lê nova entrada enquanto a anterior (inclusive assíncrona) não terminou, exceto para
  responder `pergunta`.
- Eco: com `echo: true`, mostra o valor da última instrução-expressão como o `prosa` mostra, menos `indefinido` (`1 mais 2`
  mostra `3`; declarações e `prosa(x)` não ecoam). Linha que começa com `.` é comando do REPL no prompt principal
  (desconhecido: erro goiano com sugestão) e continuação dentro de buffer pendente (§4.6).
- Comandos, com variantes sem acento: `.desenrola`, `.mostra_os_trem` (lista `session.bindings`, nome e tipo; o
  contexto não serve porque `let` não aparece nele), `.lembra_aí`, `.limpa_o_terreiro`, `.zera_o_trem` (contexto novo e
  sessão vazia), `.vaza`. O TAB completa com a lista gerada da tabela (§5.2) e os nomes de `session.bindings`.
- `pergunta` e `espera_um_cadim` no topo funcionam; diagnósticos com o mesmo catálogo.

### 6.3 Playground

- Editor Monaco com linguagem gerada da tabela (`unicode: true`), **diagnósticos ao vivo** (vários), **autocomplete** (palavra goiana + equivalente JS + link da lição) e hover.
- **"JS gerado" lado a lado**, com seletor didático/otimizado.
- **Execução:** Web Worker com **CSP por recurso** como barreira real (o sombreamento de globais não é fronteira, [D APP-01](../../auditoria/2026-10-13/D-apps.md)). O mundo fechado (§4.1) não verifica `x[k]` não literal: a contenção é a CSP, e no CLI o programa roda com os poderes do usuário. Espera da saída assíncrona com detector de ociosidade e tempo máximo; teto de log; trava de laço (`GS0701`, com a linha); caixinha de `pergunta`; código salvo no navegador.
- **Piso de navegador:** Chrome e Edge 110, Firefox 115, Safari 16 (mínimo para `.toReversed()` e `.toSorted()`). O E2E cobre Chromium, Firefox e WebKit (hoje só Chromium, [C G15](../../auditoria/2026-10-13/C-testes-ci-gates.md)). O `ecma: 2022` do Terser (§5.8) vale só para sintaxe.
- Páginas de erro e 404 em goianês; imagem de compartilhamento gerada de um snippet que compila no CI.
- URLs públicas (domínio, compartilhamento, CORS) vêm de configuração, não hardcoded.
- Links de doação (Pix, Sponsors, Ko-fi) vêm de configuração; link ausente não é exibido. O build de produção e um E2E falham se o valor for igual ao do `.env.example`; o job semanal (§8.3) confere que as URLs de Sponsors e Ko-fi respondem ([E F08](../../auditoria/2026-10-13/E-governanca-extensao-historico.md)).
- Deploy na Vercel (projeto e domínio: tarefas do dono, §10.3).

### 6.4 Cartilha (`/cartilha`)

Lições em Markdown, cada uma com exemplo editável e exercício com correção automática pela saída esperada:

1. `prosa` (primeiro programa) · 2. `uai` e `trem` · 3. texto e `mais` · 4. `se_ocê_quiser` · 5. laços ·
6. listas · 7. `faz_trem` · 8. coisas (objetos) · 9. `arruma_trem` e `a_raiz` · 10. `tenta_aí` e `vixe` ·
11. `pergunta` e `espera_um_cadim`.

Todo bloco de código e toda solução de exercício compilam e executam no CI; cada diagnóstico aponta para a lição.

- A lição 2 ensina que o decimal é com ponto (`10.50`), com um exercício que corrige `uai preço é 10,50` (GS0208, P12); o exercício de `vira_número(pergunta("Quanto custa?"))` respondido com `10,50` fica na lição 11, onde `pergunta` é apresentada.
- Exemplos e exercícios não usam `Conta` nem `Data` como nome de classe (P4) nem membros de nome reservado (P3); a lição 9 segue `Fruta`/`Pequi` (§4.7).
- Exercício com `pergunta` traz o `stdin.txt` que o teste de execução alimenta (lição 11).

### 6.5 Extensão VS Code (`goiasscript-vscode`)

- Casca nova; compilador embutido (sem servidor LSP separado); diagnósticos em tempo real; hover; autocomplete; gramática, snippets e ícones gerados da tabela.
- Comandos `traduz` e `bota_pra_moer` executam com argumentos em lista (`execFile`), **nunca pelo shell**, e só aceitam `document.uri.scheme === 'file'`.
- Declara `capabilities.untrustedWorkspaces: { supported: 'limited', description: <texto em goianês> }`. `traduz` e os diagnósticos não executam código; `bota_pra_moer` executa o programa do aluno e só roda com `vscode.workspace.isTrusted` (`when: isWorkspaceTrusted` nos menus e atalhos, mais checagem em runtime). `{ supported: false }` também atenderia, mas desativaria a extensão inteira no Modo Restrito.
- Sem debugger na v3. Versão alinhada à linguagem (§9.5).
- Publicação pelo CI no Marketplace e no Open VSX. Marketplace sem PAT: os PATs globais do Azure DevOps são aposentados em 2026-12-01, antes do fim da Fase 5. O método é escolhido na Fase 0 entre Entra ID com federação de identidade (`vsce publish --azure-credential`, documentado) e `vsce publish --oidc` (descrito só no README do vsce 4.0.0; maturidade a confirmar). O Open VSX usa token com escopo restrito (OIDC não documentado).
- `.gitattributes` com `*.gs linguist-language=JavaScript`. O Linguist associa `.gs` a GLSL, Genie, Gosu e JavaScript e só desambigua por conteúdo (`#version`, `uses java.`, `[indent=`), que um `.gs` em goianês não casa. O Google Apps Script também usa `.gs`, mas não é linguagem do Linguist.

### 6.6 Engoianador (`apps/engoianador-api`)

Reescreve **texto** em goianês (não código).

- Modelo por variável de ambiente; ID verificado contra a API na hora do deploy (os modelos usados antes, `llama-3.1-70b-versatile` e `llama-3.3-70b-versatile`, foram desligados pela Groq).
- Fallback Workers AI configurado e testado.
- **Teste de contrato agendado** (semanal) contra a API real.
- Limite de uso atômico por rede /64, teto global e kill switch; configuração inválida falha no deploy em vez de desligar limites.
- A cota só é consumida por resposta bem-sucedida do provedor: a reserva é atômica e é devolvida quando o provedor falha (4xx, 5xx, timeout ou modelo desligado), então falha de infraestrutura não esgota as 20 requisições diárias ([D APP-02](../../auditoria/2026-10-13/D-apps.md)). Teste de concorrência (`Promise.all`) e teste com provedor simulado em erro, verificando que o contador volta ao valor anterior.
- Cache por hash do texto normalizado, com chave que inclui o ID do modelo e a versão do prompt. Resposta em cache não chama o provedor nem consome cota, o que zera o custo das 5 frases prontas da página ([D APP-03](../../auditoria/2026-10-13/D-apps.md)). TTL curto; o aviso de privacidade cobre o armazenamento do resultado.
- `GET /health` (evolução do `GET /`) responde sem chamar o provedor e sem consumir cota; serve de liveness e confere a configuração (modelo e bindings). A chamada ao provedor real fica só no teste de contrato semanal e num smoke único pós-deploy.
- **Validação de borda:** corpo validado por schema (Zod), com campo de texto em inglês e tamanho máximo; `Content-Type` JSON obrigatório; `Content-Length` conferido antes de ler o corpo; `null`, array ou tipo errado devolvem 400 em goianês, com CORS; falha transitória do KV tem política explícita e registrada. Teste de cada caso ([D APP-10](../../auditoria/2026-10-13/D-apps.md)).
- Aviso de privacidade na interface (texto enviado ao provedor de LLM).
- Testes reais de `index.ts` e `engoiana.ts` (hoje 0/8 mutantes mortos).

---

## 7. Fora de escopo da v3

Balaios (`gs-balaio`), debugger (`gs-fuçá`), módulos, sistema de tipos, LSP como processo separado, níveis graduais
estilo Hedy, interop com JS nativo, IR própria. Cada um só entra por RFC (§9.3).

---

## 8. Qualidade

### 8.1 Regras do dono como gate

O CI roda ESLint com `--max-warnings 0` e o baseline do scanner nasce vazio. A coluna "Bloqueia" diz se a violação derruba o PR.

| Regra do dono | Mecanismo | Bloqueia |
|---|---|---|
| TypeScript estrito (inclui `unknown` em `catch`) | TS 6.0.x fixado (TS 7 sem API JS; typescript-eslint exige < 6.1); `strict` (com `useUnknownInCatchVariables`), `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly` | Sim |
| Sem `any` | ESLint 10 flat + typescript-eslint `strictTypeChecked` (`no-explicit-any`, `no-unsafe-*`); scanner R07 como conferência | Sim |
| Sem `@ts-ignore`/`eslint-disable` sem motivo | `ban-ts-comment` (`ts-ignore: true`, `ts-expect-error: 'allow-with-description'`, `minimumDescriptionLength: 6`); `@eslint-community/eslint-comments/require-description`; `reportUnusedDisableDirectives: 'error'`; scanner R08/R09 | Sim |
| `TODO` só com ticket | Scanner R10 com `TICKET_PATTERN` restrito a `// TODO(GS-<n>): …` (n = número da issue no GitHub), forma que também passa nos hooks locais do mantenedor; `no-warning-comments` não é usado | Sim |
| Sem magic numbers | `no-magic-numbers` (`ignore: [-1, 0, 1, 2]`, `ignoreArrayIndexes`, `detectObjects`) | Sim |
| Sem magic strings | Scanner R16 (string repetida ≥ 3x) só avisa; valores nominais viram `as const`; revisão do agente revisor | Não (avisa) |
| Imutabilidade | `no-param-reassign` (`props: true`), `prefer-const`, `no-var`, `functional/immutable-data` (eslint-plugin-functional 10.x, inclui Map e Set). Exceção proposta (ADR-0004), por override de flat config com `files` restrito a `packages/compiler/src/{lexer,parser,analyzer}/**` e `ignoreAccessorPattern: 'this.**'`: mutação só em `this.*` (cursor, acumulador, fila, tabela de símbolos); parâmetro e AST seguem proibidos; AST, tokens e `Diagnostic` são `readonly` na API | Sim |
| Erro nunca engolido | `no-empty` (`allowEmptyCatch: false`) e `no-restricted-syntax` com seletor de `catch` sem `throw`/`return`/`process.exit`; scanner R20 só avisa (falso positivo 16,7%) | Sim (ESLint); não (scanner) |
| Types e constantes em arquivos próprios | `no-restricted-syntax` em `ExportNamedDeclaration > TSInterfaceDeclaration` e `> TSTypeAliasDeclaration`, desligado só em `**/*.types.ts`; constantes nominais em `*.constants.ts` ou nas tabelas de dados (§5.2), conferidas na revisão | Sim (types) |
| Tamanhos | `max-lines` 800 (limite do dono); alvo de 400 só avisa (scanner R01); `max-lines-per-function` 50; `max-depth` 4 | Sim; alvo de 400 não |
| Sem `console` em produção | `no-console` sem exceção. O terminal do CLI (`packages/cli/src/terminal.ts`) escreve por `process.stdout.write`/`process.stderr.write` atrás de uma interface de saída injetável (testável) | Sim |
| Identificadores em inglês | Scanner R14 portado como gate (§8.1.1). `id-match` (só diacríticos) e `@typescript-eslint/naming-convention` (só caixa) não verificam idioma. Vocabulário goiano só como valor string de dado; string em português só como valor user-facing (ADR-0007) | Sim |
| Comentários R1–R4 | Scanner R11 (bloco > 4 linhas), R12 (ao lado do código) e R13 (histórico/meta-processo) com baseline vazio; R21 (comentário que só narra) só avisa | Sim (R11–R13); não (R21) |
| Fronteiras e código morto | dependency-cruiser (camadas §5.1, nada de `node:*` em `language`/`compiler`); knip | Sim |
| Commits | husky 9 + lint-staged + commitlint (ADR-0008), mais lint do título do PR | Sim |
| Segurança | Entrada validada por schema nas fronteiras; sem segredo nem valor de exemplo em produção; CodeQL e OSV (§8.3); revisão de segurança nos gates das Fases 3, 4, 5 e 7 (§10.1) | Sim (CodeQL, OSV); revisão manual |
| TDD (RED → GREEN) | Não é verificável por máquina. Proxies: sentinela `expected-fail` (RED na `main`, GREEN = remover o marcador), cobertura de patch ≥ 80% (§8.2), checkbox "teste de regressão incluído" no template de PR e revisor independente (§10.2) | Parcial (sentinela e patch) |
| Cobertura e mutação | §8.2 (Vitest ≥ 80% por pacote e de patch; Stryker) | Sim (limiar) |

**Severidade e supressão.** Bloqueiam as regras de ESLint e dependency-cruiser da tabela, o scanner R14 (falso positivo 0/23) e R11–R13 (6/6 verdadeiros no censo), com baseline vazio ([medição da auditoria](../../auditoria/2026-10-13/F-conformidade-quantitativa.md)). Só avisam, a cargo do agente revisor (§8.3), as regras com falso positivo medido: R16 (14,3%), R20 (16,7%) e R21 (4,4%). A supressão é inline, com motivo de uma linha: `// scanner-ignore R16 -- motivo` e `eslint-disable-next-line <regra> -- motivo`; supressão sem motivo falha o CI (R09). A catraca (só pode melhorar) vale para os orçamentos (§5.11), a cobertura, a nota de mutação e o baseline de `apps/*`; em código novo o baseline do scanner nasce vazio e `--write-baseline` não é permitido. As regras bloqueantes e de aviso vivem em `tools/rules-scan/policy.json`, versionado.

**Sem mecanismo de máquina** (agente revisor em contexto fresco, §8.3, com checklist no template de PR): R1 e R4 (comentar só o porquê não óbvio); idioma português dos comentários (ADR-0007); constantes nominais fora de `*.constants.ts`; TDD.

**Escopo dos gates.** (a) Pacotes novos (`packages/language`, `compiler`, `optimizer`, `cli`, `vscode`): todos os gates bloqueiam desde o primeiro commit, sem baseline. (b) `packages/core`, `vscode-extension/` e `lsp-server/`: fora do ESLint estrito, do scanner, de `max-lines`, do knip e do dependency-cruiser, por caminho, até a remoção na Fase 8 (§9.4); seguem só com `lint` e testes legados. (c) `apps/*` (reescrito nas Fases 4 e 7): catraca por arquivo; um baseline gerado na Fase 1 lista os arquivos intocados, e todo arquivo criado ou alterado obedece a todos os gates. (d) Até a Fase 4, `apps/playground` pode importar `goiasscript/browser` do `packages/core`, por regra do dependency-cruiser com expiração na Fase 4. O CI cobre também `scripts/`, geradores (§5.2) e configs `.mjs`/`.ts`; scripts e geradores novos são `.ts` por type stripping (compatível com `erasableSyntaxOnly`), e o toolchain de desenvolvimento exige Node ≥ 22.22.1 (lint-staged), acima do mínimo 22.12 do pacote publicado.

#### 8.1.1 Gate de idioma (R14)

O scanner da auditoria está preso ao legado (escopo só em `packages/core`, `apps/*` e `vscode-extension`; três scripts com caminho absoluto), então é portado, não reaproveitado.

- **Porte.** `tools/rules-scan/` em Node puro, sem caminho absoluto; escopo em `scope.json` (`packages/{language,compiler,optimizer,cli,vscode}/{src,tests}` e `apps/*`). O gate **falha** se escanear 0 arquivos ou se algum `.ts`/`.tsx` rastreado não estiver no escopo nem na lista `excluded` de `scope.json`. `excluded` traz só `packages/core`, `vscode-extension/` e `lsp-server/` (§8.1, escopo dos gates, item b), com remoção na Fase 8; `scripts/` e as configs `.ts` da raiz entram no escopo. Também confere os segmentos de caminho (ADR-0007), fora de `docs/` e dos exemplos `.gs`.
- **Teste antes do código (RED).** O selftest nasce com `fixtures/pt-names.txt` (≥ 100 nomes portugueses plausíveis de compilador, incluindo `existente` e `buscarUsuario`) e um corpus de nomes em inglês que não podem ser marcados. Aceite: recall ≥ 90% e falso positivo 0.
- **Léxico.** `wbrazilian`, `wamerican` e `wbritish` por `apt` no job Ubuntu; hashes em `dictionaries.lock.json`; o gate falha se o dicionário estiver indisponível ou o hash divergir (atualizar é decisão explícita). O modo só com denylist não vale como gate: a lista do legado só cobre os nomes já listados, não os novos. Listas de palavras só entram no repositório com a licença conferida. Roda em um job só, no Ubuntu, fora da matriz Windows.
- **Baseline.** Vazio nos pacotes novos; `apps/*` herda `tools/rules-scan/baseline.json` em catraca (só pode melhorar).
- **Isenção de superfície.** Só valores string dos arquivos da tabela em `packages/language/src/` (§5.2); nunca identificador, nunca por casamento de nome.

### 8.2 Testes

- **Corpus de conformidade (golden)** em `packages/compiler/tests/conformance/<id>/` com `input.gs`, `output.mjs`, `stdout.txt`, `diagnostics.json` e, opcionais, `stdin.txt` (alimenta `pergunta`) e `case.json`. `pnpm bless` regrava os goldens (a mudança passa por revisão) e recusa, listando, qualquer caso `expected-fail`. Semeado com: os 173 casos da auditoria **triados** em "bug a corrigir" ou "mudança intencional" (Fase 1; a regra de pertinência da §4.7 decide a segunda); os blocos de código da documentação e da cartilha; os exemplos do repositório (`async_exemplo.gs` é mudança intencional: `setTimeout`, `Date` e `;` saem); um caso por diagnóstico do catálogo (`GS0901` por injeção de falha, fora dessa conta); e os grupos abaixo.
- **Falha esperada (sentinela).** `case.json` com `{ "status": "expected-fail", "rfc": "RFC-NNNN" }` (ou `"issue": "<id>"`, nos "bug a corrigir") roda como `test.fails` do Vitest: o check fica verde enquanto o caso falha e **vermelho quando ele passa**, o que obriga a remover o marcador no PR da correção. O gate de release (S2) exige zero casos `expected-fail`. `{ "differential": false }` tira o caso do diferencial.

| Grupo | Casos |
|---|---|
| Fim de instrução | callback em bloco com ≥ 2 instruções, também dentro de `[ ]`; arrow com bloco em coisa de várias linhas; `faz_um promessa` com `daqui_a_pouco` aninhado (com `stdout.txt`); `soma(1,⏎ 2)` continua; `se_ocê_quiser … se_não` na mesma linha e com `se_não` em linha nova (comentário entre); `tenta_aí`/`se_der_ruim`/`por_fim` em linhas separadas; estilo Allman em função, `se_ocê_quiser`, `enquanto_tiver`, `vai_indo`, classe com `inherda_de` e `tenta_aí`; `uai o é { a: 1 }` e `uai f é x => { faz_favor x }` seguidos de linha com `[` ou `(` (`;` na saída); cabeçalho do `vai_indo` com exatamente 2 `;` (nenhum em `de`/`em`); `faz_favor⏎1` e `faz_favor /* a⏎b */ 1` devolvem `indefinido`; `x menos-1`, `x-menos 1`, `x menos -1` sem virar `--` nem comentário; GS0203 (`mais b` no início da linha), GS0204 (`x⏎=> x`), GS0205 (`se_não` solto), GS0202 (`vai_na_frente⏎faz_trem`, `a vezes*b`, `a dividido/2`) |
| Palavras e nomes | `{ de: "SP" }`, `obj.de`, `obj.mais`; `uai de é 1` com `vai_indo (uai x de de)`; `uai em é 5` com `vai_indo (uai k em em)`; `uai mais é 1` (GS0303); `promessa.catch(f)` (GS0405); `{ new: 1 }` (GS0401) e `obj.default` (GS0402) (P2); `uai public é 1` (GS0402) e um caso por palavra reservada do JS, com o código da §4.4 (GS0401 com equivalente goiano, GS0402 sem equivalente, GS0403 para global); uma variante sem acento por keyword (uso como keyword e GS0303 como nome); alfabeto (P5): acento NFC e decomposto aceitos (NFC na saída); `ç` aceito; letra grega, emoji e `$` (GS0104), nas matrizes Node 22 e 24 |
| Unicode e arquivo | `identifier-nfd`: declarar em NFC e usar em NFD (variável, propriedade, método, parâmetro) e o inverso, com `output.mjs` só em NFC e a entrada montada no teste com U+0301 explícito (editores e git normalizam); keyword em NFD (`se_não`, `ocê`, `é`) reconhecida; texto e comentário com `é` NFD intactos byte a byte; `line-breaks`: BOM com `\r\n` dá o mesmo `stdout.txt` e as mesmas linhas de diagnóstico que `\n` sem BOM; `\r` isolado; U+2028 e U+2029 em comentário, texto e código (GS0105); `.gitattributes` marca `tests/conformance/**` como `-text`; posições com emoji (par substituto) antes do erro, `é` decomposto, fim de arquivo e última linha sem `\n`, conferindo linha e coluna do diagnóstico, linha do erro de execução e do source map, e a conversão de base para LSP, VS Code e `mappings` |
| Regex, template e números | `uai r é /ab+/g`, `/"/`, `/a\//` e `/=abc/` (um só GS05xx, nenhum GS01xx, resto da linha consumido); `uai m é a / b / c` e `a /b/ c` (divisões, sem diagnóstico); crase, inclusive com `${…}` aninhado (GS05xx, sugere `mais`); `08` e `01310` (GS0101, ajuda sugere texto); `1.000.000` (GS0101) e `uai preço é 10,50` (GS0208, com a correção); `1.000,50` em argumentos (GS0805) (P12); sem diagnóstico: `[1,2,3]`, `soma(2,3)`, `uai pi é 3.141` |
| Membros e mundo fechado (P1) | `lista.some(f)` e `x.toString()` (GS0406); `lista.map(f)` (GS0405); `p.nmoe` (GS0305, com sugestão); `constructor`, `prototype`, `__proto__` (GS0406); positivos: `ocê.campo`, método de classe e chave de coisa lidos em outro ponto do arquivo, `lista[i]` sem aviso, `coisa["mapear"]` (aviso GS0809); membro declarado numa entrada do REPL e lido na seguinte |
| Reserva por forma (P3) | aceitos: `{ ano: 1999 }`, `{ dia: 5 }`, `{ hora: 9 }`, `{ maior: 3 }`, `{ tem: certeza }`, `{ pergunta: "x" }`, `filme.ano`, `{ ano: 1999 }` junto de `agora.ano()`, `fila.tem(x)`; GS0601: `{ tamanho: 3 }`, `{ mensagem: "oi" }`, classe `Fila` com `tamanho()`, classe com método `mapear(f)`, `{ ano: (x) => x }`, `{ ano: ano }`, `{ ano: calcula }`; GS0603: `x.tamanho()`, `Conta.PI()`, `uai f é lista.mapear`; GS0405: `x.length`; GS0604: `.amontoar(f)`, `.trocar("a")`, `.ordenar(f)` |
| Sombreamento (P4) | classe `Conta` do usuário com `faz_um Conta(…)` e `uai Data é …` (GS0804, vale a do usuário); `faz_trem pergunta()` do usuário (sem `await` automático e sem ajudante emitido); `pergunta` e `Conta.maior` reais ao lado de classe com outro nome; `faz_trem ordenar(l)` junto de `l.ordenar()`, sem colisão de ajudante |
| Ajudantes e rebaixamento | `.ordenar()` em lista mista com `NaN`; `d.mês() vezes 2`, `d.mês().com_casas(2)`, `faz_um Data().mês()` |
| `pergunta` e `vixe` | `pergunta("Nome?").gritando()` → `(await $gs_pergunta("Nome?")).toUpperCase();`; `pergunta("Nome?")[0]`; `.tamanho` → `(await $gs_pergunta("Nome?")).length;`; `pergunta("a").trocar("x", "y").gritando()`; o mesmo encadeamento quebrado em duas linhas (linhas preservadas); `uai nome é pergunta("Nome?")` → `const nome = await $gs_pergunta("Nome?");`; `prosa(pergunta("x"))`; `uai n é vira_número(pergunta("Idade?")) mais 1` (sem parênteses); `pergunta` em `vai_na_frente faz_trem` e no REPL com `await` no topo; `vixe`: `x => { vixe("a") }` válido; `x => vixe("a")`, `a ou_então vixe("b")`, `vixe("a", "b")` e `vixe("a") mais "b"` (GS0206); `vixe(erro)` no `se_der_ruim` → `throw (erro);` (P8); `vixe(faz_um Erro("a"))` → `throw (new Error("a"));` |
| Erros de execução (P10) | `caught-error-*`: `tenta_aí { … } se_der_ruim (erro) { prosa(erro.mensagem) }` com `stdout.txt` em português para leitura de propriedade de `nada`, chamada de valor que não é função, `trem` usado antes da declaração (TDZ), `"a".repete(-1)`, `.com_casas(101)` e recursão infinita, nos três modos e em Node 22 e 24; controle com `vixe("Deu ruim, sô!")` de mensagem idêntica à do aluno; erro lançado em ajudante (`.ordenar()` em valor que não é lista; GS0701 num laço na linha N) aponta a linha do `.gs` de quem chamou, com o mapeamento do motor desligado; classificação sem ler `error.message`; arquivo exibido igual a `fileName` |
| Palavras aposentadas (P13) | um golden por palavra de `retiredWords` nos dois tons (GS0306); `uai lista é [1]`, `uai vazio é 0` e `uai se é 1` compilam sem diagnóstico |
| Avisos pedagógicos | `vai_indo (trem i é 0; i menor_que 5; i mais 1)` e `i mais 1` solto (GS0806); `a mais b` no topo do alvo `repl` sem aviso (é eco); `prosa(erro)` direto do `se_der_ruim` (GS0807); `.trocar` com `$&` no texto de substituição (GS0808) |
| REPL (por PTY) | persistência (`uai x é 5` e `prosa(x)`); redeclaração substitui (P14) e reatribuir `uai` da sessão dá GS0302; falha de inicialização seguida de redeclaração; nome inexistente (GS0301 com sugestão); `vixe` antes de uma declaração; bloco aninhado e `{` dentro de texto; `.mapear` no buffer pendente e no prompt; eco de `1 mais 2`; TAB; Ctrl+C no meio de bloco; entrada com `await` que declara função e classe; `espera_um_cadim` no topo; `pergunta` sem segundo leitor; `daqui_a_pouco` e `cochila`; erro do host e `e é_tipo_de Erro`; multilinha por `incomplete` |

- **Testes de execução:** todo golden executável roda e compara stdout (com `stdin.txt` quando existe).
- **Oráculos:** `acorn.parse` com `ecmaVersion: 2022` e `sourceType: 'module'` em todo JS emitido (o alvo `repl` também como script em `vm.Script`; o padrão `script` do acorn aceitaria `const public = 1`). Diferencial entre os três modos (§5.8) no subconjunto **determinístico**: o executor semeia `Math.random` e `Date` por pré-carga, e programas que imprimem texto de erro do motor sem passar por `.mensagem` ficam fora (`differential: false`; o Terser inlina constantes, então a mensagem do motor muda com `--otimiza` e entre Node 22 e 24). Regressões do otimizador: programa com `espera_um_cadim` ou `pergunta` no topo passa por `--otimiza` e `--minifica` mantendo o stdout (o `module: true` do Terser é obrigatório), e as posições do `.mjs` otimizado e minificado resolvem para o `.gs` esperado. Oráculo estrutural: toda `CallExpression` de `$gs_pergunta` (no alvo `repl`, `pergunta`), fora da declaração do ajudante, é o argumento direto de uma `AwaitExpression`. Paridade das reservadas: o universo é `Object.keys(acorn.keywordTypes)` mais `ReservedWord` do ES2022, as reservadas do modo estrito (`implements interface let package private protected public static yield`), `eval` e `arguments`; toda palavra que `acorn.parse('const <palavra> = 1', …)` ou `vm.Script` rejeita está em `jsReserved`, e toda palavra de `jsReserved` é rejeitada como nome nas 7 posições de ligação (`uai X é 1`, `faz_trem f(X) {}`, `faz_trem X() {}`, `arruma_trem X {}`, `X => X`, `se_der_ruim (X) {}`, `vai_indo (uai X de lista) {}`).
- **Propriedades (fast-check):** (a) lexer e `compile()` nunca lançam, com strings Unicode arbitrárias e sequências aleatórias de tokens da tabela (inclusive `Newline`), nem estouram a pilha com `'('.repeat(n)`, `'{'.repeat(n)`, `'1' + ' mais 1'.repeat(n)` e `'a' + '.a'.repeat(n)` até n = 100 mil (acima do limite de aninhamento há diagnóstico de sintaxe); (b) **`ok` ⇒ `acorn.parse` da saída não lança**, com dois geradores: AST arbitrária da §5.5 (`fc.letrec`, `maxDepth`) impressa em `.gs` por um impressor de teste, sem filtrar o que o ESTree permite e o JS rejeita (`uai` sem init, `faz_favor` solto, parâmetros repetidos), e mutação do corpus (troca, remoção e inserção de tokens e de quebras), com identificadores também tirados do universo de reservadas; cada propriedade com `ok: true` registra a taxa de aceitação e falha abaixo de um piso fixado ao fim da Fase 2 (catraca); (c) em programas válidos: `compile()` é determinístico (mesma saída em todo Node da matriz e no navegador); a linha de cada token do `.gs` é preservada no JS (alvos `module` e `playground`), com `\n`, `\r`, `\r\n`, U+2028 e U+2029 no gerador e igual à contagem do V8, e ajudantes só acrescentam linhas depois da última linha do `.gs`; remover todo `;` opcional não altera o JS; inserir quebras entre tokens mantém `ok` ⇒ válido; recompor ou decompor (NFC/NFD) identificadores não altera saída nem stdout (salvo colunas) e todo identificador da saída está em NFC; os alvos que não são módulo ES emitem `'use strict'` no offset 0; todo acesso `.nome` do JS emitido, fora de `helperRange`, pertence a D (membros declarados no fonte) ∪ imagem JS da `stdlib`; ajudantes são só `function`/`var`; o lexer nunca emite token de regex; o comparador de `.ordenar()` é pré-ordem total (`NaN`, `-0`, ±Infinity, textos e outros tipos) e independe da permutação; as edições do rebaixamento nunca se sobrepõem; `compile(source).ok` é o mesmo com e sem `retiredWords`; `compile(source, { target: 'repl', session })` é determinístico, nunca lança nem muta `session`, e todo prefixo de programa válido é `ok: true` ou `incomplete: true`. Toda falha reduzida vira golden.
- **Integridade da tabela (`@goiasscript/language`):** nenhuma grafia aparece em mais de uma entrada de `keywords`, `jsReserved` e `stdlib`; a variante sem acento nunca é igual a outra entrada; toda keyword acentuada, exceto `é`, tem variante.
- **Mutação (Stryker, incremental):** núcleo do compilador, com `thresholds.break: null` (só relatório) até o fim da Fase 2; então `thresholds.break` é fixado 2 pontos abaixo da primeira nota medida da suíte completa e só sobe (catraca).
- **Unitários e integração:** Vitest; cobertura ≥ 80% por pacote e de patch (linhas novas ou alteradas ≥ 80%, check obrigatório da `main`; Codecov `patch` ou diff-cover sobre o lcov do Vitest, fixado no plano da Fase 1 e registrado no ADR-0005).
- **Regressão dos CRITICAL ([B F01](../../auditoria/2026-10-13/B-cli-repl-pacote.md), [E F01](../../auditoria/2026-10-13/E-governanca-extensao-historico.md)), gate de saída das Fases 3 e 5:**
  - **CLI** (E2E contra o tarball instalado, §8.5.1): para `traduz` e `bota_pra_moer`, entradas `x.txt`, `x` (sem extensão), `X.GS`, `x.gs` (controle), `e.gs/f/programa.gs` (`.gs` no meio do caminho) e `x.gs` com um `x.temp.js` preexistente. O arquivo de entrada permanece idêntico (sha256 antes e depois) e nenhum arquivo preexistente é alterado ou apagado. Entrada que não termina em `.gs` (sem diferenciar maiúsculas) sai com exit `3` e mensagem goiana; saída igual à entrada, ou destino existente sem `--sobrescreve`, é recusada. Em sistema de arquivos que não diferencia maiúsculas, `X.GS` e `x.gs` rodam em diretórios separados.
  - **Extensão** (`@vscode/test-electron`): arquivos `a$(touch PWNED).gs`, `` a`touch PWNED`.gs ``, `a";touch PWNED;".gs`, `a;b.gs` e `a b.gs`. `traduz` e `bota_pra_moer` não criam o marcador `PWNED`; o nome chega ao `execFile` como um único elemento do argv, sem `shell: true` (espião no `execFile`). Documento com `document.uri.scheme !== 'file'` é recusado, e o teste exige `capabilities.untrustedWorkspaces` no `package.json`. Nomes com aspas (`"`) rodam só em Linux e macOS (inválidos no NTFS); os demais, em toda a matriz.
- **E2E (Playwright):** fuga de sandbox (`Function('return this')()`, `importScripts`, XHR, WebSocket, `[].constructor.constructor("return this")()`, que falha já na compilação, e `x["con" mais "structor"]`, que compila e fica contido pelo sandbox, provando que o isolamento não depende da checagem estática), laço infinito, saída assíncrona, `pergunta`, o caso do TypeError capturado em português, autocomplete, tela dividida, cartilha; smoke da extensão.

### 8.3 CI/CD

- Matriz Node 22 e 24 (e 26 quando virar LTS, 2026-10-28) em Ubuntu e Windows; macOS para o CLI. O R14 roda em um job só, no Ubuntu (§8.1.1).
- Actions pinadas por SHA, `permissions` mínimas, `concurrency`; job agendado semanal (contrato do Engoianador, dependências, links externos e URLs de doação).
- Dependabot, CodeQL, OSV.
- Proteção da `main` (aplicada pelo GitHub): checks obrigatórios (`verify`, `test`, `commitlint`, `compat` da §9.5, gate de promessas públicas, seção "Revisão" do PR), PR obrigatório, histórico linear (squash, ou rebase no PR de fase, D13), sem merge commit, branch apagada ao mesclar.
- A revisão por agente revisor em contexto fresco **não** é check do GitHub: é etapa manual do dono antes do merge. O resultado (pontos levantados e a disposição de cada um) é colado na seção "Revisão" do corpo do PR, que o template exige; um job confere só que a seção existe e não está vazia (ADR-0011). Com um único mantenedor, o critério de merge é CI verde + checklist de auto-revisão + essa seção; se entrarem contribuidores, passa a exigir 1 aprovação.
- Template de PR em `.github/pull_request_template.md` com o checklist de auto-revisão, a seção "Revisão" e o checkbox "teste de regressão incluído" (criado na Fase 1).

### 8.4 Orçamentos

Os da §5.11: tetos absolutos (0 bytes de runtime no alvo `module`; 100 mil espaços < 100 ms; `compile()` de 10 mil linhas ≤ 150 ms) em vigor desde a Fase 2, e catracas relativas (tempo de `compile()` e bytes brotli do compilador, no bundle do playground e da extensão) medidas e travadas ao fim da Fase 2; até lá, só relatório.

### 8.5 Gate de promessas públicas

Os itens abaixo são citados como §8.5.N (§8.5.1 é o item 1, §8.5.5 é o item 5).

1. Instala o tarball do `goiasscript` numa pasta limpa e roda todos os comandos (falha sem README/LICENSE). Roda um programa com duas `pergunta` e stdin por pipe em quatro cenários: (i) entrada toda de uma vez; (ii) entrada espaçada no tempo; (iii) escritor do pipe mantido aberto, com o processo encerrando em menos de 1 s depois da última resposta; (iv) fim da entrada cedo, com exit 2, `GS0702` e nunca 13 nem 0 silencioso. Roda também um programa com promessa pendente: exit 2 e `GS0703`.
2. Compila e executa todo bloco de código goiano do README, de `docs/`, da cartilha e do `CLAUDE.md`; blocos da página "o que mudou" com palavra aposentada são marcados como erro esperado (GS0306).
3. Confere que todo comando citado no README, em `docs/`, no `CLAUDE.md` e no `.github/copilot-instructions.md` existe e que toda keyword citada está na tabela.
4. Varre as strings vistas pelo usuário (catálogo, `--help`, REPL, UI, Worker, páginas de erro) contra uma lista de inglês proibido, com lista de permissão versionada ao lado, e roda todo golden executável falhando se stdout ou stderr casar com a lista de inglês do motor (`Cannot read properties`, `is not a function`, `is not a constructor`, `before initialization`, `Maximum call stack`, `Invalid count value`, `toFixed()`). Entram na permissão: (a) o trecho entre aspas, em mensagem GS04xx, que cita palavra, global ou API do JavaScript; (b) nomes próprios (JavaScript, GoiásScript, Node.js, npm, VS Code) e nomes de comando e de pacote; (c) o conteúdo do painel "JS gerado" e qualquer código emitido. Cada entrada exige um motivo de uma linha. Snapshot do `--help`.
5. Confere que `@goiasscript/compiler` tem zero dependências de runtime.
6. Confere a tabela de rastreabilidade (§11): cada afirmação aponta para um teste existente e verde.
7. Extrai do `CLAUDE.md` e do `.github/copilot-instructions.md` os comandos, scripts do `package.json`, caminhos e pacotes citados e falha se algum não existir. Roda como job próprio desde a Fase 1; os itens 1 a 6 entram conforme os artefatos passam a existir.
8. Confere links com `lychee` sobre README, `CONTRIBUTING.md`, `docs/` e a cartilha: links locais e âncoras bloqueiam o PR; links externos rodam no job semanal (§8.3), para que um site fora do ar não trave o merge.

### 8.6 Release

- Changesets; o tipo de cada changeset segue a §9.5, e o job `compat` bloqueia changeset menor que o exigido. Configurado para gerar `chore(release): versiona pacotes`.
- npm por **trusted publishing (OIDC)** com provenance, publicando **o mesmo tarball testado**. Cada publicação (`next` e `latest`) fica em stage até `npm stage approve` com 2FA. O trusted publisher do `goiasscript` só é criado imediatamente antes do primeiro `npm stage publish` (o alpha da Fase 3), com o `release.yml` definitivo já na `main`: a configuração expira se o primeiro publish não for validado em 2 dias e não pode ser editada, só recriada. A Fase 3 confirma que `--tag next` funciona com publisher só de stage (dist-tag é permissão separada).
- `3.0.0-alpha` no dist-tag `next` (Fase 3) e `3.0.0` em `latest` (Fase 9); `npm deprecate goiasscript@2.0.0`; GitHub Release e tag `v3.0.0`.
- CHANGELOG em português; a entrada 3.0.0 traz "Removido" (palavras aposentadas do 1.0/1.5) e "Alterado" (`trem` → `let`, D5; `.tamanho()` → `.tamanho`).

---

## 9. Governança

### 9.1 Documentação

```
docs/
  spec/        referência da linguagem, gramática EBNF com ids estáveis, migracao.md,
               vocabulario.lock.json, o-que-mudou.md (gerada de retiredWords)
  adr/         decisões de arquitetura (MADR enxuto)
  rfc/         mudanças na linguagem (template rfc.md)
  operacao.md  runbook do mantenedor único
  auditoria/   evidência da auditoria de 2026-10-13
  pesquisa/    evidência da pesquisa de 2026-10-13
  superpowers/ specs e planos
```

### 9.2 ADRs iniciais (MADR enxuto, cada um com a linha "Confirmação" que nomeia o check de CI)

| ADR | Decisão | Confirmação |
|---|---|---|
| 0001 | Front-end próprio escrito à mão (D4); acorn só como oráculo de teste. Se o gate da Fase 0 falhar, a decisão volta ao dono: não há plano B automático. Registra os limites da Fase 0 fixados antes da medição (os 1.500 linhas, os 29 KB, os 150 ms e os 28 dias são estimativas a priori que o dono confirma ao aprovar o plano 1), a medida do PoC e a extrapolação da Fase 2 | Zero dependências de runtime em `@goiasscript/compiler` (§8.5.5) |
| 0002 | Mundo fechado (nomes e membros, P1) e reserva de nomes: palavras do JavaScript em qualquer posição (P2) e membros de instância da biblioteca por forma (P3); globais da biblioteca sombreáveis com aviso (P4). Custo: `tamanho` e `mensagem` ficam indisponíveis para campos e métodos. Descartado: ajudante por apelido com despacho ao membro do usuário (exige runtime, contra o ADR-0003); reabre por RFC se o piloto (S8) mostrar fricção | Propriedade "todo acesso `.nome` do JS emitido, fora de `helperRange`, pertence a D ∪ imagem da `stdlib`" e goldens de reserva por forma (§8.2) |
| 0003 | Zero runtime: apelidos rebaixados para nativo; ajudantes só se usados (inclui `.mensagem`, `pergunta`, `.ordenar()`); protótipos intocados | Orçamento de 0 bytes para programa só nativo (§8.4) |
| 0004 | Emissão por edições, módulo ES, numeração de linhas preservada; exceção de mutação confinada a lexer, parser e analisador (override por glob, `this.**`), sujeita à aprovação do dono (§10.3) | Fixtures de lint must-pass (`this.pos += 1`, `this.scopes.set(k, v)`, `this.tokens.push(t)`) e must-fail (`param.x = 1`, `list.push(x)` fora de `this`, mutação fora dos três diretórios) |
| 0005 | Toolchain (TS 6.0.x, ESLint 10, Vitest, Node ≥ 22.12, pnpm; ferramenta de cobertura de patch) com data de revisão | `engines`, matriz de CI (§8.3) e data de revisão no ADR |
| 0006 | Versionamento e compatibilidade (§9.5): SemVer único, política de quebra e de depreciação (P17); versão 3.0.0, corte sem alias das palavras do 1.0/1.5 (`retiredWords`, P13; nenhuma das duas versões esteve no npm, e alias recriaria os dois vocabulários) e deprecate da 2.0.0 | Job `compat` (§9.5) |
| 0007 | Idioma: identificadores e nomes de arquivos internos (código, testes, fixtures, scripts) em inglês; comentários e documentação para leitores (`docs/`, inclusive nomes de arquivo) em português; superfície da linguagem, mensagens, nomes de comando e valores de opção que o usuário digita ou vê (`--tom raiz\|neutro`, `fileName` padrão `programa.gs`) em goianês; discriminantes e enums que o usuário nunca digita (`CompileTarget`, `receiver`, `kind`, `severity`) em inglês. Os símbolos `+ - * / %` e `< > <= >=` valem ao lado das palavras (razão do autor do spec, que o dono confirma ao aprovar a RFC-0001); `=`, `==`, `===`, `!=`, `&&`, `\|\|` e `!` dão erro. Chave de TODO `GS-<n>` | Scanner R14 estendido aos segmentos de caminho (mesma denylist de português, fora de `docs/` e dos exemplos `.gs`) + `@typescript-eslint/naming-convention`; conformidade: `x < 5` e `x menor_que 5` compilam, `x == 5` e `x = 5` geram diagnóstico |
| 0008 | Commits: Conventional Commits `<type>[(escopo)]: descrição`, em português, minúsculo, sem ID Jira; sem trailer nem rodapé de atribuição de IA (co-autor humano é permitido); merge por squash (ou rebase no PR de fase, D13, em que cada commit segue o padrão), e o título do PR segue o mesmo padrão | Job `commitlint` obrigatório na `main` |
| 0009 | Publicação (npm OIDC, Marketplace, Open VSX). O trusted publisher do npm não é editável e expira se o primeiro publish (o alpha da Fase 3) não ocorrer em até 2 dias: só criar com o `release.yml` definitivo em `main` e o publish pronto para rodar. Marketplace sem PAT (Entra ID federado ou `vsce --oidc`, decidido na Fase 0); Open VSX com token restrito | Job de release com `npm stage publish`; smoke pós-publicação (§2.3 S7) |
| 0010 | O que fica fora da v3 (§7) | Só entra por RFC (§9.3) |
| 0011 | Fluxo de PR e merge, histórico público e branches. Fluxo: uma pessoa = CI verde + checklist de auto-revisão + revisão do agente colada no PR; histórico linear: squash, ou rebase no PR de fase que leva um commit por unidade (D13); sem merge commit; `delete_branch_on_merge`; 1 aprovação se entrarem contribuidores. Histórico: reescrito na Fase 1 (D11, §9.4); limpeza de branches | Ruleset da `main` versionado; job que exige a seção "Revisão" no corpo do PR; configuração lida por `gh api` no gate de release (`delete_branch_on_merge=true`, `allow_merge_commit=false`); `git grep -nE '/hom[e]/'` vazio na `main` |

**ADR-0008, regras.** Tipos (`type-enum`): feat, fix, refactor, docs, test, chore, perf, ci, style, build, revert. Escopos (`scope-enum`, opcional; se presente, tem de estar na lista): language, compiler, optimizer, cli, vscode, playground, engoianador, docs, ci, deps, release. `subject-case`: o assunto não começa em maiúscula (siglas e identificadores no meio são aceitos). `header-max-length`: 72. Assunto vago (ajustes, fix, updates, wip, sozinhos) é bloqueado por regra local de commitlint. Trailer `Co-Authored-By` cujo valor case com Claude, Anthropic, Copilot ou bot é bloqueado por regra local; o rodapé "Generated with" é vedado nos corpos de PR por checagem de CI. A autoria unificada (`.mailmap`) é tarefa da Fase 1, fora do ADR.

**Plano B (só por decisão do dono, reabre D4).** O gate da Fase 0 recomenda, não decide. Se o dono aciona o plano B, mudam juntos, no mesmo PR: (a) §5.1 e §8.5.5: `acorn` entra como dependência de runtime de `@goiasscript/compiler`, em versão exata fixada, e o gate de zero dependências é reescrito; (b) §5.3–§5.4 e o gate da Fase 0: o front-end reporta um erro por execução, e o critério "≥ 3 diagnósticos" e a frase "reporta vários erros por execução" deixam de valer; (c) §10.4 e a linha "Lexer + parser escritos à mão" do §11 saem, e S1 e o §8.5 deixam de cobrir essa promessa; (d) a descrição do repositório no GitHub (hoje "hand-written lexer and parser"), o README e o vídeo trocam a afirmação por "transpilador sobre o acorn"; (e) os orçamentos de bytes (§5.11 e §8.4) são recalculados com o acorn (cerca de 29 KB em brotli no navegador). O ADR-0001 registra a reabertura de D4 com data.

### 9.3 RFCs

Toda mudança na linguagem (sintaxe, semântica, tabela, códigos de diagnóstico, remoções) passa por RFC em
`docs/rfc/`: **rascunho → proposto** (delta de EBNF, exemplos, notas de migração) **→ aceito** (testes de conformidade escritos com `status: expected-fail` ligado à RFC, verdes na `main` como sentinela, §8.2) **→ implementado** (marcador removido no PR da implementação) **→ lançado**. Revisão por agente em contexto fresco.

**RFC-0001**: vocabulário v3, alfabeto de identificadores, tabela de decisões de gramática (§4.7) e biblioteca padrão (§4.2–§4.9), com os anexos obrigatórios: de-para 1.5 → v3, `retiredWords`, lista gerada de membros nativos do JS sem nome goiano, lacunas da biblioteca (§4.9) e, por nome, a origem (dono, 1.5 ou proposta), a forma verbal e o resultado do teste da prosa. É revisada por 2 a 3 falantes de Goiás antes da aprovação (parecer consultivo; a decisão é do dono, D8) e aprovada pelo dono nome a nome na Fase 0. Aprova as propostas P8–P13, P15 e P16 (§3.1).

### 9.4 Instruções para agentes e limpeza

- **`CLAUDE.md` e `.github/copilot-instructions.md`**, no primeiro PR depois da aprovação do spec (Fase 1): `CLAUDE.md` com menos de 200 linhas, **rastreado** (sai do `.gitignore` no mesmo PR) e só com afirmações verdadeiras: o que a v3 é e o que fica fora (§7); a precedência entre as regras globais do dono e as do repositório (superfície e mensagens em goianês; commits com escopo semântico, sem ID Jira, ADR-0008; identificadores em inglês e comentários em português, ADR-0007); os comandos, scripts e caminhos que existem; ponteiros para os ADRs em vez de cópia do conteúdo. `packages/core` e `apps/` legados constam como removíveis. O `copilot-instructions.md` vira ponteiro de 3 linhas para o `CLAUDE.md`. Ambos são conferidos pelo gate de promessas públicas (§8.5, item 7). Na Fase 8 o `CLAUDE.md` só é atualizado para o estado final.
- `SECURITY.md` e `CODE_OF_CONDUCT.md` com contato real; reporte privado de vulnerabilidade ligado.
- **Histórico público.** O histórico anterior à v3 contém material que não pertence ao repositório público; apagar branches não o remove. Decisão do dono (D11): reescrever todas as refs com `git filter-repo` e force-push no primeiro passo da Fase 1, antes da tag `legacy/1.5`, e pedir ao Suporte do GitHub que purgue `refs/pull/*` e caches; SHAs, PRs antigos, o fork e clones existentes não são alcançados. A lista de caminhos a remover fica fora do repositório. Nenhum documento novo cita onde o material está nem repete o conteúdo.
- **Branches e merge.** Primeiro a reescrita do histórico (D11); depois, a tag `legacy/1.5` no último commit da 1.5 em `main`, enviada ao remoto antes de qualquer commit da v3 na `main` e usada como referência de conferência da legenda de origem da §4.9. Depois dela: excluir `staging` (duplicata de `archive/v2-experimental`), `feat/v1.5-slim`, `feat/v1.5-launch-playground-engoianador` e `feat/increase-test-coverage`; excluir `DEVELOPMENT` só depois de portar o teste e a correção do `;` ([E F15](../../auditoria/2026-10-13/E-governanca-extensao-historico.md)); manter, protegidas, `archive/v2-experimental` e a tag `v2.0-pre-archive`. Ligar `delete_branch_on_merge` e desligar o merge commit (squash e rebase ligados, D13), complementando a proteção da `main` (§8.3).
- **Higiene antes do primeiro push da branch do spec.** A evidência fica commitada na branch antes de qualquer envio ao remoto, então a higiene reescreve esses commits locais, sem commit corretivo depois: o que chega ao remoto não volta atrás. Em `docs/auditoria` e `docs/pesquisa`, trocar por script os caminhos absolutos da máquina do autor, inclusive os iniciados em `~/`, por `<repo>` ou `<home>`, e reescrever o trecho de `E-governanca-extensao-historico.md` que descreve esse material sem listar refs, contagens nem termos dele ("planejamento pessoal removido do repositório; ver ADR-0011"). `research_notes/` e `reports/` não são rastreados: entram no `.gitignore`; só o que for único vai para `docs/pesquisa/` (comparar `reports/Arquitetura de compilador para GoiásScript.md` com `relatorio.md`; screenshots de `probes-apps/web`) e o resto é apagado localmente. Nessa etapa nunca se usa `git add -A`: adiciona-se por caminho explícito.
- **Porta de entrada da comunidade (Fase 8).** `CONTRIBUTING.md` reescrito e enxuto, só para humanos: como rodar (comandos conferidos pelo §8.5.3), como propor uma palavra (RFC pelo template `rfc.md`), expectativa de resposta honesta para mantenedor único (sem SLA; o valor é do dono), o que fica "fora da v3" (§7, só por RFC), formato de commit (ADR-0008) e a regra real de merge (ADR-0011); sem links para material de planejamento, sem backlog (vai para Issues) e sem referência a Discussions desligado. `.github/`: template de PR reduzido ao que é verificado, templates de issue e `config.yml` com pnpm e versão atual, `rfc.md`; marcadores `AUTO-GENERATED` sem gerador são removidos ou gerados do `package.json`. O README declara a política "não faz parte da v3". O template de PR e a regra de merge entram já na Fase 1.
- **`docs/operacao.md` (Fase 8).** Runbook: rotacionar a chave da Groq; acionar e desligar o kill switch do Engoianador; republicar a extensão (Marketplace e Open VSX); `npm deprecate` e dist-tags; recriar o trusted publisher expirado; reverter o deploy do playground. Os comandos citados são conferidos pelo §8.5.3.
- Depois da tag `legacy/1.5` e com o corpus novo verde: remover `packages/core`, `vscode-extension/`, os `.vsix`, `lsp-server/`, `KEEP-OR-ARCHIVE.md` e docs obsoletos; tag de arquivo para o histórico do protótipo Rust; corrigir o `.gitignore` (padrão inválido `./docs`, `lib/`, `out/`).

### 9.5 Compatibilidade e versionamento

**Uma versão só.** O SemVer do pacote `goiasscript` vale para a linguagem, a biblioteca padrão, a API (§5.9), o CLI e a extensão (§6.5); com Changesets, o maior bump do release vence. Não há versão de linguagem opt-in na v3 (só por RFC, §9.3). Pré-lançamentos (`3.0.0-alpha.*`) ficam fora da promessa.

**Promessa.** Programa `.gs` que compila com `ok: true` na `3.x.y` continua compilando com `ok: true` e com a mesma semântica em toda `3.x'.y'` posterior. Não são especificados, e portanto não quebram a promessa: o texto de mensagem, de `help` e o tom; o texto exato do JS emitido, exceto o que o spec garante (módulo ES estrito, linhas preservadas, 0 bytes de runtime para programa só nativo, protótipos intocados); a ordem de diagnósticos na mesma posição; o desempenho dentro dos orçamentos (§5.11); e bug do compilador que contrariava este spec (o spec vence).

| Bump | O que entra |
|---|---|
| MAJOR | O conjunto de nomes reservados cresce: keyword, entrada de `stdlib` (§4.9) ou palavra JS da §4.4 (P17). · Remover ou renomear keyword ou entrada de `stdlib`. · Mudar a semântica de uma entrada (inclui nativa ↔ didática). · Programa antes aceito passar a dar erro (diagnóstico novo com severidade `error`, ou aviso promovido a erro). · Reutilizar um código `GSnnnn` ou mudar o significado dele. · Mudança incompatível em `CompileOptions`/`CompileResult`/`Diagnostic` ou em comando/flag do CLI. · Quebrar uma garantia de emissão da promessa (ex.: deixar de preservar linhas). · Subir o piso do Node (ADR-0005). |
| MINOR | Comando, flag, opção de API ou alvo novo e compatível. · Código `GSnnnn` novo com severidade `warning`. · Construção hoje fora do subconjunto (§4.7) passar a ser aceita, desde que não reserve nome novo. · Aviso de depreciação ou de ponte (abaixo). |
| PATCH | Correção de bug conforme o spec; texto de mensagem, ajuda e tom; formato do JS emitido; desempenho; documentação. |

**Consequência.** O vocabulário da RFC-0001 só cresce em MAJOR; a 3.x recebe apenas MINORs que não reservam nome.

**Ponte e depreciação.** Cada entrada de `keywords` e de `stdlib` (§5.2) ganha `since` (versão que a introduziu) e `deprecatedIn?`.
- Nome planejado para o próximo MAJOR entra na tabela com `since` igual a esse MAJOR. A partir da MINOR anterior, usá-lo como identificador gera aviso da faixa GS08xx (código fixado por RFC): "`X` vai virar palavra reservada na 4.0; troque o nome".
- Depreciar é marcar `deprecatedIn` e emitir aviso GS08xx com a forma nova, por no mínimo 2 minors (janela escolhida pelo autor; o PEP 387 pede dois lançamentos com aviso). A remoção só ocorre em MAJOR.
- Se a forma nova reserva nome novo, ela entra no mesmo MAJOR da remoção da antiga; o aviso anuncia a troca, e as duas formas só convivem quando a nova já era aceita.
- Toda remoção, renomeação e nome novo reservado vira linha em `docs/spec/migracao.md` e no CHANGELOG. Codemod de migração só por RFC.

**Confirmação (CI), job `compat`:** (a) um gerador de `@goiasscript/language` produz `docs/spec/vocabulario.lock.json` (nomes reservados com `since`/`deprecatedIn`, códigos `GSnnnn` com severidade) e o job falha se o diff exigir bump maior que o do changeset pendente; (b) roda os casos `ok: true` do corpus da tag anterior contra o código do PR e falha se algum virar erro sem changeset `major`.

---

## 10. Entrega

### 10.1 Sub-projetos

| # | Sub-projeto | Dias (hipótese) | Gate de saída |
|---|---|---|---|
| 0 | Prova de conceito: lexer + parser + emissão do subconjunto (exemplos do playground migrados para o subconjunto, `demo` do vídeo, 10 erros típicos), rodados sob ESLint provisório (`max-lines-per-function` 50, `max-depth` 4, `functional/immutable-data` com o override do ADR-0004); spike do sandbox; método de publicação da extensão sem PAT; rascunho da RFC-0001 | 3 | Limites fixados no ADR-0001 antes da medição e nunca renegociados depois dela (Node 24, mediana de 20 execuções após 2 de aquecimento): (a) lexer + parser + emissão do PoC ≤ 1.500 linhas de TypeScript, sem testes nem tabelas geradas, e ≤ 29 KB em brotli; (b) `compile()` de 10 mil linhas ≤ 150 ms; (c) os exemplos do playground e o `demo` compilam, passam em `acorn.parse` e reproduzem o stdout, e cada um de 10 erros típicos dá o GSnnnn esperado na linha certa, sem lançar; (d) ≥ 3 diagnósticos distintos num arquivo com vários erros; (e) RFC-0001 aprovada, com o teste da prosa registrado por nome e a tabela de decisões do §4.7, e `docs/spec/gramatica.md` coerente com ela; (f) extrapolação da Fase 2 a partir dos dias e das linhas reais do PoC, registrada no ADR-0001, com projeção ≤ 28 dias (22 + 6 de folga reservada ao núcleo; o dono confirma o valor). As violações de tamanho e de profundidade do ESLint provisório são contadas e entram na extrapolação (informativo); a config provisória vira a final na Fase 1. Se um critério técnico falhar, o trabalho para e o dono decide entre estender o prazo, reduzir o subconjunto e acionar o plano B (reabre D4, §9.2); a RFC-0001 é bloqueio independente e não aciona o plano B |
| 1 | Fundação: monorepo novo, tsconfig, ESLint, Vitest, porte do scanner R14 (§8.1.1), hooks, CI (Node 22/24, Windows), proteção da `main` (PR obrigatório, histórico linear com squash ou rebase (D13), template de PR com seção Revisão, ADR-0011), `CLAUDE.md` e `copilot-instructions.md` reescritos (§9.4), higiene do repositório e de branches (§9.4), ADRs, esqueleto do spec, corpus importado e triado | 3 | Código novo nasce dentro dos gates: scanner com baseline vazio; matriz da §8.1 implementada, cada linha com um teste de configuração (arquivo de exemplo que viola a regra e é barrado); selftest do R14 com recall ≥ 90% e um arquivo com `const existente` em `packages/compiler` barrado no CI; `CLAUDE.md` verdadeiro (§8.5, item 7); `git grep -nE '/hom[e]/'` vazio (o colchete evita que o próprio spec case com o padrão); `research_notes/` e `reports/` ignorados |
| 2 | Núcleo: tabela + geradores, lexer, parser, AST, análise, rebaixamento, emissão, source maps, catálogo (com `retiredWords`), erros de execução, otimizador, corpus, propriedades, mutação, orçamentos | 22 | `compile()` estável; corpus verde; tetos relativos da §5.11, piso de aceitação das propriedades e limiar de mutação fixados e travados na catraca |
| 3 | CLI + REPL; `3.0.0-alpha` em `next` | 6 | Tarball instala e roda em pasta limpa; matriz de nomes do CLI verde (§8.2); revisão de segurança (`security-reviewer`, contexto fresco) do CLI sem CRITICAL/HIGH abertos |
| 4 | Playground | 7 | E2E ampliado verde; revisão de segurança (`security-reviewer`, contexto fresco) do sandbox e da doação sem CRITICAL/HIGH abertos; guarda de configuração de doação verde (§6.3) |
| 5 | Extensão VS Code | 5 | Publicada no Marketplace e no Open VSX, após teste de nomes hostis e do manifesto verde (§8.2) e revisão de segurança (`security-reviewer`, contexto fresco) da extensão sem CRITICAL/HIGH abertos |
| 6 | Cartilha + piloto | 6 | Lições no CI; retorno do piloto aplicado |
| 7 | Engoianador | 3 | Contrato contra a API real verde; revisão de segurança (`security-reviewer`, contexto fresco) do Worker sem CRITICAL/HIGH abertos; validação de corpo por schema coberta por teste (§6.6) |
| 8 | Docs, spec final, atualização do `CLAUDE.md`, CONTRIBUTING e templates, `docs/operacao.md`, página "o que mudou", remoção do legado | 3 | Gate de promessas públicas (§8.5), incluindo links e `CLAUDE.md` |
| 9 | Relançamento + vídeo | 3 | Rastreabilidade (§11) 100% verde |
| — | Folga e endurecimento | 10 | Revisão adversarial por fatia. Até 6 dos 10 dias ficam reservados à Fase 2 (parser e análise); os outros 4 cobrem as demais fases |
| | **Total** | **71** | |

Caminho crítico: 0 → 1 → 2 → 3. Núcleo + CLI usáveis por volta do dia 34, **se** a Fase 2 couber em 22 dias (hipótese).

**Base das estimativas.** Dias de uma pessoa sênior, sozinha, derivados das fases das três propostas do painel ([`panel-full.json`](../../auditoria/2026-10-13/panel-full.json), campo `phases`) e ajustados pelos cortes deste spec. Não há medição própria até o gate da Fase 0: a coluna "Dias" é hipótese de planejamento, não compromisso, e o gate da Fase 0 exige a reestimativa. O porte do scanner (§8.1.1) é entregável nomeado da Fase 1; se estourar os 3 dias, consome a folga.

| Fase | Dias | Referência no painel | Cortes deste spec |
|---|---|---|---|
| 2 | 22 | Sobre o acorn, 17 + 3 (otimizador) = 20, sem lexer e parser próprios; com parser próprio, +10 = 30; as demais propostas somam 30 a 35 | Sem printer (emissão por edições, §5.7); sem passes próprios (§5.8); gramática menor, sem template, regex, desestruturação, spread, `?.`, `??`, `?:` (§4.5, §4.7); sem re-scan de lexer além do `rescanAsRegex()`, que só diagnostica regex (§5.4). O efeito desses cortes não foi medido; o resíduo é risco assumido |
| 6 | 6 | 5 a 9 (motor de lições, 10 a 12 lições, glossário, ligação erro → lição) | O motor de lições (Markdown → editor + correção pela saída esperada) conta nesta fase; o piloto com 3 a 5 aprendizes soma 1 dia |

### 10.2 Planos de implementação

O **plano 1** (`docs/superpowers/plans/2026-10-14-goiasscript-3-plano-1.md`) cobre os sub-projetos 0, 1 e 2 e é
executado como grafo de unidades (D12). Os planos seguintes são escritos ao fim de cada fase, já com os nomes
reais do código, e executados no mesmo esquema: unidades de trabalho com dependências explícitas, worktree por
unidade, TDD e revisor independente; gate humano entre fases.

### 10.3 Tarefas do dono (bloqueios)

| Tarefa | Bloqueia |
|---|---|
| Aprovar as propostas P8–P13, P15 e P16 na RFC-0001 (P1–P7, P14 e P17 aprovadas em 2026-10-14, D10) | Saída da Fase 0 |
| Aprovar a RFC-0001 (vocabulário e biblioteca, nome a nome; inclui registrar a decisão sobre `oce` e `senao`); o rascunho é entregável da Fase 0 | Saída da Fase 0 (gate do §10.1) |
| Confirmar os limites do ADR-0001 (1.500 linhas, 29 KB em brotli, 150 ms, projeção de 28 dias) ao aprovar o plano 1 | Fase 0 |
| 2 a 3 falantes de Goiás para revisar os nomes novos da RFC-0001 (parecer consultivo) | Fase 0 |
| Remover, ou trocar por um ponteiro de 5 linhas para as regras globais do dono, as cópias vencidas de regras que a pasta pai do repositório carrega em toda sessão de agente (a pasta é compartilhada com outros projetos pessoais; a decisão é do dono) | Fase 0 (antes de despachar agentes) |
| Aprovar as exceções às regras do dono: mutação confinada a `this.*` de lexer, parser e analisador (ADR-0004); commits sem ID Jira e com escopo semântico (ADR-0008); `TODO(GS-<n>)` (ADR-0007) | Fase 1 |
| Executar ou autorizar, comando a comando, a reescrita do histórico (D11) e a exclusão das branches obsoletas (§9.4) | Fase 1 |
| Domínio: registrar `goiasscript.com.br` ou adotar o `.vercel.app` | Fase 4 |
| Chave Pix real e GitHub Sponsors, ou remover | Fase 4 |
| E-mail de contato para `SECURITY.md` e `CODE_OF_CONDUCT.md` | Fase 8 |
| Trusted publisher do `goiasscript` no npm, criado imediatamente antes do primeiro `npm stage publish` e só com o `release.yml` final em `main` (a configuração não é editável e expira em 2 dias sem publish validado) | Fases 3 e 9 |
| Publisher no Marketplace com identidade Entra ID federada ao GitHub Actions (sem PAT) | Fase 5 |
| Conta Eclipse, Publisher Agreement do Open VSX, namespace (`ovsx create-namespace`) e token com escopo restrito | Fase 5 |
| Chave da Groq; conta Cloudflare (KV, secret); projeto na Vercel | Fases 4, 7 |
| 3 a 5 aprendizes para o piloto (inclusive de fora de Goiás) | Fase 6 |

### 10.4 Vídeo de lançamento

O kit de captura do vídeo (fora deste repositório) é atualizado para ler o CLI novo (stdout **e** stderr) e o
vídeo é renderizado de novo com os dados reais: versão `v3.0.0`, contagem de testes real, saídas do terminal sem aviso
falso, `trem` → `let`, resposta real do Engoianador. Autocomplete, tela dividida e "lexer + parser escritos à mão"
passam a ser verdade.

---

## 11. Rastreabilidade das promessas públicas

| Promessa (vídeo/README) | Prova |
|---|---|
| "Cê escreve uai, faz trem, prosa! Vira JavaScript na hora!" | Goldens de keywords e biblioteca |
| Autocomplete com goianês → JS no editor | E2E do playground + teste da extensão |
| Tela dividida `.gs` / `.js` | E2E do playground |
| `goiasscript arma_o_barraco meu-projeto` | Gate de tarball (§8.5.1) |
| `goiasscript bota_pra_moer main.gs` → "Bão, sô" | Gate de tarball + golden do `demo` |
| Playground: roda no navegador | E2E + smoke pós-deploy |
| Extensão: realce, ícones, snippets | Teste da extensão + smoke pós-publicação |
| Engoianador: texto vira goianês com LLM | Contrato agendado + smoke pós-deploy |
| Roda de Prosa: "Digita goias e vai" | Testes do REPL por PTY (§8.2): persistência, redeclaração, multilinha, `pergunta`, eco, TAB |
| "N testes" | Número lido do CI no momento da captura do vídeo |
| "Lexer + parser escritos à mão" | Gate de zero dependências do `@goiasscript/compiler` |
| `npm install -g goiasscript` / versão | Smoke de instalação do `latest` |
| "MIT, código aberto" | Checagem de `LICENSE` no tarball |
| "O CLI nunca apaga nem sobrescreve o seu `.gs`" | E2E da matriz de nomes (§8.2) |
| "A extensão não executa comando a partir do nome do arquivo e respeita o Modo Restrito" | Teste de nomes hostis e do manifesto (§8.2) |

---

## 12. Riscos

| Risco | Mitigação |
|---|---|
| Parser resiliente custar mais que o previsto | Os 22 dias são hipótese até o gate da Fase 0: limites numéricos fixados no ADR-0001 antes da medição e extrapolação da Fase 2 a partir do PoC; se estourar (projeção acima de 28 dias), volta ao dono com o custo medido (D4 não muda sem aprovação dele); 6 dias da folga ficam reservados ao núcleo |
| Vocabulário ou alfabeto de identificadores mudar depois de existir programa de aluno | RFC-0001 congelada na Fase 0; o vocabulário só cresce em MAJOR, com aviso de ponte nas minors anteriores e entrada em `docs/spec/migracao.md` (§9.5) |
| Reserva de nomes de membro custar nomes comuns do iniciante (`tamanho`, `mensagem`) | Reserva por forma (P3): propriedade sempre, método só chamável, campo de dado livre; a RFC-0001 revê `tamanho`, `mensagem`, `ano`, `mês`, `dia`, `hora`, `minuto`, `segundo`, `repete`, `caça` e `juntar` contra colisão com nomes de domínio; GS0601 sugere alternativa |
| Gíria regional virar barreira para quem não é goiano | Tom `neutro`; piloto com aprendizes de fora de Goiás |
| Sandbox do playground contornável | Spike na Fase 0; CSP por recurso; E2E de fuga; o mundo fechado não impede `x["con" mais "structor"]`, então a contenção é a CSP |
| Engoianador: custo, abuso, modelo desligado | Limite atômico, cota só em sucesso, cache, teto, kill switch, modelo configurável, fallback, contrato agendado |
| Prazos externos (PAT do Marketplace em 2026-12-01; Node 26 LTS em 2026-10-28) | Método de publicação sem PAT decidido na Fase 0; trusted publisher do npm criado só antes do primeiro publish; matriz do CI revisada |
| Confusão com `goiasscript@2.0.0` | `npm deprecate` + página "o que mudou" (`docs/spec/o-que-mudou.md`) gerada de `retiredWords` + diagnóstico GS0306 (risco baixo: 8 downloads em 30 dias, janela 2026-09-13 a 2026-10-12; estrelas e alcance do vídeo não medidos) |
| Mantenedor único e dormência pós-viral | Spec + corpus como contrato, escopo curto, automação de release e de captura do vídeo, política "não faz parte da v3" no README e no CONTRIBUTING, runbook em `docs/operacao.md`, fluxo de PR registrado (ADR-0011) |
| Material que não pertence ao repositório no histórico anterior à v3 | Reescrita na Fase 1 (D11, ADR-0011); evidência higienizada antes do primeiro push (§9.4) |
| Escopo voltando (balaios, debugger, tipos) | Só por RFC |
| Regras de imutabilidade em tensão com lexer, parser e analisador | Override por glob com `this.**` e fixtures must-pass/must-fail (ADR-0004); o PoC da Fase 0 mede violações de `max-lines-per-function` e `max-depth`; aprovação do dono pendente (§10.3) |
| Versões de ferramentas mudando | ADR-0005 com data de revisão; versões verificadas no dia da Fase 1 |
