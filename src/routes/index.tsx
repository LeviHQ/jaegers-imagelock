import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { IconGrid } from "@/components/imagelock/IconGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
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

  const [username, setUsername] = useState("");
  const [sequence, setSequence] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);


  async function handleSubmit() {
    if (!username.trim() || sequence.length < 4) return;
    setBusy(true);
    try {
      const hash = await hashSequence(username, sequence);
      const { error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail(username),
        password: hash,
      });

      if (error) {
        setSequence([]);
        setConfirmed(false);
        toast.error("Wrong username or picture sequence", {
          description: "Please check and try again.",
        });
        return;
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
          />
        </div>

        <IconGrid
          sequence={sequence}
          onChange={setSequence}
          enforceRules={false}
          confirmed={confirmed}
          onConfirm={() => setConfirmed(true)}
          onEdit={() => setConfirmed(false)}
        />

        <Button
          className="w-full"
          size="lg"
          disabled={busy || !confirmed || !username.trim()}
          onClick={handleSubmit}
        >
          {busy ? "Checking…" : "Log in"}
        </Button>

        <div className="flex flex-col items-center gap-2 text-sm">
          <Link to="/register" className="text-muted-foreground hover:underline">
            New here? Create an account
          </Link>
        </div>
      </div>

    </main>
  );
}
