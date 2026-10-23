import { createLiveDiagnostics } from '../diagnostics/live-diagnostics.ts';
import type { Feature } from '../host/extension-host.types.ts';

export const diagnosticsFeature: Feature = {
  activate: (host) => createLiveDiagnostics({ host, timers: { set: (callback, delayMs) => setTimeout(callback, delayMs), clear: (handle) => { clearTimeout(handle as NodeJS.Timeout); } } }),
};
