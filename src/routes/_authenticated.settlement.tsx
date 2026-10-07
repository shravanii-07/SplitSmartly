import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeftRight, CheckCircle2, Loader2, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState, StatCard } from "@/components/ui-blocks";
import { useGroup, useOverview } from "@/hooks/use-splitsmart";
import { completeSettlement, generateSettlement } from "@/lib/splitsmart.functions";
import { formatDate, formatMoney, friendlyError, initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settlement")({
  validateSearch: (search: Record<string, unknown>): { group?: string } =>
    typeof search["group"] === "string" ? { group: search["group"] as string } : {},

  head: () => ({
    meta: [
      { title: "Settlement — SplitSmart" },
      {
        name: "description",
        content:
          "Generate the minimum set of payments that clears every debt in a group using greedy heap matching.",
      },
      { property: "og:title", content: "Settlement — SplitSmart" },
      { property: "og:description", content: "Fewer transfers, same result." },
    ],
  }),
  component: SettlementPage,
});

function SettlementPage() {
  const search = Route.useSearch();
  const { data: overview, isLoading: loadingOverview } = useOverview();
  const [groupId, setGroupId] = useState<string | undefined>(search.group);
  const { data, isLoading } = useGroup(groupId);
  const queryClient = useQueryClient();
  const optimize = useServerFn(generateSettlement);
  const complete = useServerFn(completeSettlement);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!groupId && overview?.groups.length) setGroupId(overview.groups[0]!.id);
  }, [groupId, overview]);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    void queryClient.invalidateQueries({ queryKey: ["overview"] });
  }

  async function onOptimize() {
    if (!groupId) return;
    setBusy(true);
    try {
      const res = await optimize({ data: { groupId } });
      toast.success(
        `${res.created} transfers instead of ${res.rawTransactionCount} — ${res.transfersSaved} avoided.`,
      );
      refresh();
    } catch (err) {
      toast.error(friendlyError(err, "Could not generate the settlement."));
    } finally {
      setBusy(false);
    }
  }

  async function onComplete(settlementId: string) {
    try {
      await complete({ data: { settlementId } });
      toast.success("Marked as paid.");
      refresh();
    } catch (err) {
      toast.error(friendlyError(err, "Could not update that transfer."));
    }
  }

  const nameOf = (userId: string) =>
    data?.members.find((m) => m.userId === userId)?.name ?? "Member";
  const pending = (data?.settlements ?? []).filter((s) => s.status === "PENDING");
  const completed = (data?.settlements ?? []).filter((s) => s.status === "COMPLETED");

  return (
    <AppShell
      title="Settlement"
      description="Minimum-transfer plan built with a debt graph, max-heaps and greedy matching."
      actions={
        <Button onClick={onOptimize} disabled={busy || !groupId}>
          <Zap className="size-4" /> Generate plan
        </Button>
      }
    >
      {loadingOverview ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (overview?.groups.length ?? 0) === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No groups to settle."
          description="Create a group and record some expenses first."
        />
      ) : (
        <div className="space-y-6">
          <div className="surface-card max-w-sm p-4">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Group
            </label>
            <Select value={groupId ?? ""} onValueChange={setGroupId}>
              <SelectTrigger className="mt-2" aria-label="Select group">
                <SelectValue placeholder="Choose a group" />
              </SelectTrigger>
              <SelectContent>
                {(overview?.groups ?? []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading || !data ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Naive transfers"
                  value={String(data.pipeline.rawTransactionCount)}
                  hint="Debt graph edges"
                />
                <StatCard
                  label="Optimized transfers"
                  value={String(data.pipeline.optimizedTransactionCount)}
                  tone="positive"
                  hint="Greedy heap matching"
                />
                <StatCard
                  label="Payments avoided"
                  value={String(data.pipeline.transfersSaved)}
                  tone="positive"
                />
                <StatCard label="Amount to settle" value={formatMoney(data.pipeline.totalToSettle)} />
              </div>

              <section className="surface-card p-5">
                <h2 className="text-lg font-semibold">Suggested plan (live)</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recomputed from current balances every time this page loads.
                </p>
                {data.pipeline.transactions.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Everyone is settled up — nothing to transfer.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {data.pipeline.transactions.map((t, i) => (
                      <li
                        key={`${t.from}-${t.to}-${i}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                            {initials(nameOf(t.from))}
                          </span>
                          <strong>{nameOf(t.from)}</strong>
                          <ArrowLeftRight className="size-4 text-muted-foreground" />
                          <strong>{nameOf(t.to)}</strong>
                        </div>
                        <span className="font-semibold tabular-nums">{formatMoney(t.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="surface-card p-5">
                <h2 className="text-lg font-semibold">Saved plan ({pending.length} pending)</h2>
                {pending.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nothing saved yet. Use “Generate plan” to persist the transfers for everyone in
                    the group.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {pending.map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="text-sm">
                          <strong>{nameOf(s.from_user)}</strong> pays{" "}
                          <strong>{nameOf(s.to_user)}</strong>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {formatDate(s.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold tabular-nums">
                            {formatMoney(s.amount)}
                          </span>
                          <Button size="sm" variant="outline" onClick={() => onComplete(s.id)}>
                            <CheckCircle2 className="size-4" /> Mark paid
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {completed.length > 0 ? (
                  <>
                    <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Completed
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {completed.map((s) => (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary p-3 text-sm"
                        >
                          <span>
                            {nameOf(s.from_user)} → {nameOf(s.to_user)}
                          </span>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">Paid</Badge>
                            <span className="font-semibold tabular-nums">
                              {formatMoney(s.amount)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
