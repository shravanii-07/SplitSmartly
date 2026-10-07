/**
 * HashMap — separate-chaining hash table (real implementation, not a wrapper
 * around the built-in Map).
 *
 * Why a HashMap for SplitSmart?
 * Balance calculation walks every expense and every participant of every
 * expense. For each row we need to *find* the running balance of one member
 * and update it. With an array we would scan the whole member list each time
 * -> O(n) per lookup, O(n * m) overall. A hash table converts each of those
 * lookups into an average O(1) operation, so the whole balance pass is O(m)
 * where m = number of (expense, participant) rows.
 *
 * Complexity: put / get / has / remove -> O(1) average, O(n) worst case
 * (all keys colliding into a single bucket).
 */

interface Entry<K, V> {
  key: K;
  value: V;
  next: Entry<K, V> | null;
}

export class HashMapDS<K extends string | number, V> {
  private buckets: Array<Entry<K, V> | null>;
  private count = 0;
  private readonly loadFactor = 0.75;

  constructor(initialCapacity = 16) {
    this.buckets = new Array(Math.max(4, initialCapacity)).fill(null);
  }

  /** Simple deterministic string hash (djb2 variant). */
  private hash(key: K): number {
    const s = String(key);
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) | 0; // h * 33 + c
    }
    return Math.abs(h) % this.buckets.length;
  }

  put(key: K, value: V): void {
    const index = this.hash(key);
    let node = this.buckets[index] ?? null;
    while (node) {
      if (node.key === key) {
        node.value = value;
        return;
      }
      node = node.next;
    }
    this.buckets[index] = { key, value, next: this.buckets[index] ?? null };
    this.count++;
    if (this.count / this.buckets.length > this.loadFactor) this.resize();
  }

  get(key: K): V | undefined {
    let node = this.buckets[this.hash(key)] ?? null;
    while (node) {
      if (node.key === key) return node.value;
      node = node.next;
    }
    return undefined;
  }

  getOrDefault(key: K, fallback: V): V {
    const found = this.get(key);
    return found === undefined ? fallback : found;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  remove(key: K): boolean {
    const index = this.hash(key);
    let node = this.buckets[index] ?? null;
    let prev: Entry<K, V> | null = null;
    while (node) {
      if (node.key === key) {
        if (prev) prev.next = node.next;
        else this.buckets[index] = node.next;
        this.count--;
        return true;
      }
      prev = node;
      node = node.next;
    }
    return false;
  }

  get size(): number {
    return this.count;
  }

  keys(): K[] {
    const out: K[] = [];
    for (const bucket of this.buckets) {
      let node = bucket;
      while (node) {
        out.push(node.key);
        node = node.next;
      }
    }
    return out;
  }

  entries(): Array<[K, V]> {
    const out: Array<[K, V]> = [];
    for (const bucket of this.buckets) {
      let node = bucket;
      while (node) {
        out.push([node.key, node.value]);
        node = node.next;
      }
    }
    return out;
  }

  /** Doubling the bucket array keeps the average chain length near 1. */
  private resize(): void {
    const old = this.entries();
    this.buckets = new Array(this.buckets.length * 2).fill(null);
    this.count = 0;
    for (const [k, v] of old) this.put(k, v);
  }
}
