import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_ATTEMPTS = 3;
const LOCK_SECONDS = 60;

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9_]+$/);
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);

function synth(username: string) {
  return `${username.trim().toLowerCase()}@users.imagelock.app`;
}

export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string; email: string; hash: string }) =>
    z
      .object({
        username: usernameSchema,
        email: z.string().trim().email().max(255),
        hash: hashSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const username = data.username.trim().toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existing) return { ok: false as const, error: "That username is already taken." };

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: synth(username),
      password: data.hash,
      email_confirm: true,
    });
    if (error || !created.user) {
      return { ok: false as const, error: "Could not create the account. Try another username." };
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      username,
      email: data.email.trim().toLowerCase(),
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return { ok: false as const, error: "Could not save the profile. Please try again." };
    }
    return { ok: true as const };
  });

export const getLockState = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string }) =>
    z.object({ username: usernameSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("failed_attempts, locked_until")
      .eq("username", data.username.trim().toLowerCase())
      .maybeSingle();
    if (!profile) return { locked: false, secondsLeft: 0, attemptsLeft: MAX_ATTEMPTS };
    const lockedUntil = profile.locked_until ? new Date(profile.locked_until).getTime() : 0;
    const secondsLeft = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
    return {
      locked: secondsLeft > 0,
      secondsLeft,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - profile.failed_attempts),
    };
  });

export const recordFailedAttempt = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string }) =>
    z.object({ username: usernameSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const username = data.username.trim().toLowerCase();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, failed_attempts")
      .eq("username", username)
      .maybeSingle();
    if (!profile) return { locked: false, secondsLeft: 0, attemptsLeft: MAX_ATTEMPTS - 1 };

    const attempts = profile.failed_attempts + 1;
    const shouldLock = attempts >= MAX_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + LOCK_SECONDS * 1000).toISOString()
      : null;
    await supabaseAdmin
      .from("profiles")
      .update({ failed_attempts: shouldLock ? 0 : attempts, locked_until: lockedUntil })
      .eq("id", profile.id);

    return {
      locked: shouldLock,
      secondsLeft: shouldLock ? LOCK_SECONDS : 0,
      attemptsLeft: shouldLock ? 0 : MAX_ATTEMPTS - attempts,
    };
  });

export const clearAttempts = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string }) =>
    z.object({ username: usernameSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({ failed_attempts: 0, locked_until: null })
      .eq("username", data.username.trim().toLowerCase());
    return { ok: true as const };
  });

/** Simulates emailing a one-time recovery code. Never reveals the old sequence. */
export const requestRecoveryCode = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .eq("email", email)
      .maybeSingle();

    // Always report success so accounts cannot be enumerated.
    if (!profile) return { sent: true as const, demoCode: null, username: null };

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await supabaseAdmin.from("reset_codes").insert({
      user_id: profile.id,
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    // Demo prototype: the "email" is simulated and shown on screen.
    return { sent: true as const, demoCode: code, username: profile.username };
  });

export const resetSequence = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string; hash: string }) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        code: z.string().trim().regex(/^\d{6}$/),
        hash: hashSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .eq("email", data.email.trim().toLowerCase())
      .maybeSingle();
    if (!profile) return { ok: false as const, error: "Invalid code." };

    const { data: record } = await supabaseAdmin
      .from("reset_codes")
      .select("id, expires_at, used")
      .eq("user_id", profile.id)
      .eq("code", data.code.trim())
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!record || new Date(record.expires_at).getTime() < Date.now()) {
      return { ok: false as const, error: "That code is invalid or expired." };
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: data.hash,
    });
    if (error) return { ok: false as const, error: "Could not save the new sequence." };

    await supabaseAdmin.from("reset_codes").update({ used: true }).eq("id", record.id);
    await supabaseAdmin
      .from("profiles")
      .update({ failed_attempts: 0, locked_until: null })
      .eq("id", profile.id);
    return { ok: true as const, username: profile.username };
  });
