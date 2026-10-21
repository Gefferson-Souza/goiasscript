const TYPES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'ci', 'style', 'build', 'revert'];
const SCOPES = ['language', 'compiler', 'optimizer', 'cli', 'vscode', 'playground', 'engoianador', 'docs', 'ci', 'deps', 'release'];
const MAX_HEADER_LENGTH = 72;
const VAGUE_SUBJECTS = new Set(['ajustes', 'ajuste', 'fix', 'updates', 'update', 'wip']);
const AI_TRAILER = /^co-authored-by:.*(\[bot\]|\bbot\b|claude|anthropic|copilot)/im;

const localRules = {
  rules: {
    'subject-vague': ({ subject }) => [!VAGUE_SUBJECTS.has((subject ?? '').trim().toLowerCase()), 'o assunto é vago; diga o que mudou'],
    'subject-starts-lowercase': ({ subject }) => {
      const first = (subject ?? '').trim().charAt(0);
      return [first === first.toLowerCase(), 'o assunto começa em minúscula'];
    },
    'footer-no-ai-attribution': ({ raw }) => [!AI_TRAILER.test(raw ?? ''), 'trailer Co-Authored-By de IA ou bot não é permitido'],
  },
};

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [localRules],
  rules: {
    'type-enum': [2, 'always', TYPES],
    'scope-enum': [2, 'always', SCOPES],
    'subject-case': [0],
    'header-max-length': [2, 'always', MAX_HEADER_LENGTH],
    'subject-full-stop': [2, 'never', '.'],
    'subject-vague': [2, 'always'],
    'subject-starts-lowercase': [2, 'always'],
    'footer-no-ai-attribution': [2, 'always'],
  },
};
