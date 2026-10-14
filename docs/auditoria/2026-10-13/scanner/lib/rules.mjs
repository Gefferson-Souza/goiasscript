export const THRESHOLDS = {
  fileTarget: 400,
  fileMax: 800,
  functionLines: 50,
  depth: 4,
  blockNesting: 4,
  commentBlockLines: 4,
  repeatedStringMin: 3,
};

const isStrongTier = (item) => item.tier === 'strong' || item.tier === 'weak';
const isInternalName = (item) => item.surface !== 'surface-exact' && isStrongTier(item);
const nonTest = (file) => !file.isTest;
const everyFile = () => true;
const tsOnly = (file) => file.isTs;

function longFunctions(file) {
  return file.functions.filter((fn) => fn.lines > THRESHOLDS.functionLines && !fn.testContainer);
}

function deepFunctions(file) {
  return file.functions.filter((fn) => fn.maxDepth > THRESHOLDS.depth);
}

function nestedFunctions(file) {
  return file.functions.filter((fn) => fn.outermost && fn.blockNesting > THRESHOLDS.blockNesting);
}

const fnItem = (fn, detail) => ({ line: fn.line, text: `${fn.name}: ${detail}` });

// Cada regra devolve as ocorrências individuais (items); a contagem é o tamanho da lista.
const RULE_LIST = [
  {
    id: 'R01', title: 'Arquivo acima de 400 linhas (alvo)', owner: 'coding-style: 200-400 típico', weight: 2, cap: 1,
    applies: everyFile,
    items: (f) => (f.size.lines > THRESHOLDS.fileTarget ? [{ line: 1, text: `${f.size.lines} linhas` }] : []),
  },
  {
    id: 'R02', title: 'Arquivo acima de 800 linhas (máximo)', owner: 'coding-style: 800 máx', weight: 2, cap: 1,
    applies: everyFile,
    items: (f) => (f.size.lines > THRESHOLDS.fileMax ? [{ line: 1, text: `${f.size.lines} linhas` }] : []),
  },
  {
    id: 'R03', title: 'Função/método acima de 50 linhas', owner: 'coding-style: funções < 50', weight: 2, cap: 10,
    applies: everyFile,
    items: (f) => longFunctions(f).map((fn) => fnItem(fn, `${fn.lines} linhas`)),
  },
  {
    id: 'R04', title: 'Profundidade de controle > 4 (max-depth)', owner: 'coding-style: nesting <= 4', weight: 2, cap: 10,
    applies: everyFile,
    items: (f) => deepFunctions(f).map((fn) => fnItem(fn, `profundidade ${fn.maxDepth}`)),
  },
  {
    id: 'R05', title: 'Chaves aninhadas > 4 (inclui closures)', owner: 'coding-style: nesting <= 4', weight: 2, cap: 10,
    applies: everyFile,
    items: (f) => nestedFunctions(f).map((fn) => fnItem(fn, `${fn.blockNesting} níveis`)),
  },
  {
    id: 'R06', title: 'console.* fora de testes', owner: 'code-generation-quality 8', weight: 3, cap: 10,
    applies: nonTest,
    items: (f) => (f.isTest ? [] : f.consoleCalls.map((c) => ({ line: c.line, text: c.code }))),
  },
  {
    id: 'R07', title: 'any explícito (TypeScript)', owner: 'code-generation-quality 1', weight: 3, cap: 10,
    applies: tsOnly,
    items: (f) => f.typeEscapes.any.map((a) => ({ line: a.line, text: `${a.kind}: ${a.code}` })),
  },
  {
    id: 'R08', title: '@ts-ignore/@ts-expect-error sem justificativa', owner: 'code-generation-quality 8', weight: 3, cap: 10,
    applies: everyFile,
    items: (f) => f.suppressions.tsDirectives.filter((d) => !d.justified).map((d) => ({ line: d.line, text: d.text })),
  },
  {
    id: 'R09', title: 'eslint-disable sem justificativa (-- motivo)', owner: 'code-generation-quality 8', weight: 3, cap: 10,
    applies: everyFile,
    items: (f) => f.suppressions.eslintDisables.filter((d) => !d.justified).map((d) => ({ line: d.line, text: d.text })),
  },
  {
    id: 'R10', title: 'TODO/FIXME sem ticket', owner: 'comments R3', weight: 3, cap: 10,
    applies: everyFile,
    items: (f) => f.suppressions.todos.filter((t) => !t.hasTicket).map((t) => ({ line: t.line, text: t.text })),
  },
  {
    id: 'R11', title: 'Comentário em bloco > 4 linhas', owner: 'comments R2/R3', weight: 1, cap: 10,
    applies: everyFile,
    items: (f) => f.comments.longBlocks.map((b) => ({ line: b.line, text: `${b.contentLines} linhas: ${b.preview}` })),
  },
  {
    id: 'R12', title: 'Comentário ao lado do código', owner: 'comments R3', weight: 1, cap: 10,
    applies: everyFile,
    items: (f) => f.comments.trailing.map((c) => ({ line: c.line, text: c.text })),
  },
  {
    id: 'R13', title: 'Comentário de histórico/meta-processo', owner: 'comments R2', weight: 1, cap: 10,
    applies: everyFile,
    items: (f) => f.comments.history.map((c) => ({ line: c.line, text: `[${c.matches.join(',')}] ${c.text}` })),
  },
  {
    id: 'R14', title: 'Identificador em português (interno)', owner: 'code-generation-quality 9', weight: 3, cap: 10,
    applies: everyFile,
    items: (f) => f.identifiers.items.filter(isInternalName).map((i) => ({ line: i.line, text: `${i.name} (${i.kind}, ${i.tier}, ${i.surface}${i.embedded ? ', embutido' : ''})` })),
  },
  {
    id: 'R21', title: 'Comentário que só rotula/narra (<= 7 palavras, sem porquê)', owner: 'comments R2: narrar o quê', weight: 1, cap: 10,
    applies: everyFile,
    items: (f) => f.comments.narrations.map((c) => ({ line: c.line, text: c.text })),
  },
  {
    id: 'R15', title: 'Número mágico', owner: 'code-generation-quality 2', weight: 1, cap: 10,
    applies: nonTest,
    items: (f) => f.magicNumbers.map((m) => ({ line: m.line, text: `${m.value} (${m.context}): ${m.code}` })),
  },
  {
    id: 'R16', title: 'String repetida >= 3x (valor nominal)', owner: 'code-generation-quality 2', weight: 1, cap: 10,
    applies: nonTest,
    items: (f) => f.magicStrings.repeated.map((s) => ({ line: s.lines[0], text: `"${s.value}" x${s.count}` })),
  },
  {
    id: 'R17', title: 'Reatribuição de parâmetro', owner: 'coding-style: imutabilidade', weight: 1, cap: 10,
    applies: everyFile,
    items: (f) => f.mutation.paramReassignments.map((m) => ({ line: m.line, text: m.code })),
  },
  {
    id: 'R18', title: 'Mutação de objeto recebido por parâmetro', owner: 'coding-style: imutabilidade', weight: 1, cap: 10,
    applies: everyFile,
    items: (f) => f.mutation.paramPropertyMutations.filter((m) => !m.idiom).map((m) => ({ line: m.line, text: `${m.kind}: ${m.code}` })),
  },
  {
    id: 'R19', title: '`let` nunca reatribuído / `var`', owner: 'code-generation-quality 3', weight: 1, cap: 10,
    applies: everyFile,
    items: (f) => [...f.mutation.neverReassignedLet, ...f.mutation.varDeclarations].map((m) => ({ line: m.line, text: m.code })),
  },
  {
    id: 'R20', title: 'catch que engole o erro', owner: 'code-generation-quality 7', weight: 3, cap: 10,
    applies: everyFile,
    items: (f) => f.catches.swallowed.map((c) => ({ line: c.line, text: `${c.kind}: ${c.code}` })),
  },
];

export const RULES = [...RULE_LIST].sort((a, b) => a.id.localeCompare(b.id));

export function evaluateFile(file) {
  const evaluation = {};
  for (const rule of RULES) {
    const applicable = rule.applies(file);
    const items = applicable ? rule.items(file) : [];
    evaluation[rule.id] = { applicable, count: items.length, items };
  }
  return evaluation;
}

export function fileScore(evaluation) {
  let earned = 0;
  let possible = 0;
  for (const rule of RULES) {
    if (!evaluation[rule.id].applicable) continue;
    possible += rule.weight;
    earned += (rule.weight * Math.min(evaluation[rule.id].count, rule.cap)) / rule.cap;
  }
  return { earned: Number(earned.toFixed(3)), possible, pct: possible ? Number(((earned / possible) * 100).toFixed(1)) : 0 };
}
