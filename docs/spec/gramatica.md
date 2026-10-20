# Gramática do GoiásScript 3 (EBNF)

Esta gramática é uma lista de permissão: só é aceito o que está aqui. Toda outra construção do JavaScript que seja
código válido é `GS0500`; texto que não é JavaScript válido continua sendo erro de sintaxe `GS02xx`. Os ids `Gnn` são
estáveis: um id nunca é reaproveitado, e uma produção removida deixa o número vago. Esta gramática congela junto com a
RFC-0001.

Convenções: texto entre aspas é palavra da linguagem; `{ x }` repete zero ou mais vezes; `[ x ]` é opcional;
`( a | b )` agrupa alternativas. As variantes sem acento (`oce`, `se_nao`…) valem onde a forma acentuada vale.

```ebnf
G01 Program     = { Separator | Statement } ;
G02 Statement   = VarDecl | FuncDecl | ClassDecl | If | While | For | Try | Return | Jump | Throw | ExprStmt ;
G03 VarDecl     = ( "uai" | "trem" ) Name [ "é" Expr ] ;               (* "uai" sem valor: GS0307 *)
G04 FuncDecl    = [ "vai_na_frente" ] "faz_trem" Name Params Block
                | "vai_na_frente_faz_trem" Name Params Block ;
G05 Params      = "(" [ Name { "," Name } [ "," ] ] ")" ;
G06 Block       = "{" { Separator | Statement } "}" ;                   (* corpo sempre entre chaves: GS0207 *)
G07 If          = "se_ocê_quiser" "(" Expr ")" Block { "se_num_for" "(" Expr ")" Block } [ "se_não" Block ] ;
G08 While       = "enquanto_tiver" "(" Expr ")" Block ;
G09 For         = "vai_indo" "(" ( ForClassic | ForEach ) ")" Block ;
G10 ForClassic  = [ VarDecl | Expr ] ";" [ Expr ] ";" [ Expr ] ;
G11 ForEach     = ( "uai" | "trem" ) Name ( "de" | "em" ) Expr ;        (* "de" e "em" só aqui são keywords *)
G12 Try         = "tenta_aí" Block ( Catch [ Finally ] | Finally ) ;
G13 Catch       = "se_der_ruim" [ "(" Name ")" ] Block ;
G14 Finally     = "por_fim" Block ;
G15 ClassDecl   = "arruma_trem" Name [ "inherda_de" Postfix ] "{" { Method } "}" ;
G16 Method      = [ "num_muda" ] [ "vai_na_frente" ] ( "aprepara_trem" | PropName ) Params Block ;
G17 Return      = "faz_favor" [ Expr ] ;                                (* quebra depois: devolve indefinido *)
G18 Jump        = "para_com_isso" | "continua_aí" ;
G19 Throw       = "vixe" "(" Expr ")" ;                                 (* instrução; um argumento: GS0206 *)
G20 ExprStmt    = Expr ;

G21 Expr        = Assign ;
G22 Assign      = Binary [ "é" Assign ] ;                               (* alvo: nome ou membro: GS0209 *)
G23 Binary      = Unary { BinOp Unary } ;                               (* precedência: tabela G24 *)
G25 Unary       = ( "num_é" | "menos" | "-" | "espera_um_cadim" ) Unary | Postfix ;
G26 Postfix     = Primary { Args | "[" Expr "]" | "." PropName } ;
G27 Primary     = Number | String | Literal | Name | "ocê" | "a_raiz" | New | Array | Object | Arrow | "(" Expr ")" ;
G28 New         = "faz_um" Postfix [ Args ] ;
G29 Arrow       = ( Name | Params ) "=>" ( Block | Expr ) ;             (* quebra antes do "=>": GS0204 *)
G30 Args        = "(" [ Expr { "," Expr } [ "," ] ] ")" ;
G31 Array       = "[" [ Expr { "," Expr } [ "," ] ] "]" ;
G32 Object      = "{" [ Pair { "," Pair } [ "," ] ] "}" ;
G33 Pair        = ( PropName | String | Number ) ":" Expr ;
G34 Literal     = "certeza" | "de_jeito_nenhum" | "nada" | "indefinido" ;
G35 PropName    = Name | AnyKeyword ;                                   (* depois de ".", antes de ":" e em método *)

G40 Separator   = Newline | ";" ;
G41 Terminator  = Separator | "}" | EndOfFile ;                         (* termina instrução simples *)
```

## G24. Precedência dos operadores binários

`BinOp` é qualquer operador da tabela. Do nível mais baixo ao mais alto; todos associam à esquerda, e `é` (G22) associa
à direita e fica abaixo de todos. Os operadores com símbolo do JavaScript que o protótipo reconhece só para ensinar a
forma goiana (`==`, `&&`…) não são aceitos: dão o diagnóstico `GS02xx`/`GS04xx` correspondente.

| Nível | Operadores |
|---|---|
| 3 | `ou_então` |
| 4 | `e_mais` |
| 8 | `é_igualim`, `diferente` |
| 9 | `menor_que`, `maior_que`, `no_máximo`, `pelo_menos`, `é_tipo_de`, e os símbolos `<`, `>`, `<=`, `>=` |
| 11 | `mais`, `menos`, e os símbolos `+`, `-` |
| 12 | `vezes`, `dividido`, `sobrou`, e os símbolos `*`, `/`, `%` |

Prefixos (G25) prendem mais que qualquer nível: `num_é`, `menos`, `-` e `espera_um_cadim`.

## Regras de fim de instrução (§4.6 do design)

- **G42. Agrupamento.** Dentro de `( )`, `[ ]` e do `{ }` de coisa a quebra de linha é ignorada; o `{` de um bloco
  (corpo de função, seta, método ou condicional) volta à regra de instrução, mesmo dentro de um agrupamento.
- **G43. Continuação.** Em qualquer contexto a quebra é ignorada depois de operador binário, `é`, `,`, `.`, `=>`, `(`,
  `[` e `{`, e antes de `.` (encadeamento), e também antes do `{` do corpo de uma construção que exige bloco.
- **G44. Continuação da instrução composta.** `se_num_for` e `se_não` continuam um `se_ocê_quiser`/`se_num_for`;
  `se_der_ruim` e `por_fim` continuam um `tenta_aí`; `por_fim` continua um `se_der_ruim`. Linhas em branco e comentários
  entre o `}` e a palavra não contam; qualquer outra palavra deixa a quebra terminar a instrução.
- **G45. Operador no começo da linha.** Linha que começa com operador binário não continua a de cima: a instrução
  termina e o parser dá `GS0203`; só `.` continua pelo início. A quebra entre os parâmetros da seta e o `=>` é `GS0204`.
