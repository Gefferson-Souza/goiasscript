// Levenshtein com corte: devolve a distância exata se for <= limit, senão limit + 1.
// Aparar prefixo e sufixo comuns e reusar buffers mantém a busca de sugestão barata em escopos grandes.
class BoundedEditDistance {
  private previous: number[] = [];
  private current: number[] = [];

  compute(a: string, b: string, limit: number): number {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    let start = 0;
    while (start < a.length && start < b.length && a.charCodeAt(start) === b.charCodeAt(start)) start += 1;
    let endA = a.length;
    let endB = b.length;
    while (endA > start && endB > start && a.charCodeAt(endA - 1) === b.charCodeAt(endB - 1)) {
      endA -= 1;
      endB -= 1;
    }
    const lengthA = endA - start;
    const lengthB = endB - start;
    if (lengthA === 0 || lengthB === 0) return Math.min(Math.max(lengthA, lengthB), limit + 1);
    return this.fillRows(a.slice(start, endA), b.slice(start, endB), limit);
  }

  private fillRows(a: string, b: string, limit: number): number {
    const width = b.length + 1;
    for (let column = 0; column < width; column += 1) this.previous[column] = column;
    for (let row = 1; row <= a.length; row += 1) {
      this.current[0] = row;
      let rowMinimum = row;
      for (let column = 1; column < width; column += 1) {
        const cost = a.charCodeAt(row - 1) === b.charCodeAt(column - 1) ? 0 : 1;
        const value = Math.min((this.previous[column] ?? 0) + 1, (this.current[column - 1] ?? 0) + 1, (this.previous[column - 1] ?? 0) + cost);
        this.current[column] = value;
        if (value < rowMinimum) rowMinimum = value;
      }
      if (rowMinimum > limit) return limit + 1;
      [this.previous, this.current] = [this.current, this.previous];
    }
    return Math.min(this.previous[b.length] ?? 0, limit + 1);
  }
}

const SHARED = new BoundedEditDistance();

export const editDistanceWithin = (a: string, b: string, limit: number): number => SHARED.compute(a, b, limit);
