import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getAdminFromRequest, unauthorized } from "@/lib/auth";
import { isOrderStatus, OrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

/** GET /api/admin/orders — admin-only, paginated list with search + status filter. */
export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) return unauthorized();

  const sp = req.nextUrl.searchParams;
  const search = (sp.get("search") ?? "").trim();
  const statusParam = sp.get("status") ?? "";
  const status: OrderStatus | null = isOrderStatus(statusParam) ? statusParam : null;
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  // Compose WHERE dynamically (parameterized — no string interpolation of user input).
  const conds: string[] = [];
  const params: unknown[] = [];
  let n = 0;
  if (search) {
    n++;
    params.push(`%${search}%`);
    conds.push(
      `(public_ref ILIKE $${n} OR customer_name ILIKE $${n} OR phone ILIKE $${n})`,
    );
  }
  if (status) {
    n++;
    params.push(status);
    conds.push(`status = $${n}`);
  }
  const whereSql = conds.length > 0 ? `WHERE ${conds.join(" AND ")}` : "";

  try {
    const countRows = await q<{ count: number }>(
      `SELECT count(*)::int AS count FROM order_requests ${whereSql}`,
      params,
    );
    const total = countRows[0]?.count ?? 0;

    n++;
    const limitParam = n;
    n++;
    const offsetParam = n;
    const rows = await q(
      `SELECT id, public_ref, customer_name, phone, product_name_snapshot,
              price_snapshot, quantity, status, created_at, updated_at
       FROM order_requests
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, PAGE_SIZE, offset],
    );

    return NextResponse.json({
      success: true,
      orders: rows,
      total,
      page,
      pageSize: PAGE_SIZE,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (err) {
    console.error("admin orders list failed", err);
    return NextResponse.json(
      { success: false, error: "Could not load orders right now." },
      { status: 500 },
    );
  }
}
