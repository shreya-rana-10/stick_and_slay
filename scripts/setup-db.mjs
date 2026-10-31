#!/usr/bin/env node
/**
 * Sets up the Stick & Slay database (Neon Postgres):
 *   1. Creates tables (products, order_requests, order_notes, admins) — idempotent.
 *   2. Seeds the starter catalogue (ON CONFLICT DO NOTHING — owner edits preserved).
 *   3. Bootstrap/resets the single admin account (scrypt hash in DB).
 *
 * Usage:
 *   node scripts/setup-db.mjs
 *   ADMIN_EMAIL=you@example.com node scripts/setup-db.mjs     # set the owner email
 *   ADMIN_PASSWORD='your-pass' node scripts/setup-db.mjs       # set a known password
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='x' \
 *   node scripts/setup-db.mjs --create                          # add a 2nd admin account
 *
 * Reads DATABASE_URL from the environment or .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");

// Minimal .env.local loader (KEY=VALUE lines).
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

const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, SCRYPT_OPTS);
  return `s1$${salt.toString("base64")}$${hash.toString("base64")}`;
}

// Optional local DNS bypass: connect to the IP with SNI = real hostname
// (the same convention as the app's lib/db.ts). No-op on Vercel.
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

// Price note (PRD §7): prices are stored as INTEGER RUPEES (not paise).
// e.g. ₹199 is stored as 199. Switch to paise only if fractional prices appear.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price_inr INTEGER NOT NULL CHECK (price_inr >= 0),
  image_url TEXT NOT NULL DEFAULT '',
  gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT NOT NULL DEFAULT 'studs',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_requests (
  id SERIAL PRIMARY KEY,
  public_ref TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  product_name_snapshot TEXT NOT NULL,
  price_snapshot INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  customer_note TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','confirmed','dispatched','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_requests_created_at ON order_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_requests_phone ON order_requests (phone);
CREATE INDEX IF NOT EXISTS idx_order_requests_status ON order_requests (status);

CREATE TABLE IF NOT EXISTS order_notes (
  id SERIAL PRIMARY KEY,
  order_request_id INTEGER NOT NULL REFERENCES order_requests(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL DEFAULT 'admin'
);
CREATE INDEX IF NOT EXISTS idx_order_notes_request ON order_notes (order_request_id);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON order_requests;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON order_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Upgrade pre-existing databases that lack the gallery column.
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
`;

// Real product line (owner-supplied photography). Designs marked is_active:
// false are kept only as "currently unavailable" placeholders for fresh DBs.
const PRODUCTS = [
  {
    name: "Diamond Magnetic Stud",
    slug: "diamond-magnetic-stud",
    category: "studs",
    price_inr: 199,
    image_url: "/products/diamond-magnetic-stud.jpg",
    gallery_urls: [
      "/products/diamond-stud-on-ear.jpg",
      "/products/diamond-stud-giftbox.jpg",
      "/products/diamond-stud-4views.jpg",
      "/products/diamond-stud-explainer.jpg",
    ],
    description:
      "Silver-tone magnetic stud with a sparkling diamond-cut face. The front and a plain magnetic back clamp the lobe from both sides — the full stud look with zero piercings.",
  },
  {
    name: "Amber Square Magnetic Stud",
    slug: "amber-square-magnetic-stud",
    category: "studs",
    price_inr: 249,
    image_url: "/products/amber-square-magnetic-stud.jpg",
    description:
      "Square amber gem in a gold-tone bezel backed by a dark magnetic plate. A warm pop of colour for your no-piercing look — snaps on, holds firm, slides off clean.",
  },
  {
    name: "Ice Cube Stud",
    slug: "ice-cube-stud",
    category: "studs",
    price_inr: 199,
    image_url: "/products/ice-cube-stud.svg",
    is_active: false,
    description:
      "A squared-off gem-cut stud that plays with light like crushed ice. Sharp geometry, zero commitment.",
  },
  {
    name: "Midnight Hoop",
    slug: "midnight-hoop",
    category: "hoops",
    price_inr: 249,
    image_url: "/products/midnight-hoop.svg",
    is_active: false,
    description:
      "Blackened hoop with a smooth edge and a magnetic hold — the full loop look, no pierced ear required.",
  },
  {
    name: "Gold Rush Hoop",
    slug: "gold-rush-hoop",
    category: "hoops",
    price_inr: 299,
    image_url: "/products/gold-rush-hoop.svg",
    is_active: false,
    description:
      "Gold-finish statement hoop. Thick profile, warm shine — the one you wear when you want to be the fit.",
  },
  {
    name: "The Minimal Bar",
    slug: "minimal-bar",
    category: "minimal",
    price_inr: 149,
    image_url: "/products/minimal-bar.svg",
    is_active: false,
    description:
      "Straight brushed-steel bar stud. The quiet flex — small, sharp, and impossible to argue with.",
  },
];

const pool = new pg.Pool(buildPoolConfig());

try {
  await pool.query(SCHEMA);
  console.log("✓ Schema ready (products, order_requests, order_notes, admins)");

  for (const p of PRODUCTS) {
    await pool.query(
      `INSERT INTO products (name, slug, description, price_inr, image_url, category, gallery_urls, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
       ON CONFLICT (slug) DO NOTHING`,
      [
        p.name,
        p.slug,
        p.description,
        p.price_inr,
        p.image_url,
        p.category,
        JSON.stringify(p.gallery_urls ?? []),
        p.is_active ?? true,
      ],
    );
  }
  const count = await pool.query(`SELECT count(*)::int AS c FROM products`);
  console.log(`✓ Catalogue seeded (${count.rows[0].c} products; seed never overwrites owner edits)`);

  // --- Admin bootstrap -----------------------------------------------------
  const createFlag = process.argv.includes("--create");
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD ?? "";

  if (email || createFlag) {
    const target = email || "owner@stickandslay.app";
    const existing = await pool.query(`SELECT id FROM admins WHERE email = $1`, [target]);
    if (!password) password = crypto.randomBytes(16).toString("base64url").slice(0, 14);
    if (existing.rowCount > 0) {
      await pool.query(`UPDATE admins SET password_hash = $1 WHERE email = $2`, [
        hashPassword(password),
        target,
      ]);
      console.log(`✓ Reset password for admin: ${target}`);
    } else {
      await pool.query(
        `INSERT INTO admins (email, password_hash) VALUES ($1, $2)`,
        [target, hashPassword(password)],
      );
      console.log(`✓ Created admin: ${target}`);
    }
    console.log(`  Email:    ${target}`);
    console.log(`  Password: ${password}`);
    console.log("  (Keep this safe. Re-run with ADMIN_PASSWORD to reset.)");
  } else {
    const admins = await pool.query(`SELECT email FROM admins`);
    if (admins.rowCount === 0) {
      const generated = crypto.randomBytes(16).toString("base64url").slice(0, 14);
      const target = "owner@stickandslay.app";
      await pool.query(`INSERT INTO admins (email, password_hash) VALUES ($1, $2)`, [
        target,
        hashPassword(generated),
      ]);
      console.log(`✓ Created default admin: ${target}`);
      console.log(`  Email:    ${target}`);
      console.log(`  Password: ${generated}`);
      console.log("  TODO: change to your real admin email (see README).");
    } else {
      console.log(
        `✓ Admin(s) already exist: ${admins.rows.map((r) => r.email).join(", ")}`,
      );
      console.log("  Set ADMIN_EMAIL / ADMIN_PASSWORD env vars to reset a password,");
      console.log("  or ADMIN_EMAIL=... ADMIN_PASSWORD=... ... setup-db.mjs --create to add one.");
    }
  }

  console.log("Done.");
} catch (err) {
  console.error("Setup failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
