import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Receipt, Trash2, UserPlus, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReceiptThumb } from "@/components/ReceiptThumb";
import { EmptyState, StatCard } from "@/components/ui-blocks";
import { useGroup } from "@/hooks/use-splitsmart";
import {
  addGroupMember,
  deleteExpense,
  generateSettlement,
} from "@/lib/splitsmart.functions";
import { formatDate, formatMoney, friendlyError, initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/groups/$groupId")({
  head: () => ({
    meta: [
      { title: "Group details — SplitSmart" },
      {
        name: "description",
        content: "Members, expenses, net balances and the optimized settlement plan for this group.",
      },
      { property: "og:title", content: "Group details — SplitSmart" },
      { property: "og:description", content: "Balances computed with a debt graph and greedy matching." },
    ],
  }),
  component: GroupDetailPage,
});

function GroupDetailPage() {
  const { groupId } = Route.useParams();
  const { data, isLoading, error } = useGroup(groupId);
  const queryClient = useQueryClient();
  const invite = useServerFn(addGroupMember);
  const removeExpense = useServerFn(deleteExpense);
  const optimize = useServerFn(generateSettlement);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    void queryClient.invalidateQueries({ queryKey: ["overview"] });
  }

  async function onInvite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await invite({ data: { groupId, email: email.trim() } });
      toast.success(`${res.name} added to the group.`);
      setEmail("");
      refresh();
    } catch (err) {
      toast.error(friendlyError(err, "Could not add that member."));
    } finally {
      setBusy(false);
    }
  }

  async function onOptimize() {
    setBusy(true);
    try {
      const res = await optimize({ data: { groupId } });
      toast.success(`${res.created} transfers generated (${res.transfersSaved} saved).`);
      refresh();
    } catch (err) {
      toast.error(friendlyError(err, "Could not generate the settlement."));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(expenseId: string) {
    try {
      await removeExpense({ data: { expenseId } });
      toast.success("Expense deleted.");
      refresh();
    } catch (err) {
      toast.error(friendlyError(err, "Could not delete that expense."));
    }
  }

  const nameOf = (userId: string) =>
    data?.members.find((m) => m.userId === userId)?.name ?? "Member";

  return (
    <AppShell
      title={data?.group.name ?? "Group"}
      description={data?.group.description || "Members, expenses and balances."}
      actions={
        data ? (
          <>
            <AddExpenseDialog
              groups={[{ id: data.group.id, name: data.group.name, members: data.members }]}
              defaultGroupId={data.group.id}
            />
            <Button variant="outline" onClick={onOptimize} disabled={busy}>
              <Zap className="size-4" /> Optimize settlement
            </Button>
          </>
        ) : null
      }
    >
      <Link
        to="/groups"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All groups
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : error || !data ? (
        <p className="text-sm text-destructive">Could not load this group.</p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total spent" value={formatMoney(data.stats.totalSpent)} />
            <StatCard label="Expenses" value={String(data.stats.expenseCount)} />
            <StatCard label="Average expense" value={formatMoney(data.stats.averageExpense)} />
            <StatCard
              label="Optimized transfers"
              value={`${data.pipeline.optimizedTransactionCount} of ${data.pipeline.rawTransactionCount}`}
              hint={`${data.pipeline.transfersSaved} payments avoided`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="surface-card p-5">
              <h2 className="text-lg font-semibold">Net balances</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                HashMap aggregation of everything paid minus everything owed.
              </p>
              <ul className="mt-4 space-y-2">
                {data.pipeline.balances.map((b) => (
                  <li
                    key={b.userId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {initials(nameOf(b.userId))}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {nameOf(b.userId)}
                          {b.userId === data.currentUserId ? " (you)" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          paid {formatMoney(b.totalPaid)} · share {formatMoney(b.totalShare)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        b.netBalance > 0.005
                          ? "text-success"
                          : b.netBalance < -0.005
                            ? "text-warning"
                            : "text-muted-foreground"
                      }`}
                    >
                      {b.netBalance > 0.005
                        ? `gets ${formatMoney(b.netBalance)}`
                        : b.netBalance < -0.005
                          ? `owes ${formatMoney(-b.netBalance)}`
                          : "settled"}
                    </span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-8 text-lg font-semibold">Optimized transfers</h3>
              {data.pipeline.transactions.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Everyone is settled up.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.pipeline.transactions.map((t, i) => (
                    <li
                      key={`${t.from}-${t.to}-${i}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary p-3 text-sm"
                    >
                      <span>
                        <strong>{nameOf(t.from)}</strong> pays <strong>{nameOf(t.to)}</strong>
                      </span>
                      <span className="font-semibold tabular-nums">{formatMoney(t.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="surface-card h-fit p-5">
              <h2 className="text-lg font-semibold">Members ({data.members.length})</h2>
              <ul className="mt-3 space-y-2">
                {data.members.map((m) => (
                  <li key={m.userId} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {initials(m.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <form onSubmit={onInvite} className="mt-5 space-y-2">
                <Label htmlFor="member-email">Add member by email</Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="friend@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="outline" className="w-full" disabled={busy}>
                  <UserPlus className="size-4" /> Add member
                </Button>
                <p className="text-xs text-muted-foreground">
                  They need a SplitSmart account with that email.
                </p>
              </form>
            </aside>
          </div>

          <section className="surface-card p-5">
            <h2 className="text-lg font-semibold">Expenses</h2>
            {data.expenses.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No expenses yet."
                description="Record the first expense and balances update instantly."
              />
            ) : (
              <ul className="mt-4 space-y-2">
                {data.expenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ReceiptThumb url={e.receiptUrl} title={e.title} />
                      <div className="min-w-0">
                      <p className="truncate font-medium">{e.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        paid by {nameOf(e.paidBy)} · {formatDate(e.expenseDate)} ·{" "}
                        {e.participants.length} sharing ·{" "}
                        {formatMoney(e.participants[0]?.share ?? 0)} each
                      </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{e.category}</Badge>
                      <span className="font-semibold tabular-nums">{formatMoney(e.amount)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${e.title}`}
                        onClick={() => onDelete(e.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
