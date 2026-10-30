import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await q<Product>(
      `SELECT id, name, slug, description, price_inr, image_url, category, is_active
       FROM products
       WHERE is_active = true
       ORDER BY id ASC`,
    );
    return NextResponse.json({ success: true, products });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not load the catalogue right now." },
      { status: 500 },
    );
  }
}
