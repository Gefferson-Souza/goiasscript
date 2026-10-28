import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const REQUIRED_CHECKS = ['verify', 'test', 'commitlint', 'patch-coverage', 'pr-body', 'promises-gate'];
const readRuleset = (name) => JSON.parse(fs.readFileSync(path.join(ROOT_DIR, '.github/rulesets', `${name}.json`), 'utf8'));
const ruleTypes = (ruleset) => ruleset.rules.map((rule) => rule.type);
const ruleOf = (ruleset, type) => ruleset.rules.find((rule) => rule.type === type);

function workflowJobNames() {
  const dir = path.join(ROOT_DIR, '.github/workflows');
  return fs.readdirSync(dir).filter((file) => file.endsWith('.yml')).flatMap((file) =>
    Object.entries(parse(fs.readFileSync(path.join(dir, file), 'utf8')).jobs).map(([id, job]) => job.name ?? id));
}

describe('rulesets versionados', () => {
  it('a main exige PR, histórico linear, sem force-push nem exclusão, e só squash ou rebase', () => {
    const main = readRuleset('main');
    expect(main.target).toBe('branch');
    expect(main.conditions.ref_name.include).toEqual(['refs/heads/main']);
    expect(ruleTypes(main)).toEqual(expect.arrayContaining(['pull_request', 'required_linear_history', 'non_fast_forward', 'deletion', 'required_status_checks']));
    expect(ruleOf(main, 'pull_request').parameters.allowed_merge_methods).toEqual(['squash', 'rebase']);
    expect(main.bypass_actors).toEqual([]);
  });
  it('cada check exigido na main é nome de job existente e os seis estão presentes', () => {
    const contexts = ruleOf(readRuleset('main'), 'required_status_checks').parameters.required_status_checks.map((check) => check.context);
    expect(contexts).toEqual(expect.arrayContaining(REQUIRED_CHECKS));
    expect(workflowJobNames()).toEqual(expect.arrayContaining(contexts));
  });
  it('as branches archive/** não podem ser apagadas nem movidas', () => {
    const archive = readRuleset('archive');
    expect(archive.conditions.ref_name.include).toEqual(['refs/heads/archive/**']);
    expect(ruleTypes(archive)).toEqual(['deletion', 'non_fast_forward']);
  });
  it('as tags legacy/*, v2.0-pre-archive, v3.* e vscode-v* não podem ser apagadas, movidas nem atualizadas', () => {
    const tags = readRuleset('tags');
    expect(tags.target).toBe('tag');
    expect(tags.conditions.ref_name.include).toEqual(['refs/tags/legacy/*', 'refs/tags/v2.0-pre-archive', 'refs/tags/v3.*', 'refs/tags/vscode-v*']);
    expect(ruleTypes(tags)).toEqual(['deletion', 'non_fast_forward', 'update']);
  });
});
