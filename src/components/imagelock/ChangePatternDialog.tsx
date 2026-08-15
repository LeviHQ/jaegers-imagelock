import { useState } from "react";
import { toast } from "sonner";

import { IconGrid } from "@/components/imagelock/IconGrid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { hashSequence, syntheticEmail } from "@/lib/imagelock/hash";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
};

export function ChangePatternDialog({ open, onOpenChange, username }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [sequence, setSequence] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset(nextStep: 1 | 2) {
    setSequence([]);
    setConfirmed(false);
    setStep(nextStep);
  }

  async function verifyCurrent() {
    setBusy(true);
    try {
      const hash = await hashSequence(username, sequence);
      const { error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail(username),
        password: hash,
      });
      if (error) {
        toast.error("That is not your current sequence.");
        reset(1);
        return;
      }
      toast.success("Verified. Now pick your new sequence.");
      reset(2);
    } finally {
      setBusy(false);
    }
  }

  async function saveNew() {
    setBusy(true);
    try {
      const hash = await hashSequence(username, sequence);
      const { error } = await supabase.auth.updateUser({ password: hash });
      if (error) {
        toast.error("Could not save the new sequence. Pick different pictures.");
        return;
      }
      toast.success("Your new picture sequence is saved.");
      onOpenChange(false);
      reset(1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset(1);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Step 1: Confirm current sequence" : "Step 2: New sequence"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Tap your current pictures in the same order."
              : "Tap new pictures in the order you want to remember."}
          </DialogDescription>
        </DialogHeader>

        <IconGrid
          sequence={sequence}
          onChange={setSequence}
          confirmed={confirmed}
          onConfirm={() => setConfirmed(true)}
          onEdit={() => setConfirmed(false)}
        />

        <Button
          size="lg"
          disabled={busy || !confirmed}
          onClick={step === 1 ? verifyCurrent : saveNew}
        >
          {busy ? "Working…" : step === 1 ? "Verify" : "Save new sequence"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
