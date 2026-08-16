const STORAGE_KEY = "imagelock:narration";

export function isNarrationOn() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

export function setNarration(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  if (!on) stopSpeaking();
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

/** Speak a short label out loud (browser built-in voice, no network). */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!isNarrationOn()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* narration is best-effort */
  }
}

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
