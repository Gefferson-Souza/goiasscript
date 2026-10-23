import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildVscode } from '../../../scripts/build-vscode.ts';
import { packVscode } from '../../../scripts/pack-vscode.ts';
import { PACKAGE_ROOT, readManifest } from './support/manifest.ts';
import { listZipEntries, readZipEntry } from './support/zip.ts';

const ALLOWED_NODE_MODULES = new Set(['child_process', 'path', 'os']);
const NODE_REQUIRE = /require\("node:([a-z_/]+)"\)/gu;
const ALLOWED_VSIX_ENTRY = /^(?:\[Content_Types\]\.xml|extension\.vsixmanifest|extension\/(?:dist\/.+|syntaxes\/.+|snippets\/.+|assets\/.+|language-configuration\.json|[Rr][Ee][Aa][Dd][Mm][Ee]\.md|LICENSE(?:\.txt)?|[Cc][Hh][Aa][Nn][Gg][Ee][Ll][Oo][Gg]\.md|package\.json))$/u;
const FORBIDDEN_VSIX_ENTRY = /\.(?:ts|map)$|\/(?:tests|src)\//u;
const BUDGETS_FILE = path.join(PACKAGE_ROOT, 'budgets.json');
// O codificador do brotli varia um pouco entre versões do Node; diferença menor que isto não exige atualizar o arquivo.
const ENCODER_JITTER_BYTES = 64;

let workDir = '';
let distDir = '';
let measuredBrotliBytes = 0;

beforeAll(async () => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-vscode-'));
  distDir = path.join(workDir, 'dist');
  measuredBrotliBytes = (await buildVscode({ outDir: distDir })).extensionBrotliBytes;
});

afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

describe('build do bundle', () => {
  it('gera extension.cjs em CommonJS, sem pacote do workspace e com vscode externo', () => {
    const bundle = fs.readFileSync(path.join(distDir, 'extension.cjs'), 'utf8');
    expect(bundle).not.toContain('@goiasscript/');
    expect(bundle).toContain('require("vscode")');
    const nodeModules = [...bundle.matchAll(NODE_REQUIRE)].map((match) => match[1]);
    expect(nodeModules.filter((name) => name !== undefined && !ALLOWED_NODE_MODULES.has(name))).toEqual([]);
  });

  it('exporta activate quando carregado como CommonJS', () => {
    const bundle = fs.readFileSync(path.join(distDir, 'extension.cjs'), 'utf8');
    const loaded: { exports: Record<string, unknown> } = { exports: {} };
    const fakeVscode = { CompletionItemKind: { Keyword: 1, Function: 2, Property: 3 }, DiagnosticSeverity: { Error: 0, Warning: 1 } };
    const requireStub = (id: string): unknown => (id === 'vscode' ? fakeVscode : {});
    const run = vm.runInNewContext(`(function (require, module, exports) {${bundle}\n})`) as (...args: readonly unknown[]) => void;
    run(requireStub, loaded, loaded.exports);
    expect(typeof loaded.exports['activate']).toBe('function');
  });

  it('embute o build do CLI com o shebang no executável', () => {
    const entry = fs.readFileSync(path.join(distDir, 'cli/goiasscript.mjs'), 'utf8');
    expect(entry.startsWith('#!/usr/bin/env node')).toBe(true);
    expect(fs.existsSync(path.join(distDir, 'cli/goias.mjs'))).toBe(true);
  });

  it('não passa dos bytes brotli registrados em budgets.json (catraca)', () => {
    const budgets = JSON.parse(fs.readFileSync(BUDGETS_FILE, 'utf8')) as { readonly extensionBundleBrotliBytes: number };
    const registered = budgets.extensionBundleBrotliBytes;
    expect(measuredBrotliBytes, `subiu: medido ${String(measuredBrotliBytes)} B contra ${String(registered)} B registrados`).toBeLessThanOrEqual(registered + ENCODER_JITTER_BYTES);
    expect(registered - measuredBrotliBytes, `melhorou: atualize budgets.json para { "extensionBundleBrotliBytes": ${String(measuredBrotliBytes)} }`).toBeLessThanOrEqual(ENCODER_JITTER_BYTES);
  });
});

describe('empacotamento do vsix', () => {
  it('lista só o que a extensão publica e devolve o sha256 do arquivo', async () => {
    const result = await packVscode({ outDir: path.join(workDir, 'pack'), env: {} });
    const bytes = fs.readFileSync(result.vsix);
    expect(result.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
    const entries = listZipEntries(bytes);
    expect(entries.filter((name) => !ALLOWED_VSIX_ENTRY.test(name))).toEqual([]);
    expect(entries.filter((name) => FORBIDDEN_VSIX_ENTRY.test(name))).toEqual([]);
    expect(entries).toContain('extension/dist/extension.cjs');
    expect(entries).toContain('extension/dist/cli/goiasscript.mjs');
    expect(entries).toContain('extension/package.json');
  });

  it('troca o publisher só no manifesto empacotado', async () => {
    const result = await packVscode({ outDir: path.join(workDir, 'pack-publisher'), env: { GS_EXTENSION_PUBLISHER: 'meu-publisher' } });
    const packed = JSON.parse(readZipEntry(fs.readFileSync(result.vsix), 'extension/package.json').toString('utf8')) as { readonly publisher: string };
    expect(packed.publisher).toBe('meu-publisher');
    expect(readManifest().publisher).toBe('goiasscript');
  });
});
