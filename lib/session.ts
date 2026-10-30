import crypto from "node:crypto";

/**
 * Stateless, HMAC-signed admin session cookies. HTTP-only, SameSite=Lax,
 * Secure in production. The signing secret lives in ADMIN_SESSION_SECRET.
 */

export const ADMIN_COOKIE = "ss_admin";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

type SessionPayload = { sub: string; exp: number };

function sign(body: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  return crypto.createHmac("sha256", secret).update(body).digest("base64url");
}

export function createSessionToken(subject: string): string {
  const payload: SessionPayload = {
    sub: subject,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token?: string | null): { sub: string } | null {
  if (!token) return null;
  if (!process.env.ADMIN_SESSION_SECRET) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (
      typeof payload?.sub !== "string" ||
      typeof payload?.exp !== "number" ||
      payload.exp < Date.now()
    ) {
      return null;
    }
    return { sub: payload.sub };
  } catch {
    return null;
  }
}
