import { DebtGraph, round2 } from "./debt-graph";
import { HashMapDS } from "./hash-map";
import { MaxHeap } from "./max-heap";

/**
 * SettlementOptimizer — greedy debt settlement using a HashMap, a directed
 * graph and two max-heaps (priority queues).
 *
 * Pipeline:
 *  1. HashMap pass over expenses  -> totalPaid / totalShare / net balance
 *  2. Directed graph              -> raw debt edges (participant -> payer)
 *  3. Two priority queues         -> largest creditor, largest debtor
 *  4. Greedy matching             -> minimum number of transfers
 *
 * Time complexity (n = members, m = expense-participant rows):
 *  step 1: O(m) with O(1) average HashMap lookups
 *  step 2: O(m) edge insertions, O(V + E) to read edges
 *  step 3: O(n log n) to build the heaps
 *  step 4: each iteration removes at least one person from a heap, so it runs
 *          at most 2n - 1 times, each with O(log n) heap work -> O(n log n)
 *  overall: O(m + n log n)
 */

export interface ExpenseRow {
  id: string;
  paidBy: string;
  amount: number;
  participants: Array<{ userId: string; share: number }>;
}

export interface MemberBalance {
  userId: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number;
}

export interface SettlementTransaction {
  from: string;
  to: string;
  amount: number;
}

export interface SettlementResult {
  balances: MemberBalance[];
  /** Debt edges before optimisation (the naive "one transfer per debt" view). */
  rawEdges: Array<{ from: string; to: string; amount: number }>;
  rawTransactionCount: number;
  transactions: SettlementTransaction[];
  optimizedTransactionCount: number;
  totalToSettle: number;
  transfersSaved: number;
}

/** Step 1 — HashMap based balance computation. O(m) average. */
export function computeBalances(memberIds: string[], expenses: ExpenseRow[]): MemberBalance[] {
  const paid = new HashMapDS<string, number>();
  const share = new HashMapDS<string, number>();
  for (const id of memberIds) {
    paid.put(id, 0);
    share.put(id, 0);
  }

  for (const expense of expenses) {
    paid.put(expense.paidBy, paid.getOrDefault(expense.paidBy, 0) + expense.amount);
    for (const p of expense.participants) {
      share.put(p.userId, share.getOrDefault(p.userId, 0) + p.share);
    }
  }

  const ids = new Set([...memberIds, ...paid.keys(), ...share.keys()]);
  return [...ids].map((userId) => {
    const totalPaid = round2(paid.getOrDefault(userId, 0));
    const totalShare = round2(share.getOrDefault(userId, 0));
    return { userId, totalPaid, totalShare, netBalance: round2(totalPaid - totalShare) };
  });
}

/** Step 2 — build the directed debt graph from raw expense rows. */
export function buildDebtGraph(memberIds: string[], expenses: ExpenseRow[]): DebtGraph {
  const graph = new DebtGraph();
  for (const id of memberIds) graph.addNode(id);
  for (const expense of expenses) {
    for (const p of expense.participants) {
      // participant owes the payer their share (self-share cancels out)
      graph.addDebt(p.userId, expense.paidBy, p.share);
    }
  }
  return graph;
}

/** Steps 3 + 4 — greedy matching driven by two max-heaps. */
export function optimizeSettlement(balances: MemberBalance[]): SettlementTransaction[] {
  type Node = { userId: string; amount: number };
  // Highest amount first in both queues.
  const creditors = new MaxHeap<Node>((a, b) => a.amount - b.amount);
  const debtors = new MaxHeap<Node>((a, b) => a.amount - b.amount);

  for (const b of balances) {
    if (b.netBalance > 0.004) creditors.push({ userId: b.userId, amount: b.netBalance });
    else if (b.netBalance < -0.004) debtors.push({ userId: b.userId, amount: -b.netBalance });
  }

  const transactions: SettlementTransaction[] = [];
  while (!creditors.isEmpty() && !debtors.isEmpty()) {
    const creditor = creditors.pop()!;
    const debtor = debtors.pop()!;
    const amount = round2(Math.min(creditor.amount, debtor.amount));
    if (amount > 0.004) {
      transactions.push({ from: debtor.userId, to: creditor.userId, amount });
    }
    const creditorLeft = round2(creditor.amount - amount);
    const debtorLeft = round2(debtor.amount - amount);
    // Anyone left with a non-zero balance goes back into their queue.
    if (creditorLeft > 0.004) creditors.push({ userId: creditor.userId, amount: creditorLeft });
    if (debtorLeft > 0.004) debtors.push({ userId: debtor.userId, amount: debtorLeft });
  }

  return transactions.sort((a, b) => b.amount - a.amount);
}

/** Runs the full pipeline and reports how many transfers were saved. */
export function runSettlementPipeline(
  memberIds: string[],
  expenses: ExpenseRow[],
): SettlementResult {
  const balances = computeBalances(memberIds, expenses);
  const graph = buildDebtGraph(memberIds, expenses);
  const rawEdges = graph.edges();
  const transactions = optimizeSettlement(balances);
  const totalToSettle = round2(transactions.reduce((sum, t) => sum + t.amount, 0));

  return {
    balances,
    rawEdges,
    rawTransactionCount: rawEdges.length,
    transactions,
    optimizedTransactionCount: transactions.length,
    totalToSettle,
    transfersSaved: Math.max(0, rawEdges.length - transactions.length),
  };
}

/**
 * Equal split with correct rounding: every participant gets floor-to-paise
 * share and the remaining paise are distributed one by one, so
 * SUM(shares) === amount exactly.
 */
export function equalSplit(amount: number, participantIds: string[]): Array<{ userId: string; share: number }> {
  const n = participantIds.length;
  if (n === 0) return [];
  const totalPaise = Math.round(amount * 100);
  const base = Math.floor(totalPaise / n);
  let remainder = totalPaise - base * n;
  return participantIds.map((userId) => {
    let paise = base;
    if (remainder > 0) {
      paise += 1;
      remainder -= 1;
    }
    return { userId, share: paise / 100 };
  });
}
