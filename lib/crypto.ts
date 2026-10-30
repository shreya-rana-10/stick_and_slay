import crypto from "node:crypto";

/**
 * Password hashing for the private admin area. Uses Node's built-in scrypt
 * (no external dependency). Stored format: "s1$<salt b64>$<hash b64>".
 */
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, SCRYPT_OPTS);
  return `s1$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [tag, saltB64, hashB64] = stored.split("$");
    if (tag !== "s1" || !saltB64 || !hashB64) return false;
    const salt = Buffer.from(saltB64, "base64");
    const storedHash = Buffer.from(hashB64, "base64");
    const candidate = crypto.scryptSync(password, salt, storedHash.length, SCRYPT_OPTS);
    return crypto.timingSafeEqual(storedHash, candidate);
  } catch {
    return false;
  }
}

/** Typeable strong random password (for first-run admin creation). */
export function generatePassword(length = 16): string {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}
