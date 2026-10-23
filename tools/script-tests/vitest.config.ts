import { defineConfig } from 'vitest/config';

// Os testes sobem processos do Node para executar blocos; o runner do CI precisa de folga.
const PROCESS_TESTS_TIMEOUT_MS = 60_000;

export default defineConfig({ test: { name: 'script-tests', testTimeout: PROCESS_TESTS_TIMEOUT_MS, hookTimeout: PROCESS_TESTS_TIMEOUT_MS } });
