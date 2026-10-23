import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkCompilerDependencies, loadCompilerPackages } from '../../../scripts/compiler-dependencies.ts';
import type { PackageManifest } from '../../../scripts/gate.types.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const LANGUAGE: PackageManifest = { name: '@goiasscript/language' };
const COMPILER: PackageManifest = { name: '@goiasscript/compiler', dependencies: { '@goiasscript/language': 'workspace:*' } };
const withCompiler = (extra: Partial<PackageManifest>): readonly PackageManifest[] => [{ ...COMPILER, ...extra }, LANGUAGE];

describe('checkCompilerDependencies', () => {
  it('aceita só a tabela da linguagem do próprio workspace', () => {
    expect(checkCompilerDependencies([COMPILER, LANGUAGE], {})).toEqual([]);
  });

  it('falha se o compilador declarar dependência de runtime', () => {
    const problems = checkCompilerDependencies(withCompiler({ dependencies: { '@goiasscript/language': 'workspace:*', acorn: '8.19.0' } }), {});
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('acorn');
  });

  it('falha com dependência opcional ou de par', () => {
    const optional = checkCompilerDependencies(withCompiler({ optionalDependencies: { esbuild: '0.28.2' } }), {});
    const peer = checkCompilerDependencies(withCompiler({ peerDependencies: { react: '19.0.0' } }), {});
    expect(optional).toHaveLength(1);
    expect(peer).toHaveLength(1);
  });

  it('falha se a tabela da linguagem declarar dependência', () => {
    const problems = checkCompilerDependencies([COMPILER, { ...LANGUAGE, dependencies: { yaml: '2.9.1' } }], {});
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('yaml');
  });

  it('falha se o código do compilador importar pacote de fora', () => {
    const sources = { 'packages/compiler/src/lexer.ts': "import { parse } from 'acorn';\nimport { KEYWORDS } from '@goiasscript/language';\nimport { x } from './x.ts';\n" };
    const problems = checkCompilerDependencies([COMPILER, LANGUAGE], sources);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.file).toBe('packages/compiler/src/lexer.ts');
    expect(problems[0]?.message).toContain('acorn');
  });

  it('falha se um módulo nativo do Node for importado', () => {
    const problems = checkCompilerDependencies([COMPILER, LANGUAGE], { 'packages/compiler/src/a.ts': "import fs from 'node:fs';\n" });
    expect(problems).toHaveLength(1);
  });
});

describe('loadCompilerPackages', () => {
  it('o compilador real passa no gate', () => {
    const { manifests, sources } = loadCompilerPackages(ROOT_DIR);
    expect(manifests.map((manifest) => manifest.name)).toEqual(['@goiasscript/compiler', '@goiasscript/language']);
    expect(Object.keys(sources).length).toBeGreaterThan(5);
    expect(checkCompilerDependencies(manifests, sources)).toEqual([]);
  });
});
