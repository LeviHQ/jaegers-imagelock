import { Grid2x2, Moon, Settings, Sun, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  ICON_SIZES,
  setIconSize,
  setSound,
  setTheme,
  useSettings,
} from "@/lib/imagelock/settings";
import { speak, speechSupported } from "@/lib/imagelock/speak";
import { cn } from "@/lib/utils";

export function SettingsButton() {
  const { theme, sound, iconSize, mounted } = useSettings();

  if (!mounted) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Settings"
          title="Settings"
          className="fixed right-4 top-4 z-50 rounded-full shadow-sm"
        >
          <Settings className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4">
        <p className="text-sm font-semibold">Settings</p>

        {/* Sound */}
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="setting-sound" className="flex items-center gap-2 text-sm font-normal">
            {sound ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
            Sound narration
          </Label>
          <Switch
            id="setting-sound"
            checked={sound}
            disabled={!speechSupported()}
            onCheckedChange={(next) => {
              setSound(next);
              if (next) speak("Sound on. Tap and hold a picture to hear its name.");
            }}
          />
        </div>

        <Separator />

        {/* Theme */}
        <div className="space-y-2">
          <p className="text-sm">Appearance</p>
          <div className="grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                size="sm"
                variant={theme === mode ? "default" : "outline"}
                aria-pressed={theme === mode}
                onClick={() => setTheme(mode)}
              >
                {mode === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {mode === "light" ? "Light" : "Dark"}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Icon size */}
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm">
            <Grid2x2 className="size-4" aria-hidden /> Picture size
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ICON_SIZES.map((s) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={iconSize === s.id ? "default" : "outline"}
                aria-pressed={iconSize === s.id}
                className={cn("px-2")}
                onClick={() => setIconSize(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
