import type { GateIo, GateMessages, GateProblem } from './gate.types.ts';

export const processIo: GateIo = { out: (text) => process.stdout.write(text), err: (text) => process.stderr.write(text) };

export function reportGate(problems: readonly GateProblem[], io: GateIo, messages: GateMessages): number {
  if (problems.length === 0) {
    io.out(`${messages.success}\n`);
    return 0;
  }
  for (const item of problems) io.err(`${item.file}: ${item.message}\n`);
  io.err(`${messages.failure(problems.length)}\n`);
  return 1;
}
