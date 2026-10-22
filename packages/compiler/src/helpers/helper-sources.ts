const HELPER_SOURCE_TEXTS: readonly string[] = [
  `function $gs_ordem(a, b) {
  const rank = (v) => (typeof v === 'number' ? (Number.isNaN(v) ? 1 : 0) : typeof v === 'string' ? 2 : 3);
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 0) return a - b;
  if (ra === 2) return a.localeCompare(b, 'pt-BR');
  return 0;
}`,
  `function $gs_vira_numero(t) {
  const s = String(t).trim().replace(',', '.');
  return s === '' ? NaN : Number(s);
}`,
  `function $gs_e_numero(x) {
  return typeof x === 'number' && !Number.isNaN(x);
}`,
  `function $gs_vira_texto(x) {
  return typeof x === 'object' && x !== null ? JSON.stringify(x) : String(x);
}`,
  `function $gs_trocar(text, search, replacement) {
  return String(text).replaceAll(String(search), () => String(replacement));
}`,
  `function $gs_mensagem(error) {
  return error.message;
}`,
  `function $gs_sorteia_um(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}`,
  `function $gs_cochila(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}`,
  `var $gs_reader;
var $gs_ended;
async function $gs_pergunta(prompt) {
  if ($gs_ended) throw Object.assign(new Error('GS0702'), { gsCode: 'GS0702' });
  if (!$gs_reader) {
    const { createInterface } = await import('node:readline/promises');
    $gs_reader = createInterface({ input: process.stdin, output: process.stdout, terminal: false })[Symbol.asyncIterator]();
  }
  process.stdout.write(prompt + ' ');
  process.stdin.resume();
  const item = await $gs_reader.next();
  if (item.done) { $gs_ended = true; throw Object.assign(new Error('GS0702'), { gsCode: 'GS0702' }); }
  process.stdin.pause();
  return item.value;
}`,
];

const DECLARED_HELPER = /function \$gs_(\w+)/u;

const HELPER_SOURCES: ReadonlyMap<string, string> = new Map(
  HELPER_SOURCE_TEXTS.flatMap((text): readonly (readonly [string, string])[] => {
    const name = DECLARED_HELPER.exec(text)?.[1];
    return name === undefined ? [] : [[name, text]];
  }),
);

export const helperSourceOf = (helperName: string): string | undefined => HELPER_SOURCES.get(helperName);
