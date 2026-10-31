import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { validateOrder } from "@/lib/validation";
import { makePublicRef } from "@/lib/orders";
import { appendOrderToSheet } from "@/lib/sheets";

export const dynamic = "force-dynamic";

/**
 * POST /api/order-requests
 * Validate every field server-side, check product availability, store ONE
 * request — primary storage is the owner's Google Sheet (Apps Script
 * webhook), with the database as fallback if the sheet write fails.
 * Returns a public reference. No payment data is ever accepted (PRD §8).
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "The submission could not be read. Please try again." },
      { status: 400 },
    );
  }

  // Honeypot: real users never fill this hidden field. Bots get a fake
  // 201 (nothing is stored) so they don't adapt.
  const honey = (body as Record<string, unknown> | null)?.company_website;
  if (typeof honey === "string" && honey.trim() !== "") {
    return NextResponse.json(
      { success: true, reference: "SS-XXXXXX", estimateInr: 0 },
      { status: 201 },
    );
  }

  // Lightweight anti-spam: max 5 submissions per minute per IP.
  if (!rateLimit(clientKey(req, "order"), 5, 60_000)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  const result = validateOrder(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, errors: result.errors }, { status: 400 });
  }
  const value = result.value;

  const productRows = await q<{ id: number; name: string; price_inr: number; is_active: boolean }>(
    `SELECT id, name, price_inr, is_active FROM products WHERE id = $1`,
    [value.productId],
  );
  const product = productRows[0];
  if (!product || !product.is_active) {
    return NextResponse.json(
      {
        success: false,
        errors: [
          { field: "productId", message: "That design is unavailable right now. Please pick another." },
        ],
      },
      { status: 400 },
    );
  }

  const estimate = product.price_inr * value.quantity;
  const reference = makePublicRef();

  // PRIMARY storage: the owner's Google Sheet. Order details live there;
  // the database is only used as a fallback when the sheet write fails.
  const sheetWrite = await appendOrderToSheet({
    reference,
    customerName: value.customerName,
    phone: value.phone,
    email: value.email,
    address: value.address,
    city: value.city,
    pincode: value.pincode,
    productName: product.name,
    unitPriceInr: product.price_inr,
    quantity: value.quantity,
    estimateInr: estimate,
    customerNote: value.note,
    status: "new",
  });
  if (sheetWrite.ok) {
    // Only public fields are returned — never internal ids or payment data.
    return NextResponse.json(
      { success: true, reference, estimateInr: estimate },
      { status: 201 },
    );
  }
  console.error("google sheets write failed, falling back to database:", sheetWrite.error);

  // FALLBACK storage: the database. Only reaches here when the sheet write
  // fails, so a customer request is never lost. Retries on ref collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const fallbackRef = makePublicRef();
    try {
      await q(
        `INSERT INTO order_requests
           (public_ref, customer_name, phone, email, address, city, pincode,
            product_id, product_name_snapshot, price_snapshot, quantity, customer_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          fallbackRef,
          value.customerName,
          value.phone,
          value.email,
          value.address,
          value.city,
          value.pincode,
          product.id,
          product.name,
          product.price_inr,
          value.quantity,
          value.note,
        ],
      );
      return NextResponse.json(
        { success: true, reference: fallbackRef, estimateInr: estimate },
        { status: 201 },
      );
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "23505") continue; // unique violation on public_ref -> retry with a new ref
      console.error("order insert failed", err);
      break;
    }
  }

  return NextResponse.json(
    { success: false, error: "We couldn't save your request right now. Please try again." },
    { status: 500 },
  );
}
