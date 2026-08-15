import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleUserRound,
  Eye,
  Images,
  KeyRound,
  Lock,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { ChangePatternDialog } from "@/components/imagelock/ChangePatternDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your account — Jaegers-ImageLock" },
      {
        name: "description",
        content:
          "Your Jaegers-ImageLock home: see your profile, learn how picture passwords work, and change your sequence.",
      },
      { property: "og:title", content: "Your account — Jaegers-ImageLock" },
      {
        property: "og:description",
        content: "Simple, accessible, secure picture-based authentication.",
      },
    ],
  }),
  component: HomePage,
});

const GUIDE = [
  {
    Icon: Images,
    title: "Your login is a picture password",
    text: "You choose pictures in an order only you remember.",
  },
  {
    Icon: Eye,
    title: "Nothing is written down",
    text: "No text password to type, read, or spell.",
  },
  {
    Icon: ShieldCheck,
    title: "We never store your pictures",
    text: "Your sequence is turned into a secret code (hash) before it is saved.",
  },
  {
    Icon: Lock,
    title: "3 wrong tries locks the account",
    text: "A short lock stops people from guessing.",
  },
  {
    Icon: KeyRound,
    title: "Forgot it? Use your email",
    text: "We send a one-time code, then you pick new pictures.",
  },
];

function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", userData.user.id)
        .maybeSingle();
      return data;
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          <CircleUserRound className="size-11 text-primary" />
          <div>
            <p className="font-semibold">{profile?.username ?? "…"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email ?? ""}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(true)}>
            <KeyRound className="size-4" /> Change Authentication Pattern
          </Button>
          <Button variant="ghost" onClick={signOut} aria-label="Log out">
            <LogOut className="size-4" /> Log out
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Hello {profile?.username ?? "there"}, welcome to your simple, accessible, secure
          authentication system.
        </h1>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDE.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
            >
              <Icon className="size-9 shrink-0 text-primary" />
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {profile?.username && (
        <ChangePatternDialog
          open={open}
          onOpenChange={setOpen}
          username={profile.username}
        />
      )}
    </main>
  );
}
