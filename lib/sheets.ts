/**
 * Mirror of every new order request into the owner's Google Sheet.
 *
 * Implemented with a Google Apps Script "Web app" attached to the sheet —
 * no API keys or service-account JSON needed. Sheet columns (the script
 * creates the header row itself on first write):
 *   Timestamp (IST) | Order Ref | Customer Name | Phone | Email | Address |
 *   City | Pincode | Product | Unit Price (INR) | Quantity | Est. Total (INR) |
 *   Customer Note | Status
 *
 * Vercel env vars (never committed):
 *   SHEETS_WEBHOOK_URL     https://script.google.com/macros/s/.../exec
 *   SHEETS_WEBHOOK_SECRET  shared secret, checked by the script
 *
 * Behaviour: primary order storage. The route falls back to the database
 * only when the sheet write fails, so a request is never lost.
 */

export type SheetOrder = {
  reference: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  pincode: string;
  productName: string;
  unitPriceInr: number;
  quantity: number;
  estimateInr: number;
  customerNote: string | null;
  status: string;
};

export async function appendOrderToSheet(order: SheetOrder): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.SHEETS_WEBHOOK_URL?.trim();
  const secret = process.env.SHEETS_WEBHOOK_SECRET?.trim();
  if (!url || !secret) {
    return { ok: false, error: "SHEETS_WEBHOOK_URL/SECRET not configured" };
  }

  const payload = {
    secret,
    reference: order.reference,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email ?? "",
    address: order.address,
    city: order.city,
    pincode: order.pincode,
    product: order.productName,
    unitPriceInr: order.unitPriceInr,
    quantity: order.quantity,
    estimateInr: order.estimateInr,
    customerNote: order.customerNote ?? "",
    status: order.status,
  };

  // AbortController timeout so a hung Apps Script can't stall order creation.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    // text/plain avoids an Apps Script CORS preflight (it cannot answer OPTIONS).
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, error: `webhook responded ${res.status}` };
    const text = await res.text(); // drain the response
    let scriptResult: { ok?: boolean; error?: string } | null = null;
    try {
      scriptResult = JSON.parse(text) as { ok?: boolean; error?: string };
    } catch {
      scriptResult = null; // non-JSON output — treat HTTP 200 as success
    }
    if (scriptResult && scriptResult.ok === false) {
      return { ok: false, error: `script error: ${scriptResult.error ?? "unknown"}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}
