import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Binary, GitBranch, Hash, Layers, Wallet, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How SplitSmart works — the DSA behind it" },
      {
        name: "description",
        content:
          "Inside SplitSmart: a HashMap for balances, a directed debt graph, max-heaps and a greedy algorithm that minimizes the number of payments.",
      },
      { property: "og:title", content: "How SplitSmart works — the DSA behind it" },
      {
        property: "og:description",
        content: "HashMap, directed graph, max-heap and greedy matching explained step by step.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const STRUCTURES = [
  {
    icon: Hash,
    name: "HashMap (separate chaining)",
    complexity: "O(1) average insert / lookup",
    body: "Every expense updates two running totals per member: what they paid, and their fair share. A custom hash map with bucket chaining keys those totals by user id, so aggregating thousands of expenses stays linear in the number of expense-participant pairs.",
  },
  {
    icon: GitBranch,
    name: "Directed debt graph",
    complexity: "O(V + E) traversal",
    body: "Each expense creates directed edges: every participant owes the payer their share. Stored as an adjacency map of maps, parallel edges collapse and mutual debts cancel out — the naive edge count is exactly how many payments people would make without optimization.",
  },
  {
    icon: Binary,
    name: "Max-heap priority queue",
    complexity: "O(log n) push / pop",
    body: "Net balances split into two binary max-heaps: creditors ordered by the largest amount owed to them, debtors ordered by the largest amount they owe. The heap invariant is restored by sift-up and sift-down on every operation.",
  },
  {
    icon: Zap,
    name: "Greedy settlement matching",
    complexity: "O(n log n)",
    body: "Repeatedly pop the biggest debtor and the biggest creditor, transfer the smaller of the two amounts, and push back whatever remains. Each transfer fully clears at least one person, so the plan needs at most n − 1 payments instead of one payment per debt edge.",
  },
] as const;

const STEPS = [
  "Record expenses. Each amount is split equally between the selected participants, and shares are rounded so the pennies always add back to the exact total.",
  "Aggregate with the HashMap. paid[u] and share[u] are summed in one pass over every expense participant.",
  "Compute net balance. net[u] = paid[u] − share[u]; positive means the group owes them, negative means they owe the group.",
  "Build the debt graph. Directed edges from each participant to the payer show the raw web of who-owes-who.",
  "Optimize greedily. Two max-heaps drive largest-debtor-to-largest-creditor matching until every balance is zero.",
  "Save the plan. The minimal transfer list is stored so every member on every device sees the same settlement.",
] as const;

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="size-5" />
            </span>
            <span className="font-display text-lg font-bold">SplitSmart</span>
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back home
        </Link>

        <h1 className="mt-6 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          How SplitSmart works
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          SplitSmart is a real data-structures project. Balances, debts and settlements are computed
          with hand-written structures rather than library helpers — here is exactly what runs when
          you press “Optimize settlement”.
        </p>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {STRUCTURES.map(({ icon: Icon, name, complexity, body }) => (
            <article key={name} className="surface-card p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-3 text-lg font-semibold">{name}</h2>
              <Badge variant="secondary" className="mt-2">
                {complexity}
              </Badge>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Layers className="size-5 text-primary" /> The pipeline, step by step
          </h2>
          <ol className="mt-5 space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="surface-card flex gap-4 p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">A worked example</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Four friends, three expenses, six raw debt edges — settled in three payments.
          </p>
          <div className="surface-card mt-4 overflow-x-auto p-5">
            <pre className="font-mono text-xs leading-relaxed text-muted-foreground">{`net balances (paid - share)
  Aarav  +900   Diya  +150   Kabir  -450   Meera  -600

max-heaps
  creditors: [Aarav 900, Diya 150]
  debtors:   [Meera 600, Kabir 450]

greedy matching
  Meera -> Aarav  600   (Meera cleared)
  Kabir -> Aarav  300   (Aarav cleared, 150 left in Kabir)
  Kabir -> Diya   150   (all balances zero)

result: 3 transfers instead of 6 edges`}</pre>
          </div>
        </section>

        <section className="surface-card mt-12 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-xl font-bold">Try it with your own group</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a group, add a few expenses, and watch the transfer count drop.
            </p>
          </div>
          <Button asChild>
            <Link to="/register">Create free account</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
