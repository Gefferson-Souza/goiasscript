# RFC-0001: Vocabulário e biblioteca padrão do GoiásScript 3

| Campo | Valor |
|---|---|
| Status | rascunho da Fase 0; o dono aprova nome a nome |
| Spec | §3.1, §4 e §9.3 de `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md` |
| Decide | P8, P9, P10, P11, P12, P13, P15 e P16 |

## 1. Resumo

Esta RFC congela as keywords, os operadores, o alfabeto de identificadores, a gramática e a biblioteca padrão da v3.
Mudar um nome depois da aprovação é MAJOR (spec §9.5). Os falantes de Goiás dão parecer consultivo (anexo F); a decisão
é do dono (D8). Toda coluna "Decisão do dono" está `pendente` até o GATE 0.

## 2. Vocabulário (keywords, operadores e literais)

| Categoria | GoiásScript | JavaScript | Classe | Variante sem acento | Decisão do dono |
| --- | --- | --- | --- | --- | --- |
| Declaração | `uai` | `const` | R | — | pendente |
| Declaração | `trem` | `let` | R | — | pendente |
| Atribuição | `é` | `=` | R | — | pendente |
| Função | `faz_trem` | `function` | R | — | pendente |
| Função | `faz_favor` | `return` | R | — | pendente |
| Função | `vai_na_frente` | `async` | R | — | pendente |
| Função | `vai_na_frente_faz_trem` | `async function` | R | — | pendente |
| Função | `espera_um_cadim` | `await` | R | — | pendente |
| Controle | `se_ocê_quiser` | `if` | R | `se_oce_quiser` | pendente |
| Controle | `se_num_for` | `else if` | R | — | pendente |
| Controle | `se_não` | `else` | R | `se_nao` | pendente |
| Controle | `vai_indo` | `for` | R | — | pendente |
| Controle | `enquanto_tiver` | `while` | R | — | pendente |
| Controle | `para_com_isso` | `break` | R | — | pendente |
| Controle | `continua_aí` | `continue` | R | `continua_ai` | pendente |
| Controle | `de` | `of` (em `vai_indo`) | C | — | pendente |
| Controle | `em` | `in` (em `vai_indo`) | C | — | pendente |
| Classe | `arruma_trem` | `class` | R | — | pendente |
| Classe | `inherda_de` | `extends` | R | — | pendente |
| Classe | `aprepara_trem` | `constructor` | R | — | pendente |
| Classe | `num_muda` | `static` | R | — | pendente |
| Classe | `a_raiz` | `super` | R | — | pendente |
| Classe | `ocê` | `this` | R | `oce` | pendente |
| Classe | `faz_um` | `new` | R | — | pendente |
| Classe | `é_tipo_de` | `instanceof` | R | `e_tipo_de` | pendente |
| Erro | `tenta_aí` | `try` | R | `tenta_ai` | pendente |
| Erro | `se_der_ruim` | `catch` | R | — | pendente |
| Erro | `por_fim` | `finally` | R | — | pendente |
| Erro | `vixe` | `throw` ou `throw new Error(…)` (instrução, §4.8) | R | — | pendente |
| Literal | `certeza` | `true` | R | — | pendente |
| Literal | `de_jeito_nenhum` | `false` | R | — | pendente |
| Literal | `nada` | `null` | R | — | pendente |
| Literal | `indefinido` | `undefined` | R | — | pendente |
| Operador | `é_igualim` | `===` | R | `e_igualim` | pendente |
| Operador | `diferente` | `!==` | R | — | pendente |
| Operador | `maior_que` | `>` | R | — | pendente |
| Operador | `menor_que` | `<` | R | — | pendente |
| Operador | `pelo_menos` | `>=` | R | — | pendente |
| Operador | `no_máximo` | `<=` | R | `no_maximo` | pendente |
| Operador | `e_mais` | `&&` | R | — | pendente |
| Operador | `ou_então` | `\|\|` | R | `ou_entao` | pendente |
| Operador | `num_é` | `!` | R | `num_e` | pendente |
| Operador | `mais` | `+` | R | — | pendente |
| Operador | `menos` | `-` (binário e unário) | R | — | pendente |
| Operador | `vezes` | `*` | R | — | pendente |
| Operador | `dividido` | `/` | R | — | pendente |
| Operador | `sobrou` | `%` | R | — | pendente |

## 3. Alfabeto de identificadores (P5)

`A–Z`, `a–z`, letras acentuadas do português em NFC, `0–9` e `_`; fora disso é GS0104. Ampliar só por RFC.

## 4. Decisões de gramática (§4.7)

A gramática normativa é `docs/spec/gramatica.md` (ids `Gnn` estáveis). As decisões abaixo ficam congeladas com a
aprovação desta RFC.

| Construção | Decisão | Decisão do dono |
| --- | --- | --- |
| Corpo de `se_ocê_quiser`, `se_num_for`, `se_não`, `vai_indo`, `enquanto_tiver`, `tenta_aí`, `se_der_ruim`, `por_fim`, função, método e classe | Sempre entre `{ }` (P7). Corpo sem chaves é GS0207, com a correção "bota as chaves". Única exceção: corpo-expressão de seta (`x => x vezes 2`). A trava de laço do playground insere o contador logo depois da `{` do corpo, na mesma linha (§5.7). | pendente |
| `se_num_for`, `se_não`, `se_der_ruim`, `por_fim` | Continuam a instrução anterior, na linha do `}` ou na seguinte (§4.6). | pendente |
| Função como valor | Só seta (`=>`) (P6): `faz_trem` sem nome fica fora. Corpo de seta com `{` é bloco; para devolver uma coisa direto, use parênteses: `x => ({ nome: x })`. Quando a primeira instrução desse bloco tem a forma `nome: valor`, o diagnóstico de rótulo acrescenta a dica dos parênteses. | pendente |
| Assíncrono | `vai_na_frente` vale antes de `faz_trem` nomeada, de seta (`vai_na_frente x => …`, `vai_na_frente (a, b) => {…}`) (P6) e de método de classe (`vai_na_frente busca() {…}`). `espera_um_cadim` e `pergunta` valem dentro de qualquer um deles. | pendente |
| Vírgula final | Aceita em lista, coisa, parâmetros e argumentos (`[1, 2,]`, `{ a: 1, }`). Passa para o JS sem edição. | pendente |
| Coisa (objeto literal) | Só `chave: valor`, com chave identificador (palavra do JS não serve, P2), texto ou número. | pendente |
| `tenta_aí` | Exige `se_der_ruim` ou `por_fim` (um dos dois ou ambos); sozinho é erro de sintaxe (GS0202). `se_der_ruim {…}` sem parâmetro é aceito. | pendente |
| `uai` sem valor inicial | GS0307, porque `const x;` não é JS válido. `trem x` sem valor inicial é aceito e vale `indefinido`. | pendente |
| `ocê` | Aceito em construtor, método e `faz_trem`; a seta usa o `ocê` de fora. Fora de qualquer função, método ou construtor é aviso pedagógico (`ocê` vale `indefinido` no alvo `module`; nos alvos que não são módulo ES vale o objeto global do contexto, §5.7; código fixado na RFC-0001). | pendente |
| `a_raiz` | `a_raiz(args)` só no `aprepara_trem` de classe que herda, antes de qualquer uso de `ocê`; `a_raiz.metodo(args)` em método ou construtor de classe que herda. Qualquer outro uso é GS0311. | pendente |

Propostas já aprovadas pelo dono no spec (D10); entram aqui só para registro.

| Id | Proposta | Situação |
| --- | --- | --- |
| P1 | Mundo fechado também para membros: `x.nome` só vale se `nome` foi declarado no arquivo ou é da biblioteca; membro nativo do JS dá erro (`lista.some` → GS0406) | aprovada no spec |
| P2 | Palavra do JavaScript (§4.4) não serve de nome em posição nenhuma, inclusive propriedade (`{ new: 1 }`, `obj.public`) | aprovada no spec |
| P3 | Reserva de membro da biblioteca por forma: propriedade (`.tamanho`, `.mensagem`) reservada sempre; método só como membro chamável; campo de dado livre (`{ ano: 2026 }`); membro de `Conta`/`Coisa` não reserva | aprovada no spec |
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
| Saída | `prosa(…)` ✅ | `console.log` | nativa | dono | herdado | herdado | herdado | pendente |
| Saída | `reclama(…)` (1.5) | `console.error` | nativa | 1.5 | herdado | herdado | herdado | pendente |
| Saída | `avisa(…)` | `console.warn` | nativa | proposta | imperativo | sim | sim | pendente |
| Entrada | `pergunta(texto)` | — | didática (§4.10) | proposta | imperativo | sim | sim | pendente |
| Texto | `.gritando()` ✅ | `.toUpperCase()` | nativa | dono | herdado | herdado | herdado | pendente |
| Texto | `.cochichando()` ✅ | `.toLowerCase()` | nativa | dono | herdado | herdado | herdado | pendente |
| Texto/lista | `.tem_no_meio(x)` ✅ | `.includes(x)` | nativa | dono | herdado | herdado | herdado | pendente |
| Texto | `.trocar(a, b)` ✅ | `.replaceAll(a, b)` | nativa: troca todas as ocorrências (a 1.5 tratava `a` como regex); `a` é texto literal; em `b`, `$$`, `$&`, `` $` `` e `$'` valem como no JavaScript (`"x".trocar("x", "US$$")` devolve `"US$"`, aviso GS0808) (P16) | dono | herdado | herdado | herdado | pendente |
| Texto | `.dividir(sep)` ✅ | `.split(sep)` | nativa | dono | herdado | herdado | herdado | pendente |
| Texto | `.tira_os_espaço()` | `.trim()` | nativa | proposta | imperativo | sim | sim | pendente |
| Texto | `.começa_com(x)` | `.startsWith(x)` | nativa | proposta | imperativo | sim | sim | pendente |
| Texto | `.termina_com(x)` | `.endsWith(x)` | nativa | proposta | imperativo | sim | sim | pendente |
| Texto/lista | `.pedaço(i, f)` | `.slice(i, f)` | nativa | proposta | substantivo | sim | sim | pendente |
| Texto/lista | `.onde_tá(x)` | `.indexOf(x)` | nativa | proposta | substantivo | sim | sim | pendente |
| Texto/lista | `.tamanho` | `.length` | nativa (propriedade, sem parênteses; na 1.5 era `.tamanho()`; conta unidades UTF-16) | proposta | substantivo | sim | sim | pendente |
| Texto | `.repete(n)` | `.repeat(n)` | nativa | proposta | imperativo | sim | sim | pendente |
| Lista | `.bota_no_final(x)` ✅ | `.push(x)` | nativa | dono | herdado | herdado | herdado | pendente |
| Lista | `.arranca_o_rabo()` ✅ | `.pop()` | nativa | dono | herdado | herdado | herdado | pendente |
| Lista | `.bota_no_começo(x)` | `.unshift(x)` | nativa | proposta | imperativo | sim | sim | pendente |
| Lista | `.arranca_a_cabeça()` | `.shift()` | nativa | proposta | imperativo | sim | sim | pendente |
| Lista | `.mapear(f)` ✅ | `.map(f)` | nativa | dono | herdado | herdado | herdado | pendente |
| Lista | `.filtrar(f)` ✅ | `.filter(f)` | nativa | dono | herdado | herdado | herdado | pendente |
| Lista | `.amontoar(f, inicial)` | `.reduce(f, inicial)` | nativa; `inicial` obrigatório (evita o `NaN` da 1.5) | proposta | infinitivo | sim | sim | pendente |
| Lista | `.pra_cada(f)` | `.forEach(f)` | nativa | proposta | substantivo | sim | não | pendente |
| Lista | `.caça(f)` | `.find(f)` | nativa | proposta | imperativo | sim | sim | pendente |
| Lista | `.juntar(sep)` | `.join(sep)` | nativa | proposta | infinitivo | sim | sim | pendente |
| Lista | `.emenda(outra)` | `.concat(outra)` | nativa | proposta | imperativo | sim | sim | pendente |
| Lista | `.de_trás_pra_frente()` | `.toReversed()` | nativa, sem mutar (ES2023) | proposta | substantivo | sim | sim | pendente |
| Lista | `.ordenar()` | `.toSorted($gs_ordem)` | **didática**, sem argumentos e sem mutar (ES2023). Ordem total e estável: números por valor (`NaN` por último), depois textos por `localeCompare('pt-BR')`, depois o resto (`nada`, `indefinido`, `certeza`, `de_jeito_nenhum`, lista, coisa) na ordem em que estava. `.ordenar(f)` é GS0604, com ajuda própria (P9) | proposta | infinitivo | sim | sim | pendente |
| Coisa | `Coisa.chaves(c)` | `Object.keys(c)` | nativa | proposta | substantivo | sim | sim | pendente |
| Coisa | `Coisa.valores(c)` | `Object.values(c)` | nativa | proposta | substantivo | sim | sim | pendente |
| Coisa | `Coisa.entradas(c)` | `Object.entries(c)` | nativa | proposta | substantivo | sim | sim | pendente |
| Coisa | `Coisa.tem(c, k)` | `Object.hasOwn(c, k)` | nativa | proposta | substantivo | sim | sim | pendente |
| Coisa | `Coisa.mistura(a, b)` | `Object.assign({}, a, b)` | nativa (macro: insere `{}` como primeiro argumento), sem mutar | proposta | imperativo | sim | sim | pendente |
| Conta | `Conta.sorteia_um(min, max)` ✅ | — | **didática**: inteiro aleatório em `[min, max]` (o ✅ vale só para o nome; a semântica é nova) | dono | herdado | herdado | herdado | pendente |
| Conta | `Conta.arredondar(x)` ✅ | `Math.round(x)` | nativa; o meio sobe (`Conta.arredondar(-2.5)` é -2) (P15) | dono | herdado | herdado | herdado | pendente |
| Conta | `Conta.arredondar_pra_baixo(x)` | `Math.floor(x)` | nativa (P15) | proposta | infinitivo | sim | sim | pendente |
| Conta | `Conta.arredondar_pra_cima(x)` | `Math.ceil(x)` | nativa (P15) | proposta | infinitivo | sim | sim | pendente |
| Conta | `Conta.maior(…)` ✅ | `Math.max(…)` | nativa; recebe os números separados, não uma lista | dono | herdado | herdado | herdado | pendente |
| Conta | `Conta.menor(…)` | `Math.min(…)` | nativa; recebe os números separados, não uma lista | proposta | substantivo | sim | sim | pendente |
| Conta | `Conta.sem_sinal(x)` | `Math.abs(x)` | nativa | proposta | substantivo | não | não | pendente |
| Conta | `Conta.raiz_quadrada(x)` | `Math.sqrt(x)` | nativa | proposta | substantivo | sim | sim | pendente |
| Conta | `Conta.elevado(b, e)` | `Math.pow(b, e)` | nativa | proposta | substantivo | sim | sim | pendente |
| Conta | `Conta.PI` | `Math.PI` | nativa (propriedade) | proposta | substantivo | sim | sim | pendente |
| Conta | `Conta.E` | `Math.E` | nativa (propriedade) | proposta | substantivo | sim | sim | pendente |
| Número | `vira_número(t)` | — | **didática**: ignora espaços nas pontas e aceita vírgula decimal (`"1,5"` vira 1.5); texto que não é número e texto vazio dão `NaN` (o `Number("")` nativo dá 0) (P11) | proposta | imperativo | sim | sim | pendente |
| Número | `é_número(x)` | `typeof x === "number" && !Number.isNaN(x)` | **didática** (ajudante, avalia `x` uma vez): `certeza` só para número de verdade; `"12"` e o `NaN` de `vira_número("abc")` dão `de_jeito_nenhum`, então converta antes com `vira_número` (P11) | proposta | substantivo | sim | sim | pendente |
| Número | `.com_casas(n)` | `.toFixed(n)` | nativa; ponto decimal; arredonda o valor binário (`(1.005).com_casas(2)` é `"1.00"`) | proposta | substantivo | sim | sim | pendente |
| Texto | `vira_texto(x)` | `String(x)` | nativa | proposta | imperativo | sim | sim | pendente |
| Tempo | `daqui_a_pouco(f, ms)` | `setTimeout(f, ms)` | nativa | proposta | substantivo | sim | sim | pendente |
| Tempo | `toda_hora(f, ms)` | `setInterval(f, ms)` | nativa | proposta | substantivo | sim | sim | pendente |
| Tempo | `deixa_pra_lá(id)` | `clearTimeout(id)` / `clearInterval(id)` | nativa | proposta | imperativo | sim | sim | pendente |
| Tempo | `cochila(ms)` | — | **didática**: promessa que resolve depois de `ms` | proposta | imperativo | sim | sim | pendente |
| Promessa | `faz_um promessa(f)` (1.5) | `new Promise(f)` | nativa | 1.5 | herdado | herdado | herdado | pendente |
| Promessa | `.quando_resolver(f)` (1.5) | `.then(f)` | nativa | 1.5 | herdado | herdado | herdado | pendente |
| Promessa | `.se_der_pobrema(f)` (1.5) | `.catch(f)` | nativa | 1.5 | herdado | herdado | herdado | pendente |
| Erro | `faz_um Erro(msg)` | `new Error(msg)` | nativa | proposta | substantivo | sim | sim | pendente |
| Erro | `.mensagem` | `.message` (via `$gs_mensagem`) | **didática** (ajudante, só leitura): erro do motor (`TypeError`, `ReferenceError`, `RangeError`) devolve a frase em português do catálogo GS07xx; erro do programa (`vixe`, `faz_um Erro(msg)`) devolve `msg` intacta (P10) | proposta | substantivo | sim | sim | pendente |
| Data | `faz_um Data()` e `.ano() .dia() .hora() .minuto() .segundo()` | `new Date()` e getters | nativa | proposta | substantivo | sim | sim | pendente |
| Data | `.mês()` | `.getMonth() + 1` | **didática** (macro, 0 bytes): devolve 1–12; emitido como `(x.getMonth() + 1)` | proposta | substantivo | sim | sim | pendente |

Origem `dono` é a grafia idêntica à do `CLAUDE.md` da 1.5 (✅ no spec); `1.5` é nome da tabela de 53 entradas da 1.5;
`proposta` é nome novo. Nas linhas `dono` e `1.5` as colunas de forma verbal e de prosa ficam `herdado`: o nome já existe e não
é reexaminado, salvo se o dono pedir. Nas linhas `proposta`, as respostas são do autor do rascunho e valem como ponto de
partida: o parecer dos falantes de Goiás (anexo F) pode mudá-las, e a decisão é do dono.

**Notas do teste da prosa.** Forma verbal marcada `substantivo` inclui locuções (`pra_cada`, `daqui_a_pouco`,
`de_trás_pra_frente`, `com_casas`) e predicados (`onde_tá`, `é_número`, `Coisa.tem`), que não cabem nas três formas
verbais; é a forma mais próxima.

- `Conta.sem_sinal`: (a) `não` e (b) `não`. É calco de *unsigned*; ninguém diz "sem sinal" para o valor absoluto numa
  prosa. Alternativas no anexo E.
- `.pra_cada`: (b) `não`. É a tradução literal de *forEach*, embora "pra cada" seja uma locução comum; fica para o dono
  e para os falantes decidirem se basta.
- `.amontoar`: (a) e (b) `sim` como metáfora, mas "amontoar" não é "reduzir"; o parecer dos falantes diz se o sentido
  chega ao aluno (alternativa `.reduzir` no anexo E).
- `Coisa.entradas`, `Coisa.chaves`, `Coisa.valores`: `sim` por serem palavras comuns; `entradas` acompanha *entries*.
- `Erro`, `Data`, `.mensagem`, `.tamanho`: português neutro, sem expressão goiana natural (spec §4.9); colisão com
  nomes de domínio tratada em P3 e P4.

## 6. Propostas para decisão do dono

| # | Proposta | Alternativa se recusada | Decisão do dono |
| --- | --- | --- | --- |
| P8 | `vixe` é instrução; `vixe(erro)` com o parâmetro do `se_der_ruim` relança o mesmo erro | `vixe` sempre embrulha em `Error` | pendente |
| P9 | `.ordenar()` sem comparador, ordem total e estável (números, depois textos pt-BR, depois o resto) | `.ordenar(comparador?)` | pendente |
| P10 | `.mensagem` didática: erro do motor chega em português do catálogo GS07xx | `.mensagem` nativa (texto do motor, em inglês) | pendente |
| P11 | `vira_número` didática (aceita vírgula decimal; texto vazio dá `NaN`) e `é_número(x)` no lugar de `num_é_número` | `vira_número` = `Number`; `num_é_número` = `Number.isNaN` | pendente |
| P12 | Números à brasileira: `1.000.000` é erro léxico; `10,50` onde a vírgula não cabe é erro com a correção; `1.000,50` em argumentos é aviso | Sem diagnóstico específico | pendente |
| P13 | Palavras aposentadas (1.0/1.5/CLAUDE.md antigo) não são reservadas; só melhoram a mensagem de erro (GS0306) | Reservar as palavras aposentadas | pendente |
| P15 | `Conta.arredondar` na grafia do dono, com `arredondar_pra_baixo`/`arredondar_pra_cima`; `Conta` × `GoianoMath` decidido na RFC-0001 | `Conta.arredonda` | pendente |
| P16 | `.trocar` mantém o `$` especial do JavaScript no texto de substituição, com aviso GS0808 | Substituição 100% literal via ajudante | pendente |

## 7. Anexos

### Anexo A. De-para 1.5 → v3

| JavaScript | Nome no CLAUDE.md | Nome no runtime 1.5 | Nome na v3 | Semântica | Decisão do dono |
|---|---|---|---|---|---|
| `replace` | `.trocar()` | `trocar` | `.trocar(a, b)` | troca todas as ocorrências; a 1.5 tratava a como regex (P16 para o $) | pendente |
| `split` | `.dividir()` | `dividir` | `.dividir(sep)` | igual ao nativo | pendente |
| `join` | — | `juntar` | `.juntar(sep)` | igual ao nativo | pendente |
| `toUpperCase` | `.gritando()` | `pra_maiusculo` | `.gritando()` | igual ao nativo | pendente |
| `toLowerCase` | `.cochichando()` | `pra_minusculo` | `.cochichando()` | igual ao nativo | pendente |
| `trim` | — | `aparar` | `.tira_os_espaço()` | igual ao nativo | pendente |
| `includes` | `.tem_no_meio()` | `contem` | `.tem_no_meio(x)` | igual ao nativo, texto e lista | pendente |
| `indexOf` | — | `posicao_de` | `.onde_tá(x)` | igual ao nativo | pendente |
| `substring` | — | `pedaco` | `.pedaço(i, f)` | vira slice; índice negativo conta do fim | pendente |
| `slice` | — | `fatiar` | `.pedaço(i, f)` | igual ao nativo | pendente |
| `charAt` | — | `letra_em` | sem equivalente na v3 | use texto[i] | pendente |
| `length` | — | `tamanho` | `.tamanho` | propriedade, sem parênteses; na 1.5 era .tamanho() | pendente |
| `startsWith` | — | `comeca_com` | `.começa_com(x)` | igual ao nativo | pendente |
| `endsWith` | — | `termina_com` | `.termina_com(x)` | igual ao nativo | pendente |
| `map` | `.mapear()` | `mapear` | `.mapear(f)` | igual ao nativo | pendente |
| `filter` | `.filtrar()` | `filtrar` | `.filtrar(f)` | igual ao nativo | pendente |
| `reduce` | — | `reduzir` | `.amontoar(f, inicial)` | inicial obrigatório; alternativa de nome no anexo E | pendente |
| `forEach` | — | `pra_cada` | `.pra_cada(f)` | igual ao nativo | pendente |
| `push` | `.bota_no_final()` | `empurrar` | `.bota_no_final(x)` | igual ao nativo | pendente |
| `pop` | `.arranca_o_rabo()` | `tirar_ultimo` | `.arranca_o_rabo()` | igual ao nativo | pendente |
| `shift` | — | `tirar_primeiro` | `.arranca_a_cabeça()` | igual ao nativo | pendente |
| `unshift` | — | `por_primeiro` | `.bota_no_começo(x)` | igual ao nativo | pendente |
| `sort` | — | `ordenar` | `.ordenar()` | sem comparador, ordem total e sem mutar (P9); a 1.5 mutava | pendente |
| `reverse` | — | `inverter` | `.de_trás_pra_frente()` | sem mutar (toReversed) | pendente |
| `find` | — | `achar` | `.caça(f)` | igual ao nativo; alternativa de nome no anexo E | pendente |
| `concat` | — | `juntar_lista` | `.emenda(outra)` | igual ao nativo; alternativa de nome no anexo E | pendente |
| `splice` | — | `emendar` | sem equivalente na v3 | lacuna (e) do anexo D | pendente |
| `keys` | — | `chaves` | `Coisa.chaves(c)` | igual ao nativo | pendente |
| `values` | — | `valores` | `Coisa.valores(c)` | igual ao nativo | pendente |
| `entries` | — | `entradas` | `Coisa.entradas(c)` | igual ao nativo | pendente |
| `hasOwnProperty` | — | `tem_propriedade` | `Coisa.tem(c, k)` | Object.hasOwn | pendente |
| `assign` | — | `misturar` | `Coisa.mistura(a, b)` | não muta o primeiro argumento | pendente |
| `Math.random` | `sorteia_um()` | `sorteio` | `Conta.sorteia_um(min, max)` | inteiro em [min, max] | pendente |
| `Math.floor` | — | `arredondar_baixo` | `Conta.arredondar_pra_baixo(x)` | igual ao nativo (P15) | pendente |
| `Math.ceil` | — | `arredondar_cima` | `Conta.arredondar_pra_cima(x)` | igual ao nativo (P15) | pendente |
| `Math.round` | `arredondar()` | `arredondar` | `Conta.arredondar(x)` | o meio sobe (P15) | pendente |
| `Math.max` | `maior()` | `maior` | `Conta.maior(…)` | números separados, não lista | pendente |
| `Math.min` | — | `menor` | `Conta.menor(…)` | números separados, não lista | pendente |
| `Math.abs` | — | `absoluto` | `Conta.sem_sinal(x)` | igual ao nativo; alternativa de nome no anexo E | pendente |
| `Math.sqrt` | — | `raiz_quadrada` | `Conta.raiz_quadrada(x)` | igual ao nativo | pendente |
| `Math.pow` | — | `potencia` | `Conta.elevado(b, e)` | igual ao nativo; alternativa de nome no anexo E | pendente |
| `getFullYear` | — | `pegar_ano` | `.ano()` | getter da Data | pendente |
| `getMonth` | — | `pegar_mes` | `.mês()` | 1 a 12 (getMonth + 1) | pendente |
| `getDate` | — | `pegar_dia` | `.dia()` | getter da Data | pendente |
| `getHours` | — | `pegar_horas` | `.hora()` | getter da Data | pendente |
| `getMinutes` | — | `pegar_minutos` | `.minuto()` | getter da Data | pendente |
| `getSeconds` | — | `pegar_segundos` | `.segundo()` | getter da Data | pendente |
| `console.log` | `prosa()` | `prosa` | `prosa(…)` | igual ao nativo | pendente |
| `console.error` | — | `prosa_erro` | `reclama(…)` | igual ao nativo | pendente |
| `console.warn` | — | `prosa_aviso` | `avisa(…)` | igual ao nativo | pendente |
| `parseInt` | — | `vira_numero` | `vira_número(t)` | didática (P11); aceita vírgula decimal | pendente |
| `parseFloat` | — | `vira_decimal` | `vira_número(t)` | didática (P11); um só nome para inteiro e decimal | pendente |
| `isNaN` | — | `eh_nao_numero` | `é_número(x)` | didática (P11); sentido invertido: certeza só para número de verdade | pendente |
| `setTimeout` | — | `depois_de` | `daqui_a_pouco(f, ms)` | igual ao nativo | pendente |
| `setInterval` | — | `repetir_a_cada` | `toda_hora(f, ms)` | igual ao nativo | pendente |
| `clearTimeout` | — | `cancelar_depois` | `deixa_pra_lá(id)` | igual ao nativo | pendente |
| `clearInterval` | — | `cancelar_repeticao` | `deixa_pra_lá(id)` | igual ao nativo | pendente |
| `Math (namespace)` | `GoianoMath` | — | `Conta` | namespace; a 1.5 documentava GoianoMath e o runtime usa Math.x | pendente |

### Anexo B. Palavras aposentadas (`retiredWords`, P13)

| Aposentada | Forma na v3 | Decisão do dono |
| --- | --- | --- |
| `presta_serviço` / `vai_na_frente_presta_serviço` | `faz_trem` / `vai_na_frente_faz_trem` | pendente |
| `mexe_assim nome(…)` | `nome(…) {…}` (método de classe não leva palavra; o construtor é `aprepara_trem`) | pendente |
| `vixe_que(msg)` | `vixe(msg)` | pendente |
| `vazio` / `sei_lá` | `nada` / `indefinido` | pendente |
| `se` / `senao` / `fazer` | `se_ocê_quiser` / `se_não` / `faz_trem` (documentadas na 1.5, nunca implementadas) | pendente |
| `é_igual_a` | `é_igualim` | pendente |
| `um_tanto_de`, `ninguem_fuça`, `só_da_famia`, `todo_mundo_vê` | sem equivalente: saíram da linguagem | pendente |

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
| a1 | coisa para texto | `JSON.stringify` | `Coisa.vira_texto(c)` | GS0403; monte o texto com `mais` | pendente |
| a2 | texto para coisa | `JSON.parse` | `Coisa.vira_coisa(t)` | GS0403; sem alternativa pequena | pendente |
| a3 | `vira_texto(lista)` e `vira_texto(coisa)` devolvem o texto JSON em vez de `[object Object]` | `String(x)` | mesmo nome, semântica didática | manter `String(x)`; o aluno vê `[object Object]` | pendente |
| b | esperar várias promessas | `Promise.all` | `promessa.todas(lista)` | GS0403; `espera_um_cadim` uma por vez | pendente |
| c | algum elemento passa no teste | `.some` | `.tem_algum(f)` | GS0406; `vai_indo` com `para_com_isso` | pendente |
| d | todos os elementos passam no teste | `.every` | `.todos(f)` | GS0406; `vai_indo` com `para_com_isso` | pendente |
| e | tirar ou trocar elementos no meio | `.splice` | `.tira_do_meio(i, n)` | GS0406; `.pedaço` com `.emenda` | pendente |
| f | posição do primeiro que passa no teste | `.findIndex` | `.onde_tá_o(f)` | GS0406; `vai_indo` com contador | pendente |
| g | instante atual em milissegundos | `Date.now` | `Data.agora()` | GS0403; `faz_um Data()` com `.hora()` e `.minuto()` | pendente |
| h1 | data como texto ISO, usada pelos exemplos do núcleo | `.toISOString` | sem candidato | GS0406; montar com `.ano()`, `.mês()` e `.dia()` | pendente |
| h2 | chamar função com outro `ocê`, usada num exemplo de classes | `.call` | sem candidato | GS0406; repensar o exemplo | pendente |

As linhas `h` vêm de passar os exemplos de `packages/core/examples` e dos modelos de projeto pelo mundo fechado
(`.toISOString` em `faz_um Date().toISOString()`, `.call` num método redefinido); os exemplos usam também
`JSON.stringify` e `Promise.all`, que já são as linhas a1 e b. O `demo` do vídeo não está no repositório e ainda não
passou pela mesma conferência.

### Anexo E. Alternativas de nome

O dono decide nome a nome. A coluna "Atual" é a proposta da §5.

| Item | Atual | Alternativa | Motivo | Decisão do dono |
|---|---|---|---|---|
| e1 | `Conta.sem_sinal` | `Conta.tira_o_sinal` | a 1.5 tinha `absoluto`; `sem_sinal` é calco de *unsigned* | pendente |
| e2 | `.caça` | `.acha` | a 1.5 tinha `achar` | pendente |
| e3 | `.emenda` | `.junta_com(outra)` | a 1.5 tinha `emendar`, que era `splice` | pendente |
| e4 | `Conta.elevado` | `Conta.elevado_a` | lê melhor com dois argumentos | pendente |
| e5 | `Conta.arredondar` | `Conta.arredonda` | P15 | pendente |
| e6 | `faz_um promessa` | `faz_um Promessa` | igual a `Erro` e `Data` | pendente |
| e7 | `Conta` | `GoianoMath` | o dono escreveu `GoianoMath`; `Conta` e `Data` colidem com classes didáticas comuns (conta bancária, data) e o aluno que as declara recebe o aviso GS0804 | pendente |
| e8 | `.amontoar` | `.reduzir` | o neutro da 1.5 continua válido | pendente |
| e9 | `Conta.sem_sinal` | `absoluto` | o neutro da 1.5 continua válido | pendente |

Nomes de domínio com risco de colisão para a revisão da §4.9: `tamanho`, `mensagem`, `ano`, `mês`, `dia`, `hora`,
`minuto`, `segundo`, `repete`, `caça` e `juntar`; `.tamanho` e `.mensagem` são os mais propensos. Cada um fica com a
justificativa registrada ou ganha outra forma, a critério do dono.

### Anexo F. Parecer dos falantes de Goiás

Parecer consultivo de 2 a 3 falantes de Goiás sobre o teste da prosa das linhas `proposta` da §5. Ainda não recolhido.

| Falante | Cidade | Nome avaliado | Diria numa prosa? | Observação |
|---|---|---|---|---|
| pendente | pendente | pendente | pendente | pendente |

## 8. Notas de migração

Para quem vem da 1.5:

- `.tamanho()` vira `.tamanho` (propriedade); chamar com parênteses é GS0603 com a correção.
- `trem` passa a ser `let` (D5); na 1.5 era `var`.
- `.trocar` troca todas as ocorrências e trata o primeiro argumento como texto, não como regex.
- `.ordenar()` não aceita comparador e não muta a lista (P9); `.inverter` e `Coisa.mistura` também não mutam.
- `.reduzir` vira `.amontoar(f, inicial)` e o valor inicial é obrigatório, o que acaba com o `NaN` da 1.5.
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
| Propostas P8–P13, P15 e P16 | pendente |
| Biblioteca padrão, nome a nome | pendente |
| Lacunas (anexo D) e alternativas (anexo E) | pendente |
| Parecer dos falantes de Goiás (anexo F) | pendente |
| Status da RFC | pendente |
