import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../conformance/', import.meta.url));

function isExpectedFail(id: string): boolean {
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(ROOT, id, 'case.json'), 'utf8'));
    return typeof parsed === 'object' && parsed !== null && 'status' in parsed && parsed.status === 'expected-fail';
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

const marked = readdirSync(ROOT).filter(isExpectedFail);
process.stdout.write(`${String(marked.length)} casos expected-fail\n${marked.join('\n')}\n`);
process.exitCode = marked.length === 0 ? 0 : 1;
