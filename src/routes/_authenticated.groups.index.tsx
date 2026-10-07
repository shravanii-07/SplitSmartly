import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Users, ArrowRight, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui-blocks";
import { useOverview } from "@/hooks/use-splitsmart";
import { formatDate, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/groups/")({
  head: () => ({
    meta: [
      { title: "Your groups — SplitSmart" },
      {
        name: "description",
        content: "Every SplitSmart group you belong to, with members, expense counts and totals.",
      },
      { property: "og:title", content: "Your groups — SplitSmart" },
      { property: "og:description", content: "Trips, college, food, projects and events." },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const { data, isLoading } = useOverview();
  const groupOptions = (data?.groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    members: g.members,
  }));

  return (
    <AppShell
      title="Groups"
      description="Trips, classes, flatmates and project teams."
      actions={<CreateGroupDialog />}
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (data?.groups.length ?? 0) === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet."
          description="Create your first group to start splitting expenses."
          action={<CreateGroupDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data!.groups.map((g) => (
            <article key={g.id} className="surface-card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{g.name}</h2>
                <Badge variant="secondary">{g.category}</Badge>
              </div>
              {g.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
              ) : null}

              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-secondary p-2">
                  <dt className="text-[11px] uppercase text-muted-foreground">Members</dt>
                  <dd className="font-semibold tabular-nums">{g.memberCount}</dd>
                </div>
                <div className="rounded-lg bg-secondary p-2">
                  <dt className="text-[11px] uppercase text-muted-foreground">Expenses</dt>
                  <dd className="font-semibold tabular-nums">{g.expenseCount}</dd>
                </div>
                <div className="rounded-lg bg-secondary p-2">
                  <dt className="text-[11px] uppercase text-muted-foreground">Spent</dt>
                  <dd className="font-semibold tabular-nums">{formatMoney(g.totalSpent)}</dd>
                </div>
              </dl>

              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" /> Created {formatDate(g.created_at)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/groups/$groupId" params={{ groupId: g.id }}>
                    Open group <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <AddExpenseDialog
                  groups={groupOptions}
                  defaultGroupId={g.id}
                  trigger={
                    <Button size="sm" variant="outline">
                      Add expense
                    </Button>
                  }
                />
                <Button asChild size="sm" variant="ghost">
                  <Link to="/settlement" search={{ group: g.id }}>
                    Settlement
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
