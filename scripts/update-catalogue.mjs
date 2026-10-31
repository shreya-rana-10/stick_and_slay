#!/usr/bin/env node
/**
 * One-off catalogue migration to the real product line:
 *   1. Ensures products.gallery_urls exists (JSONB, default '[]').
 *   2. Renames/re-points the two ₹199/₹249 rows to the real designs
 *      (Diamond Magnetic Stud / Amber Square Magnetic Stud) with real photos.
 *   3. Deletes the 4 placeholder designs (cancelled test orders referencing
 *      them are removed first; anything else falls back to is_active=false).
 *
 * Usage: node scripts/update-catalogue.mjs
 * Reads DATABASE_URL (+ optional DATABASE_HOSTADDR / DATABASE_SERVERNAME)
 * from the environment or .env.local. Never sets the DNS pin on Vercel.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");

function loadEnv(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^([A-Za-z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}
loadEnv(".env.local");
loadEnv(".env.production");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (environment or .env.local).");
  process.exit(1);
}

function buildPoolConfig() {
  const url = new URL(process.env.DATABASE_URL);
  const realHost = url.hostname;
  const hostaddr = (process.env.DATABASE_HOSTADDR ?? "").trim();
  const servername = (process.env.DATABASE_SERVERNAME ?? "").trim() || realHost;
  const host = hostaddr && hostaddr !== realHost ? hostaddr : realHost;
  return {
    host,
    user: url.username,
    password: decodeURIComponent(url.password ?? ""),
    database: url.pathname.replace(/^\//, ""),
    port: Number.parseInt(url.port || "5432", 10),
    max: 2,
    ssl: { rejectUnauthorized: false, servername: hostaddr ? servername : undefined },
  };
}

const PLACEHOLDERS = ["ice-cube-stud", "midnight-hoop", "gold-rush-hoop", "minimal-bar"];

const UPDATES = [
  {
    from: "classic-black-stud",
    to: {
      name: "Diamond Magnetic Stud",
      slug: "diamond-magnetic-stud",
      description:
        "Silver-tone magnetic stud with a sparkling diamond-cut face. The front and a plain magnetic back clamp the lobe from both sides — the full stud look with zero piercings.",
      price_inr: 199,
      image_url: "/products/diamond-magnetic-stud.jpg",
      category: "studs",
      gallery_urls: [
        "/products/diamond-stud-on-ear.jpg",
        "/products/diamond-stud-giftbox.jpg",
        "/products/diamond-stud-4views.jpg",
        "/products/diamond-stud-explainer.jpg",
      ],
    },
  },
  {
    from: "chrome-stud",
    to: {
      name: "Amber Square Magnetic Stud",
      slug: "amber-square-magnetic-stud",
      description:
        "Square amber gem in a gold-tone bezel backed by a dark magnetic plate. A warm pop of colour for your no-piercing look — snaps on, holds firm, slides off clean.",
      price_inr: 249,
      image_url: "/products/amber-square-magnetic-stud.jpg",
      category: "studs",
      gallery_urls: [],
    },
  },
];

const pool = new pg.Pool(buildPoolConfig());

try {
  await pool.query(
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb`,
  );
  console.log("✓ gallery_urls column ready");

  for (const u of UPDATES) {
    await pool.query(
      `UPDATE products
         SET name = $1, slug = $2, description = $3, price_inr = $4,
             image_url = $5, category = $6, gallery_urls = $7::jsonb
       WHERE slug = $8`,
      [
        u.to.name, u.to.slug, u.to.description, u.to.price_inr,
        u.to.image_url, u.to.category, JSON.stringify(u.to.gallery_urls), u.from,
      ],
    );
    console.log(`✓ ${u.from} → ${u.to.slug} (${u.to.name}, ₹${u.to.price_inr})`);
  }

  const del = await pool.query(
    `DELETE FROM order_requests
      WHERE status = 'cancelled'
        AND product_id IN (SELECT id FROM products WHERE slug = ANY($1))`,
    [PLACEHOLDERS],
  );
  console.log(`✓ removed ${del.rowCount} cancelled test order(s) tied to placeholders`);

  // Delete only placeholders that no order references; the referenced ones
  // stay in the catalogue but marked inactive (order snapshots keep working).
  const unreferenced = await pool.query(
    `SELECT slug FROM products p
      WHERE slug = ANY($1)
        AND NOT EXISTS (SELECT 1 FROM order_requests o WHERE o.product_id = p.id)`,
    [PLACEHOLDERS],
  );
  const toDelete = unreferenced.rows.map((r) => r.slug);
  if (toDelete.length > 0) {
    const removed = await pool.query(`DELETE FROM products WHERE slug = ANY($1)`, [toDelete]);
    console.log(`✓ deleted ${removed.rowCount} placeholder design(s): ${toDelete.join(", ")}`);
  }
  const stillReferenced = await pool.query(
    `SELECT slug FROM products WHERE slug = ANY($1) AND is_active = true`,
    [PLACEHOLDERS],
  );
  for (const row of stillReferenced.rows) {
    await pool.query(`UPDATE products SET is_active = false WHERE slug = $1`, [row.slug]);
    await pool.query(
      `INSERT INTO order_notes (order_request_id, note, created_by)
       SELECT id, 'Design retired from the active catalogue — it remains available to view for order history.',
              'system'
         FROM order_requests
        WHERE product_id = (SELECT id FROM products WHERE slug = $1)
          AND NOT EXISTS (
            SELECT 1 FROM order_notes n
             WHERE n.order_request_id = order_requests.id
               AND n.note = 'Design retired from the active catalogue — it remains available to view for order history.'
          )`,
      [row.slug],
    );
  }
  if (stillReferenced.rowCount > 0) {
    console.log(
      `⚠ referenced by live orders, kept as inactive: ${stillReferenced.rows.map((r) => r.slug).join(", ")}`,
    );
  }

  const list = await pool.query(
    `SELECT slug, name, price_inr, is_active, jsonb_array_length(gallery_urls) AS gallery
       FROM products ORDER BY is_active DESC, id ASC`,
  );
  console.log("--- Current catalogue ---");
  for (const r of list.rows) {
    console.log(`${r.is_active ? "ACTIVE  " : "inactive"} ${r.name} (${r.slug}) ₹${r.price_inr} · ${r.gallery} gallery img(s)`);
  }
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
