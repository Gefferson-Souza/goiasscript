import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { AUDIT_REPORTS_DIR, EXPECTED_FAIL_SCRIPT, REPORT_FILE } from './audit-checklist.constants.ts';
import type { ChecklistFs, ExpectedFailPort } from './audit-checklist.types.ts';

const HEADER_LINES = 1;
const SUCCESS_STATUS = 0;

export function realChecklistFs(root: string): ChecklistFs {
  return { exists: (file) => fs.existsSync(path.join(root, file)), read: (file) => fs.readFileSync(path.join(root, file), 'utf8') };
}

export function listReportNames(root: string): readonly string[] {
  return fs.readdirSync(path.join(root, AUDIT_REPORTS_DIR)).filter((name) => REPORT_FILE.test(name)).sort();
}

export function createExpectedFailPort(root: string): ExpectedFailPort {
  return {
    list: () => {
      const result = spawnSync(process.execPath, [path.join(root, EXPECTED_FAIL_SCRIPT)], { cwd: root, encoding: 'utf8' });
      if (result.error !== undefined) throw result.error;
      if (result.status === SUCCESS_STATUS) return [];
      const lines = result.stdout.split('\n').slice(HEADER_LINES).filter((line) => line !== '');
      if (lines.length === 0) throw new Error(`list-expected-fail falhou sem listar casos: ${result.stderr}`);
      return lines;
    },
  };
}
