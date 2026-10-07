import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, StatCard } from "@/components/ui-blocks";
import { ReceiptThumb } from "@/components/ReceiptThumb";
import { useOverview } from "@/hooks/use-splitsmart";
import { formatDate, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — SplitSmart" },
      {
        name: "description",
        content: "A single timeline of every expense and every settlement transfer in your groups.",
      },
      { property: "og:title", content: "History — SplitSmart" },
      { property: "og:description", content: "Expenses and transfers, newest first." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data, isLoading } = useOverview();
  const [tab, setTab] = useState("expenses");

  const settlements = data?.pendingSettlements ?? [];
  const completed = useMemo(() => settlements.filter((s) => s.status === "COMPLETED"), [settlements]);
  const pending = useMemo(() => settlements.filter((s) => s.status === "PENDING"), [settlements]);

  return (
    <AppShell title="History" description="Everything that happened across your groups.">
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (data?.expenses.length ?? 0) === 0 && settlements.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nothing here yet."
          description="Once you record expenses and generate settlements, the full timeline shows up here."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Expenses logged" value={String(data?.expenses.length ?? 0)} />
            <StatCard label="Pending transfers" value={String(pending.length)} tone="negative" />
            <StatCard label="Completed transfers" value={String(completed.length)} tone="positive" />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="transfers">Transfers</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="mt-4">
              <ol className="space-y-2">
                {(data?.expenses ?? []).map((e) => (
                  <li
                    key={e.id}
                    className="surface-card flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ReceiptThumb url={e.receiptUrl} title={e.title} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.groupName} · paid by {e.paidByName} · {formatDate(e.expenseDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{e.category}</Badge>
                      <span className="font-semibold tabular-nums">{formatMoney(e.amount)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="transfers" className="mt-4">
              {settlements.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No settlement transfers generated yet.
                </p>
              ) : (
                <ol className="space-y-2">
                  {settlements.map((s) => (
                    <li
                      key={s.id}
                      className="surface-card flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {s.fromName} → {s.toName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.groupName} ·{" "}
                          {s.status === "COMPLETED" && s.completed_at
                            ? `paid ${formatDate(s.completed_at)}`
                            : `created ${formatDate(s.created_at)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={s.status === "COMPLETED" ? "secondary" : "outline"}>
                          {s.status === "COMPLETED" ? "Paid" : "Pending"}
                        </Badge>
                        <span className="font-semibold tabular-nums">{formatMoney(s.amount)}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AppShell>
  );
}
