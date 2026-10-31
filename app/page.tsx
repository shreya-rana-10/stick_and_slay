import Link from "next/link";
import { q } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const steps = [
  {
    n: "01",
    title: "Pick your style",
    body: "Browse the designs — silver diamond and amber gem styles. Every one is magnetic and priced under ₹299.",
  },
  {
    n: "02",
    title: "Send a request",
    body: "Fill the order form with your design, quantity and delivery details. No online payment at this step.",
  },
  {
    n: "03",
    title: "We confirm & deliver",
    body: "Our team contacts you to confirm availability, delivery and payment — then your order ships.",
  },
];

const homeFaqs = [
  {
    q: "Do these need a pierced ear?",
    a: "No. Magnetic earrings hold both sides of your earlobe with magnets — you get the complete pierced look without a single hole.",
  },
  {
    q: "Do I have to pay online?",
    a: "No. The website collects an order request. We confirm availability and delivery with you personally, and payment is arranged directly.",
  },
  {
    q: "Are these only for boys?",
    a: "Not at all — the styles are unisex. We just make sure guys feel at home here too.",
  },
];

export default async function HomePage() {
  const featured = await q<Product>(
    `SELECT id, name, slug, description, price_inr, image_url, category, is_active
     FROM products
     WHERE is_active = true
     ORDER BY id ASC
     LIMIT 4`,
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 max-w-2xl rounded-full bg-slay/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-20 text-center sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-mist">
            <span className="rounded-full border border-line px-3 py-1">No piercing needed</span>
            <span className="rounded-full border border-line px-3 py-1">Unisex</span>
            <span className="rounded-full border border-line px-3 py-1">
              Under ₹{site.priceCapInr}
            </span>
          </div>
          <h1 className="mt-8 font-display text-5xl uppercase leading-[0.95] sm:text-7xl">
            The ear-piercing look.{" "}
            <span className="text-slay">No piercing needed.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-mist">
            Magnetic earrings that give you the complete earring look — without
            a needle, without the wait, without the commitment. Stick on the
            style. Slay the fit.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/order"
              className="rounded-full bg-slay px-7 py-3.5 font-display text-lg uppercase tracking-wide text-ink transition hover:bg-white"
            >
              Order now
            </Link>
            <Link
              href="/designs"
              className="rounded-full border border-line px-7 py-3.5 font-display text-lg uppercase tracking-wide text-pure transition hover:border-slay/60 hover:text-slay"
            >
              Explore designs
            </Link>
          </div>
        </div>

        {/* Hero product banner */}
        <div className="relative mx-auto max-w-lg px-4 pb-16 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products/diamond-stud-banner.jpg"
            alt="Magnetic studs — simple, stylish, everyday. Product collage showing the ear fit and the strong magnetic hold"
            className="w-full rounded-3xl border border-line"
          />
        </div>
      </section>

      {/* Featured designs */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl uppercase sm:text-4xl">Fresh drops</h2>
            <p className="mt-2 text-sm text-mist">
              Starter styles for first-time wearers. Every design under ₹
              {site.priceCapInr}.
            </p>
          </div>
          <Link
            href="/designs"
            className="shrink-0 text-sm text-slay underline underline-offset-4 transition hover:text-white"
          >
            View all →
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-line bg-panel p-6 text-sm text-mist">
            New designs are being uploaded right now — check back shortly.
          </p>
        ) : (
          <div className="mt-8 flex flex-wrap justify-center gap-4">
  {featured.map((p) => (
    <div key={p.id} className="w-full max-w-[16rem] sm:w-64">
      <ProductCard product={p} />
    </div>
  ))}
</div>
        )}
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-panel/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-3xl uppercase sm:text-4xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-line bg-panel p-6">
                <div className="font-display text-4xl text-slay">{s.n}</div>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For the boys */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-4xl items-center justify-items-center gap-10 text-center md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl uppercase sm:text-4xl">
              Built for the boys.{" "}
              <span className="text-slay">Open to everyone.</span>
            </h2>
            <p className="mt-4 leading-relaxed text-mist">
              No pierced ear? No problem. Stick &amp; Slay is for guys who want
              the earring look without a needle anywhere near them. Pick a
              silver diamond stud or an amber gem — it holds by magnet, comes
              off clean, and nobody in the room can tell the difference.
            </p>
            <p className="mt-3 text-sm text-mist">
              Girls, friends, family — the styles are unisex too. Wear what fits
              your vibe.
            </p>
            <Link
              href="/how-it-works"
              className="mt-6 inline-block text-sm text-slay underline underline-offset-4 transition hover:text-white"
            >
              See how the magnet holds →
            </Link>
          </div>
          <div className="mx-auto w-full max-w-[16rem] rounded-3xl border border-line bg-panel p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/products/diamond-stud-on-ear.jpg"
              alt="Man wearing the silver magnetic diamond stud — clean, clamped fit with no piercing"
              className="mx-auto w-full max-w-[13rem] rounded-2xl object-contain"
              loading="lazy"
            />
            <p className="px-4 py-2 text-center text-sm font-semibold uppercase tracking-widest text-mist">
              For every occasion — one stud, no holes
            </p>
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="border-t border-line bg-panel/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-3xl uppercase sm:text-4xl">
            Quick answers
          </h2>
          <div className="mt-8 space-y-3">
            {homeFaqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-panel p-5">
                <summary className="cursor-pointer list-none font-semibold marker:content-none">
                  <span className="text-slay transition group-open:rotate-90 inline-block mr-2">▸</span>
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-mist">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="text-sm text-slay underline underline-offset-4 transition hover:text-white"
            >
              Read the full FAQ →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-3xl uppercase sm:text-5xl">
          Ready to make the look yours?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-mist">
          Send a request in under a minute. We confirm with you personally
          before anything ships.
        </p>
        <Link
          href="/order"
          className="mt-8 inline-block rounded-full bg-slay px-8 py-4 font-display text-lg uppercase tracking-wide text-ink transition hover:bg-white"
        >
          Order now — from ₹199
        </Link>
      </section>
    </>
  );
}
