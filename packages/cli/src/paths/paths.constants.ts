export const SOURCE_EXTENSION = '.gs';
export const OUTPUT_EXTENSION = '.mjs';
export const STDIN_ARGUMENT = '-';
export const STDIN_DISPLAY_NAME = '<entrada>';

export const PATH_CODE = { notGs: 'GS0902', outputRefused: 'GS0903', usage: 'GS0905' } as const;

export const OUTPUT_REASON = {
  sameFile: 'é o mesmo arquivo da entrada',
  exists: 'já existe',
  isDirectory: 'é uma pasta',
  endsWithGs: 'termina em .gs',
  notRegularFile: 'não é um arquivo comum',
  missingParent: 'a pasta de destino não existe',
} as const;

export const UTF8_GUIDANCE = 'Esse arquivo não tá em UTF-8, sô. Salva o arquivo de novo como UTF-8 e tenta outra vez.';

const BOM_HIGH = 0xff;
const BOM_LOW = 0xfe;

export const BYTE_ORDER_MARKS_UTF16: readonly (readonly [number, number])[] = [
  [BOM_HIGH, BOM_LOW],
  [BOM_LOW, BOM_HIGH],
];
