/** Order domain constants + public reference generator. */

import crypto from "node:crypto";

export const ORDER_STATUSES = [
  "new",
  "contacted",
  "confirmed",
  "dispatched",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}

/** Public request reference, e.g. "SS-K7M2QX" (no sequential DB ids exposed). */
export function makePublicRef(): string {
  // Ambiguous characters (O/0, I/1/L) excluded.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let ref = "SS-";
  for (const byte of bytes) ref += alphabet[byte % alphabet.length];
  return ref;
}
