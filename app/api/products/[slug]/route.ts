import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Load one active product by slug; 404 if missing or inactive. */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/products/[slug]">,
) {
  try {
    const { slug } = await ctx.params;
    const rows = await q<Product>(
      `SELECT id, name, slug, description, price_inr, image_url, category, is_active
       FROM products
       WHERE slug = $1 AND is_active = true`,
      [slug],
    );
    const product = rows[0];
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Design not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, product });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not load this design right now." },
      { status: 500 },
    );
  }
}
