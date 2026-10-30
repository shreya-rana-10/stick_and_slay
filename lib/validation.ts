/**
 * Pure (isomorphic) input validation for the order request form.
 * Runs in the browser for friendly errors AND on the server for safety
 * (PRD principle: "Validate twice").
 */

export const MAX_QUANTITY = 10;
export const MAX_NOTE_LENGTH = 300;

export type FieldError = { field: string; message: string };

export type ValidOrder = {
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  pincode: string;
  productId: number;
  quantity: number;
  note: string | null;
};

const PHONE_RE = /^(?:\+?91|0)?([6-9]\d{9})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PIN_RE = /^[1-9]\d{5}$/;

/** Normalize an Indian mobile number to its bare 10 digits, or null. */
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const compact = raw.replace(/[\s\-().]/g, "");
  const match = PHONE_RE.exec(compact);
  return match ? match[1] : null;
}

export function isValidEmail(raw: unknown): boolean {
  return typeof raw === "string" && EMAIL_RE.test(raw) && raw.length <= 120;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateOrder(body: unknown):
  | { ok: true; value: ValidOrder }
  | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const push = (field: string, message: string) => errors.push({ field, message });

  if (!body || typeof body !== "object") {
    return { ok: false, errors: [{ field: "form", message: "The submission could not be read. Please try again." }] };
  }
  const b = body as Record<string, unknown>;

  const customerName = str(b.customerName);
  if (customerName.length < 2 || customerName.length > 80) {
    push("customerName", "Please enter your full name (2–80 characters).");
  }

  const phone = normalizePhone(b.phone);
  if (!phone) {
    push("phone", "Please enter a valid 10-digit Indian mobile number.");
  }

  const email = str(b.email);
  if (b.email != null && typeof b.email === "string" && email !== "" && !isValidEmail(email)) {
    push("email", "That email address doesn't look right.");
  }

  const address = str(b.address);
  if (address.length < 10 || address.length > 300) {
    push("address", "Please enter your full delivery address (at least 10 characters).");
  }

  const city = str(b.city);
  if (city.length < 2 || city.length > 60) {
    push("city", "Please enter your city or town.");
  }

  const pincode = str(b.pincode);
  if (!PIN_RE.test(pincode)) {
    push("pincode", "Please enter a valid 6-digit PIN code.");
  }

  const productIdRaw = (b as { productId?: unknown }).productId;
  const productId =
    typeof productIdRaw === "number"
      ? productIdRaw
      : typeof productIdRaw === "string" && productIdRaw !== ""
        ? Number.parseInt(productIdRaw, 10)
        : Number.NaN;
  if (!Number.isInteger(productId) || productId <= 0) {
    push("productId", "Please pick a design to order.");
  }

  const quantityRaw = (b as { quantity?: unknown }).quantity;
  const quantity =
    typeof quantityRaw === "number"
      ? quantityRaw
      : typeof quantityRaw === "string" && quantityRaw !== ""
        ? Number.parseInt(quantityRaw, 10)
        : Number.NaN;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    push("quantity", `Quantity must be a whole number between 1 and ${MAX_QUANTITY}.`);
  }

  const note = str(b.customerNote ?? (b as Record<string, unknown>).note);
  if (b.customerNote != null && typeof b.customerNote === "string" && note.length > MAX_NOTE_LENGTH) {
    push("customerNote", `Notes are limited to ${MAX_NOTE_LENGTH} characters.`);
  }

  if (b.consent !== true) {
    push("consent", "Please allow us to contact you about your order request.");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      customerName,
      phone: phone as string,
      email: email !== "" ? email : null,
      address,
      city,
      pincode,
      productId: productId as number,
      quantity: quantity as number,
      note: note !== "" ? note : null,
    },
  };
}
