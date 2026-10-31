import { q } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Designs",
  description: `Browse unisex magnetic earrings — gem-face and silver studs, all under ₹${site.priceCapInr}.`,
};

export default async function DesignsPage() {
  const products = await q<Product>(
    `SELECT id, name, slug, description, price_inr, image_url, category, is_active
     FROM products
     ORDER BY is_active DESC, id ASC`,
  );
  const active = products.filter((p) => p.is_active);
  const inactive = products.filter((p) => !p.is_active);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl uppercase sm:text-5xl">Designs</h1>
      <p className="mt-3 max-w-lg text-mist">
        Magnetic earrings for the no-piercing look. Every design stays under ₹
        {site.priceCapInr} — pick one, send a request, and we confirm the rest
        with you personally.
      </p>

      {products.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-line bg-panel p-6 text-sm text-mist">
          The catalogue is being set up. Check back soon.
        </p>
      ) : (
        <>
          <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-mist">
            Available now ({active.length})
          </h2>
<div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {active.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}

      {inactive.length > 0 && (
        <>
          <h2 className="mt-12 text-xs font-semibold uppercase tracking-widest text-mist">
            Currently unavailable ({inactive.length})
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 opacity-60 sm:grid-cols-3 lg:grid-cols-4">
            {inactive.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
