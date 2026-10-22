import { HELPER_PREFIX, TICK_HELPER } from '../helpers/helper.constants.ts';

const TICK_NAME = `${HELPER_PREFIX}${TICK_HELPER}`;

export const tickSource = (limit: number): string =>
  [
    `function ${TICK_NAME}(line) {`,
    `  ${TICK_NAME}.n = (${TICK_NAME}.n || 0) + 1;`,
    `  if (${TICK_NAME}.n > ${String(limit)}) { throw Object.assign(new Error('GS0701'), { gsCode: 'GS0701', gsLine: line }); }`,
    '}',
  ].join('\n');
