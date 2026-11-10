# Política de segurança

## Versões suportadas

Só a linha atual da v3 recebe correção de segurança. As versões 1.x e 2.x não recebem.

| Versão | Suportada |
| --- | --- |
| 3.x | sim |
| 2.x e 1.x | não |

Atenção: a 2.0.0 do npm é a v2 arquivada e **não** é suportada. Instale a v3 com `npm install --global goiasscript@3`;
sem o `@3`, o npm pode entregar a 2.0.0.

## Como reportar uma vulnerabilidade

**Não abra issue pública** para vulnerabilidade.

Use o reporte privado de vulnerabilidade do GitHub, direto neste link:
[github.com/Gefferson-Souza/goiasscript/security/advisories/new](https://github.com/Gefferson-Souza/goiasscript/security/advisories/new)
(ou aba **Security**, botão **Report a vulnerability**). Só o mantenedor vê o relato. Se não conseguir, chame o
mantenedor pelo perfil [github.com/Gefferson-Souza](https://github.com/Gefferson-Souza), sem detalhar o problema, e
combine um canal privado.

## O que incluir

1. O tipo de problema e onde ele está no código.
2. Os passos para reproduzir, com o programa `.gs` ou o comando mínimo.
3. O impacto: o que alguém conseguiria fazer explorando.

## Como a resposta funciona

O projeto tem um único mantenedor e não promete prazo. O relato é confirmado e analisado assim que possível, a
correção sai numa versão nova e o aviso público vem depois dela, de forma coordenada. Quem reportar recebe o crédito
no CHANGELOG, se quiser.

## Escopo

Entram: o pacote `goiasscript` (compilador, otimizador e CLI), a extensão do VS Code, o playground e o Worker do
Engoianador. Ficam de fora: engenharia social, acesso físico ao computador e falhas em dependências de terceiros
(reporte a quem mantém a dependência).
