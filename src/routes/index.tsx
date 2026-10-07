import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Wallet,
  Users,
  Network,
  ListOrdered,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SplitSmart — Split Group Expenses & Settle Up Smartly" },
      {
        name: "description",
        content:
          "SplitSmart records shared expenses, calculates each person's share and net balance, then generates the smallest possible set of payments to settle up.",
      },
      { property: "og:title", content: "SplitSmart — Split Group Expenses & Settle Up Smartly" },
      {
        property: "og:description",
        content:
          "Groups, expenses, balances and an optimized settlement plan powered by a debt graph, priority queues and a greedy algorithm.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Users,
    title: "Groups that stay in sync",
    body: "Create a group, add members by email, and everyone sees the same data from any device.",
  },
  {
    icon: Wallet,
    title: "Fair equal splitting",
    body: "Shares are rounded to the paisa so the split always adds up to the exact expense amount.",
  },
  {
    icon: Network,
    title: "Debt graph + net balances",
    body: "Every expense becomes directed debt edges; opposite edges cancel out automatically.",
  },
  {
    icon: ListOrdered,
    title: "Greedy settlement plan",
    body: "Two priority queues match the largest creditor with the largest debtor to minimise transfers.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">SplitSmart</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/how-it-works">How it works</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="hero-glow px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> Built for hostel gangs, trips and project
            teams
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
            Split expenses fairly. Settle up in the fewest payments.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            SplitSmart tracks who paid what, works out each person's exact share and net balance,
            then uses a debt graph, priority queues and a greedy algorithm to compress everything
            into the smallest possible settlement plan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/register">
                Create your account <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/how-it-works">See the algorithm</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-card p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-5xl surface-card p-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="size-5 text-success" />
            Passwords are hashed by the auth service, group data is protected by row-level access
            rules, and every calculation runs on the server from your real expenses.
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
        SplitSmart — Smart Group Expense &amp; Settlement Manager
      </footer>
    </div>
  );
}
