# E2E da cartilha: execução só na CI

Os testes `apps/playground-e2e/tests/cartilha-*.spec.ts` (6 testes) foram
escritos e listados localmente, mas executados apenas na CI, porque o
disco local não comporta os navegadores do Playwright.

Para o relatório do gate:

- Confirmar verde em Chromium, Firefox e WebKit.
- Conferir em especial, no Firefox e no WebKit, o teste "sem localStorage a
  lição continua funcionando" (bloqueio via `blockStorage`) e a espera por
  `data-verdict` em `exercise-verdict`.
- Enquanto a CI não rodar, o item fica como pendência de evidência.
