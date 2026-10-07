import { HashMapDS } from "./hash-map";

/**
 * DebtGraph — a directed, weighted graph of "who owes whom".
 *
 * Representation: adjacency list stored inside our own HashMap.
 *   from -> HashMap(to -> amount)
 * An edge  B --300--> A  means "B owes A 300".
 *
 * Why a graph?
 * Every expense creates several small debt relationships. Modelling them as a
 * directed graph lets us (a) see the raw, unoptimised transaction list,
 * (b) collapse parallel/reverse edges (if B owes A 300 and A owes B 100, the
 * net edge is B -> A 200), and (c) derive each node's net balance from its
 * outgoing (owed) and incoming (owed to) edge weights.
 *
 * Complexity: addDebt -> O(1) average, edges()/netBalances() -> O(V + E).
 */
export interface DebtEdge {
  from: string;
  to: string;
  amount: number;
}

export class DebtGraph {
  private adjacency = new HashMapDS<string, HashMapDS<string, number>>();
  private nodes = new HashMapDS<string, true>();

  addNode(id: string): void {
    if (!this.nodes.has(id)) this.nodes.put(id, true);
    if (!this.adjacency.has(id)) this.adjacency.put(id, new HashMapDS<string, number>());
  }

  /** Adds `amount` to the directed edge from -> to, netting out the reverse edge. */
  addDebt(from: string, to: string, amount: number): void {
    if (from === to || amount <= 0) return;
    this.addNode(from);
    this.addNode(to);

    // Net against the opposite direction first (graph edge reduction).
    const reverse = this.adjacency.get(to)!;
    const reverseAmount = reverse.getOrDefault(from, 0);
    let remaining = amount;
    if (reverseAmount > 0) {
      const cancelled = Math.min(reverseAmount, remaining);
      const left = reverseAmount - cancelled;
      if (left > 0.004) reverse.put(from, left);
      else reverse.remove(from);
      remaining -= cancelled;
    }
    if (remaining <= 0.004) return;

    const outgoing = this.adjacency.get(from)!;
    outgoing.put(to, outgoing.getOrDefault(to, 0) + remaining);
  }

  nodeCount(): number {
    return this.nodes.size;
  }

  edges(): DebtEdge[] {
    const out: DebtEdge[] = [];
    for (const [from, outgoing] of this.adjacency.entries()) {
      for (const [to, amount] of outgoing.entries()) {
        if (amount > 0.004) out.push({ from, to, amount: round2(amount) });
      }
    }
    return out.sort((a, b) => b.amount - a.amount);
  }

  edgeCount(): number {
    return this.edges().length;
  }

  /**
   * Net balance per node: (money owed to me) - (money I owe).
   * Positive -> should receive, negative -> owes.
   */
  netBalances(): HashMapDS<string, number> {
    const balances = new HashMapDS<string, number>();
    for (const id of this.nodes.keys()) balances.put(id, balances.getOrDefault(id, 0));
    for (const edge of this.edges()) {
      balances.put(edge.from, balances.getOrDefault(edge.from, 0) - edge.amount);
      balances.put(edge.to, balances.getOrDefault(edge.to, 0) + edge.amount);
    }
    return balances;
  }
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
