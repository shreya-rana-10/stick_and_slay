import Link from "next/link";
import { notFound } from "next/navigation";
import { q } from "@/lib/db";
import type { Product } from "@/lib/types";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const rows = await q<Product>(
    `SELECT name, description FROM products WHERE slug = $1 AND is_active = true`,
    [slug],
  );
  const product = rows[0];
  if (!product) return { title: "Design not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 150),
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const rows = await q<Product>(
    `SELECT id, name, slug, description, price_inr, image_url, category, is_active, gallery_urls, created_at, updated_at
     FROM products
     WHERE slug = $1`,
    [slug],
  );
  const product = rows[0];
  if (!product) notFound();

  const active = product.is_active;
  const underCap = product.price_inr < site.priceCapInr;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/designs" className="text-sm text-mist transition hover:text-slay">
        ← All designs
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-3xl border border-line bg-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_url}
              alt={`${product.name} — magnetic ${product.category} earring`}
              className="aspect-square h-full w-full object-cover"
            />
          </div>
          {(product.gallery_urls?.length ?? 0) > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.gallery_urls!.map((src) => (
                <div
                  key={src}
                  className="overflow-hidden rounded-2xl border border-line bg-panel"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${product.name} — additional view`}
                    className="aspect-square h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-mist">
            {product.category} · Magnetic
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-4xl text-slay">₹{product.price_inr}</span>
            {underCap && (
              <span className="rounded-full border border-slay/30 bg-slay/10 px-3 py-1 text-xs font-bold text-slay">
                Under ₹{site.priceCapInr}
              </span>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-mist">{product.description}</p>

          <ul className="mt-6 space-y-2 rounded-2xl border border-line bg-panel p-5 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slay" />
              <span className="text-mist">
                <strong className="text-pure">Hold:</strong> powerful magnets
                grip both sides of the earlobe — the stud look without a
                pierced ear.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slay" />
              <span className="text-mist">
                <strong className="text-pure">Fit:</strong> sit comfortably on
                most earlobes; reposition if the grip feels tight.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slay" />
              <span className="text-mist">
                <strong className="text-pure">Care:</strong> wipe with a soft
                dry cloth and store in the provided case. Full wear &amp; care
                guide on the{" "}
                <Link href="/how-it-works" className="text-slay underline">
                  how it works
                </Link>{" "}
                page.
              </span>
            </li>
          </ul>

          <div className="mt-6 flex items-center gap-3 text-sm">
            {active ? (
              <>
                <span className="inline-flex items-center gap-2 font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Available
                </span>
                <span className="text-mist">— request now, confirm with our team later.</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 font-semibold text-zinc-300">
                  <span className="h-2 w-2 rounded-full bg-zinc-400" />
                  Currently unavailable
                </span>
              </>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {active ? (
              <Link
                href={`/order?product=${product.slug}`}
                className="rounded-full bg-slay px-7 py-3.5 font-display text-lg uppercase tracking-wide text-ink transition hover:bg-white"
              >
                Request this design
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="cursor-not-allowed rounded-full bg-panel2 px-7 py-3.5 font-display text-lg uppercase tracking-wide text-mist"
              >
                Out of stock
              </span>
            )}
            <Link
              href="/faq"
              className="rounded-full border border-line px-7 py-3.5 font-display text-lg uppercase tracking-wide text-mist transition hover:border-slay/60 hover:text-slay"
            >
              Questions?
            </Link>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-mist">
            This website collects order requests only — no online payment. Our
            team contacts you to confirm availability, delivery and payment.
          </p>
        </div>
      </div>
    </div>
  );
}
