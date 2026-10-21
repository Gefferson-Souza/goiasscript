import path from 'node:path';
import { describe, test } from 'vitest';
import * as compiler from '../src/index.ts';
import { loadCases, pickCompile, runCase } from './support/conformance.ts';
import { executeModule } from './support/execute-module.ts';

const CONFORMANCE_ROOT = path.join(import.meta.dirname, 'conformance');

describe('corpus de conformidade', () => {
  for (const testCase of loadCases(CONFORMANCE_ROOT)) {
    const register = testCase.config.status === 'expected-fail' ? test.fails : test;
    register(testCase.id, () => runCase(testCase, pickCompile(compiler), executeModule));
  }
});
