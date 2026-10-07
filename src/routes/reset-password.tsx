import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — SplitSmart" },
      {
        name: "description",
        content:
          "Complete your SplitSmart password reset using the single-use link sent to your email.",
      },
      { property: "og:title", content: "Set a new password — SplitSmart" },
      { property: "og:description", content: "Verify your reset link and choose a new password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "ready" | "invalid">("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  // The reset link carries a single-use token. Exchange it for a short-lived
  // recovery session here; the token itself never touches app state.
  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      try {
        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new Error("Missing reset token.");
        }

        // Scrub the token from the address bar / history.
        window.history.replaceState({}, "", "/reset-password");
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(
          /weak|pwned/i.test(error.message)
            ? "That password is too common — pick a stronger one."
            : friendlyError(error, "Could not update the password."),
        );
        return;
      }
      await supabase.auth.signOut();
      toast.success("Password updated — please log in.");
      await router.navigate({ to: "/login", replace: true });
    } finally {
      setBusy(false);
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
          {status === "verifying" ? (
            <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              Verifying your reset link…
            </div>
          ) : status === "invalid" ? (
            <div className="space-y-4 text-center">
              <h1 className="text-2xl font-bold">Link expired</h1>
              <p className="text-sm text-muted-foreground">
                Reset links are single-use and time-limited. Request a fresh one to continue.
              </p>
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request a new link</Link>
              </Button>
            </div>
          ) : (
            <>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-6" />
              </span>
              <h1 className="mt-4 text-2xl font-bold">Set a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your email is verified. Choose a password you haven't used elsewhere.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Updating…" : "Update password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
