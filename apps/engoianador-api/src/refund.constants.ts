import type { ProviderFailure } from './ports.types';

// Só falha do lado do servidor devolve a cota: client-error e empty podem ser
// provocados por quem chama, e devolver nesses casos libera chamadas pagas sem custo.
export const REFUNDABLE_FAILURES: ReadonlySet<ProviderFailure> = new Set<ProviderFailure>(['server-error', 'timeout']);
