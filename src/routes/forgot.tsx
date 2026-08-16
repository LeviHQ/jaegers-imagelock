import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { IconGrid } from "@/components/imagelock/IconGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestRecoveryCode, resetSequence } from "@/lib/imagelock/auth.functions";
import { hashSequence } from "@/lib/imagelock/hash";

export const Route = createFileRoute("/forgot")({
  head: () => ({
    meta: [
      { title: "Reset your sequence — Jaegers-ImageLock" },
      {
        name: "description",
        content:
          "Recover your Jaegers-ImageLock account by email and set a brand new picture sequence.",
      },
      { property: "og:title", content: "Reset your sequence — Jaegers-ImageLock" },
      {
        property: "og:description",
        content: "Verify by email code, then choose a new picture sequence.",
      },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const navigate = useNavigate();
  const requestCode = useServerFn(requestRecoveryCode);
  const reset = useServerFn(resetSequence);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleSend() {
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) || value.length > 255) {
      setEmailError("Enter a valid email like you@example.com.");
      toast.error("Enter a valid email like you@example.com.");
      return;
    }
    setEmailError(null);
    setBusy(true);
    try {
      const result = await requestCode({ data: { email: value } });
      setDemoCode(result.demoCode);
      setUsername(result.username);
      setStep(2);
      toast.success("If that email is registered, a 6-digit code was sent.");
    } catch (error) {
      console.error("Recovery code request failed", error);
      toast.error("Recovery service is unavailable right now. Please try again later.");
    } finally {
      setBusy(false);
    }
  }


  async function handleReset() {
    if (!username) {
      toast.error("That code is invalid or expired.");
      return;
    }
    setBusy(true);
    try {
      const hash = await hashSequence(username, sequence);
      const result = await reset({
        data: { email: email.trim(), code: code.trim(), hash },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("New sequence saved. Log in with your new pictures.");
      navigate({ to: "/" });
    } catch {
      toast.error("Could not reset. Check the code and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <MailCheck className="size-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Forgot your sequence?</h1>
        <p className="mt-2 text-muted-foreground">
          We never show your old sequence. You will create a new one.
        </p>
      </header>

      <div className="space-y-6 rounded-2xl border border-border bg-card/50 p-4 sm:p-6">
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Registered email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                maxLength={255}
                aria-invalid={Boolean(emailError)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="you@example.com"
              />
              <p className="min-h-4 text-xs text-destructive">{emailError}</p>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={busy || !email.trim()}
              onClick={handleSend}
            >
              {busy ? "Sending…" : "Send reset code"}
            </Button>
          </>
        ) : (
          <>
            {demoCode && (
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
                Simulated email: your one-time code is{" "}
                <span className="font-bold tracking-widest">{demoCode}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">6-digit code</Label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
              />
            </div>

            <IconGrid
              sequence={sequence}
              onChange={setSequence}
              confirmed={confirmed}
              onConfirm={() => setConfirmed(true)}
              onEdit={() => setConfirmed(false)}
            />

            <Button
              className="w-full"
              size="lg"
              disabled={busy || !confirmed || code.length !== 6}
              onClick={handleReset}
            >
              {busy ? "Saving…" : "Save new sequence"}
            </Button>
          </>
        )}

        <p className="text-center text-sm">
          <Link to="/" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
