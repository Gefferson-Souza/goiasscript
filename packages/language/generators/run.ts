import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GeneratedFile } from './generators.types.ts';
import { renderCliHelpFiles } from './cli-help.ts';
import { renderCompletionsFiles } from './completions.ts';
import { renderCoreDiagnosticsFiles } from './core-diagnostics.ts';
import { renderErrorPhrasesFiles } from './error-phrases.ts';
import { renderGlossaryFiles } from './glossary.ts';
import { renderJsMembersFiles } from './js-members.ts';
import { renderMonarchFiles } from './monarch.ts';
import { renderReferenceFiles } from './reference.ts';
import { renderRetiredPageFiles } from './retired-page.ts';
import { renderSnippetsFiles } from './snippets.ts';
import { renderTextmateFiles } from './textmate.ts';
import { renderVocabularyLockFiles } from './vocabulary-lock.ts';

const REPOSITORY_ROOT = resolve(import.meta.dirname, '../../..');
export const GENERATORS: readonly (() => readonly GeneratedFile[])[] = [
  renderJsMembersFiles, renderTextmateFiles, renderMonarchFiles, renderSnippetsFiles, renderReferenceFiles,
  renderCliHelpFiles, renderGlossaryFiles, renderCompletionsFiles, renderRetiredPageFiles,
  renderVocabularyLockFiles, renderErrorPhrasesFiles, renderCoreDiagnosticsFiles,
];

export function renderAll(): readonly GeneratedFile[] {
  return GENERATORS.flatMap((generate) => generate());
}

async function main(mode: string | undefined): Promise<number> {
  const stale = await Promise.all(renderAll().map(async (file) => {
    const target = resolve(REPOSITORY_ROOT, file.path);
    if (mode === '--check') {
      const current = await readFile(target, 'utf8').catch(() => null);
      return current === file.content ? null : file.path;
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content);
    return null;
  }));
  const outdated = stale.filter((path): path is string => path !== null);
  if (outdated.length === 0) return 0;
  process.stderr.write(`Arquivos gerados desatualizados:\n${outdated.join('\n')}\nRode: corepack pnpm --filter @goiasscript/language generate\n`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv[2]));
}
