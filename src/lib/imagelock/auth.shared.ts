import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9_]+$/);

export const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);

export function syntheticAuthEmail(username: string) {
  return `${username.trim().toLowerCase()}@users.imagelock.app`;
}
