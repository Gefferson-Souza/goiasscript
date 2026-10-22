import { MINIMUM_NODE_LABEL } from '../node-version.ts';

// Texto fixo: o catálogo de diagnósticos vive no bundle, que um Node abaixo do mínimo pode não carregar.
export const OLD_NODE_FALLBACK_NOTICE = `aviso GS0904: Seu Node é antigo, sô. Precisa do ${MINIMUM_NODE_LABEL} ou mais.\n`;
