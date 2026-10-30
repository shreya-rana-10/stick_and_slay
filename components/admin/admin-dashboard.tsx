"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminOrderRow } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/orders";
import { formatIST } from "@/lib/ist";

const statusStyles: Record<string, string> = {
  new: "bg-slay/15 text-slay",
  contacted: "bg-blue-500/15 text-blue-300",
  confirmed: "bg-violet-500/15 text-violet-300",
  dispatched: "bg-cyan-500/15 text-cyan-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-zinc-500/20 text-zinc-300",
};

const inputCls =
  "w-full rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-pure placeholder:text-mist/60 focus:border-slay/60 focus:outline-none";

/** Newest-first order list with search + status filter (PRD §6). */
export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ orders: AdminOrderRow[]; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      const json = (await res.json()) as {
        success: boolean;
        orders?: AdminOrderRow[];
        total?: number;
        pages?: number;
        error?: string;
      };
      if (!json.success) throw new Error(json.error ?? "Failed to load orders.");
      setData({
        orders: json.orders ?? [],
        total: json.total ?? 0,
        pages: json.pages ?? 1,
      });
    } catch {
      setError("Could not load orders right now.");
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase">Orders</h1>
          <p className="mt-1 text-sm text-mist">
            Signed in as {adminEmail} · {data ? `${data.total} request(s)` : "…"}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-line px-4 py-2 text-sm text-mist transition hover:border-red-400/60 hover:text-red-300"
        >
          Log out
        </button>
      </div>

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by reference, name, or phone…"
          className={inputCls}
          aria-label="Search orders"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className={`${inputCls} sm:w-48`}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-slay px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-white"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && !data ? (
        <p className="mt-10 text-center text-mist">Loading orders…</p>
      ) : !loading && data && data.orders.length === 0 ? (
        <p className="mt-10 text-center text-mist">
          No order requests match. New requests will appear here automatically.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data?.orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="block rounded-2xl border border-line bg-panel p-4 transition hover:border-slay/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-bold text-slay">{o.public_ref}</div>
                    <div className="mt-1 truncate font-semibold">
                      {o.customer_name}
                      <span className="ml-2 text-sm font-normal text-mist">{o.phone}</span>
                    </div>
                    <div className="mt-1 text-sm text-mist">
                      {o.product_name_snapshot} × {o.quantity} · ₹
                      {o.price_snapshot * o.quantity} · {formatIST(o.created_at)}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      statusStyles[o.status] ?? "bg-panel2 text-mist"
                    }`}
                  >
                    {STATUS_LABELS[o.status as keyof typeof STATUS_LABELS] ?? o.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && data.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-line px-4 py-2 text-mist transition enabled:hover:border-slay/50 enabled:hover:text-pure disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-mist">
            Page {page} of {data.pages}
          </span>
          <button
            type="button"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-line px-4 py-2 text-mist transition enabled:hover:border-slay/50 enabled:hover:text-pure disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
