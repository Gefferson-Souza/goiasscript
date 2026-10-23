import { CONFIGURED_PORT_ENV, DEFAULT_PORT_ENV } from '../../playwright.constants.ts';
import { resolveEphemeralPort } from './ephemeral-port.ts';

const LOCAL_HOST = '127.0.0.1';

const originOf = (port: number): string => `http://${LOCAL_HOST}:${String(port)}`;

export const defaultServerOrigin = (): string => originOf(resolveEphemeralPort(DEFAULT_PORT_ENV));

export const configuredServerOrigin = (): string => originOf(resolveEphemeralPort(CONFIGURED_PORT_ENV));
