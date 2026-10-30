import Link from "next/link";
import type { Product } from "@/lib/types";

/**
 * Catalogue card. Inactive designs show an "Out of stock" state and cannot
 * be ordered (PRD §5, Screen 2).
 */
export function ProductCard({ product }: { product: Product }) {
  const { name, slug, price_inr, image_url, category, is_active } = product;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-slay/50">
      <Link
        href={`/product/${slug}`}
        aria-label={`View details of ${name}`}
        className="block overflow-hidden"
      >
        <div className="aspect-square overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image_url}
            alt={`${name} — magnetic ${category} earring`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">
              <Link href={`/product/${slug}`} className="transition hover:text-slay">
                {name}
              </Link>
            </h3>
            <p className="mt-1 text-xs uppercase tracking-widest text-mist">
              {category}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-sm font-bold ${
              is_active
                ? "border-slay/30 bg-slay/10 text-slay"
                : "border-line bg-panel2 text-mist"
            }`}
          >
            ₹{price_inr}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2">
          {is_active ? (
            <>
              <Link
                href={`/order?product=${slug}`}
                className="flex-1 rounded-full bg-slay px-4 py-2 text-center text-sm font-bold text-ink transition hover:bg-white"
              >
                Order this
              </Link>
              <Link
                href={`/product/${slug}`}
                className="rounded-full border border-line px-4 py-2 text-sm text-mist transition hover:border-slay/50 hover:text-pure"
              >
                Details
              </Link>
            </>
          ) : (
            <>
              <span
                className="flex-1 cursor-not-allowed rounded-full bg-panel2 px-4 py-2 text-center text-sm font-semibold text-mist"
                aria-disabled="true"
              >
                Out of stock
              </span>
              <Link
                href={`/product/${slug}`}
                className="rounded-full border border-line px-4 py-2 text-sm text-mist transition hover:border-slay/50 hover:text-pure"
              >
                Details
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
