/**
 * MaxHeap — binary heap used as a priority queue.
 *
 * Why a heap for SplitSmart?
 * The greedy settlement algorithm repeatedly needs "the person who is owed the
 * most" and "the person who owes the most". A heap gives us that largest
 * element in O(1) (peek) and removes it in O(log n), instead of re-sorting or
 * re-scanning the list on every step.
 *
 * Complexity: push -> O(log n), pop -> O(log n), peek -> O(1), size -> O(1).
 */
export class MaxHeap<T> {
  private items: T[] = [];

  /**
   * @param compare returns > 0 when `a` has higher priority than `b`.
   *                For creditors/debtors we compare by absolute amount, so the
   *                largest outstanding balance always sits at the root.
   */
  constructor(private readonly compare: (a: T, b: T) => number) {}

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  push(item: T): void {
    this.items.push(item);
    this.siftUp(this.items.length - 1);
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const root = this.items[0]!;
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.siftDown(0);
    }
    return root;
  }

  private siftUp(index: number): void {
    let i = index;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.items[i]!, this.items[parent]!) <= 0) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  private siftDown(index: number): void {
    let i = index;
    const n = this.items.length;
    for (;;) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let largest = i;
      if (left < n && this.compare(this.items[left]!, this.items[largest]!) > 0) largest = left;
      if (right < n && this.compare(this.items[right]!, this.items[largest]!) > 0) largest = right;
      if (largest === i) break;
      this.swap(i, largest);
      i = largest;
    }
  }

  private swap(a: number, b: number): void {
    const tmp = this.items[a]!;
    this.items[a] = this.items[b]!;
    this.items[b] = tmp;
  }
}
