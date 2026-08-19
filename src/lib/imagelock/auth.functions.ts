import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

import { hashSchema, syntheticAuthEmail, usernameSchema } from "@/lib/imagelock/auth.shared";

export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string; email: string; hash: string }) => input)
  .handler(async ({ data }) => {
    const parsed = z
      .object({
        username: usernameSchema,
        email: z.string().trim().email().max(255),
        hash: hashSchema,
      })
      .safeParse(data);
    if (!parsed.success) {
      const bad = parsed.error.issues[0]?.path[0];
      return {
        ok: false as const,
        error:
          bad === "email"
            ? "Please enter a valid email address."
            : bad === "username"
              ? "Username must be 3-32 letters, numbers or underscores."
              : "Please pick your picture sequence again.",
      };
    }
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const username = parsed.data.username.trim().toLowerCase();
      const { data: existing, error: lookupError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (lookupError) {
        console.error("Registration username lookup failed", lookupError);
        return { ok: false as const, error: "Account service is unavailable. Please try again." };
      }
      if (existing) return { ok: false as const, error: "That username is already taken." };

      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: syntheticAuthEmail(username),
        password: parsed.data.hash,
        email_confirm: true,
      });
      if (createError || !created.user) {
        console.error("Registration auth user creation failed", createError);
        const duplicate = createError?.message.toLowerCase().includes("already");
        return {
          ok: false as const,
          error: duplicate
            ? "That username is already taken."
            : "Could not create the account. Please try again.",
        };
      }

      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: created.user.id,
        username,
        email: parsed.data.email.trim().toLowerCase(),
      });
      if (profileError) {
        console.error("Registration profile creation failed", profileError);
        await supabaseAdmin.auth.admin.deleteUser(created.user.id);
        return { ok: false as const, error: "Could not save the profile. Please try again." };
      }
      return { ok: true as const };
    } catch (error) {
      console.error("Registration failed unexpectedly", error);
      return { ok: false as const, error: "Account service is unavailable. Please try again." };
    }
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    if (!userId) return { ok: false as const, error: "You are not signed in." };
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("profiles").delete().eq("id", userId);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        console.error("Account deletion failed", error);
        return { ok: false as const, error: "Could not delete the account. Please try again." };
      }
      return { ok: true as const };
    } catch (error) {
      console.error("Account deletion crashed", error);
      return { ok: false as const, error: "Account service is unavailable right now." };
    }
  });
