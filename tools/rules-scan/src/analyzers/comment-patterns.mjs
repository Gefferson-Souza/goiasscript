// Padrões que denunciam histórico de desenvolvimento ou meta-processo dentro do código.
export const HISTORY_STRONG = [
  { id: 'corrige', pattern: /\bcorrig\w*/i },
  { id: 'fix', pattern: /\bfix(?:ed|es|ing)?\b/i },
  { id: 'bug', pattern: /\bbugs?\b/i },
  { id: 'regressao', pattern: /\bregress(?:ão|ao|ion)\b/i },
  { id: 'marcador-versao', pattern: /\bv(?!8\b)\d+(?:\.\d+)*\b/i },
  { id: 'marcador-fase', pattern: /\b(?:fase|etapa|sprint|round)\s*\d+\b/i },
  { id: 'marcador-subtarefa', pattern: /(?:^|[\s(/])[PFS]\d+(?:\.\d+)?\b/ },
  { id: 'fixer', pattern: /\bFIXER[-\w]*/ },
  { id: 'gate', pattern: /\bgate\b/i },
  { id: 'achado', pattern: /\bachados?\b|\bfindings?\b/i },
  { id: 'severidade', pattern: /\b(?:CRITICAL|HIGH|MEDIUM)\b/ },
  { id: 'meta-processo', pattern: /\bconfirmad[oa]\s+(?:por|via|com)\b|\bgrep\b/i },
  { id: 'revisor', pattern: /\b(?:revisor|reviewer|auditoria|adversarial)\b/i },
  {
    id: 'pendencia',
    pattern: /\b(?:pendente|a definir|por enquanto|for now|(?:solu[çc][ãa]o|fix|workaround|implementa[çc][ãa]o)\s+(?:tempor[áa]ri[oa]|provis[óo]ri[oa])|temporary\s+(?:fix|workaround|solution)|antes d[oa]\s+(?:lan[çc]amento|release|deploy|merge|publica[çc][ãa]o))\b/i,
  },
  { id: 'roadmap', pattern: /\b(?:para\s+(?:o\s+)?futuro|futuramente|no\s+futuro|mais\s+tarde|roadmap)\b|\bTBD\b/i },
  { id: 'dirigido-ao-revisor', pattern: /\bconforme\s+(?:pedido|solicitado)\b|\bagora\s+(?:est[áa]|ficou)\s+(?:correto|certo)\b/i },
];

export const HISTORY_TEMPORAL = [
  { id: 'antes-era', pattern: /\bantes\s+(?:era|de\s+ser|usava|fazia)\b/i },
  { id: 'agora-passa', pattern: /\bagora\s+(?:é|e|está|esta|usa|usamos|passa|tem|funciona|ficou|sempre)(?=[\s.,;:!?)]|$)/i },
  { id: 'mudanca', pattern: /\bpassou\s+a\b|\bpassa\s+a\s+ser\b|\bmudou\b|\bremovid[oa]s?\b|\bantigo\b|\blegado\b|\blegacy\b/i },
  {
    id: 'en-narrativa',
    pattern: /\b(?:previously|formerly|no longer|used to|renamed from|was changed|now (?:uses|returns|handles|works|is)\b)/i,
  },
];

// Palavras soltas: ambíguas (ordenação "antes de X" é explicação legítima), só candidatas.
export const HISTORY_WEAK = [
  { id: 'antes', pattern: /\bantes\b/i },
  { id: 'agora', pattern: /\bagora\b/i },
];

export function matchPatterns(patterns, text) {
  const hits = [];
  for (const { id, pattern } of patterns) {
    const match = pattern.exec(text);
    if (match) hits.push({ id, match: match[0].trim() });
  }
  return hits;
}

const PT_STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'que', 'para', 'com', 'uma', 'um', 'não', 'nao', 'em', 'no', 'na',
  'os', 'as', 'por', 'se', 'é', 'são', 'ao', 'mais', 'como', 'ou', 'mas', 'pra', 'está', 'isso',
  'esse', 'essa', 'quando', 'também', 'já', 'só', 'sem', 'entre', 'até', 'seu', 'sua', 'ser', 'cada',
  'depois', 'antes', 'agora', 'aqui', 'onde', 'pelo', 'pela', 'nos', 'nas', 'dele', 'ela', 'ele',
]);
const EN_STOPWORDS = new Set([
  'the', 'of', 'and', 'to', 'in', 'is', 'for', 'that', 'with', 'on', 'as', 'are', 'this', 'be', 'by',
  'it', 'from', 'or', 'an', 'not', 'if', 'will', 'can', 'when', 'use', 'used', 'which', 'all', 'but',
  'have', 'has', 'each', 'we', 'so', 'then', 'only', 'after', 'before', 'while', 'into', 'its', 'any',
]);
const PT_ACCENT = /[áàâãéêíóôõúç]/i;
const MIN_WORDS_FOR_LANGUAGE = 3;

export function detectLanguage(text) {
  const words = text
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .toLowerCase()
    .split(/[^a-zà-ÿ]+/)
    .filter((word) => word.length > 0);
  if (words.length < MIN_WORDS_FOR_LANGUAGE) return 'unk';
  let pt = PT_ACCENT.test(text) ? 2 : 0;
  let en = 0;
  for (const word of words) {
    if (PT_STOPWORDS.has(word)) pt += 1;
    if (EN_STOPWORDS.has(word)) en += 1;
  }
  if (pt === en) return 'unk';
  return pt > en ? 'pt' : 'en';
}

// Comentário curto só rotula/narra quando não traz nenhum marcador de justificativa.
export const RATIONALE_MARKER =
  /\b(?:porque|pois|por\s+que|pra\s+que|para\s+que|evita(?:r)?|sen[ãa]o|caso\s+contr[áa]rio|s[óo]|apenas|nunca|sempre|n[ãa]o|mas|exceto|obrigat[óo]ri[oa]|necess[áa]ri[oa]|workaround|gambiarra|garante|impede|motivo|devido|j[áa]\s+que|because|otherwise|so\s+that|avoid|must|never|always|only|unless|since|due\s+to|important|note)\b|[—;?]/i;

export const NARRATION_MAX_WORDS = 7;
