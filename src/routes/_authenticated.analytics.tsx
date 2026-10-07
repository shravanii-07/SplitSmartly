import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, PieChart as PieIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, StatCard } from "@/components/ui-blocks";
import { useGroup, useOverview } from "@/hooks/use-splitsmart";
import { formatMoney } from "@/lib/format";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SplitSmart" },
      {
        name: "description",
        content: "Charts of category spending, who paid what, and how group spending trends over time.",
      },
      { property: "og:title", content: "Analytics — SplitSmart" },
      { property: "og:description", content: "Visualize your group spending patterns." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: overview, isLoading: loadingOverview } = useOverview();
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const { data, isLoading } = useGroup(groupId);

  useEffect(() => {
    if (!groupId && overview?.groups.length) setGroupId(overview.groups[0]!.id);
  }, [groupId, overview]);

  const nameOf = (userId: string) =>
    data?.members.find((m) => m.userId === userId)?.name ?? "Member";

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of data?.expenses ?? []) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return [...map.entries()].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [data]);

  const byMember = useMemo(
    () =>
      (data?.pipeline.balances ?? []).map((b) => ({
        name: nameOf(b.userId),
        paid: Math.round(b.totalPaid * 100) / 100,
        share: Math.round(b.totalShare * 100) / 100,
      })),
    [data],
  );

  const trend = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of data?.expenses ?? []) map.set(e.expenseDate, (map.get(e.expenseDate) ?? 0) + e.amount);
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, total]) => ({ date: date.slice(5), total: Math.round(total * 100) / 100 }));
  }, [data]);

  return (
    <AppShell title="Analytics" description="Where the money goes, per group.">
      {loadingOverview ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (overview?.groups.length ?? 0) === 0 ? (
        <EmptyState
          icon={PieIcon}
          title="No data to chart yet."
          description="Create a group and record a few expenses to unlock analytics."
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
          ) : data.expenses.length === 0 ? (
            <EmptyState
              icon={PieIcon}
              title="This group has no expenses."
              description="Record an expense in the group to see charts here."
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total spent" value={formatMoney(data.stats.totalSpent)} />
                <StatCard label="Average expense" value={formatMoney(data.stats.averageExpense)} />
                <StatCard label="Largest expense" value={formatMoney(data.stats.highestExpense)} />
                <StatCard label="Members" value={String(data.stats.memberCount)} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="surface-card p-5">
                  <h2 className="text-lg font-semibold">Spending by category</h2>
                  <div className="mt-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={95} label>
                          {byCategory.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatMoney(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="surface-card p-5">
                  <h2 className="text-lg font-semibold">Paid vs fair share</h2>
                  <div className="mt-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={byMember}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => formatMoney(v)} />
                        <Legend />
                        <Bar dataKey="paid" name="Paid" fill="var(--color-chart-1)" radius={4} />
                        <Bar dataKey="share" name="Share" fill="var(--color-chart-2)" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              <section className="surface-card p-5">
                <h2 className="text-lg font-semibold">Spending over time</h2>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => formatMoney(v)} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total"
                        stroke="var(--color-chart-1)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
