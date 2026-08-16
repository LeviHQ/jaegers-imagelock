import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { IconGrid } from "@/components/imagelock/IconGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  clearAttempts,
  getLockState,
  recordFailedAttempt,
} from "@/lib/imagelock/auth.functions";
import { hashSequence, syntheticEmail } from "@/lib/imagelock/hash";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Jaegers-ImageLock" },
      {
        name: "description",
        content:
          "Log in to Jaegers-ImageLock with your picture sequence — a password-less, accessible authentication system.",
      },
      { property: "og:title", content: "Sign in — Jaegers-ImageLock" },
      {
        property: "og:description",
        content: "Password-less login using an ordered sequence of pictures.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const lockState = useServerFn(getLockState);
  const failAttempt = useServerFn(recordFailedAttempt);
  const clear = useServerFn(clearAttempts);

  const [username, setUsername] = useState("");
  const [sequence, setSequence] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const locked = cooldown > 0;

  async function handleSubmit() {
    if (!username.trim() || sequence.length < 4) return;
    setBusy(true);
    const name = username.trim();
    try {
      // Lockout bookkeeping runs on the server; if it is unavailable we still
      // allow the sign-in attempt instead of failing the whole login.
      try {
        const state = await lockState({ data: { username: name } });
        if (state.locked) {
          setCooldown(state.secondsLeft);
          return;
        }
      } catch (e) {
        console.warn("Lock state unavailable", e);
      }

      const hash = await hashSequence(username, sequence);
      const { error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail(username),
        password: hash,
      });

      if (error) {
        setSequence([]);
        setConfirmed(false);
        try {
          const next = await failAttempt({ data: { username: name } });
          setAttemptsLeft(next.attemptsLeft);
          if (next.locked) {
            setCooldown(next.secondsLeft);
            return;
          }
          toast.error("Wrong picture sequence", {
            description: `${next.attemptsLeft} attempt(s) left before lockout.`,
          });
        } catch {
          toast.error("Wrong username or picture sequence", {
            description: "Please check and try again.",
          });
        }
        return;
      }

      try {
        await clear({ data: { username: name } });
      } catch (e) {
        console.warn("Could not reset attempt counter", e);
      }
      navigate({ to: "/home" });
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }


  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShieldCheck className="size-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Jaegers-ImageLock</h1>
        <p className="mt-2 text-muted-foreground">Sign in with your picture sequence.</p>
      </header>

      {locked && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary bg-primary/10 p-4 text-primary">
          <Lock className="size-8 shrink-0" />
          <div>
            <p className="font-semibold">Account locked</p>
            <p className="text-sm opacity-90">
              Too many wrong tries. Try again in {cooldown}s.
            </p>
          </div>
        </div>
      )}

      {!locked && attemptsLeft < 3 && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm text-primary">
          <AlertTriangle className="size-5" /> {attemptsLeft} attempt(s) left.
        </div>
      )}

      <div className="space-y-6 rounded-2xl border border-border bg-card/50 p-4 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            autoComplete="username"
            maxLength={32}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your name"
            disabled={locked}
          />
        </div>

        <IconGrid
          sequence={sequence}
          onChange={setSequence}
          locked={locked}
          enforceRules={false}
          confirmed={confirmed}
          onConfirm={() => setConfirmed(true)}
          onEdit={() => setConfirmed(false)}
        />

        <Button
          className="w-full"
          size="lg"
          disabled={busy || locked || !confirmed || !username.trim()}
          onClick={handleSubmit}
        >
          {busy ? "Checking…" : "Log in"}
        </Button>

        <div className="flex flex-col items-center gap-2 text-sm">
          <Link to="/forgot" className="text-primary hover:underline">
            Forgot sequence?
          </Link>
          <Link to="/register" className="text-muted-foreground hover:underline">
            New here? Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
