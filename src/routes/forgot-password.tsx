import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MailCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — SplitSmart" },
      {
        name: "description",
        content:
          "Request a secure password reset link for your SplitSmart account, delivered to your verified email.",
      },
      { property: "og:title", content: "Reset your password — SplitSmart" },
      {
        property: "og:description",
        content: "We email a single-use, time-limited link to set a new password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error && !/rate limit/i.test(error.message)) {
        toast.error(friendlyError(error, "Could not send the reset email."));
        return;
      }
      if (error) {
        toast.error("Too many attempts — please wait a few minutes and try again.");
        return;
      }
      // Never reveal whether the address exists.
      setSent(true);
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
          {sent ? (
            <div className="space-y-4 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MailCheck className="size-6" />
              </span>
              <h1 className="text-2xl font-bold">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-medium">{email.trim()}</span>, we sent
                a single-use reset link. It expires shortly — request a new one if it lapses.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Back to log in</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Forgot your password?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we'll send a secure link to set a new one.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Send reset link"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link to="/login" className="font-semibold text-primary">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
