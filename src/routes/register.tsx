import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { IconGrid } from "@/components/imagelock/IconGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { hashSequence, syntheticEmail } from "@/lib/imagelock/hash";
import { sequenceError } from "@/lib/imagelock/icons";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateUsername(value: string) {
  const v = value.trim();
  if (!v) return "Username is required.";
  if (v.length < 3) return "Username must be at least 3 characters.";
  if (v.length > 32) return "Username must be 32 characters or less.";
  if (!USERNAME_RE.test(v)) return "Only letters, numbers and underscores are allowed.";
  return null;
}

function validateEmail(value: string) {
  const v = value.trim();
  if (!v) return "Email is required.";
  if (v.length > 255) return "Email must be 255 characters or less.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email like you@example.com.";
  return null;
}

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
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleSubmit() {
    const uError = validateUsername(username);
    const eError = validateEmail(email);
    setUsernameError(uError);
    setEmailError(eError);
    const seqError = sequenceError(sequence);
    if (uError || eError) {
      toast.error(uError ?? eError!);
      return;
    }
    if (seqError) {
      toast.error(seqError);
      return;
    }
    setBusy(true);

    try {
      const normalizedUsername = username.trim().toLowerCase();
      const recoveryEmail = email.trim().toLowerCase();

      const { data: availability } = await supabase.rpc("imagelock_availability", {
        _username: normalizedUsername,
        _email: recoveryEmail,
      });
      const taken = availability as
        | { username_taken?: boolean; email_taken?: boolean }
        | null;
      if (taken?.username_taken || taken?.email_taken) {
        if (taken.username_taken) setUsernameError("This username is already taken.");
        if (taken.email_taken) setEmailError("This email is already registered.");
        toast.error(
          taken.username_taken
            ? "This username is already taken. Try another one."
            : "This email is already registered. Please log in instead.",
        );
        return;
      }

      const hash = await hashSequence(normalizedUsername, sequence);
      const { data, error } = await supabase.auth.signUp({
        email: syntheticEmail(normalizedUsername),
        password: hash,
        options: {
          data: {
            username: normalizedUsername,
            recovery_email: recoveryEmail,
          },
        },
      });

      if (error) {
        console.error("Account creation request failed", error);
        const message = error.message.toLowerCase();
        if (message.includes("email_taken")) {
          setEmailError("This email is already registered.");
          toast.error("This email is already registered.");
        } else if (
          message.includes("username_taken") ||
          message.includes("already") ||
          message.includes("registered") ||
          message.includes("database error")
        ) {
          setUsernameError("This username is already taken.");
          toast.error("This username is already taken. Try another one.");
        } else {
          toast.error("Could not create the account. Please try again.");
        }
        return;
      }

      if (!data.user) {
        toast.error("Could not create the account. Please try again.");
        return;
      }

      // Account creation has already succeeded at this point. Session cleanup
      // must never turn that success into a false "creation failed" message.
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (signOutError) {
        console.error("Post-signup session cleanup failed", signOutError);
      }
      toast.success("Account created. Now log in with your pictures.");
      navigate({ to: "/" });
    } catch (error) {
      console.error("Account creation failed before completion", error);
      toast.error("Could not reach the account service. Check your connection and try again.");
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
              aria-invalid={Boolean(usernameError)}
              aria-describedby="username-error"
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) setUsernameError(null);
              }}
              onBlur={() => setUsernameError(validateUsername(username))}
              placeholder="your name"
            />
            <p id="username-error" className="min-h-4 text-xs text-destructive">
              {usernameError}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              maxLength={255}
              aria-invalid={Boolean(emailError)}
              aria-describedby="email-error"
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onBlur={() => setEmailError(validateEmail(email))}
              placeholder="you@example.com"
            />
            <p id="email-error" className="min-h-4 text-xs text-destructive">
              {emailError}
            </p>
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
