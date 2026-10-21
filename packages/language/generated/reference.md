# Referência do vocabulário

## Palavras-chave

| GoiásScript | JavaScript | Classe | Categoria |
|---|---|---|---|
| `é` | `=` | reserved | assignment |
| `a_raiz` | `super` | reserved | class |
| `aprepara_trem` | `constructor` | reserved | class |
| `arruma_trem` | `class` | reserved | class |
| `faz_um` | `new` | reserved | class |
| `inherda_de` | `extends` | reserved | class |
| `num_muda` | `static` | reserved | class |
| `ocê` | `this` | reserved | class |
| `é_tipo_de` | `instanceof` | reserved | class |
| `continua_aí` | `continue` | reserved | control |
| `de` | `of` | contextual | control |
| `em` | `in` | contextual | control |
| `enquanto_tiver` | `while` | reserved | control |
| `para_com_isso` | `break` | reserved | control |
| `se_num_for` | `else if` | reserved | control |
| `se_não` | `else` | reserved | control |
| `se_ocê_quiser` | `if` | reserved | control |
| `vai_indo` | `for` | reserved | control |
| `trem` | `let` | reserved | declaration |
| `uai` | `const` | reserved | declaration |
| `por_fim` | `finally` | reserved | error |
| `se_der_ruim` | `catch` | reserved | error |
| `tenta_aí` | `try` | reserved | error |
| `vixe` | `throw` | reserved | error |
| `espera_um_cadim` | `await` | reserved | function |
| `faz_favor` | `return` | reserved | function |
| `faz_trem` | `function` | reserved | function |
| `vai_na_frente` | `async` | reserved | function |
| `vai_na_frente_faz_trem` | `async function` | reserved | function |
| `certeza` | `true` | reserved | literal |
| `de_jeito_nenhum` | `false` | reserved | literal |
| `indefinido` | `undefined` | reserved | literal |
| `nada` | `null` | reserved | literal |
| `diferente` | `!==` | reserved | operator |
| `dividido` | `/` | reserved | operator |
| `e_mais` | `&&` | reserved | operator |
| `maior_que` | `>` | reserved | operator |
| `mais` | `+` | reserved | operator |
| `menor_que` | `<` | reserved | operator |
| `menos` | `-` | reserved | operator |
| `no_máximo` | `<=` | reserved | operator |
| `num_é` | `!` | reserved | operator |
| `ou_então` | `||` | reserved | operator |
| `pelo_menos` | `>=` | reserved | operator |
| `sobrou` | `%` | reserved | operator |
| `vezes` | `*` | reserved | operator |
| `é_igualim` | `===` | reserved | operator |

## Biblioteca

| Nome | Receptor | Forma | JS | Semântica |
|---|---|---|---|---|
| `ano` | date | method | `getFullYear` | native |
| `dia` | date | method | `getDate` | native |
| `hora` | date | method | `getHours` | native |
| `minuto` | date | method | `getMinutes` | native |
| `mês` | date | method | `getMonth` | didactic |
| `segundo` | date | method | `getSeconds` | native |
| `mensagem` | error | property | `message` | didactic |
| `Coisa` | global | global | `Object` | native |
| `Conta` | global | global | `Math` | native |
| `Data` | global | global | `Date` | native |
| `Erro` | global | global | `Error` | native |
| `Promessa` | global | global | `Promise` | native |
| `avisa` | global | global | `console.warn` | native |
| `cochila` | global | helper | `$gs_cochila` | didactic |
| `daqui_um_cadim` | global | global | `setTimeout` | native |
| `larga_mão` | global | global | `clearTimeout` | native |
| `pergunta` | global | helper | `$gs_pergunta` | didactic |
| `prosa` | global | global | `console.log` | native |
| `reclama` | global | global | `console.error` | native |
| `toda_hora` | global | global | `setInterval` | native |
| `vira_número` | global | helper | `$gs_vira_numero` | didactic |
| `vira_texto` | global | helper | `$gs_vira_texto` | didactic |
| `é_número` | global | helper | `$gs_e_numero` | didactic |
| `ajunta` | list | method | `join` | native |
| `amontoar` | list | method | `reduce` | native |
| `arruma` | list | method | `toSorted` | didactic |
| `bota_no_começo` | list | method | `unshift` | native |
| `bota_no_final` | list | method | `push` | native |
| `cata` | list | method | `find` | native |
| `de_trás_pra_frente` | list | method | `toReversed` | native |
| `emenda` | list | method | `concat` | native |
| `filtrar` | list | method | `filter` | native |
| `mapear` | list | method | `map` | native |
| `onde_tá_o` | list | method | `findIndex` | native |
| `pra_cada` | list | method | `forEach` | native |
| `ranca_a_cabeça` | list | method | `shift` | native |
| `ranca_do_meio` | list | method | `splice` | native |
| `ranca_o_rabo` | list | method | `pop` | native |
| `tem_algum` | list | method | `some` | native |
| `todin` | list | method | `every` | native |
| `Coisa.chaves` | namespace | method | `Object.keys` | native |
| `Coisa.entradas` | namespace | method | `Object.entries` | native |
| `Coisa.mistura` | namespace | method | `Object.assign` | native |
| `Coisa.tem` | namespace | method | `Object.hasOwn` | native |
| `Coisa.valores` | namespace | method | `Object.values` | native |
| `Coisa.vira_coisa` | namespace | method | `JSON.parse` | native |
| `Coisa.vira_texto` | namespace | method | `JSON.stringify` | native |
| `Conta.E` | namespace | property | `Math.E` | native |
| `Conta.PI` | namespace | property | `Math.PI` | native |
| `Conta.arredondar` | namespace | method | `Math.round` | native |
| `Conta.arredondar_pra_baixo` | namespace | method | `Math.floor` | native |
| `Conta.arredondar_pra_cima` | namespace | method | `Math.ceil` | native |
| `Conta.elevado_a` | namespace | method | `Math.pow` | native |
| `Conta.maior` | namespace | method | `Math.max` | native |
| `Conta.menor` | namespace | method | `Math.min` | native |
| `Conta.raiz_quadrada` | namespace | method | `Math.sqrt` | native |
| `Conta.ranca_o_sinal` | namespace | method | `Math.abs` | native |
| `Conta.sorteia_um` | namespace | method | `$gs_sorteia_um` | didactic |
| `Data.agorinha` | namespace | method | `Date.now` | native |
| `Promessa.tudim_junto` | namespace | method | `Promise.all` | native |
| `com_casas` | number | method | `toFixed` | native |
| `quando_der_bão` | promise | method | `then` | native |
| `se_der_ruim` | promise | method | `catch` | native |
| `cochichando` | text | method | `toLowerCase` | native |
| `começa_com` | text | method | `startsWith` | native |
| `dividir` | text | method | `split` | native |
| `gritando` | text | method | `toUpperCase` | native |
| `ranca_os_espaço` | text | method | `trim` | native |
| `repete` | text | method | `repeat` | native |
| `termina_com` | text | method | `endsWith` | native |
| `trocar` | text | method | `replaceAll` | didactic |
| `naco` | textOrList | method | `slice` | native |
| `o_tanto` | textOrList | property | `length` | native |
| `onde_tá` | textOrList | method | `indexOf` | native |
| `tem_no_meio` | textOrList | method | `includes` | native |
