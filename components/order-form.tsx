"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { MAX_QUANTITY, normalizePhone, PIN_RE } from "@/lib/validation";

type Props = {
  products: Product[];
  preselectedSlug?: string;
};

type FieldErrors = Record<string, string>;

const inputCls =
  "w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-pure placeholder:text-mist/60 focus:border-slay/60 focus:outline-none";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-mist";

/** Client-side mirror of the server validation for instant, friendly errors. */
function clientValidate(fields: {
  productId: string;
  quantity: number;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  note: string;
  consent: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.productId) errors.productId = "Please pick a design to order.";
  if (fields.quantity < 1 || fields.quantity > MAX_QUANTITY)
    errors.quantity = `Quantity must be between 1 and ${MAX_QUANTITY}.`;
  if (fields.customerName.trim().length < 2)
    errors.customerName = "Please enter your full name.";
  if (!normalizePhone(fields.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (fields.email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
    errors.email = "That email address doesn't look right.";
  if (fields.address.trim().length < 10) errors.address = "Please enter your full delivery address.";
  if (fields.city.trim().length < 2) errors.city = "Please enter your city or town.";
  if (!PIN_RE.test(fields.pincode.trim())) errors.pincode = "Enter a valid 6-digit PIN code.";
  if (fields.note.length > 300) errors.customerNote = "Notes are limited to 300 characters.";
  if (!fields.consent) errors.consent = "Please allow us to contact you about your request.";
  return errors;
}

export function OrderForm({ products, preselectedSlug }: Props) {
  const router = useRouter();
  const preselected = products.find((p) => p.slug === preselectedSlug);

  const [productId, setProductId] = useState<string>(preselected ? String(preselected.id) : "");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  // Honeypot: humans never see or fill this.
  const [honey, setHoney] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const product = products.find((p) => String(p.id) === productId);
  const estimate = product ? product.price_inr * quantity : 0;

  const errText = (key: string) => errors[key] ? (
    <p className="mt-1.5 text-xs text-red-400" role="alert">{errors[key]}</p>
  ) : null;

  function setQty(next: number) {
    setQuantity(Math.min(MAX_QUANTITY, Math.max(1, next)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSummary(null);

    // Silently drop bot submissions that filled the honeypot.
    if (honey.trim() !== "") return;

    const clientErrors = clientValidate({
      productId,
      quantity,
      customerName,
      phone,
      email,
      address,
      city,
      pincode,
      note,
      consent,
    });
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setSummary("Please fix the highlighted fields and try again.");
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/order-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          email: email.trim() === "" ? null : email.trim(),
          productId: Number.parseInt(productId, 10),
          quantity,
          address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          customerNote: note.trim(),
          consent,
          company_website: honey,
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        reference?: string;
        errors?: Array<{ field: string; message: string }>;
        error?: string;
      };

      if (res.ok && data.success && data.reference) {
        // Duplicate submissions impossible after this point.
        router.push(`/thank-you?ref=${encodeURIComponent(data.reference)}`);
        router.refresh();
        return;
      }

      if (data.errors && data.errors.length > 0) {
        const map: FieldErrors = {};
        for (const fe of data.errors) map[fe.field] = fe.message;
        setErrors(map);
        setSummary("Please fix the highlighted fields and try again.");
      } else {
        setSummary(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setSummary("Network problem — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6" aria-describedby="order-form-note">
      {/* Honeypot field — visually hidden, never required */}
      <input
        type="text"
        name="company_website"
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <fieldset className="rounded-2xl border border-line bg-panel p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-widest text-slay">
          1 · Choose your design
        </legend>
        <div className="mt-2 space-y-4">
          <div>
            <label htmlFor="product" className={labelCls}>Design</label>
            <select
              id="product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="">Choose a design…</option>
              {products.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} — ₹{p.price_inr} ({p.category})
                </option>
              ))}
            </select>
            {errText("productId")}
          </div>

          <div>
            <label htmlFor="quantity" className={labelCls}>Quantity</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty(quantity - 1)}
                className="h-11 w-11 rounded-xl border border-line text-lg font-bold text-mist transition hover:border-slay/60 hover:text-pure"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                id="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_QUANTITY}
                value={quantity}
                onChange={(e) => setQty(Number.parseInt(e.target.value, 10) || 1)}
                className={`${inputCls} w-20 text-center`}
              />
              <button
                type="button"
                onClick={() => setQty(quantity + 1)}
                className="h-11 w-11 rounded-xl border border-line text-lg font-bold text-mist transition hover:border-slay/60 hover:text-pure"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            {errText("quantity")}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-mist">Estimated total</div>
              <div className="text-xs text-mist/70">
                Estimate only — the final amount is confirmed with you directly.
                No online payment.
              </div>
            </div>
            <div className="font-display text-2xl text-slay">₹{estimate}</div>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-panel p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-widest text-slay">
          2 · Contact details
        </legend>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="customerName" className={labelCls}>Full name</label>
            <input
              id="customerName"
              type="text"
              autoComplete="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className={inputCls}
            />
            {errText("customerName")}
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>Phone (WhatsApp preferred)</label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              className={inputCls}
            />
            {errText("phone")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className={labelCls}>Email (optional)</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
            {errText("email")}
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-panel p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-widest text-slay">
          3 · Delivery details
        </legend>
        <div className="mt-2 grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <label htmlFor="address" className={labelCls}>Address</label>
            <textarea
              id="address"
              rows={3}
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House / street / area / landmark"
              className={`${inputCls} resize-y`}
            />
            {errText("address")}
          </div>
          <div className="sm:col-span-4">
            <label htmlFor="city" className={labelCls}>City / town</label>
            <input
              id="city"
              type="text"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Pune"
              className={inputCls}
            />
            {errText("city")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pincode" className={labelCls}>PIN code</label>
            <input
              id="pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              placeholder="411001"
              className={inputCls}
            />
            {errText("pincode")}
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="note" className={labelCls}>Anything else? (optional)</label>
            <textarea
              id="note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. gift wrap, preferred delivery time…"
              className={`${inputCls} resize-y`}
            />
            {errText("customerNote")}
          </div>
        </div>
      </fieldset>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-mist">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#d9ff45]"
          />
          <span>
            I agree to be contacted about my order request. I understand this
            website does not take online payment — our team confirms the order
            with me first. (See our{" "}
            <Link href="/privacy" className="text-slay underline underline-offset-2">
              privacy notice
            </Link>
            .)
          </span>
        </label>
        {errText("consent")}
      </div>

      {summary && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {summary}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-slay px-6 py-4 font-display text-lg uppercase tracking-wide text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Sending request…" : "Send order request"}
      </button>

      <p id="order-form-note" className="text-center text-xs text-mist">
        You'll receive a unique reference code on the next page — keep it handy
        for follow-up.
      </p>
    </form>
  );
}
