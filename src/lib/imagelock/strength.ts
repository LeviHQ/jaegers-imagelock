import { ICON_MAP, sequenceCategories } from "./icons";

export type Strength = {
  score: number; // 0-100
  label: "Too short" | "Weak" | "Fair" | "Strong" | "Very strong";
  tip: string;
  tone: "muted" | "weak" | "fair" | "strong" | "best";
};

/** Rough strength of a picture sequence: length, variety of groups, and repeats. */
export function sequenceStrength(sequence: string[]): Strength {
  const length = sequence.length;
  if (length === 0) {
    return { score: 0, label: "Too short", tip: "Pick your pictures to see strength.", tone: "muted" };
  }

  const groups = sequenceCategories(sequence).length;
  const unique = new Set(sequence.filter((id) => ICON_MAP[id])).size;
  const repeats = length - unique;

  let score = 0;
  score += Math.min(length, 8) * 7; // up to 56
  score += Math.min(groups, 4) * 9; // up to 36
  score += unique >= 4 ? 8 : 0;
  score -= repeats * 6;
  score = Math.max(5, Math.min(100, score));

  if (length < 4) {
    return {
      score: Math.min(score, 25),
      label: "Too short",
      tip: `Add ${4 - length} more picture${4 - length === 1 ? "" : "s"}.`,
      tone: "weak",
    };
  }

  if (score < 45) {
    return {
      score,
      label: "Weak",
      tip: groups < 2 ? "Use pictures from another group." : "Add a few more pictures.",
      tone: "weak",
    };
  }
  if (score < 70) {
    return {
      score,
      label: "Fair",
      tip: repeats > 0 ? "Avoid repeating the same picture." : "Add one more group for extra safety.",
      tone: "fair",
    };
  }
  if (score < 88) {
    return { score, label: "Strong", tip: "Nice — easy to remember, hard to guess.", tone: "strong" };
  }
  return { score, label: "Very strong", tip: "Excellent picture sequence.", tone: "best" };
}
