# Métodos goianos do GoiásScript

Esta página mostra os nomes goianos da biblioteca e como usar cada um. A tabela completa, gerada
do código, fica em `packages/language/generated/reference.md`. Todo exemplo abaixo compila e roda:
o gate de promessas confere cada bloco.

## Texto

```goiasscript
uai frase é "Oi sô"
prosa(frase.gritando())
prosa(frase.cochichando())
prosa(frase.trocar("Oi", "Eai"))
prosa(frase.começa_com("Oi"))
prosa(frase.termina_com("sô"))
prosa(frase.tem_no_meio("i s"))
prosa("  uai  ".ranca_os_espaço())
prosa("ha".repete(3))
prosa(frase.dividir(" "))
prosa(frase.o_tanto)
prosa(frase.naco(0, 2))
```

## Lista

```goiasscript
uai numeros é [3, 1, 2]
prosa(numeros.mapear(x => x vezes 2))
prosa(numeros.filtrar(x => x maior_que 1))
prosa(numeros.amontoar((soma, x) => soma mais x, 0))
prosa(numeros.arruma())
prosa(numeros.de_trás_pra_frente())
prosa(numeros.ajunta("-"))
prosa(numeros.cata(x => x menor_que 3))
prosa(numeros.tem_algum(x => x maior_que 2))
prosa(numeros.todin(x => x maior_que 0))
prosa(numeros.onde_tá(2))
numeros.pra_cada(x => prosa(x))
```

Para mexer na lista em si, use `bota_no_final`, `bota_no_começo`, `ranca_o_rabo` e `ranca_a_cabeça`:

```goiasscript
trem fila é [1, 2]
fila.bota_no_final(3)
fila.bota_no_começo(0)
prosa(fila.ranca_o_rabo())
prosa(fila.ranca_a_cabeça())
prosa(fila)
```

## Número e conta

```goiasscript
prosa((3.14159).com_casas(2))
prosa(Conta.arredondar(3.7))
prosa(Conta.arredondar_pra_baixo(3.7))
prosa(Conta.arredondar_pra_cima(3.2))
prosa(Conta.maior(1, 5, 3))
prosa(Conta.menor(1, 5, 3))
prosa(Conta.raiz_quadrada(81))
prosa(Conta.elevado_a(2, 10))
prosa(Conta.ranca_o_sinal(-4))
prosa(vira_número("42"))
prosa(é_número("abc"))
prosa(vira_texto(42))
```

## Coisa

```goiasscript
uai pessoa é { nome: "Maria", idade: 30 }
prosa(Coisa.chaves(pessoa))
prosa(Coisa.valores(pessoa))
prosa(Coisa.entradas(pessoa))
prosa(Coisa.tem(pessoa, "nome"))
prosa(Coisa.vira_texto(pessoa))
prosa(Coisa.vira_coisa("{\"a\":1}"))
```

## Tempo e promessa

```goiasscript
vai_na_frente faz_trem esperaUmPouco() {
  espera_um_cadim cochila(10)
  faz_favor "passou"
}

esperaUmPouco().quando_der_bão(resposta => prosa(resposta))
Promessa.tudim_junto([esperaUmPouco(), esperaUmPouco()]).quando_der_bão(lista => prosa(lista.o_tanto))
```

## Erro

```goiasscript
tenta_aí {
  vixe("deu ruim")
} se_der_ruim (erro) {
  reclama(erro.mensagem)
}
```
