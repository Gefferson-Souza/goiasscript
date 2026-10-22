import { describe, expect, it } from 'vitest';
import { stripImports } from '../../../scripts/cli-declarations.ts';

describe('stripImports', () => {
  it('remove imports de uma linha e multilinha sem deixar resíduo', () => {
    const source = ["import type { A } from './a.ts';", 'import type {', '  B,', '  C,', "} from './b.ts';", 'export type {', '  D,', "} from './d.ts';", 'export type Kept = string;'].join('\n');
    expect(stripImports(source).trim()).toBe('export type Kept = string;');
  });

  it('remove re-export local que duplicaria a exportação ao concatenar', () => {
    const source = ['export interface SourceMapV3 {}', '', 'export type { SourceMapV3 };', 'export type Kept = string;'].join('\n');
    expect(stripImports(source)).not.toContain('export type { SourceMapV3 }');
    expect(stripImports(source)).toContain('export type Kept = string;');
  });
});
