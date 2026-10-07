import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Users, Receipt, Wallet, TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, StatCard } from "@/components/ui-blocks";
import { useOverview } from "@/hooks/use-splitsmart";
import { formatDate, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SplitSmart" },
      {
        name: "description",
        content: "Your groups, spending, what you owe and what you should receive at a glance.",
      },
      { property: "og:title", content: "Dashboard — SplitSmart" },
      { property: "og:description", content: "Live totals from your real groups and expenses." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading, error } = useOverview();

  const groupOptions = (data?.groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    members: g.members,
  }));

  return (
    <AppShell
      title="Dashboard"
      description="Everything calculated live from your groups and expenses."
      actions={
        <>
          <CreateGroupDialog />
          <AddExpenseDialog groups={groupOptions} />
        </>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">Could not load your dashboard. Please refresh.</p>
      ) : !data || data.totals.groups === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet."
          description="Create your first group to start splitting expenses with your friends."
          action={<CreateGroupDialog />}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Groups" value={String(data.totals.groups)} icon={Users} />
            <StatCard label="Expenses" value={String(data.totals.expenses)} icon={Receipt} />
            <StatCard label="Total spent" value={formatMoney(data.totals.spent)} icon={Wallet} />
            <StatCard
              label="You owe"
              value={formatMoney(data.totals.owe)}
              tone="negative"
              icon={TrendingDown}
            />
            <StatCard
              label="You should receive"
              value={formatMoney(data.totals.receive)}
              tone="positive"
              icon={TrendingUp}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/groups">View groups</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/settlement">View settlements</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/analytics">View analytics</Link>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="surface-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent groups</h2>
                <Link to="/groups" className="text-sm font-medium text-primary">
                  All groups
                </Link>
              </div>
              <ul className="space-y-3">
                {data.groups.slice(0, 4).map((g) => (
                  <li key={g.id}>
                    <Link
                      to="/groups/$groupId"
                      params={{ groupId: g.id }}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{g.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.memberCount} members · {g.expenseCount} expenses
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatMoney(g.totalSpent)}
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="surface-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent expenses</h2>
                <Link to="/history" className="text-sm font-medium text-primary">
                  Full history
                </Link>
              </div>
              {data.expenses.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No expenses recorded yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.expenses.slice(0, 5).map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.groupName} · paid by {e.paidByName} · {formatDate(e.expenseDate)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary">{e.category}</Badge>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatMoney(e.amount)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
