import { SHARE_HASH_PREFIX } from '../share-link.constants.ts';
import { PLAYGROUND_ROUTE } from './routes.constants.ts';

/** Links antigos apontavam o código para "/"; agora o editor mora em /playground. */
export function legacyShareTarget(search: string, hash: string): string | null {
  return hash.startsWith(SHARE_HASH_PREFIX) ? `${PLAYGROUND_ROUTE}${search}${hash}` : null;
}
