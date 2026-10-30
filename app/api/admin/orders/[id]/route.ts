import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { isOrderStatus } from "@/lib/orders";
import { MAX_NOTE_LENGTH } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Fetch the full order + notes for the admin detail view. */
async function loadOrder(id: number) {
  const orders = await q<Record<string, unknown>>(
    `SELECT id, public_ref, customer_name, phone, email, address, city, pincode,
            product_id, product_name_snapshot, price_snapshot, quantity,
            customer_note, status, created_at, updated_at
     FROM order_requests
     WHERE id = $1`,
    [id],
  );
  if (!orders[0]) return null;
  const notes = await q<Record<string, unknown>>(
    `SELECT id, note, created_at, created_by
     FROM order_notes
     WHERE order_request_id = $1
     ORDER BY created_at DESC`,
    [id],
  );
  return { order: orders[0], notes };
}

/** GET /api/admin/orders/[id] — admin-only order detail. */
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[id]">,
) {
  if (!getAdminFromRequest(req)) return unauthorized();
  const { id: idParam } = await ctx.params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, error: "Invalid id." }, { status: 400 });
  }

  try {
    const data = await loadOrder(id);
    if (!data) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    console.error("admin order detail failed", err);
    return NextResponse.json(
      { success: false, error: "Could not load this order right now." },
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/orders/[id] — update status and/or append an internal note. */
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[id]">,
) {
  const session = getAdminFromRequest(req);
  if (!session) return unauthorized();

  const { id: idParam } = await ctx.params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, error: "Invalid id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 });
  }
  const { status, note } = (body ?? {}) as { status?: unknown; note?: unknown };

  const hasStatus = status !== undefined && status !== null && status !== "";
  const hasNote = note !== undefined && note !== null && typeof note === "string" && note.trim() !== "";
  if (!hasStatus && !hasNote) {
    return NextResponse.json(
      { success: false, error: "Nothing to update — provide a status or a note." },
      { status: 400 },
    );
  }
  if (hasStatus && !isOrderStatus(status)) {
    return NextResponse.json({ success: false, error: "Unknown status." }, { status: 400 });
  }
  if (typeof note === "string" && note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json(
      { success: false, error: `Notes are limited to ${MAX_NOTE_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const exists = await q(`SELECT id FROM order_requests WHERE id = $1`, [id]);
    if (!exists[0]) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    if (hasStatus) {
      await q(
        `UPDATE order_requests SET status = $1, updated_at = now() WHERE id = $2`,
        [status, id],
      );
    }
    if (hasNote) {
      await q(
        `INSERT INTO order_notes (order_request_id, note, created_by) VALUES ($1, $2, $3)`,
        [id, (note as string).trim(), session.sub],
      );
    }

    const data = await loadOrder(id);
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    console.error("admin order update failed", err);
    return NextResponse.json(
      { success: false, error: "Could not update this order right now." },
      { status: 500 },
    );
  }
}
