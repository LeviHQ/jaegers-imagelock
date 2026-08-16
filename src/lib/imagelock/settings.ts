import { useEffect, useState } from "react";

import { setNarration, isNarrationOn } from "./speak";

export type IconSize = "small" | "medium" | "large";
export type ThemeMode = "light" | "dark";

const ICON_SIZE_KEY = "imagelock:iconSize";
const THEME_KEY = "imagelock-theme";
const EVENT = "imagelock:settings";

export const ICON_SIZES: { id: IconSize; label: string; cols: number; rows: number }[] = [
  { id: "small", label: "Small", cols: 5, rows: 5 },
  { id: "medium", label: "Medium", cols: 4, rows: 4 },
  { id: "large", label: "Large", cols: 3, rows: 3 },
];

export function getIconSize(): IconSize {
  if (typeof window === "undefined") return "medium";
  const v = window.localStorage.getItem(ICON_SIZE_KEY);
  return v === "small" || v === "large" ? v : "medium";
}

export function getTheme(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function setIconSize(size: IconSize) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ICON_SIZE_KEY, size);
  notify();
}

export function setTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
  notify();
}

export function setSound(on: boolean) {
  setNarration(on);
  notify();
}

/** Client-only settings snapshot; stays "default" until mounted to avoid hydration mismatch. */
export function useSettings() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<{ theme: ThemeMode; sound: boolean; iconSize: IconSize }>({
    theme: "light",
    sound: true,
    iconSize: "medium",
  });

  useEffect(() => {
    const read = () =>
      setState({ theme: getTheme(), sound: isNarrationOn(), iconSize: getIconSize() });
    read();
    setMounted(true);
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);

  return { ...state, mounted };
}
