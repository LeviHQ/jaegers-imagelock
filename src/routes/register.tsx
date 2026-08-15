import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { IconGrid } from "@/components/imagelock/IconGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashSequence } from "@/lib/imagelock/hash";

type RegistrationResult = { ok: boolean; error?: string };

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Jaegers-ImageLock" },
      {
        name: "description",
        content:
          "Create a Jaegers-ImageLock account: pick a username and build a picture sequence instead of a text password.",
      },
      { property: "og:title", content: "Create account — Jaegers-ImageLock" },
      {
        property: "og:description",
        content: "Register with a picture sequence instead of a password.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [sequence, setSequence] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username.trim())) {
      toast.error("Username must be 3-32 letters, numbers or underscores.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setBusy(true);

    try {
      const hash = await hashSequence(username, sequence);
      const response = await fetch("/api/public/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), hash }),
      });
      const result = (await response.json()) as RegistrationResult;
      if (!result.ok) {
        toast.error(result.error ?? "Could not create the account. Please try again.");
        return;
      }
      toast.success("Account created. Now log in with your pictures.");
      navigate({ to: "/" });
    } catch {
      toast.error("Could not create your account. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <UserPlus className="size-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-muted-foreground">
          Pick pictures in an order only you know. That is your password.
        </p>
      </header>

      <div className="space-y-6 rounded-2xl border border-border bg-card/50 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              maxLength={32}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (for recovery only)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
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
          disabled={busy || !confirmed || !username.trim() || !email.trim()}
          onClick={handleSubmit}
        >
          {busy ? "Creating…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
