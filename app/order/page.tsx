import { q } from "@/lib/db";
import { OrderForm } from "@/components/order-form";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order now",
  description:
    "Request a Stick & Slay magnetic earring. No online payment — our team confirms availability and delivery with you personally.",
};

export default async function OrderPage(props: PageProps<"/order">) {
  const sp = await props.searchParams;
  const preselectedSlug = typeof sp.product === "string" ? sp.product : undefined;

  const products = await q<Product>(
    `SELECT id, name, slug, description, price_inr, image_url, category, is_active
     FROM products
     WHERE is_active = true
     ORDER BY id ASC`,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl uppercase sm:text-5xl">Order a design</h1>
      <p className="mt-4 text-mist">
        Send your request below — our team reviews it and contacts you to
        confirm availability, delivery and payment. Nothing is charged online,
        ever.
      </p>

      <div className="mt-10">
        <OrderForm products={products} preselectedSlug={preselectedSlug} />
      </div>
    </div>
  );
}
