const nextRow = (row: readonly number[], leftChar: string, rightChars: readonly string[]): readonly number[] =>
  rightChars.reduce<readonly number[]>(
    (current, rightChar, column) => [
      ...current,
      Math.min((row[column + 1] ?? 0) + 1, (current[column] ?? 0) + 1, (row[column] ?? 0) + (leftChar === rightChar ? 0 : 1)),
    ],
    [(row[0] ?? 0) + 1],
  );

export function editDistance(left: string, right: string): number {
  const rightChars = Array.from(right);
  const initial = Array.from({ length: rightChars.length + 1 }, (_unused, index) => index);
  const last = Array.from(left).reduce<readonly number[]>((row, leftChar) => nextRow(row, leftChar, rightChars), initial);
  return last[rightChars.length] ?? 0;
}
