const BLOCK_TEMPLATE: readonly string[] = [
  'uai valor_{n} é {n} mais 2 vezes 3',
  'faz_trem soma_{n}(a, b) {',
  '  faz_favor a mais b',
  '}',
  'se_ocê_quiser (valor_{n} maior_que 10 e_mais num_é (valor_{n} é_igualim 7)) {',
  '  prosa("maior:" mais valor_{n})',
  '} se_não {',
  '  prosa("menor")',
  '}',
  'uai lista_{n} é [1, 2, 3].mapear(x => {',
  '  prosa(x)',
  '  faz_favor x vezes {n}',
  '})',
  'vai_indo (trem i é 0; i menor_que 3; i é i mais 1) {',
  '  prosa(soma_{n}(i, valor_{n}))',
  '}',
];

export const GENERATED_LINE_COUNT = 10_000;

export function generateProgram(lineCount: number = GENERATED_LINE_COUNT): string {
  const blockCount = Math.floor(lineCount / BLOCK_TEMPLATE.length);
  const blocks = Array.from({ length: blockCount }, (_, block) =>
    BLOCK_TEMPLATE.map((line) => line.replaceAll('{n}', String(block))),
  ).flat();
  const padding = Array.from({ length: lineCount - blocks.length }, () => '// fim');
  return [...blocks, ...padding].join('\n');
}
