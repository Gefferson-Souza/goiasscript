import { emptyDisposable } from '../host/disposable.ts';
import type { Feature } from '../host/extension-host.types.ts';

export const commandsFeature: Feature = { activate: emptyDisposable };
