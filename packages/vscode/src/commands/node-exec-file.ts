import { execFile } from 'node:child_process';
import type { ExecFileLike } from './commands.types.ts';

const OUTPUT_ENCODING = 'utf8';

// A referência a execFile é lida a cada chamada, para o teste dentro do VS Code poder espionar o módulo.
export const nodeExecFile: ExecFileLike = (file, args, options, callback) => execFile(file, [...args], { ...options, encoding: OUTPUT_ENCODING }, callback);
