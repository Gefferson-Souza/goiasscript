import path from 'node:path';
import mochaConstructor from 'mocha';
import { SCENARIO_ENV, SCENARIO_FILES } from '../integration.constants.ts';
import type { IntegrationScenario } from '../integration.types.ts';

const FAILURE_SUMMARY = 'testes falharam dentro do VS Code';

function scenarioFromEnv(): IntegrationScenario {
  return process.env[SCENARIO_ENV] === 'untrusted' ? 'untrusted' : 'trusted';
}

export function run(): Promise<void> {
  const mocha = new mochaConstructor({ ui: 'tdd', color: true });
  SCENARIO_FILES[scenarioFromEnv()].forEach((file) => {
    mocha.addFile(path.join(__dirname, '..', file));
  });
  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) reject(new Error(`${String(failures)} ${FAILURE_SUMMARY}`));
      else resolve();
    });
  });
}
