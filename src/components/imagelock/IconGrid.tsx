import { ArrowLeft, Check, ChevronRight, Lock, Pencil, Search, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CATEGORIES,
  ICONS,
  ICON_MAP,
  MIN_CATEGORIES,
  MIN_SEQUENCE,
  sequenceCategories,
  sequenceError,
  type CategoryId,
  type IconItem,
} from "@/lib/imagelock/icons";
import { isNarrationOn, setNarration, speak, speechSupported, stopSpeaking } from "@/lib/imagelock/speak";
import { cn } from "@/lib/utils";

type Props = {
  sequence: string[];
  onChange: (next: string[]) => void;
  locked?: boolean;
  confirmed?: boolean;
  onConfirm?: () => void;
  onEdit?: () => void;
  /** Enforce the minimum length / multi-group rules (off for login). */
  enforceRules?: boolean;
};

const PAGE_SIZE = 16; // 4 columns x 4 rows
const HOLD_MS = 400;

function chunk(items: IconItem[], size: number) {
  const out: IconItem[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out.length ? out : [[]];
}

/** Tap-and-hold to hear a label read aloud; a normal tap still activates. */
function useHoldToSpeak() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spoke = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const handlers = useCallback(
    (label: string) => ({
      onPointerDown: () => {
        spoke.current = false;
        clear();
        timer.current = setTimeout(() => {
          spoke.current = true;
          speak(label);
        }, HOLD_MS);
      },
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      onContextMenu: (e: React.MouseEvent) => {
        if (spoke.current) e.preventDefault();
      },
    }),
    [clear],
  );

  return { handlers, didSpeak: () => spoke.current };
}


export function IconGrid({
  sequence,
  onChange,
  locked = false,
  confirmed = false,
  onConfirm,
  onEdit,
  enforceRules = true,
}: Props) {
  const disabled = locked || confirmed;
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [query, setQuery] = useState("");

  const searching = query.trim().length > 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (category) {
      const inCat = ICONS.filter((i) => i.category === category);
      return q ? inCat.filter((i) => i.label.toLowerCase().includes(q)) : inCat;
    }
    if (q) return ICONS.filter((i) => i.label.toLowerCase().includes(q));
    return [];
  }, [query, category]);

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        ICONS.some((i) => i.category === c.id && i.label.toLowerCase().includes(q)),
    );
  }, [query]);

  const pages = chunk(visible, PAGE_SIZE);
  const activeCategory = CATEGORIES.find((c) => c.id === category);
  const groupsUsed = sequenceCategories(sequence).length;
  const ruleError = enforceRules ? sequenceError(sequence) : null;

  const hold = useHoldToSpeak();
  const [narration, setNarrationState] = useState(true);
  const canSpeak = speechSupported();

  useEffect(() => {
    setNarrationState(isNarrationOn());
    return () => stopSpeaking();
  }, []);


  return (
    <div className="space-y-4">
      {/* Selected sequence preview */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your picture sequence
          </p>
          {canSpeak && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={narration}
              onClick={() => {
                const next = !narration;
                setNarrationState(next);
                setNarration(next);
                if (next) speak("Sound on. Tap and hold a picture to hear its name.");
              }}
            >
              {narration ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              {narration ? "Sound on" : "Sound off"}
            </Button>
          )}
        </div>

        <div className="flex min-h-14 flex-wrap items-center gap-2">
          {sequence.length === 0 && (
            <span className="text-sm text-muted-foreground">
              {enforceRules
                ? `Tap at least ${MIN_SEQUENCE} pictures from ${MIN_CATEGORIES}+ groups, in order.`
                : "Tap your pictures, in order."}
            </span>
          )}
          {sequence.map((id, index) => {
            const item = ICON_MAP[id];
            if (!item) return null;
            const { Icon } = item;
            return (
              <span
                key={`${id}-${index}`}
                className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2"
              >
                <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                <Icon className="size-6" style={{ color: item.color }} aria-hidden />
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
                disabled={locked || sequence.length < MIN_SEQUENCE || Boolean(ruleError)}
                onClick={onConfirm}
              >
                <Check className="size-4" /> Done
              </Button>
            </>
          )}
        </div>
        {enforceRules && (
          <p
            className={cn(
              "mt-2 text-xs",
              ruleError ? "text-destructive" : "text-muted-foreground",
            )}
            role="status"
          >
            {ruleError ??
              `Looks good — ${sequence.length} pictures from ${groupsUsed} groups.`}
          </p>
        )}
      </div>

      <div className={cn("relative space-y-3", disabled && "pointer-events-none opacity-40")}>
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pictures (cat, pizza, car…)"
            className="pl-9"
            aria-label="Search pictures"
          />
        </div>

        {/* Category list */}
        {!category && (
          <ul className="max-h-[15.5rem] snap-y snap-mandatory space-y-2 overflow-y-auto overscroll-contain rounded-xl pr-1">
            {visibleCategories.length === 0 && (
              <li className="p-3 text-sm text-muted-foreground">No groups match your search.</li>
            )}
            {visibleCategories.map((c) => {
              const count = ICONS.filter((i) => i.category === c.id).length;
              return (
                <li key={c.id} className="snap-start">
                  <button
                    type="button"
                    {...hold.handlers(`${c.label} group`)}
                    onClick={() => {
                      if (hold.didSpeak()) return;
                      stopSpeaking();
                      setCategory(c.id);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >

                    <span
                      className="flex size-11 items-center justify-center rounded-lg bg-muted"
                      style={{ color: c.color }}
                    >
                      <c.Icon className="size-6" aria-hidden />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">{c.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {count} pictures
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Paged, horizontally swipeable grid */}
        {(category || searching) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {category && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCategory(null)}
                >
                  <ArrowLeft className="size-4" /> Groups
                </Button>
              )}
              <p className="text-sm font-medium">
                {searching ? `Results for “${query.trim()}”` : activeCategory?.label}
              </p>
              <span className="ml-auto text-xs text-muted-foreground">
                {pages.length > 1 ? "Swipe sideways →" : `${visible.length} pictures`}
              </span>
            </div>

            {visible.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No picture found. Try another word.
              </p>
            ) : (
              <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
                {pages.map((page, pageIndex) => (
                  <div
                    key={pageIndex}
                    className="grid w-full flex-none snap-start grid-cols-4 grid-rows-4 gap-2"
                  >
                    {page.map(({ id, label, Icon, color }) => {
                      const count = sequence.filter((s) => s === id).length;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-label={label}
                          title={label}
                          disabled={disabled}
                          {...hold.handlers(label)}
                          onClick={() => {
                            if (hold.didSpeak()) return;
                            speak(label);
                            onChange([...sequence, id]);
                          }}

                          className={cn(
                            "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card transition-colors",
                            "hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            count > 0 && "border-primary bg-primary/10",
                          )}
                        >
                          <Icon className="size-8" style={{ color }} aria-hidden />
                          <span className="max-w-full truncate px-1 text-[10px] text-muted-foreground">
                            {label}
                          </span>
                          {count > 0 && (
                            <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
            <Lock className="size-10 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
