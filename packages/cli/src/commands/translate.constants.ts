export const TRANSLATE_TEXT = {
  done: { root: 'Tá pronto, sô!', neutral: 'Pronto!' },
  optimizeFailed: {
    root: 'Não deu pra otimizar, sô; gravei a saída normal.\n',
    neutral: 'Não foi possível otimizar; a saída normal foi gravada.\n',
  },
  writeFailed: { root: 'não consegui gravar o arquivo de saída', neutral: 'não foi possível gravar o arquivo de saída' },
} as const;

export const OVERWRITE_FLAG = '--sobrescreve';
export const WRITE_EXISTS_REASON = 'já existe';
