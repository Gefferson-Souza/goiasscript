# ADR-0009: Publicação

- Status: aceito em 2026-10-14

## Contexto

Os PATs globais do Azure DevOps acabam em 2026-12-01, e o trusted publisher do npm expira se o primeiro publish não for validado em 2 dias.

## Decisão

npm por OIDC com provenance, publicando o mesmo tarball que foi testado. Trusted publisher só com o `release.yml` definitivo em `main`. Marketplace sem PAT. Open VSX com token restrito.

## Consequências

O alpha da Fase 3 é planejado em torno da janela de 2 dias.

## Confirmação

Job de release com `npm stage publish` e smoke pós-publicação.
