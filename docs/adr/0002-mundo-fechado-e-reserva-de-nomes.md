# ADR-0002: Mundo fechado e reserva de nomes

- Status: aceito em 2026-10-14

## Contexto

Sem tipos, o erro só é útil se o compilador conhece todo nome que o programa usa.

## Decisão

- Mundo fechado para nomes e membros (P1).
- Palavra do JavaScript não serve de nome em posição nenhuma (P2).
- Membro de instância da biblioteca reservado por forma (P3).
- Global da biblioteca pode ser sombreado, com aviso (P4).

## Consequências

- `tamanho` e `mensagem` ficam indisponíveis para campos e métodos.
- Descartado: ajudante por apelido com despacho, porque exige runtime e contraria o ADR-0003.
- Reabre por RFC se o piloto (S8) mostrar fricção.

## Confirmação

Propriedade "todo acesso `.nome` do JS emitido, fora de `helperRange`, pertence a D mais a imagem da `stdlib`" e goldens de reserva por forma (spec §8.2).
