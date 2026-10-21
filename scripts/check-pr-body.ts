import { checkPullRequestBody } from './pr-body.ts';

const problems = checkPullRequestBody(process.env['PR_BODY'] ?? '');
for (const problem of problems) process.stderr.write(`${problem}\n`);
process.exit(problems.length === 0 ? 0 : 1);
