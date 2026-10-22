export class ListBuilder<T> {
  private readonly items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  build(): readonly T[] {
    return [...this.items];
  }
}
