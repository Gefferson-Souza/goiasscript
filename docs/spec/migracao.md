# Migração entre versões

Toda remoção, renomeação e nome novo reservado entra aqui e no CHANGELOG, uma linha por mudança (ADR-0006).

| Versão | Mudança | Tipo | Como migrar |
|---|---|---|---|
| 3.0.0 | `trem` passa a declarar `let` (na 1.5 era `var`) | mudança de semântica | Revise o uso de `trem` fora do bloco onde foi declarado: o escopo agora é o do bloco. |
| 3.0.0 | `.tamanho()` vira `.o_tanto` | renomeação | Troque por `.o_tanto`, sem parênteses; chamar com parênteses é `GS0603`. |
| 3.0.0 | `presta_serviço` deixa de existir | renomeação | Troque por `faz_trem`. |
| 3.0.0 | `vai_na_frente_presta_serviço` deixa de existir | renomeação | Troque por `vai_na_frente_faz_trem`. |
| 3.0.0 | `mexe_assim` deixa de existir | remoção | Sem substituto: reescreva o trecho sem essa palavra. |
| 3.0.0 | `vixe_que` deixa de existir | renomeação | Troque por `vixe`. |
| 3.0.0 | `vazio` deixa de existir | renomeação | Troque por `nada`. |
| 3.0.0 | `sei_lá` deixa de existir | renomeação | Troque por `indefinido`. |
| 3.0.0 | `se` deixa de existir | renomeação | Troque por `se_ocê_quiser`. |
| 3.0.0 | `senao` deixa de existir | renomeação | Troque por `se_não`. |
| 3.0.0 | `fazer` deixa de existir | renomeação | Troque por `faz_trem`. |
| 3.0.0 | `é_igual_a` deixa de existir | renomeação | Troque por `é_igualim`. |
| 3.0.0 | `um_tanto_de` deixa de existir | remoção | Sem substituto: reescreva o trecho sem essa palavra. |
| 3.0.0 | `ninguem_fuça` deixa de existir | remoção | Sem substituto: reescreva o trecho sem essa palavra. |
| 3.0.0 | `só_da_famia` deixa de existir | remoção | Sem substituto: reescreva o trecho sem essa palavra. |
| 3.0.0 | `todo_mundo_vê` deixa de existir | remoção | Sem substituto: reescreva o trecho sem essa palavra. |
