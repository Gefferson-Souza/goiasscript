# Spike do sandbox do playground

Compara três isolamentos para executar o JS emitido do aluno no playground (spec §6.3, §5.7, §8.2). Medido com Playwright 1.64.1 em Chromium, Firefox e WebKit; o código vive em `spikes/sandbox/`.

## Critérios

1. **Ataques bloqueados:** fetch, XHR, WebSocket, `import()` dinâmico, fuga por `constructor`/`Function` e leitura de segredos do host; um canário HTTP não pode registrar nenhuma requisição e o segredo do host não pode aparecer.
2. **CSP não herdada:** o mesmo, com a página host liberando rede (`?net=1`), como a página real precisa para o Engoianador.
3. **Linha exata:** o `stack` do erro de execução aponta a linha do programa (3 no programa de teste).
4. **Laço infinito:** a página continua responsiva (batimento < 250 ms) e o encerramento funciona.

Candidatos:

- **worker-blob:** Worker de módulo criado a partir de um blob com o runner; herda a CSP da página.
- **worker-file:** Worker de módulo carregado de `/runner.js`, servido com CSP isolada por cabeçalho.
- **iframe-sandbox:** iframe `sandbox="allow-scripts"` apontando para `/frame.html` com CSP isolada; roda na thread da página.

## Resultados

| Candidato › critério | chromium | firefox | webkit |
| --- | --- | --- | --- |
| worker-blob › nenhum ataque alcança o canário e nenhum segredo do host vaza | passou | passou | passou |
| worker-blob › com a rede da página liberada, o isolamento não herda a CSP do host | FALHOU | FALHOU | FALHOU |
| worker-blob › o erro de execução aponta a linha exata do programa | passou | passou | passou |
| worker-blob › laço infinito não congela a página e o encerramento funciona | passou | passou | passou |
| worker-file › nenhum ataque alcança o canário e nenhum segredo do host vaza | passou | passou | passou |
| worker-file › com a rede da página liberada, o isolamento não herda a CSP do host | passou | passou | passou |
| worker-file › o erro de execução aponta a linha exata do programa | passou | passou | passou |
| worker-file › laço infinito não congela a página e o encerramento funciona | passou | passou | passou |
| iframe-sandbox › nenhum ataque alcança o canário e nenhum segredo do host vaza | passou | passou | passou |
| iframe-sandbox › com a rede da página liberada, o isolamento não herda a CSP do host | passou | passou | passou |
| iframe-sandbox › o erro de execução aponta a linha exata do programa | passou | passou | passou |
| iframe-sandbox › laço infinito não congela a página e o encerramento funciona | FALHOU | FALHOU | FALHOU |

## Decisão

**Candidato escolhido:** worker-file
**Escalado ao dono:** não

Regra: o mais simples que passa nos 4 critérios nos 3 navegadores.

- worker-blob reprovou o critério 2 nos três navegadores: o Worker de blob herda a CSP da página, então liberar rede na página libera o aluno.
- iframe-sandbox reprovou o critério 4 nos três: o laço infinito congela a página que hospeda o iframe, e o encerramento não roda.
- worker-file passou nos 4 critérios nos 3 navegadores.

## Consequências para a Fase 4

- Runner estático `/sandbox/runner.js` com a CSP isolada por cabeçalho no `vercel.json`.
- JS emitido entregue por `postMessage` e executado por `import()` de blob (módulo ES, `await` de topo, linha exata no `stack`).
- `pergunta` e saída como mensagens ao host.
- Encerramento por `worker.terminate()`.
- O E2E do playground reaproveita `attacks.mjs` com `x["con" mais "structor"]` compilado.
