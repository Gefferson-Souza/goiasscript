import { INDEX_PREFIX_LIMIT, MAX_SUGGESTION_DISTANCE } from './name-checks.constants.ts';

const withoutEachCharacter = (key: string): readonly string[] =>
  Array.from({ length: key.length }, (_, position) => key.slice(0, position) + key.slice(position + 1));

function deletionKeys(name: string): ReadonlySet<string> {
  const start: ReadonlySet<string> = new Set([name.slice(0, INDEX_PREFIX_LIMIT)]);
  return Array.from({ length: MAX_SUGGESTION_DISTANCE }).reduce<ReadonlySet<string>>(
    (all) => new Set([...all, ...[...all].flatMap(withoutEachCharacter)]),
    start,
  );
}

// Dois nomes a no máximo MAX_SUGGESTION_DISTANCE edições compartilham ao menos uma chave de remoção.
export class DeletionIndex {
  private readonly buckets = new Map<string, readonly number[]>();

  add(name: string, id: number): void {
    for (const key of deletionKeys(name)) this.buckets.set(key, [...(this.buckets.get(key) ?? []), id]);
  }

  // Ids em ordem crescente, para o desempate continuar sendo "o que veio antes".
  candidateIds(name: string): readonly number[] {
    const ids = new Set([...deletionKeys(name)].flatMap((key) => this.buckets.get(key) ?? []));
    return [...ids].sort((left, right) => left - right);
  }
}
