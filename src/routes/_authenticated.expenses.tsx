import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, StatCard } from "@/components/ui-blocks";
import { ReceiptThumb } from "@/components/ReceiptThumb";
import { useOverview } from "@/hooks/use-splitsmart";
import { EXPENSE_CATEGORIES, formatDate, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — SplitSmart" },
      {
        name: "description",
        content: "Search and filter every expense recorded across all of your SplitSmart groups.",
      },
      { property: "og:title", content: "Expenses — SplitSmart" },
      { property: "og:description", content: "Equal splits, payers and per-person shares." },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { data, isLoading } = useOverview();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [category, setCategory] = useState("all");

  const groupOptions = (data?.groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    members: g.members,
  }));

  const rows = useMemo(() => {
    const all = data?.expenses ?? [];
    const q = query.trim().toLowerCase();
    return all.filter(
      (e) =>
        (group === "all" || e.groupId === group) &&
        (category === "all" || e.category === category) &&
        (!q || e.title.toLowerCase().includes(q) || e.paidByName.toLowerCase().includes(q)),
    );
  }, [data, query, group, category]);

  const total = rows.reduce((s, e) => s + e.amount, 0);
  const myShare = rows.reduce(
    (s, e) => s + (e.participants.find((p) => p.userId === data?.currentUserId)?.share ?? 0),
    0,
  );

  return (
    <AppShell
      title="Expenses"
      description="Every expense across your groups, newest first."
      actions={<AddExpenseDialog groups={groupOptions} />}
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (data?.expenses.length ?? 0) === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses recorded."
          description="Add an expense in one of your groups and it will show up here."
          action={<AddExpenseDialog groups={groupOptions} />}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Matching expenses" value={String(rows.length)} />
            <StatCard label="Total value" value={formatMoney(total)} />
            <StatCard label="Your share" value={formatMoney(myShare)} />
          </div>

          <div className="surface-card grid gap-3 p-4 sm:grid-cols-3">
            <Input
              placeholder="Search title or payer"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search expenses"
            />
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger aria-label="Filter by group">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                {(data?.groups ?? []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No expenses match those filters.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((e) => (
                <li
                  key={e.id}
                  className="surface-card flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ReceiptThumb url={e.receiptUrl} title={e.title} />
                    <div className="min-w-0">
                    <p className="truncate font-medium">{e.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.groupName} · paid by {e.paidByName} · {formatDate(e.expenseDate)} ·{" "}
                      {e.participants.length} sharing {formatMoney(e.participants[0]?.share ?? 0)}{" "}
                      each
                    </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{e.category}</Badge>
                    <span className="font-semibold tabular-nums">{formatMoney(e.amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AppShell>
  );
}
