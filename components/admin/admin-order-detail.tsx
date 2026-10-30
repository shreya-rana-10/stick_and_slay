"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminOrderRow, OrderNote } from "@/lib/types";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/orders";
import { formatIST } from "@/lib/ist";

const inputCls =
  "w-full rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-pure focus:border-slay/60 focus:outline-none";

type Detail = {
  order: AdminOrderRow & {
    email: string | null;
    address: string;
    city: string;
    pincode: string;
    customer_note: string | null;
    product_id: number;
  };
  notes: OrderNote[];
};

/** One order: contact + delivery facts, status update, internal notes. */
export function AdminOrderDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    if (res.status === 401) {
      window.location.href = "/admin";
      return;
    }
    const json = (await res.json()) as { success: boolean } & Detail;
    if (json.success) {
      setDetail({ order: json.order, notes: json.notes ?? [] });
      setStatus(json.order.status);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { success: boolean } & Detail;
      if (res.ok && json.success) {
        setDetail({ order: json.order, notes: json.notes ?? [] });
        setStatus(json.order.status);
        setMsg({ ok: true, text: "Saved." });
        setNote("");
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setMsg({ ok: false, text: data?.error ?? "Could not save — try again." });
      }
    } catch {
      setMsg({ ok: false, text: "Network problem — try again." });
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-mist">Order not found.</p>
        <Link href="/admin" className="mt-4 inline-block text-sm text-slay underline">
          ← Back to all orders
        </Link>
      </div>
    );
  }

  if (!detail) {
    return <p className="px-4 py-16 text-center text-mist">Loading order…</p>;
  }

  const { order: o, notes } = detail;
  const estimate = o.price_snapshot * o.quantity;

  const field = (label: string, value: React.ReactNode) => (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-mist">{label}</div>
      <div className="mt-1 break-words text-sm text-pure">{value || "—"}</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/admin" className="text-sm text-mist transition hover:text-slay">
        ← All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slay">{o.public_ref}</h1>
          <p className="mt-1 text-xs text-mist">
            Submitted {formatIST(o.created_at)} · Last updated {formatIST(o.updated_at)}
          </p>
        </div>
        <span className="font-display text-3xl uppercase">₹{estimate}</span>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="font-display text-lg uppercase">Customer</h2>
          <div className="mt-4 space-y-4">
            {field("Name", o.customer_name)}
            {field(
              "Phone",
              <span className="flex items-center gap-3">
                {o.phone}
                <a
                  href={`https://wa.me/91${o.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-line px-3 py-1 text-xs text-mist transition hover:border-slay/60 hover:text-slay"
                >
                  WhatsApp ↗
                </a>
              </span>,
            )}
            {field("Email", o.email)}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="font-display text-lg uppercase">Delivery</h2>
          <div className="mt-4 space-y-4">
            {field("Address", o.address)}
            {field("City", o.city)}
            {field("PIN code", o.pincode)}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="font-display text-lg uppercase">Order</h2>
          <div className="mt-4 space-y-4">
            {field("Design (as ordered)", o.product_name_snapshot)}
            {field("Quantity", o.quantity)}
            {field("Price snapshot", `₹${o.price_snapshot}`)}
            {field("Customer note", o.customer_note)}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="font-display text-lg uppercase">Update</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="status" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-mist">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputCls}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={busy || status === o.status}
              onClick={() => patch({ status })}
              className="w-full rounded-full bg-slay px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save status"}
            </button>

            <div>
              <label htmlFor="note" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-mist">
                Add internal note
              </label>
              <textarea
                id="note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. called at 5pm, will pay by UPI…"
                className={`${inputCls} resize-y`}
              />
            </div>
            <button
              type="button"
              disabled={busy || note.trim() === ""}
              onClick={() => patch({ note })}
              className="w-full rounded-full border border-line px-4 py-2.5 text-sm text-mist transition enabled:hover:border-slay/60 enabled:hover:text-pure disabled:opacity-50"
            >
              Add note
            </button>

            {msg && (
              <p className={`text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`} role="status">
                {msg.text}
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-panel p-5">
        <h2 className="font-display text-lg uppercase">Notes</h2>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-mist">No notes yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-line bg-panel2 px-4 py-3">
                <p className="text-sm">{n.note}</p>
                <p className="mt-1 text-xs text-mist">
                  {n.created_by} · {formatIST(n.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
