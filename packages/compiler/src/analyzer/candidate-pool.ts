import { DeletionIndex } from './deletion-index.ts';
import { editDistanceWithin } from './edit-distance.ts';
import type { NameMatch } from './candidate-pool.types.ts';
import { LINEAR_SCAN_LIMIT, MAX_SUGGESTION_DISTANCE } from './name-checks.constants.ts';

export class CandidatePool {
  private readonly names: string[] = [];
  private index: DeletionIndex | undefined;

  static of(names: Iterable<string>): CandidatePool {
    const pool = new CandidatePool();
    for (const name of names) pool.add(name);
    return pool;
  }

  add(name: string): void {
    this.names.push(name);
    this.index?.add(name, this.names.length - 1);
  }

  // Devolve o melhor entre `best` e os candidatos deste pool; empate fica com o que veio antes.
  closest(name: string, best: NameMatch | undefined): NameMatch | undefined {
    let result = best;
    for (const id of this.candidateIds(name)) {
      const candidate = this.names[id] ?? '';
      const distance = editDistanceWithin(name, candidate, MAX_SUGGESTION_DISTANCE);
      if (distance <= MAX_SUGGESTION_DISTANCE && (result === undefined || distance < result.distance)) result = { name: candidate, distance };
    }
    return result;
  }

  private candidateIds(name: string): Iterable<number> {
    if (this.names.length <= LINEAR_SCAN_LIMIT) return this.names.keys();
    if (this.index === undefined) {
      this.index = new DeletionIndex();
      this.names.forEach((existing, id) => this.index?.add(existing, id));
    }
    return this.index.candidateIds(name);
  }
}

export function closestInPools(name: string, pools: Iterable<CandidatePool>): string | undefined {
  let best: NameMatch | undefined;
  for (const pool of pools) best = pool.closest(name, best);
  return best?.name;
}
