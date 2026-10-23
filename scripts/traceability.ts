import fs from 'node:fs';
import path from 'node:path';
import { TRACEABILITY_PATH } from './gate.constants.ts';
import type { GateProblem, TraceabilityEntry, TraceabilityFs, TraceabilityProof } from './gate.types.ts';

const TEST_PROOF = 'test';
const READY_PROOF_KINDS: readonly string[] = ['workflow', 'script'];

const problem = (entry: TraceabilityEntry, message: string): GateProblem => ({ file: TRACEABILITY_PATH, message: `"${entry.promise}": ${message}` });

function proofProblem(entry: TraceabilityEntry, proof: TraceabilityProof, files: TraceabilityFs): readonly GateProblem[] {
  if (!files.exists(proof.path)) return [problem(entry, `a prova ${proof.path} não existe.`)];
  if (proof.name !== undefined && !files.read(proof.path).includes(proof.name)) {
    return [problem(entry, `o nome "${proof.name}" não aparece em ${proof.path}.`)];
  }
  return [];
}

function stateProblems(entry: TraceabilityEntry): readonly GateProblem[] {
  const kinds = entry.proofs.map((proof) => proof.kind);
  if (entry.state === 'missing') return [problem(entry, 'a promessa está sem prova (estado missing).')];
  if (entry.proofs.length === 0) return [problem(entry, 'a promessa não aponta para nenhuma prova.')];
  if (entry.state === 'green' && !kinds.includes(TEST_PROOF)) return [problem(entry, 'o estado green exige ao menos um teste.')];
  if (entry.state === 'ready' && !kinds.some((kind) => READY_PROOF_KINDS.includes(kind))) {
    return [problem(entry, 'o estado ready exige um workflow ou um script.')];
  }
  return [];
}

export function checkTraceability(entries: readonly TraceabilityEntry[], files: TraceabilityFs): readonly GateProblem[] {
  return entries.flatMap((entry) => [...stateProblems(entry), ...entry.proofs.flatMap((proof) => proofProblem(entry, proof, files))]);
}

export function loadTraceability(root: string): readonly TraceabilityEntry[] {
  return JSON.parse(fs.readFileSync(path.join(root, TRACEABILITY_PATH), 'utf8')) as readonly TraceabilityEntry[];
}

export function realFiles(root: string): TraceabilityFs {
  return { exists: (file) => fs.existsSync(path.join(root, file)), read: (file) => fs.readFileSync(path.join(root, file), 'utf8') };
}
