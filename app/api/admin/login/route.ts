import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/login — owner authentication.
 * Verifies the scrypt password hash and issues a signed HttpOnly session
 * cookie. Failures return a generic message; attempts are rate-limited.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(clientKey(req, "admin-login"), 8, 10 * 60_000)) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid email or password." },
      { status: 400 },
    );
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return NextResponse.json(
      { success: false, error: "Invalid email or password." },
      { status: 400 },
    );
  }

  const rows = await q<{ id: number; email: string; password_hash: string }>(
    `SELECT id, email, password_hash FROM admins WHERE email = $1`,
    [email.trim().toLowerCase()],
  );
  const admin = rows[0];
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Invalid email or password." },
      { status: 401 },
    );
  }

  // Constant-time-ish comparison; same generic message either way.
  let valid = false;
  try {
    valid = verifyPassword(password, admin.password_hash);
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json(
      { success: false, error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ success: true });
  return setSessionCookie(res, admin.email);
}
