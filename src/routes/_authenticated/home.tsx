import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleUserRound,
  Eye,
  Images,
  KeyRound,
  Lock,
  LogOut,
  MailQuestion,
  ShieldCheck,
  UserPlus,
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

type Step = {
  Icon: typeof Images;
  title: string;
  text: string;
  points: string[];
  upcoming?: boolean;
};

const STEPS: Step[] = [
  {
    Icon: UserPlus,
    title: "Create your account",
    text: "You only give a username and an email. No text password anywhere.",
    points: [
      "Username is your name for logging in — 3 to 32 letters, numbers or _.",
      "Email is used only if you ever need to recover your account.",
      "If a username or email is already used, you are told right away.",
    ],
  },
  {
    Icon: Images,
    title: "Pick your picture sequence",
    text: "Your picture sequence is your password. Order matters.",
    points: [
      "Open a group (Animals, Food, Vehicles…) or search a picture by name.",
      "Tap pictures one by one — the order you tap is the order you must repeat.",
      "You need at least 4 pictures from 2 or more different groups.",
      "Tap Undo to remove the last one, then Done when you are happy.",
    ],
  },
  {
    Icon: ShieldCheck,
    title: "Your pictures become a secret code",
    text: "The sequence never leaves your device as pictures.",
    points: [
      "Your phone turns the sequence into a long secret code (SHA-256 hash).",
      "Only that code is sent and stored — encrypted again on the server.",
      "Nobody, not even us, can turn the code back into your pictures.",
    ],
  },
  {
    Icon: Eye,
    title: "Log in by repeating the sequence",
    text: "Type your username, tap the same pictures in the same order.",
    points: [
      "Same pictures + same order = same secret code = you are in.",
      "Nothing is typed or spelled, so it works well for low-literacy users.",
      "Wrong order counts as wrong — the sequence must match exactly.",
    ],
  },
  {
    Icon: KeyRound,
    title: "Change your pattern any time",
    text: "Use the Change Authentication Pattern button at the top.",
    points: [
      "Step 1: confirm your current picture sequence.",
      "Step 2: pick a brand new one (same 4 pictures / 2 groups rule).",
      "The old code is replaced immediately.",
    ],
  },
  {
    Icon: Lock,
    title: "Lockout after 3 wrong tries",
    text: "A short automatic lock stops people from guessing your pictures.",
    points: [
      "3 wrong sequences in a row lock the account for 60 seconds.",
      "A red lock banner shows exactly how long is left.",
      "This is still being finished, so it is not active on every deployment yet.",
    ],
    upcoming: true,
  },
  {
    Icon: MailQuestion,
    title: "Forgot your sequence? Email recovery",
    text: "A one-time code sent to your email lets you set a new sequence.",
    points: [
      "Enter your email on the Forgot sequence page.",
      "You get a 6-digit one-time code that expires quickly.",
      "After the code is verified you pick a fresh picture sequence.",
      "This is still being finished, so it is not active on every deployment yet.",
    ],
    upcoming: true,
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
        <h2 className="text-xl font-semibold">How it works — step by step</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Read it in order. Each step is one part of your picture password.
        </p>

        <ol className="mt-5 space-y-4">
          {STEPS.map(({ Icon, title, text, points, upcoming }, index) => (
            <li
              key={title}
              className="relative rounded-2xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" aria-hidden />
                  <span className="text-[10px] font-bold">{index + 1}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{title}</h3>
                    {upcoming && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground shadow-sm">
                        <Sparkles className="size-3" aria-hidden />
                        Upcoming
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                  <ul className="mt-3 space-y-1.5">
                    {points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
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
