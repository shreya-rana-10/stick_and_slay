import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "./session";

/** Read the (verified) admin identity from an incoming request. */
export function getAdminFromRequest(req: NextRequest): { sub: string } | null {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Uniform 401 for admin APIs. */
export function unauthorized(): NextResponse {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

/** Attach an HttpOnly, signed session cookie to a response. */
export function setSessionCookie(res: NextResponse, subject: string): NextResponse {
  res.cookies.set(ADMIN_COOKIE, createSessionToken(subject), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}

/** Clear the session cookie (logout). */
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
