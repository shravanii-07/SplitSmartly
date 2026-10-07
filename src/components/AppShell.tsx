import { Link, useRouter } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Receipt,
  ArrowLeftRight,
  History,
  PieChart,
  BookOpen,
  LogOut,
  Menu,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { initials } from "@/lib/format";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/settlement", label: "Settlement", icon: ArrowLeftRight },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: PieChart },
  { to: "/how-it-works", label: "How It Works", icon: BookOpen },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className:
              "flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2.5 text-sm font-semibold text-sidebar-accent-foreground",
          }}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2 px-1 py-1">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Wallet className="size-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">SplitSmart</span>
    </Link>
  );
}

function UserBox() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const name = (user?.user_metadata?.["name"] as string | undefined) ?? user?.email ?? "Member";

  return (
    <div className="mt-auto border-t border-sidebar-border pt-4">
      <div className="flex items-center gap-3 px-1">
        <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="mt-2 w-full justify-start gap-3 text-muted-foreground"
        onClick={async () => {
          await signOut();
          await router.navigate({ to: "/login" });
        }}
      >
        <LogOut className="size-4" /> Logout
      </Button>
    </div>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Brand />
        <NavLinks />
        <UserBox />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-6 bg-sidebar p-4">
            <Brand />
            <NavLinks onNavigate={() => setOpen(false)} />
            <UserBox />
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
