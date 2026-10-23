import { editDistanceWithin } from './edit-distance.ts';
import type { NameMatch } from './candidate-pool.types.ts';
import { MASK_BITS_MODULO, MAX_MASK_DIFFERENCE, MAX_SUGGESTION_DISTANCE } from './name-checks.constants.ts';

// Cópias locais: leitura direta de import dentro do laço quente custa caro sob o transformador de teste.
const MASK_MODULO = MASK_BITS_MODULO;
const MASK_BUDGET = MAX_MASK_DIFFERENCE;

function characterMask(text: string): number {
  let mask = 0;
  for (let index = 0; index < text.length; index += 1) mask |= 1 << (text.charCodeAt(index) & MASK_MODULO);
  return mask;
}

// Cada edição liga ou desliga no máximo dois bits; apaga os bits mais baixos até o limite e vê se sobrou algum.
function exceedsMaskBudget(difference: number): boolean {
  let remaining = difference;
  for (let step = 0; step < MASK_BUDGET; step += 1) remaining &= remaining - 1;
  return remaining !== 0;
}

export class CandidatePool {
  private readonly names: string[] = [];
  private readonly masks: number[] = [];

  static of(names: Iterable<string>): CandidatePool {
    const pool = new CandidatePool();
    for (const name of names) pool.add(name);
    return pool;
  }

  add(name: string): void {
    this.names.push(name);
    this.masks.push(characterMask(name));
  }

  // Devolve o melhor entre `best` e os candidatos deste pool; empate fica com o que veio antes.
  closest(name: string, best: NameMatch | undefined): NameMatch | undefined {
    const nameMask = characterMask(name);
    let result = best;
    const { masks } = this;
    for (let index = 0; index < this.names.length; index += 1) {
      if (exceedsMaskBudget(nameMask ^ (masks[index] ?? 0))) continue;
      const candidate = this.names[index] ?? '';
      const distance = editDistanceWithin(name, candidate, MAX_SUGGESTION_DISTANCE);
      if (distance <= MAX_SUGGESTION_DISTANCE && (result === undefined || distance < result.distance)) result = { name: candidate, distance };
    }
    return result;
  }
}

export function closestInPools(name: string, pools: Iterable<CandidatePool>): string | undefined {
  let best: NameMatch | undefined;
  for (const pool of pools) best = pool.closest(name, best);
  return best?.name;
}
