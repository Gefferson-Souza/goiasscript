# RFC-0001: Vocabulário e biblioteca padrão do GoiásScript 3

| Campo | Valor |
|---|---|
| Status | decisões do dono registradas em 2026-10-20; aguarda o parecer dos falantes (anexo F) |
| Spec | §3.1, §4 e §9.3 de `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md` |
| Decide | P8, P9, P10, P11, P12, P13, P15 e P16 |

## 1. Resumo

Esta RFC congela as keywords, os operadores, o alfabeto de identificadores, a gramática e a biblioteca padrão da v3.
Mudar um nome depois da aprovação é MAJOR (spec §9.5). Os falantes de Goiás dão parecer consultivo (anexo F); a decisão
é do dono (D8). As decisões do dono foram registradas em 2026-10-20; falta o parecer do anexo F.

## 2. Vocabulário (keywords, operadores e literais)

| Categoria | GoiásScript | JavaScript | Classe | Variante sem acento | Decisão do dono |
| --- | --- | --- | --- | --- | --- |
| Declaração | `uai` | `const` | R | — | aprovado (2026-10-20) |
| Declaração | `trem` | `let` | R | — | aprovado (2026-10-20) |
| Atribuição | `é` | `=` | R | — | aprovado (2026-10-20) |
| Função | `faz_trem` | `function` | R | — | aprovado (2026-10-20) |
| Função | `faz_favor` | `return` | R | — | aprovado (2026-10-20) |
| Função | `vai_na_frente` | `async` | R | — | aprovado (2026-10-20) |
| Função | `vai_na_frente_faz_trem` | `async function` | R | — | aprovado (2026-10-20) |
| Função | `espera_um_cadim` | `await` | R | — | aprovado (2026-10-20) |
| Controle | `se_ocê_quiser` | `if` | R | `se_oce_quiser` | aprovado (2026-10-20) |
| Controle | `se_num_for` | `else if` | R | — | aprovado (2026-10-20) |
| Controle | `se_não` | `else` | R | `se_nao` | aprovado (2026-10-20) |
| Controle | `vai_indo` | `for` | R | — | aprovado (2026-10-20) |
| Controle | `enquanto_tiver` | `while` | R | — | aprovado (2026-10-20) |
| Controle | `para_com_isso` | `break` | R | — | aprovado (2026-10-20) |
| Controle | `continua_aí` | `continue` | R | `continua_ai` | aprovado (2026-10-20) |
| Controle | `de` | `of` (em `vai_indo`) | C | — | aprovado (2026-10-20) |
| Controle | `em` | `in` (em `vai_indo`) | C | — | aprovado (2026-10-20) |
| Classe | `arruma_trem` | `class` | R | — | aprovado (2026-10-20) |
| Classe | `inherda_de` | `extends` | R | — | aprovado (2026-10-20) |
| Classe | `aprepara_trem` | `constructor` | R | — | aprovado (2026-10-20) |
| Classe | `num_muda` | `static` | R | — | aprovado (2026-10-20) |
| Classe | `a_raiz` | `super` | R | — | aprovado (2026-10-20) |
| Classe | `ocê` | `this` | R | `oce` | aprovado (2026-10-20) |
| Classe | `faz_um` | `new` | R | — | aprovado (2026-10-20) |
| Classe | `é_tipo_de` | `instanceof` | R | `e_tipo_de` | aprovado (2026-10-20) |
| Erro | `tenta_aí` | `try` | R | `tenta_ai` | aprovado (2026-10-20) |
| Erro | `se_der_ruim` | `catch` | R | — | aprovado (2026-10-20) |
| Erro | `por_fim` | `finally` | R | — | aprovado (2026-10-20) |
| Erro | `vixe` | `throw` ou `throw new Error(…)` (instrução, §4.8) | R | — | aprovado (2026-10-20) |
| Literal | `certeza` | `true` | R | — | aprovado (2026-10-20) |
| Literal | `de_jeito_nenhum` | `false` | R | — | aprovado (2026-10-20) |
| Literal | `nada` | `null` | R | — | aprovado (2026-10-20) |
| Literal | `indefinido` | `undefined` | R | — | aprovado (2026-10-20) |
| Operador | `é_igualim` | `===` | R | `e_igualim` | aprovado (2026-10-20) |
| Operador | `diferente` | `!==` | R | — | aprovado (2026-10-20) |
| Operador | `maior_que` | `>` | R | — | aprovado (2026-10-20) |
| Operador | `menor_que` | `<` | R | — | aprovado (2026-10-20) |
| Operador | `pelo_menos` | `>=` | R | — | aprovado (2026-10-20) |
| Operador | `no_máximo` | `<=` | R | `no_maximo` | aprovado (2026-10-20) |
| Operador | `e_mais` | `&&` | R | — | aprovado (2026-10-20) |
| Operador | `ou_então` | `\|\|` | R | `ou_entao` | aprovado (2026-10-20) |
| Operador | `num_é` | `!` | R | `num_e` | aprovado (2026-10-20) |
| Operador | `mais` | `+` | R | — | aprovado (2026-10-20) |
| Operador | `menos` | `-` (binário e unário) | R | — | aprovado (2026-10-20) |
| Operador | `vezes` | `*` | R | — | aprovado (2026-10-20) |
| Operador | `dividido` | `/` | R | — | aprovado (2026-10-20) |
| Operador | `sobrou` | `%` | R | — | aprovado (2026-10-20) |

## 3. Alfabeto de identificadores (P5)

`A–Z`, `a–z`, letras acentuadas do português em NFC, `0–9` e `_`; fora disso é GS0104. Ampliar só por RFC.

## 4. Decisões de gramática (§4.7)

A gramática normativa é `docs/spec/gramatica.md` (ids `Gnn` estáveis). As decisões abaixo ficam congeladas com a
aprovação desta RFC.

| Construção | Decisão | Decisão do dono |
| --- | --- | --- |
| Corpo de `se_ocê_quiser`, `se_num_for`, `se_não`, `vai_indo`, `enquanto_tiver`, `tenta_aí`, `se_der_ruim`, `por_fim`, função, método e classe | Sempre entre `{ }` (P7). Corpo sem chaves é GS0207, com a correção "bota as chaves". Única exceção: corpo-expressão de seta (`x => x vezes 2`). A trava de laço do playground insere o contador logo depois da `{` do corpo, na mesma linha (§5.7). | aprovado (2026-10-20) |
| `se_num_for`, `se_não`, `se_der_ruim`, `por_fim` | Continuam a instrução anterior, na linha do `}` ou na seguinte (§4.6). | aprovado (2026-10-20) |
| Função como valor | Só seta (`=>`) (P6): `faz_trem` sem nome fica fora. Corpo de seta com `{` é bloco; para devolver uma coisa direto, use parênteses: `x => ({ nome: x })`. Quando a primeira instrução desse bloco tem a forma `nome: valor`, o diagnóstico de rótulo acrescenta a dica dos parênteses. | aprovado (2026-10-20) |
| Assíncrono | `vai_na_frente` vale antes de `faz_trem` nomeada, de seta (`vai_na_frente x => …`, `vai_na_frente (a, b) => {…}`) (P6) e de método de classe (`vai_na_frente busca() {…}`). `espera_um_cadim` e `pergunta` valem dentro de qualquer um deles. | aprovado (2026-10-20) |
| Vírgula final | Aceita em lista, coisa, parâmetros e argumentos (`[1, 2,]`, `{ a: 1, }`). Passa para o JS sem edição. | aprovado (2026-10-20) |
| Coisa (objeto literal) | Só `chave: valor`, com chave identificador (palavra do JS não serve, P2), texto ou número. | aprovado (2026-10-20) |
| `tenta_aí` | Exige `se_der_ruim` ou `por_fim` (um dos dois ou ambos); sozinho é erro de sintaxe (GS0202). `se_der_ruim {…}` sem parâmetro é aceito. | aprovado (2026-10-20) |
| `uai` sem valor inicial | GS0307, porque `const x;` não é JS válido. `trem x` sem valor inicial é aceito e vale `indefinido`. | aprovado (2026-10-20) |
| `ocê` | Aceito em construtor, método e `faz_trem`; a seta usa o `ocê` de fora. Fora de qualquer função, método ou construtor é aviso pedagógico (`ocê` vale `indefinido` no alvo `module`; nos alvos que não são módulo ES vale o objeto global do contexto, §5.7; código fixado na RFC-0001). | aprovado (2026-10-20) |
| `a_raiz` | `a_raiz(args)` só no `aprepara_trem` de classe que herda, antes de qualquer uso de `ocê`; `a_raiz.metodo(args)` em método ou construtor de classe que herda. Qualquer outro uso é GS0311. | aprovado (2026-10-20) |

Propostas já aprovadas pelo dono no spec (D10); entram aqui só para registro.

| Id | Proposta | Situação |
| --- | --- | --- |
| P1 | Mundo fechado também para membros: `x.nome` só vale se `nome` foi declarado no arquivo ou é da biblioteca; membro nativo do JS dá erro (`lista.some` → GS0406) | aprovada no spec |
| P2 | Palavra do JavaScript (§4.4) não serve de nome em posição nenhuma, inclusive propriedade (`{ new: 1 }`, `obj.public`) | aprovada no spec |
| P3 | Reserva de membro da biblioteca por forma: propriedade (`.o_tanto`, `.mensagem`) reservada sempre; método só como membro chamável; campo de dado livre (`{ ano: 2026 }`); membro de `Conta`/`Coisa` não reserva | aprovada no spec |
| P4 | Nome global da biblioteca (`prosa`, `pergunta`, `Conta`, `Data`, `Erro`…) pode ser declarado pelo aluno e esconde o da biblioteca, com aviso GS0804 | aprovada no spec |
| P5 | Alfabeto fixo de identificador: `A–Z`, `a–z`, letras acentuadas do português, dígitos e `_` | aprovada no spec |
| P6 | Função como valor só com seta (`=>`); `faz_trem` sem nome fica fora; seta assíncrona `vai_na_frente (x) => {…}` entra | aprovada no spec |
| P7 | Corpo de condicional, laço, `tenta_aí`/`se_der_ruim`/`por_fim`, função e classe sempre entre `{ }` | aprovada no spec |
| P14 | No REPL, declarar de novo um nome da sessão substitui o anterior (como no console do navegador); reatribuir um `uai` da sessão continua GS0302 | aprovada no spec |
| P17 | SemVer da linguagem (§9.5): crescer o conjunto de nomes reservados, inclusive entrada nova na biblioteca, é MAJOR | aprovada no spec |

## 5. Biblioteca padrão

Teste da prosa: (a) alguém de Goiás diria isso numa prosa, ou o nome é composição transparente de palavras que se
dizem? (b) o nome não é calco de termo técnico do inglês ou do JavaScript? Responder `sim` ou `não`. Forma verbal:
`imperativo`, `infinitivo` ou `substantivo`.

| Área | GoiásScript | JavaScript | Semântica | Origem | Forma verbal | Prosa (a) | Prosa (b) | Decisão do dono |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Saída | `prosa(…)` ✅ | `console.log` | nativa | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Saída | `reclama(…)` (1.5) | `console.error` | nativa | 1.5 | herdado | herdado | herdado | aprovado (2026-10-20) |
| Saída | `avisa(…)` | `console.warn` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Entrada | `pergunta(texto)` | — | didática (§4.10) | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Texto | `.gritando()` ✅ | `.toUpperCase()` | nativa | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Texto | `.cochichando()` ✅ | `.toLowerCase()` | nativa | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Texto/lista | `.tem_no_meio(x)` ✅ | `.includes(x)` | nativa | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Texto | `.trocar(a, b)` ✅ | `.replaceAll(a, b)` | **didática** (ajudante `$gs_trocar`): troca todas as ocorrências; `a` e `b` são texto literal, sem `$` especial (a 1.5 tratava `a` como regex) (P16) | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Texto | `.dividir(sep)` ✅ | `.split(sep)` | nativa | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Texto | `.ranca_os_espaço()` | `.trim()` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Texto | `.começa_com(x)` | `.startsWith(x)` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Texto | `.termina_com(x)` | `.endsWith(x)` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Texto/lista | `.naco(i, f)` | `.slice(i, f)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Texto/lista | `.onde_tá(x)` | `.indexOf(x)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Texto/lista | `.o_tanto` | `.length` | nativa (propriedade, sem parênteses; na 1.5 era `.tamanho()`; conta unidades UTF-16) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Texto | `.repete(n)` | `.repeat(n)` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Lista | `.bota_no_final(x)` ✅ | `.push(x)` | nativa | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Lista | `.ranca_o_rabo()` | `.pop()` | nativa (era `.arranca_o_rabo()` ✅; trocado pelo dono pela família `ranca`) | dono | imperativo | sim | sim | aprovado (2026-10-20) |
| Lista | `.bota_no_começo(x)` | `.unshift(x)` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Lista | `.ranca_a_cabeça()` | `.shift()` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Lista | `.mapear(f)` ✅ | `.map(f)` | nativa | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Lista | `.filtrar(f)` ✅ | `.filter(f)` | nativa | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Lista | `.amontoar(f, inicial)` | `.reduce(f, inicial)` | nativa; `inicial` obrigatório (evita o `NaN` da 1.5) | proposta | infinitivo | sim | sim | aprovado (2026-10-20) |
| Lista | `.pra_cada(f)` | `.forEach(f)` | nativa | proposta | substantivo | sim | não | aprovado (2026-10-20) |
| Lista | `.cata(f)` | `.find(f)` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Lista | `.ajunta(sep)` | `.join(sep)` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Lista | `.emenda(outra)` | `.concat(outra)` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Lista | `.de_trás_pra_frente()` | `.toReversed()` | nativa, sem mutar (ES2023) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Lista | `.arruma()` | `.toSorted($gs_ordem)` | **didática**, sem argumentos e sem mutar (ES2023). Ordem total e estável: números por valor (`NaN` por último), depois textos por `localeCompare('pt-BR')`, depois o resto (`nada`, `indefinido`, `certeza`, `de_jeito_nenhum`, lista, coisa) na ordem em que estava. `.arruma(f)` é GS0604, com ajuda própria (P9) | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Coisa | `Coisa.chaves(c)` | `Object.keys(c)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Coisa | `Coisa.valores(c)` | `Object.values(c)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Coisa | `Coisa.entradas(c)` | `Object.entries(c)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Coisa | `Coisa.tem(c, k)` | `Object.hasOwn(c, k)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Coisa | `Coisa.mistura(a, b)` | `Object.assign({}, a, b)` | nativa (macro: insere `{}` como primeiro argumento), sem mutar | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Conta | `Conta.sorteia_um(min, max)` ✅ | — | **didática**: inteiro aleatório em `[min, max]` (o ✅ vale só para o nome; a semântica é nova) | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Conta | `Conta.arredondar(x)` ✅ | `Math.round(x)` | nativa; o meio sobe (`Conta.arredondar(-2.5)` é -2) (P15) | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Conta | `Conta.arredondar_pra_baixo(x)` | `Math.floor(x)` | nativa (P15) | proposta | infinitivo | sim | sim | aprovado (2026-10-20) |
| Conta | `Conta.arredondar_pra_cima(x)` | `Math.ceil(x)` | nativa (P15) | proposta | infinitivo | sim | sim | aprovado (2026-10-20) |
| Conta | `Conta.maior(…)` ✅ | `Math.max(…)` | nativa; recebe os números separados, não uma lista | dono | herdado | herdado | herdado | aprovado (2026-10-20) |
| Conta | `Conta.menor(…)` | `Math.min(…)` | nativa; recebe os números separados, não uma lista | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Conta | `Conta.ranca_o_sinal(x)` | `Math.abs(x)` | nativa | proposta | substantivo | não | não | aprovado (2026-10-20) |
| Conta | `Conta.raiz_quadrada(x)` | `Math.sqrt(x)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Conta | `Conta.elevado_a(b, e)` | `Math.pow(b, e)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Conta | `Conta.PI` | `Math.PI` | nativa (propriedade) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Conta | `Conta.E` | `Math.E` | nativa (propriedade) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Número | `vira_número(t)` | — | **didática**: ignora espaços nas pontas e aceita vírgula decimal (`"1,5"` vira 1.5); texto que não é número e texto vazio dão `NaN` (o `Number("")` nativo dá 0) (P11) | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Número | `é_número(x)` | `typeof x === "number" && !Number.isNaN(x)` | **didática** (ajudante, avalia `x` uma vez): `certeza` só para número de verdade; `"12"` e o `NaN` de `vira_número("abc")` dão `de_jeito_nenhum`, então converta antes com `vira_número` (P11) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Número | `.com_casas(n)` | `.toFixed(n)` | nativa; ponto decimal; arredonda o valor binário (`(1.005).com_casas(2)` é `"1.00"`) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Texto | `vira_texto(x)` | `String(x)` | **didática**: lista e coisa viram o texto JSON em vez de `[object Object]` (anexo D, a3) | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Tempo | `daqui_um_cadim(f, ms)` | `setTimeout(f, ms)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Tempo | `toda_hora(f, ms)` | `setInterval(f, ms)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Tempo | `larga_mão(id)` | `clearTimeout(id)` / `clearInterval(id)` | nativa | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Tempo | `cochila(ms)` | — | **didática**: promessa que resolve depois de `ms` | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Promessa | `faz_um Promessa(f)` (1.5) | `new Promise(f)` | nativa | 1.5 | herdado | herdado | herdado | aprovado (2026-10-20) |
| Promessa | `.quando_der_bão(f)` (1.5) | `.then(f)` | nativa | 1.5 | herdado | herdado | herdado | aprovado (2026-10-20) |
| Promessa | `.se_der_ruim(f)` (1.5) | `.catch(f)` | nativa | 1.5 | herdado | herdado | herdado | aprovado (2026-10-20) |
| Erro | `faz_um Erro(msg)` | `new Error(msg)` | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Erro | `.mensagem` | `.message` (via `$gs_mensagem`) | **didática** (ajudante, só leitura): erro do motor (`TypeError`, `ReferenceError`, `RangeError`) devolve a frase em português do catálogo GS07xx; erro do programa (`vixe`, `faz_um Erro(msg)`) devolve `msg` intacta (P10) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Data | `faz_um Data()` e `.ano() .dia() .hora() .minuto() .segundo()` | `new Date()` e getters | nativa | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Data | `.mês()` | `.getMonth() + 1` | **didática** (macro, 0 bytes): devolve 1–12; emitido como `(x.getMonth() + 1)` | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Coisa | `Coisa.vira_texto(c)` | `JSON.stringify(c)` | nativa (anexo D, a1) | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Coisa | `Coisa.vira_coisa(t)` | `JSON.parse(t)` | nativa (anexo D, a2) | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Lista | `.tem_algum(f)` | `.some(f)` | nativa (anexo D, c) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Lista | `.todin(f)` | `.every(f)` | nativa (anexo D, d) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Lista | `.ranca_do_meio(i, n)` | `.splice(i, n)` | nativa, muta a lista (anexo D, e) | proposta | imperativo | sim | sim | aprovado (2026-10-20) |
| Lista | `.onde_tá_o(f)` | `.findIndex(f)` | nativa (anexo D, f) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Promessa | `Promessa.tudim_junto(lista)` | `Promise.all(lista)` | nativa (anexo D, b) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |
| Data | `Data.agorinha()` | `Date.now()` | nativa (anexo D, g) | proposta | substantivo | sim | sim | aprovado (2026-10-20) |

Origem `dono` é a grafia idêntica à do `CLAUDE.md` da 1.5 (✅ no spec); `1.5` é nome da tabela de 53 entradas da 1.5;
`proposta` é nome novo. Nas linhas `dono` e `1.5` as colunas de forma verbal e de prosa ficam `herdado`: o nome já existe e não
é reexaminado, salvo se o dono pedir. Nas linhas `proposta`, as respostas são do autor do rascunho e valem como ponto de
partida: o parecer dos falantes de Goiás (anexo F) pode mudá-las, e a decisão é do dono.

**Critério de nomeação.** Vale o que o goiano fala; o sentido no resto do Brasil e a clareza para iniciante só
desempatam entre opções goianas. As fontes do falar goiano estão no anexo G. Nas linhas `proposta`, as colunas de
prosa valem como ponto de partida do parecer do anexo F.

- `Erro` e `.mensagem` ficam no português neutro: "rata" é besteira que alguém faz, não erro do programa.
- `reclama` fica: "grilar" é ficar preocupado, não mostrar o erro.
- `.se_der_ruim` (de promessa) repete a keyword do `catch` de propósito; depois de `.` o parser aceita a keyword como
  nome de membro, só nesse caso.

## 6. Propostas para decisão do dono

| # | Proposta | Alternativa se recusada | Decisão do dono |
| --- | --- | --- | --- |
| P8 | `vixe` é instrução; `vixe(erro)` com o parâmetro do `se_der_ruim` relança o mesmo erro | `vixe` sempre embrulha em `Error` | aprovada (2026-10-20) |
| P9 | `.arruma()` sem comparador, ordem total e estável (números, depois textos pt-BR, depois o resto) | `.ordenar(comparador?)` | aprovada (2026-10-20), com o nome `.arruma()` |
| P10 | `.mensagem` didática: erro do motor chega em português do catálogo GS07xx | `.mensagem` nativa (texto do motor, em inglês) | aprovada (2026-10-20) |
| P11 | `vira_número` didática (aceita vírgula decimal; texto vazio dá `NaN`) e `é_número(x)` no lugar de `num_é_número` | `vira_número` = `Number`; `num_é_número` = `Number.isNaN` | aprovada (2026-10-20) |
| P12 | Números à brasileira: `1.000.000` é erro léxico; `10,50` onde a vírgula não cabe é erro com a correção; `1.000,50` em argumentos é aviso | Sem diagnóstico específico | aprovada (2026-10-20) |
| P13 | Palavras aposentadas (1.0/1.5/CLAUDE.md antigo) não são reservadas; só melhoram a mensagem de erro (GS0306) | Reservar as palavras aposentadas | aprovada (2026-10-20) |
| P15 | `Conta.arredondar` na grafia do dono, com `arredondar_pra_baixo`/`arredondar_pra_cima`; `Conta` × `GoianoMath` decidido na RFC-0001 | `Conta.arredonda` | aprovada (2026-10-20); namespace `Conta` |
| P16 | `.trocar` mantém o `$` especial do JavaScript no texto de substituição, com aviso GS0808 | Substituição 100% literal via ajudante | recusada (2026-10-20): troca 100% literal via ajudante `$gs_trocar`, sem GS0808 |

## 7. Anexos

### Anexo A. De-para 1.5 → v3

| JavaScript | Nome no CLAUDE.md | Nome no runtime 1.5 | Nome na v3 | Semântica | Decisão do dono |
|---|---|---|---|---|---|
| `replace` | `.trocar()` | `trocar` | `.trocar(a, b)` | troca todas as ocorrências, 100% literal (P16); a 1.5 tratava a como regex | aprovado (2026-10-20) |
| `split` | `.dividir()` | `dividir` | `.dividir(sep)` | igual ao nativo | aprovado (2026-10-20) |
| `join` | — | `juntar` | `.ajunta(sep)` | igual ao nativo | aprovado (2026-10-20) |
| `toUpperCase` | `.gritando()` | `pra_maiusculo` | `.gritando()` | igual ao nativo | aprovado (2026-10-20) |
| `toLowerCase` | `.cochichando()` | `pra_minusculo` | `.cochichando()` | igual ao nativo | aprovado (2026-10-20) |
| `trim` | — | `aparar` | `.ranca_os_espaço()` | igual ao nativo | aprovado (2026-10-20) |
| `includes` | `.tem_no_meio()` | `contem` | `.tem_no_meio(x)` | igual ao nativo, texto e lista | aprovado (2026-10-20) |
| `indexOf` | — | `posicao_de` | `.onde_tá(x)` | igual ao nativo | aprovado (2026-10-20) |
| `substring` | — | `pedaco` | `.naco(i, f)` | vira slice; índice negativo conta do fim | aprovado (2026-10-20) |
| `slice` | — | `fatiar` | `.naco(i, f)` | igual ao nativo | aprovado (2026-10-20) |
| `charAt` | — | `letra_em` | sem equivalente na v3 | use texto[i] | aprovado (2026-10-20) |
| `length` | — | `tamanho` | `.o_tanto` | propriedade, sem parênteses; na 1.5 era .tamanho() | aprovado (2026-10-20) |
| `startsWith` | — | `comeca_com` | `.começa_com(x)` | igual ao nativo | aprovado (2026-10-20) |
| `endsWith` | — | `termina_com` | `.termina_com(x)` | igual ao nativo | aprovado (2026-10-20) |
| `map` | `.mapear()` | `mapear` | `.mapear(f)` | igual ao nativo | aprovado (2026-10-20) |
| `filter` | `.filtrar()` | `filtrar` | `.filtrar(f)` | igual ao nativo | aprovado (2026-10-20) |
| `reduce` | — | `reduzir` | `.amontoar(f, inicial)` | inicial obrigatório; alternativa de nome no anexo E | aprovado (2026-10-20) |
| `forEach` | — | `pra_cada` | `.pra_cada(f)` | igual ao nativo | aprovado (2026-10-20) |
| `push` | `.bota_no_final()` | `empurrar` | `.bota_no_final(x)` | igual ao nativo | aprovado (2026-10-20) |
| `pop` | `.ranca_o_rabo()` | `tirar_ultimo` | `.ranca_o_rabo()` | igual ao nativo | aprovado (2026-10-20) |
| `shift` | — | `tirar_primeiro` | `.ranca_a_cabeça()` | igual ao nativo | aprovado (2026-10-20) |
| `unshift` | — | `por_primeiro` | `.bota_no_começo(x)` | igual ao nativo | aprovado (2026-10-20) |
| `sort` | — | `ordenar` | `.arruma()` | sem comparador, ordem total e sem mutar (P9); a 1.5 mutava | aprovado (2026-10-20) |
| `reverse` | — | `inverter` | `.de_trás_pra_frente()` | sem mutar (toReversed) | aprovado (2026-10-20) |
| `find` | — | `achar` | `.cata(f)` | igual ao nativo; alternativa de nome no anexo E | aprovado (2026-10-20) |
| `concat` | — | `juntar_lista` | `.emenda(outra)` | igual ao nativo; alternativa de nome no anexo E | aprovado (2026-10-20) |
| `splice` | — | `emendar` | sem equivalente na v3 | lacuna (e) do anexo D | aprovado (2026-10-20) |
| `keys` | — | `chaves` | `Coisa.chaves(c)` | igual ao nativo | aprovado (2026-10-20) |
| `values` | — | `valores` | `Coisa.valores(c)` | igual ao nativo | aprovado (2026-10-20) |
| `entries` | — | `entradas` | `Coisa.entradas(c)` | igual ao nativo | aprovado (2026-10-20) |
| `hasOwnProperty` | — | `tem_propriedade` | `Coisa.tem(c, k)` | Object.hasOwn | aprovado (2026-10-20) |
| `assign` | — | `misturar` | `Coisa.mistura(a, b)` | não muta o primeiro argumento | aprovado (2026-10-20) |
| `Math.random` | `sorteia_um()` | `sorteio` | `Conta.sorteia_um(min, max)` | inteiro em [min, max] | aprovado (2026-10-20) |
| `Math.floor` | — | `arredondar_baixo` | `Conta.arredondar_pra_baixo(x)` | igual ao nativo (P15) | aprovado (2026-10-20) |
| `Math.ceil` | — | `arredondar_cima` | `Conta.arredondar_pra_cima(x)` | igual ao nativo (P15) | aprovado (2026-10-20) |
| `Math.round` | `arredondar()` | `arredondar` | `Conta.arredondar(x)` | o meio sobe (P15) | aprovado (2026-10-20) |
| `Math.max` | `maior()` | `maior` | `Conta.maior(…)` | números separados, não lista | aprovado (2026-10-20) |
| `Math.min` | — | `menor` | `Conta.menor(…)` | números separados, não lista | aprovado (2026-10-20) |
| `Math.abs` | — | `absoluto` | `Conta.ranca_o_sinal(x)` | igual ao nativo; alternativa de nome no anexo E | aprovado (2026-10-20) |
| `Math.sqrt` | — | `raiz_quadrada` | `Conta.raiz_quadrada(x)` | igual ao nativo | aprovado (2026-10-20) |
| `Math.pow` | — | `potencia` | `Conta.elevado_a(b, e)` | igual ao nativo; alternativa de nome no anexo E | aprovado (2026-10-20) |
| `getFullYear` | — | `pegar_ano` | `.ano()` | getter da Data | aprovado (2026-10-20) |
| `getMonth` | — | `pegar_mes` | `.mês()` | 1 a 12 (getMonth + 1) | aprovado (2026-10-20) |
| `getDate` | — | `pegar_dia` | `.dia()` | getter da Data | aprovado (2026-10-20) |
| `getHours` | — | `pegar_horas` | `.hora()` | getter da Data | aprovado (2026-10-20) |
| `getMinutes` | — | `pegar_minutos` | `.minuto()` | getter da Data | aprovado (2026-10-20) |
| `getSeconds` | — | `pegar_segundos` | `.segundo()` | getter da Data | aprovado (2026-10-20) |
| `console.log` | `prosa()` | `prosa` | `prosa(…)` | igual ao nativo | aprovado (2026-10-20) |
| `console.error` | — | `prosa_erro` | `reclama(…)` | igual ao nativo | aprovado (2026-10-20) |
| `console.warn` | — | `prosa_aviso` | `avisa(…)` | igual ao nativo | aprovado (2026-10-20) |
| `parseInt` | — | `vira_numero` | `vira_número(t)` | didática (P11); aceita vírgula decimal | aprovado (2026-10-20) |
| `parseFloat` | — | `vira_decimal` | `vira_número(t)` | didática (P11); um só nome para inteiro e decimal | aprovado (2026-10-20) |
| `isNaN` | — | `eh_nao_numero` | `é_número(x)` | didática (P11); sentido invertido: certeza só para número de verdade | aprovado (2026-10-20) |
| `setTimeout` | — | `depois_de` | `daqui_um_cadim(f, ms)` | igual ao nativo | aprovado (2026-10-20) |
| `setInterval` | — | `repetir_a_cada` | `toda_hora(f, ms)` | igual ao nativo | aprovado (2026-10-20) |
| `clearTimeout` | — | `cancelar_depois` | `larga_mão(id)` | igual ao nativo | aprovado (2026-10-20) |
| `clearInterval` | — | `cancelar_repeticao` | `larga_mão(id)` | igual ao nativo | aprovado (2026-10-20) |
| `Math (namespace)` | `GoianoMath` | — | `Conta` | namespace; a 1.5 documentava GoianoMath e o runtime usa Math.x | aprovado (2026-10-20) |

### Anexo B. Palavras aposentadas (`retiredWords`, P13)

| Aposentada | Forma na v3 | Decisão do dono |
| --- | --- | --- |
| `presta_serviço` / `vai_na_frente_presta_serviço` | `faz_trem` / `vai_na_frente_faz_trem` | aprovado (2026-10-20) |
| `mexe_assim nome(…)` | `nome(…) {…}` (método de classe não leva palavra; o construtor é `aprepara_trem`) | aprovado (2026-10-20) |
| `vixe_que(msg)` | `vixe(msg)` | aprovado (2026-10-20) |
| `vazio` / `sei_lá` | `nada` / `indefinido` | aprovado (2026-10-20) |
| `se` / `senao` / `fazer` | `se_ocê_quiser` / `se_não` / `faz_trem` (documentadas na 1.5, nunca implementadas) | aprovado (2026-10-20) |
| `é_igual_a` | `é_igualim` | aprovado (2026-10-20) |
| `um_tanto_de`, `ninguem_fuça`, `só_da_famia`, `todo_mundo_vê` | sem equivalente: saíram da linguagem | aprovado (2026-10-20) |

### Anexo C. Membros nativos do JavaScript sem nome goiano (ES2023)

Lista gerada de `lib.es2023.d.ts` do TypeScript fixado no spike, menos os nomes que aparecem na coluna JavaScript da
biblioteca. Na v3 todos são GS0405 ou GS0406 (P1). `constructor` e `prototype` são GS0406 em qualquer posição.

| Receptor | Membros sem nome goiano |
| --- | --- |
| Array | `at`, `copyWithin`, `every`, `fill`, `findIndex`, `findLast`, `findLastIndex`, `flat`, `flatMap`, `lastIndexOf`, `reduceRight`, `reverse`, `some`, `sort`, `splice`, `toLocaleString`, `toSpliced`, `toString`, `with` |
| String | `anchor`, `at`, `big`, `blink`, `bold`, `charAt`, `charCodeAt`, `codePointAt`, `fixed`, `fontcolor`, `fontsize`, `italics`, `lastIndexOf`, `link`, `localeCompare`, `match`, `matchAll`, `normalize`, `padEnd`, `padStart`, `replace`, `search`, `small`, `strike`, `sub`, `substr`, `substring`, `sup`, `toLocaleLowerCase`, `toLocaleUpperCase`, `toString`, `trimEnd`, `trimLeft`, `trimRight`, `trimStart`, `valueOf` |
| Object | `constructor`, `hasOwnProperty`, `isPrototypeOf`, `propertyIsEnumerable`, `toLocaleString`, `toString`, `valueOf` |
| Promise | `finally` |
| Number | `toExponential`, `toLocaleString`, `toPrecision`, `toString`, `valueOf` |
| Date | `getDay`, `getMilliseconds`, `getTime`, `getTimezoneOffset`, `getUTCDate`, `getUTCDay`, `getUTCFullYear`, `getUTCHours`, `getUTCMilliseconds`, `getUTCMinutes`, `getUTCMonth`, `getUTCSeconds`, `setDate`, `setFullYear`, `setHours`, `setMilliseconds`, `setMinutes`, `setMonth`, `setSeconds`, `setTime`, `setUTCDate`, `setUTCFullYear`, `setUTCHours`, `setUTCMilliseconds`, `setUTCMinutes`, `setUTCMonth`, `setUTCSeconds`, `toDateString`, `toISOString`, `toJSON`, `toLocaleDateString`, `toLocaleString`, `toLocaleTimeString`, `toString`, `toTimeString`, `toUTCString`, `valueOf` |
| Error | `cause`, `name`, `stack` |
| Array (estático) | `from`, `isArray`, `of`, `prototype` |
| Object (estático) | `create`, `defineProperties`, `defineProperty`, `freeze`, `fromEntries`, `getOwnPropertyDescriptor`, `getOwnPropertyDescriptors`, `getOwnPropertyNames`, `getOwnPropertySymbols`, `getPrototypeOf`, `is`, `isExtensible`, `isFrozen`, `isSealed`, `preventExtensions`, `prototype`, `seal`, `setPrototypeOf` |
| Promise (estático) | `all`, `allSettled`, `any`, `prototype`, `race`, `reject`, `resolve` |
| Number (estático) | `EPSILON`, `MAX_SAFE_INTEGER`, `MAX_VALUE`, `MIN_SAFE_INTEGER`, `MIN_VALUE`, `NEGATIVE_INFINITY`, `NaN`, `POSITIVE_INFINITY`, `isFinite`, `isInteger`, `isSafeInteger`, `parseFloat`, `parseInt`, `prototype` |
| String (estático) | `fromCharCode`, `fromCodePoint`, `prototype`, `raw` |
| Date (estático) | `UTC`, `now`, `parse`, `prototype` |
| Error (estático) | `prototype` |
| Math | `LN10`, `LN2`, `LOG10E`, `LOG2E`, `SQRT1_2`, `SQRT2`, `acos`, `acosh`, `asin`, `asinh`, `atan`, `atan2`, `atanh`, `cbrt`, `clz32`, `cos`, `cosh`, `exp`, `expm1`, `fround`, `hypot`, `imul`, `log10`, `log1p`, `log2`, `random`, `sign`, `sin`, `sinh`, `tan`, `tanh`, `trunc` |
| JSON | `parse`, `stringify` |

### Anexo D. Lacunas da biblioteca

Cada lacuna obrigatória da §4.9 vira nome aprovado ou fica fora da v3 (GS0406 para membro, GS0403 para global do
JavaScript). Os nomes da coluna "Candidato" são do autor do rascunho, ainda sem teste da prosa nem parecer dos falantes;
não valem como decisão.

| Item | Lacuna | JavaScript | Candidato | Se ficar fora da v3 | Decisão do dono |
|---|---|---|---|---|---|
| a1 | coisa para texto | `JSON.stringify` | `Coisa.vira_texto(c)` | GS0403; monte o texto com `mais` | aprovado (2026-10-20) |
| a2 | texto para coisa | `JSON.parse` | `Coisa.vira_coisa(t)` | GS0403; sem alternativa pequena | aprovado (2026-10-20) |
| a3 | `vira_texto(lista)` e `vira_texto(coisa)` devolvem o texto JSON em vez de `[object Object]` | `String(x)` | mesmo nome, semântica didática | manter `String(x)`; o aluno vê `[object Object]` | aprovado (2026-10-20) |
| b | esperar várias promessas | `Promise.all` | `Promessa.tudim_junto(lista)` | GS0403; `espera_um_cadim` uma por vez | aprovado: `Promessa.tudim_junto(lista)` |
| c | algum elemento passa no teste | `.some` | `.tem_algum(f)` | GS0406; `vai_indo` com `para_com_isso` | aprovado (2026-10-20) |
| d | todos os elementos passam no teste | `.every` | `.todin(f)` | GS0406; `vai_indo` com `para_com_isso` | aprovado: `.todin(f)` |
| e | tirar ou trocar elementos no meio | `.splice` | `.ranca_do_meio(i, n)` | GS0406; `.naco` com `.emenda` | aprovado: `.ranca_do_meio(i, n)` |
| f | posição do primeiro que passa no teste | `.findIndex` | `.onde_tá_o(f)` | GS0406; `vai_indo` com contador | aprovado (2026-10-20) |
| g | instante atual em milissegundos | `Date.now` | `Data.agorinha()` | GS0403; `faz_um Data()` com `.hora()` e `.minuto()` | aprovado: `Data.agorinha()` |
| h1 | data como texto ISO, usada pelos exemplos do núcleo | `.toISOString` | sem candidato | GS0406; montar com `.ano()`, `.mês()` e `.dia()` | fora da v3; exemplos reescritos |
| h2 | chamar função com outro `ocê`, usada num exemplo de classes | `.call` | sem candidato | GS0406; repensar o exemplo | fora da v3; exemplo reescrito |

As linhas `h` vêm de passar os exemplos de `packages/core/examples` e dos modelos de projeto pelo mundo fechado
(`.toISOString` em `faz_um Date().toISOString()`, `.call` num método redefinido); os exemplos usam também
`JSON.stringify` e `Promise.all`, que já são as linhas a1 e b. O `demo` do vídeo não está no repositório e ainda não
passou pela mesma conferência.

### Anexo E. Alternativas de nome

Decididas pelo dono em 2026-10-20, com o critério "o que o goiano fala".

| Item | Proposta do rascunho | Alternativa avaliada | Decisão do dono |
|---|---|---|---|
| e1/e9 | `Conta.ranca_o_sinal` | `Conta.tira_o_sinal`, `absoluto` | `Conta.ranca_o_sinal` |
| e2 | `.caça` | `.acha` | `.cata` |
| e3 | `.emenda` | `.junta_com(outra)` | `.emenda` |
| e4 | `Conta.elevado` | `Conta.elevado_a` | `Conta.elevado_a` |
| e5 | `Conta.arredondar` | `Conta.arredonda` | `Conta.arredondar` |
| e6 | `faz_um promessa` | `faz_um Promessa` | `faz_um Promessa` |
| e7 | `Conta` | `GoianoMath` | `Conta` |
| e8 | `.amontoar` | `.reduzir` | `.amontoar` |

Nomes de domínio com risco de colisão (`o_tanto`, `mensagem`, `ano`, `mês`, `dia`, `hora`, `minuto`, `segundo`,
`repete`, `cata`, `ajunta`, `naco`) seguem a reserva por forma (P3) e o aviso GS0804 (P4).

### Anexo F. Parecer dos falantes de Goiás

Parecer consultivo de 2 a 3 falantes de Goiás indicados pelo dono, recolhido com
`docs/rfc/0001-anexo-f-formulario.md`. Ainda não recolhido.

| Falante | Cidade | Nome avaliado | Diria numa prosa? | Observação |
|---|---|---|---|---|
| pendente | pendente | pendente | pendente | pendente |

### Anexo G. Fontes do falar goiano

Pesquisa de 2026-10-20, conceito a conceito. Classificação: goiano (marcado por fonte goiana), goiano-mineiro (fala do
Centro-Oeste e de Minas, comum em Goiás) ou sem fonte (vale o falante goiano, anexo F).

| Termo | Uso | Classificação | Fonte |
|---|---|---|---|
| `-in`/`-inha` (`tudin`, `todin`, `poquin`, `tempin`) | diminutivo enfático | goiano | Cruz e Azevedo (2018), Revista Porto das Letras 4(1), dados do ALINGO |
| `rancar` | tirar, arrancar | goiano | curtamais.com.br, dialeto goiano: expressões típicas |
| `larga` | deixa | goiano | curtamais.com.br, gírias e expressões goianas; dicionário goianês |
| `cadim`, `poquin` | pouquinho | goiano-mineiro | redecol.com.br (2009), goianês e mineirês |
| `bão` | bom | goiano-mineiro | redecol.com.br (2009) |
| `catar`, `ajuntar`, `naco`, `o tanto` | procurar, juntar, pedaço, quantidade | goiano-mineiro | redecol.com.br (2009); curtamais.com.br |
| `agorinha`, `daqui um cadim`, `larga mão` | agora, daqui a pouco, desistir | sem fonte | parecer do dono; anexo F |

## 8. Notas de migração

Para quem vem da 1.5:

- `.tamanho()` vira `.o_tanto` (propriedade); chamar com parênteses é GS0603 com a correção.
- `trem` passa a ser `let` (D5); na 1.5 era `var`.
- `.trocar` troca todas as ocorrências e trata os dois argumentos como texto literal, sem regex e sem `$` especial (P16).
- `.ordenar` vira `.arruma()`, sem comparador e sem mutar a lista (P9); `.de_trás_pra_frente` e `Coisa.mistura`
  também não mutam.
- `.reduzir` vira `.amontoar(f, inicial)` e o valor inicial é obrigatório, o que acaba com o `NaN` da 1.5.
- `.ranca_o_rabo()` vira `.ranca_o_rabo()`; a família do `ranca` cobre `pop`, `shift`, `splice`, `trim` e `Math.abs`.
- `faz_um promessa`, `.quando_resolver` e `.se_der_pobrema` viram `faz_um Promessa`, `.quando_der_bão` e `.se_der_ruim`.
- As palavras do anexo B não são reservadas; só melhoram a mensagem do erro GS0306. `uai fazer é 3` continua válido.
- Nomes de método em letra minúscula sem acento do runtime da 1.5 (`comeca_com`, `pedaco`) saem; a v3 usa a forma do
  anexo A.

## 9. Aprovação do dono

Nada nesta RFC vale antes da aprovação. O que o dono decide no GATE 0:

- as propostas P8, P9, P10, P11, P12, P13, P15 e P16 (§6);
- cada linha da biblioteca (§5), inclusive `oce`/`senao`, as lacunas do anexo D e as alternativas do anexo E;
- a linha `Status` do cabeçalho, que passa a `aprovada em AAAA-MM-DD` quando o dono aprovar. Só essa linha libera a
  Fase 1.

| Decisão | Situação |
|---|---|
| Propostas P8–P13, P15 e P16 | decididas em 2026-10-20 |
| Biblioteca padrão, nome a nome | decidida em 2026-10-20 |
| Lacunas (anexo D) e alternativas (anexo E) | decididas em 2026-10-20 |
| Parecer dos falantes de Goiás (anexo F) | pendente |
| Status da RFC | pendente |
