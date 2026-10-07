import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — SplitSmart" },
      {
        name: "description",
        content: "Log in to SplitSmart to see your groups, expenses and settlements.",
      },
      { property: "og:title", content: "Log in — SplitSmart" },
      { property: "og:description", content: "Access your shared groups and settlement plans." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void router.navigate({ to: "/dashboard" });
  }, [loading, session, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        toast.error(
          /invalid/i.test(error.message) ? "Invalid email or password." : friendlyError(error),
        );
        return;
      }
      toast.success("Welcome back!");
      await router.navigate({ to: "/dashboard" });
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
  }
  return (
    <div className="hero-glow flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">SplitSmart</span>
        </Link>
        <div className="surface-card p-6 sm:p-8">
          <h1 className="text-2xl font-bold">Log in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your groups and expenses follow you across devices.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Logging in…" : "Log in"}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-semibold text-primary">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
