import { Check, Lock, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ICONS, ICON_MAP, MIN_SEQUENCE } from "@/lib/imagelock/icons";
import { cn } from "@/lib/utils";

type Props = {
  sequence: string[];
  onChange: (next: string[]) => void;
  locked?: boolean;
  confirmed?: boolean;
  onConfirm?: () => void;
  onEdit?: () => void;
};

export function IconGrid({
  sequence,
  onChange,
  locked = false,
  confirmed = false,
  onConfirm,
  onEdit,
}: Props) {
  const disabled = locked || confirmed;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Your picture sequence
        </p>
        <div className="flex min-h-14 flex-wrap items-center gap-2">
          {sequence.length === 0 && (
            <span className="text-sm text-muted-foreground">
              Tap at least {MIN_SEQUENCE} pictures, in order.
            </span>
          )}
          {sequence.map((id, index) => {
            const item = ICON_MAP[id];
            if (!item) return null;
            const { Icon } = item;
            return (
              <span
                key={`${id}-${index}`}
                className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-primary"
              >
                <span className="text-xs font-bold opacity-70">{index + 1}</span>
                <Icon className="size-6" aria-hidden />
                <span className="sr-only">{item.label}</span>
              </span>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {confirmed ? (
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={locked || sequence.length === 0}
                onClick={() => onChange(sequence.slice(0, -1))}
              >
                <X className="size-4" /> Undo
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={locked || sequence.length < MIN_SEQUENCE}
                onClick={onConfirm}
              >
                <Check className="size-4" /> Done
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          className={cn(
            "grid grid-cols-5 gap-2 sm:grid-cols-8",
            disabled && "pointer-events-none opacity-40",
          )}
        >
          {ICONS.map(({ id, label, Icon }) => {
            const count = sequence.filter((s) => s === id).length;
            return (
              <button
                key={id}
                type="button"
                aria-label={label}
                title={label}
                disabled={disabled}
                onClick={() => onChange([...sequence, id])}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors",
                  "hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  count > 0 && "border-primary bg-primary/15 text-primary",
                )}
              >
                <Icon className="size-7" aria-hidden />
                {count > 0 && (
                  <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
            <Lock className="size-10 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
