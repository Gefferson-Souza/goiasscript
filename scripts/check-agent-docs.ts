import path from 'node:path';
import { findAgentDocProblems } from './agent-docs.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const problems = findAgentDocProblems(ROOT_DIR, ['CLAUDE.md', '.github/copilot-instructions.md']);
for (const problem of problems) process.stderr.write(`${problem}\n`);
process.exit(problems.length === 0 ? 0 : 1);
