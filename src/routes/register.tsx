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

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your SplitSmart account" },
      {
        name: "description",
        content: "Sign up for SplitSmart to split group expenses and settle up in fewer payments.",
      },
      { property: "og:title", content: "Create your SplitSmart account" },
      {
        property: "og:description",
        content: "Start splitting expenses with your friends, classmates and project groups.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void router.navigate({ to: "/dashboard" });
  }, [loading, session, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(
          /already registered|exists/i.test(error.message)
            ? "That email is already registered. Try logging in."
            : friendlyError(error),
        );
        return;
      }
      if (data.session) {
        toast.success("Account created. Welcome to SplitSmart!");
        await router.navigate({ to: "/dashboard" });
      } else {
        toast.success("Account created. Check your email to confirm, then log in.");
        await router.navigate({ to: "/login" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Free forever for student groups and trips.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
