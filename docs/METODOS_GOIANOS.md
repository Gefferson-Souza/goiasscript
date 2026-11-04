# Métodos goianos do GoiásScript

Esta página mostra os nomes goianos da biblioteca e como usar cada um. Do lado de cada linha, depois do `//`, vem
o que ela escreve na tela. Todo exemplo abaixo compila e roda: o gate de promessas confere cada bloco. A tabela
completa, gerada do código, fica na [referência](spec/referencia.md).

Toda palavra com acento também vale sem acento: `ranca_os_espaço` ou `ranca_os_espaco`, `se_ocê_quiser` ou
`se_oce_quiser`. Use o que o seu teclado deixar.

## Texto

```goiasscript
uai frase é "Oi sô"
prosa(frase.gritando())              // OI SÔ          (tudo maiúsculo)
prosa(frase.cochichando())           // oi sô          (tudo minúsculo)
prosa(frase.trocar("Oi", "Eai"))     // Eai sô
prosa(frase.começa_com("Oi"))        // true
prosa(frase.termina_com("sô"))       // true
prosa(frase.tem_no_meio("i s"))      // true
prosa("  uai  ".ranca_os_espaço())   // uai            (tira os espaços das pontas)
prosa("ha".repete(3))                // hahaha
prosa(frase.dividir(" "))            // [ 'Oi', 'sô' ] (quebra num pedaço por espaço)
prosa(frase.o_tanto)                 // 5              (quantas letras; sem parênteses)
prosa(frase.naco(0, 2))              // Oi             (pedaço do 0 até antes do 2)
```

## Lista

Estes métodos não mexem na lista original: devolvem uma resposta ou uma lista nova.

```goiasscript
uai numeros é [3, 1, 2]
prosa(numeros.mapear(x => x vezes 2))                  // [ 6, 2, 4 ]  (faz a conta em cada um)
prosa(numeros.filtrar(x => x maior_que 1))             // [ 3, 2 ]     (só os que passam)
prosa(numeros.amontoar((soma, x) => soma mais x, 0))   // 6            (junta tudo num valor, começando do 0)
prosa(numeros.arruma())                                // [ 1, 2, 3 ]  (em ordem)
prosa(numeros.de_trás_pra_frente())                    // [ 2, 1, 3 ]  (ao contrário)
prosa(numeros.ajunta("-"))                             // 3-1-2        (vira texto, com o separador)
prosa(numeros.cata(x => x menor_que 3))                // 1            (o primeiro que passa)
prosa(numeros.tem_algum(x => x maior_que 2))           // true         (algum passa?)
prosa(numeros.todin(x => x maior_que 0))               // true         (todos passam?)
prosa(numeros.onde_tá(2))                              // 2            (a posição do valor 2, contando do 0)
prosa(numeros.onde_tá_o(x => x menor_que 3))           // 1            (a posição do primeiro que passa)
prosa(numeros.emenda([9, 8]))                          // [ 3, 1, 2, 9, 8 ]
numeros.pra_cada(x => prosa(x))                        // 3, 1 e 2, um por linha
```

Para mexer na lista em si, use `bota_no_final`, `bota_no_começo`, `ranca_o_rabo`, `ranca_a_cabeça` e
`ranca_do_meio`:

```goiasscript
trem fila é [1, 2]
fila.bota_no_final(3)            // fila fica [ 1, 2, 3 ]
fila.bota_no_começo(0)           // fila fica [ 0, 1, 2, 3 ]
prosa(fila.ranca_o_rabo())       // 3   (tira o último)
prosa(fila.ranca_a_cabeça())     // 0   (tira o primeiro)
prosa(fila)                      // [ 1, 2 ]

trem time é [1, 2, 3, 4]
prosa(time.ranca_do_meio(1, 2))  // [ 2, 3 ]  (tira 2 itens a partir da posição 1)
prosa(time)                      // [ 1, 4 ]
```

`arruma()` põe em ordem número e texto. Lista de coisas (como `[{ preco: 2 }, { preco: 1 }]`) ela devolve na mesma
ordem, porque ainda não tem jeito de dizer qual campo comparar.

## Número e conta

```goiasscript
prosa((3.14159).com_casas(2))       // 3.14  (número solto vai entre parênteses antes do ponto)
prosa(Conta.arredondar(3.7))        // 4
prosa(Conta.arredondar_pra_baixo(3.7))  // 3
prosa(Conta.arredondar_pra_cima(3.2))   // 4
prosa(Conta.maior(1, 5, 3))         // 5
prosa(Conta.menor(1, 5, 3))         // 1
prosa(Conta.raiz_quadrada(81))      // 9
prosa(Conta.elevado_a(2, 10))       // 1024
prosa(Conta.ranca_o_sinal(-4))      // 4
prosa(vira_número("42"))            // 42
prosa(é_número("abc"))              // false
prosa(vira_texto(42))               // 42
```

`Conta.PI` e `Conta.E` são números já prontos, sem parênteses:

```goiasscript
prosa(Conta.PI)                     // 3.141592653589793
prosa(Conta.E)                      // 2.718281828459045
prosa(Conta.PI.com_casas(2))        // 3.14
```

Cuidado com o `é_número`: ele só confere se o valor **já é** número. Texto com cara de número não passa. Se
vier texto, passe por `vira_número` antes:

```goiasscript
prosa(é_número(12))                 // true
prosa(é_número("12"))               // false  (é texto, mesmo parecendo número)
prosa(é_número(vira_número("12")))  // true
```

Para sortear, o `Conta.sorteia_um` precisa dos dois valores, o menor e o maior, e os dois podem sair:

```goiasscript
uai dado é Conta.sorteia_um(1, 6)
prosa("Saiu", dado)                 // Saiu 4  (ou qualquer número de 1 a 6)
```

## Coisa

Uma coisa guarda valores com nome, entre chaves.

```goiasscript
uai pessoa é { nome: "Maria", idade: 30 }
prosa(Coisa.chaves(pessoa))          // [ 'nome', 'idade' ]
prosa(Coisa.valores(pessoa))         // [ 'Maria', 30 ]
prosa(Coisa.entradas(pessoa))        // [ [ 'nome', 'Maria' ], [ 'idade', 30 ] ]
prosa(Coisa.tem(pessoa, "nome"))     // true
prosa(Coisa.vira_texto(pessoa))      // {"nome":"Maria","idade":30}
prosa(Coisa.vira_coisa("{\"a\":1}")) // { a: 1 }
```

`Coisa.mistura` junta duas coisas numa nova. Ela pede exatamente dois argumentos (com três dá erro). Se a
mesma chave aparecer nas duas, vale a da segunda:

```goiasscript
prosa(Coisa.mistura({ a: 1 }, { b: 2 }))        // { a: 1, b: 2 }
prosa(Coisa.mistura({ a: 1, b: 1 }, { b: 2 }))  // { a: 1, b: 2 }
```

Coisa que vem de fora, como a do `Coisa.vira_coisa`, não tem as chaves escritas no seu arquivo. Por isso
`dado.saldo` dá erro GS0305: com ponto, o compilador só aceita campo que ele viu nascer (é assim que ele pega
`pessoa.nmoe` escrito errado). Para ler campo de fora, use colchete com o nome entre aspas:

```goiasscript
uai dado é Coisa.vira_coisa("{\"saldo\": 10}")
prosa(dado["saldo"])                 // 10
```

## Perguntar pra quem usa

`pergunta` mostra o texto, espera a pessoa digitar e Enter, e devolve o que ela escreveu, sempre como texto. Para
fazer conta, passe por `vira_número`, que também aceita vírgula (`"7,5"` vira `7.5`).

```goiasscript entrada=Maria\n30
uai nome é pergunta("Qual seu nome?")
uai idade é vira_número(pergunta("Quantos anos?"))
prosa("Eai", nome, "daqui a 10 anos ocê tem", idade mais 10)
```

```text
Qual seu nome? Maria
Quantos anos? 30
Eai Maria daqui a 10 anos ocê tem 40
```

## Tempo e promessa

`vai_na_frente` marca uma função que demora, e `espera_um_cadim` espera ela terminar.

```goiasscript
vai_na_frente faz_trem esperaUmPouco() {
  espera_um_cadim cochila(10)
  faz_favor "passou"
}

esperaUmPouco().quando_der_bão(resposta => prosa(resposta))
Promessa.tudim_junto([esperaUmPouco(), esperaUmPouco()]).quando_der_bão(lista => prosa(lista.o_tanto))
```

## Data e hora

`faz_um Data()` pega a data e a hora de agora, ou uma data que ocê escrever em texto. Os métodos `ano`, `mês`,
`dia`, `hora`, `minuto` e `segundo` devolvem cada pedaço. O `mês` conta de 1 a 12 (janeiro é 1, dezembro é 12).

```goiasscript
uai natal é faz_um Data("2026-12-25T08:30:15")
prosa(natal.ano(), natal.mês(), natal.dia())       // 2026 12 25
prosa(natal.hora(), natal.minuto(), natal.segundo())  // 8 30 15
```

Ocê também pode montar a data com números: `faz_um Data(ano, mês, dia)`. O mês aí conta de 1 a 12, igualzinho
ao método `mês`, então o que ocê escreve é o que ocê lê de volta:

```goiasscript
uai natal é faz_um Data(2026, 12, 25)
prosa(natal.mês(), natal.ano())  // 12 2026
```

`Data.agorinha()` devolve o momento de agora como um número (os milésimos de segundo desde 1970). Serve pra
medir quanto tempo passou. Como depende da hora de agora, a saída muda a cada vez:

```goiasscript sem-execucao
uai começo é Data.agorinha()
espera_um_cadim cochila(100)
prosa("Passou", Data.agorinha() menos começo, "milésimos")
```

## Temporizador

`daqui_um_cadim` roda uma função uma vez, depois de um tempo em milésimos de segundo. `toda_hora` roda a
função de novo e de novo, no mesmo intervalo. `larga_mão` para um dos dois (o que ocê guardou em `uai`).

```goiasscript
daqui_um_cadim(() => prosa("passou um cadim"), 10)

trem vezes_que_rodou é 0
uai relogio é toda_hora(() => {
  vezes_que_rodou é vezes_que_rodou mais 1
  prosa("tique", vezes_que_rodou)
  se_ocê_quiser (vezes_que_rodou é_igualim 3) {
    larga_mão(relogio)
  }
}, 10)
```

Sem o `larga_mão`, o `toda_hora` não para nunca.

## Erro

`vixe` dispara um erro (sempre com parênteses), `tenta_aí` tenta um trecho e `se_der_ruim` pega o erro.
`reclama` escreve o erro na tela e `avisa` escreve um aviso.

```goiasscript
tenta_aí {
  vixe("deu ruim")
} se_der_ruim (erro) {
  reclama(erro.mensagem)             // deu ruim
}

avisa("cuidado, sô")                 // cuidado, sô
```

`faz_um Erro("texto")` cria um erro, e `.mensagem` devolve o texto. Numa promessa, o `.se_der_ruim` pega o erro,
do mesmo jeito que o `se_der_ruim` do `tenta_aí`:

```goiasscript
uai promessa é Promessa.tudim_junto([]).quando_der_bão(() => {
  vixe(faz_um Erro("quebrou"))
})
promessa.se_der_ruim(erro => prosa("pegou:", erro.mensagem))   // pegou: quebrou
```

## Onde é diferente do JavaScript

- **Comparar e ligar condições é só com palavra:** `é_igualim`, `diferente`, `e_mais`, `ou_então` e `num_é`. Os
  símbolos `==`, `===`, `!=`, `!==`, `&&`, `||`, `!` e `++` dão erro, e o erro diz a palavra certa.
- **Conta pode ser com símbolo ou com palavra:** `<`, `>`, `<=`, `>=`, `+`, `-`, `*`, `/` e `%` valem do mesmo
  jeito que `menor_que`, `maior_que`, `no_máximo`, `pelo_menos`, `mais`, `menos`, `vezes`, `dividido` e
  `sobrou` (o resto da divisão: `7 sobrou 4` dá 3).
- **`arruma()` não recebe função:** ela põe número em ordem de número e texto em ordem de texto, e devolve uma
  lista nova.
- **`amontoar` pede o valor de começo:** `amontoar((soma, x) => soma mais x, 0)`.
- **`o_tanto` não leva parênteses:** `lista.o_tanto`, `texto.o_tanto`.
