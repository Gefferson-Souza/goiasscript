import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/compile.ts';
import { parsesAsModule } from './support/compile-helpers.ts';

const DEMOS_DIRECTORY = join(import.meta.dirname, '..', 'fixtures', 'demos');

const DEMOS: readonly (readonly [name: string, stdout: string])[] = [
  ['hello', 'Eai sô, bão demais da conta!\nSalve, Goiás!\n'],
  ['first-example', 'Bão demais da conta!\nOi, João!\nOi, Maria!\n'],
  ['list-map', 'Os número: [ 1, 2, 3, 4, 5 ]\nDobrados, sô: [ 2, 4, 6, 8, 10 ]\nSó os par: [ 2, 4 ]\nItem 0: 2\nItem 1: 4\nItem 2: 6\nItem 3: 8\nItem 4: 10\n'],
  ['pequi', 'Pequi verde, com espinho: cuidado pra num se furar!\nO pequi amadureceu, sô! Tá no ponto de pôr no arroz.\nPequi maduro, com espinho: cuidado pra num se furar!\n'],
  ['async-timer', '=== Programa GoiásScript ===\nIniciando teste...\nEsperando 20 milissegundos...\nO programa principal continua executando enquanto a função assíncrona trabalha\nContando: 0\nContando: 1\nContando: 2\nTempo de espera concluído!\nResultado: Processamento de 20ms finalizado!\nTeste concluído com sucesso!\n'],
  ['video-demo', 'Bão, sô\n'],
];

describe('demos do subconjunto da v3', () => {
  it.each(DEMOS)('%s compila, o JS passa no acorn e reproduz o stdout', (name, stdout) => {
    const result = compile(readFileSync(join(DEMOS_DIRECTORY, `${name}.gs`), 'utf8'));
    if (!result.ok) throw new Error(result.diagnostics.map((d) => `${d.code}@${d.line}`).join(','));
    expect(parsesAsModule(result.code)).toBe(true);
    expect(execFileSync(process.execPath, ['--input-type=module'], { input: result.code, encoding: 'utf8' })).toBe(stdout);
  });
});
