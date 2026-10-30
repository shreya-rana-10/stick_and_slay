"use client";

import { useState } from "react";
import { BrandMark } from "@/components/nav";

const inputCls =
  "w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-pure placeholder:text-mist/60 focus:border-slay/60 focus:outline-none";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-mist";

/** Owner login for /admin — posts to /api/admin/login, reloads on success. */
export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (res.ok && data.success) {
        window.location.reload();
      } else {
        setError(data.error ?? "Invalid email or password.");
      }
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="rounded-2xl border border-line bg-panel p-6">
        <div className="text-center">
          <BrandMark className="text-xl" />
          <h1 className="mt-3 font-display text-2xl uppercase">Owner sign in</h1>
          <p className="mt-1 text-xs text-mist">Private area for managing order requests.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className={labelCls}>Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className={labelCls}>Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              required
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-slay px-4 py-3 text-sm font-bold text-ink transition hover:bg-white disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
