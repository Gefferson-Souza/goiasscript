import { RUNNER_URL } from '../../sandbox/protocol.constants.ts';
import type { WorkerPort } from './runner-client.types.ts';

export const createBrowserWorker = (): WorkerPort => new Worker(RUNNER_URL, { type: 'module' });
