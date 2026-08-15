export function syntheticEmail(username: string) {
  return `${username.trim().toLowerCase()}@users.imagelock.app`;
}

/**
 * Hashes the picture sequence in the browser (SHA-256).
 * The plain sequence never leaves the device.
 */
export async function hashSequence(username: string, sequence: string[]) {
  const material = `imagelock:v1:${username.trim().toLowerCase()}:${sequence.join(">")}`;
  const bytes = new TextEncoder().encode(material);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
