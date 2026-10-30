import { Pool } from "pg";

/**
 * Shared Postgres pool (Neon free tier, pooled endpoint).
 *
 * Local dev only: if this machine's DNS resolver cannot resolve the Neon
 * hostname, set DATABASE_HOSTADDR (the IP) + DATABASE_SERVERNAME (the real
 * hostname) in .env.local — the app connects to the IP with correct TLS SNI.
 * Leave those vars unset on Vercel; normal DNS resolution is used there.
 *
 * Price note (PRD §7): prices are stored as INTEGER RUPEES (not paise) —
 * ₹199 is 199. Switch to paise only if fractional prices are ever introduced.
 */

type DbTarget = { host: string; ssl: { servername?: string; rejectUnauthorized: boolean } };

function parseTarget(): DbTarget {
  const url = process.env.DATABASE_URL ?? "";
  const parsed = new URL(url);
  const realHost = parsed.hostname; // e.g. ep-....pooler.c-7.us-east-2.aws.neon.tech
  const hostaddr = process.env.DATABASE_HOSTADDR?.trim();
  const servername = process.env.DATABASE_SERVERNAME?.trim() || realHost;

  return {
    // When pinned, connect to the IP and present the real hostname via SNI.
    host: hostaddr && hostaddr !== realHost ? hostaddr : realHost,
    ssl: { rejectUnauthorized: false, servername: hostaddr ? servername : undefined },
  };
}

const target = parseTarget();

const globalForDb = globalThis as unknown as { _ssPool?: Pool };

export const pool: Pool =
  globalForDb._ssPool ??
  new Pool({
    ...target,
    user: new URL(process.env.DATABASE_URL ?? "").username,
    password: decodeURIComponent(
      (new URL(process.env.DATABASE_URL ?? "").password ?? "") as string,
    ),
    database: (process.env.DATABASE_URL ?? "").split("/").pop()?.split("?")[0] ?? "postgres",
    port: Number.parseInt(new URL(process.env.DATABASE_URL ?? "").port || "5432", 10),
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb._ssPool = pool;
}

/** Simple typed query helper. */
export async function q<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
