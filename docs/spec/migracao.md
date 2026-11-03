# Migração entre versões

Toda remoção, renomeação e nome novo reservado entra aqui e no CHANGELOG, uma linha por mudança (ADR-0006).

As linhas "deixa de existir" são palavras que a 1.5 realmente aceitava. As linhas "nunca funcionou" (`se`, `senao` e `fazer`)
estavam só na documentação da 1.5: o código nunca entendeu. Nenhuma dessas palavras é reservada na v3, então
`uai fazer é 3` continua valendo; o compilador só usa a lista pra melhorar a mensagem de erro (GS0306).

| Versão | Mudança | Tipo | Como migrar |
|---|---|---|---|
| 3.0.0 | `trem` passa a declarar `let` (na 1.5 era `var`) | mudança de semântica | Revise o uso de `trem` fora do bloco onde foi declarado: o escopo agora é o do bloco. |
| 3.0.0 | `.tamanho()` vira `.o_tanto` | renomeação | Troque por `.o_tanto`, sem parênteses; chamar com parênteses é `GS0603`. |
| 3.0.0 | `.ordenar()` vira `.arruma()` | renomeação | Troque por `.arruma()`. |
| 3.0.0 | `.arranca_o_rabo()` vira `.ranca_o_rabo()` | renomeação | Troque por `.ranca_o_rabo()`. |
| 3.0.0 | `presta_serviço` deixa de existir | renomeação | Troque por `faz_trem`. |
| 3.0.0 | `vai_na_frente_presta_serviço` deixa de existir | renomeação | Troque por `vai_na_frente_faz_trem`. |
| 3.0.0 | `mexe_assim` deixa de existir | remoção | Sem substituto: reescreva o trecho sem essa palavra. |
| 3.0.0 | `vixe_que` deixa de existir | renomeação | Troque por `vixe`. |
| 3.0.0 | `vazio` deixa de existir | renomeação | Troque por `nada`. |
| 3.0.0 | `sei_lá` deixa de existir | renomeação | Troque por `indefinido`. |
| 3.0.0 | `se` não é palavra da v3 (estava na doc da 1.5, nunca funcionou) | nunca funcionou | Use `se_ocê_quiser`. A palavra não é reservada: só a mensagem GS0306 aponta a forma certa. |
| 3.0.0 | `senao` não é palavra da v3 (estava na doc da 1.5, nunca funcionou) | nunca funcionou | Use `se_não`. A palavra não é reservada: só a mensagem GS0306 aponta a forma certa. |
| 3.0.0 | `fazer` não é palavra da v3 (estava na doc da 1.5, nunca funcionou) | nunca funcionou | Use `faz_trem`. A palavra não é reservada: só a mensagem GS0306 aponta a forma certa. |
| 3.0.0 | `é_igual_a` deixa de existir | renomeação | Troque por `é_igualim`. |
| 3.0.0 | `um_tanto_de` deixa de existir | remoção | Sem substituto: reescreva o trecho sem essa palavra. |
| 3.0.0 | `ninguem_fuça` deixa de existir | remoção | Sem substituto: reescreva o trecho sem essa palavra. |
| 3.0.0 | `só_da_famia` deixa de existir | remoção | Sem substituto: reescreva o trecho sem essa palavra. |
| 3.0.0 | `todo_mundo_vê` deixa de existir | remoção | Sem substituto: reescreva o trecho sem essa palavra. |
| 3.0.0 | `.ordenar()` não muda mais a lista original | mudança de semântica | `.arruma()` devolve uma lista nova; use o resultado. Também não leva comparador. |
| 3.0.0 | `.inverter()` vira `.de_trás_pra_frente()` | renomeação | Troque o nome e use o resultado: a lista original não muda. |
| 3.0.0 | `Coisa.mistura(a, b)` não muda mais o primeiro argumento | mudança de semântica | Use o valor devolvido, em vez de contar com `a` mudado. |
| 3.0.0 | `.reduzir` vira `.amontoar(f, inicial)` | renomeação | Troque o nome e passe sempre o valor inicial. |
| 3.0.0 | `.trocar(a, b)` troca todas as ocorrências, em texto literal | mudança de semântica | Na 1.5 o primeiro argumento era expressão regular; agora é texto puro, e `/b/` dá `GS0502`. |
| 3.0.0 | `faz_um promessa` vira `faz_um Promessa` | renomeação | Troque por `faz_um Promessa`. |
| 3.0.0 | `.quando_resolver` vira `.quando_der_bão` | renomeação | Troque por `.quando_der_bão`. |
| 3.0.0 | `.se_der_pobrema` vira `.se_der_ruim` | renomeação | Troque por `.se_der_ruim`. |
| 3.0.0 | `GoianoMath` vira `Conta` | renomeação | Troque por `Conta`, por exemplo `Conta.arredondar_pra_cima(x)`. |
| 3.0.0 | `.pedaco` vira `.naco` | renomeação | Troque por `.naco(início, fim)`; índice negativo conta do fim. |
| 3.0.0 | `vira_número` aceita vírgula decimal | mudança de semântica | `vira_número("10,50")` dá 10.5; texto vazio dá `NaN`. |
| 3.0.0 | `.mensagem` do erro vem em português | mudança de semântica | Não compare o texto do erro com a mensagem em inglês do motor. |
| 3.0.0 | Número com ponto de milhar (`1.000.000`) é erro | mudança de semântica | Escreva `1000000`; o erro mostra a correção (`GS0101`). |
