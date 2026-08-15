import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  hashSchema,
  syntheticAuthEmail,
  usernameSchema,
} from "@/lib/imagelock/auth.shared";

const registrationSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().email().max(255),
  hash: hashSchema,
});

export const Route = createFileRoute("/api/public/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) {
          return Response.json({ ok: false, error: "Invalid request." }, { status: 403 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
        }

        const parsed = registrationSchema.safeParse(body);
        if (!parsed.success) {
          const field = parsed.error.issues[0]?.path[0];
          const error =
            field === "email"
              ? "Please enter a valid email address."
              : field === "username"
                ? "Username must be 3-32 letters, numbers or underscores."
                : "Please pick your picture sequence again.";
          return Response.json({ ok: false, error }, { status: 400 });
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
            return Response.json(
              { ok: false, error: "Account service is unavailable. Please try again." },
              { status: 503 },
            );
          }
          if (existing) {
            return Response.json(
              { ok: false, error: "That username is already taken." },
              { status: 409 },
            );
          }

          const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: syntheticAuthEmail(username),
            password: parsed.data.hash,
            email_confirm: true,
          });
          if (createError || !created.user) {
            console.error("Registration auth user creation failed", createError);
            const duplicate = createError?.message.toLowerCase().includes("already");
            return Response.json(
              {
                ok: false,
                error: duplicate
                  ? "That username is already taken."
                  : "Could not create the account. Please try again.",
              },
              { status: duplicate ? 409 : 500 },
            );
          }

          const { error: profileError } = await supabaseAdmin.from("profiles").insert({
            id: created.user.id,
            username,
            email: parsed.data.email.trim().toLowerCase(),
          });
          if (profileError) {
            console.error("Registration profile creation failed", profileError);
            await supabaseAdmin.auth.admin.deleteUser(created.user.id);
            return Response.json(
              { ok: false, error: "Could not save the profile. Please try again." },
              { status: 500 },
            );
          }

          return Response.json({ ok: true });
        } catch (error) {
          console.error("Registration failed unexpectedly", error);
          return Response.json(
            { ok: false, error: "Account service is unavailable. Please try again." },
            { status: 503 },
          );
        }
      },
    },
  },
});