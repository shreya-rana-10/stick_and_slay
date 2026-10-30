#!/usr/bin/env node
/**
 * Admin smoke check against a deployed/local base URL.
 * Usage: node scripts/admin-smoke.mjs <BaseUrl> <email> <password>
 * Exits 0 on success, 1 on failure.
 */
const [base, email, password] = process.argv.slice(2);
if (!base || !email || !password) {
  console.error("usage: node scripts/admin-smoke.mjs <BaseUrl> <email> <password>");
  process.exit(1);
}

const ends = [];
try {
  // 1. Admin APIs blocked without a session
  const anon = await fetch(`${base}/api/admin/orders`);
  console.log("admin unauth list ->", anon.status, anon.status === 401 ? "OK (protected)" : "BAD");
  if (anon.status !== 401) ends.push("unauth not 401");

  // 2. Wrong password rejected
  const bad = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "definitely-wrong-pass" }),
  });
  console.log("admin wrong password ->", bad.status, bad.status === 401 ? "OK" : "BAD");
  if (bad.status !== 401) ends.push("bad login not 401");

  // 3. Correct login sets a session cookie
  const login = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  console.log("admin login ->", login.status, login.status === 200 ? "OK" : "BAD");
  if (login.status !== 200) ends.push("login failed");
  const cookie = login.headers.get("set-cookie");
  if (!cookie) {
    console.log("no session cookie issued");
    ends.push("no cookie");
  } else {
    const token = cookie.split(";")[0];

    // 4. List
    const list = await fetch(`${base}/api/admin/orders`, { headers: { cookie: token } });
    console.log("admin orders list ->", list.status);
    if (list.status !== 200) ends.push("list failed");
    const data = await list.json();
    console.log("total orders:", data.total);

    // 5. Detail + note PATCH (only if there is an order)
    const first = data.orders?.[0];
    if (first) {
      const detail = await fetch(`${base}/api/admin/orders/${first.id}`, { headers: { cookie: token } });
      console.log("admin order detail ->", detail.status);
      if (detail.status !== 200) ends.push("detail failed");
      const patch = await fetch(`${base}/api/admin/orders/${first.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: token },
        body: JSON.stringify({ note: "session smoke check" }),
      });
      console.log("admin note patch ->", patch.status);
      if (patch.status !== 200) ends.push("patch failed");
    }
  }
} catch (e) {
  console.error("admin smoke FAIL:", e.message);
  ends.push(e.message);
}

if (ends.length > 0) {
  console.error("ADMIN SMOKE RESULT: FAIL —", ends.join(", "));
  process.exit(1);
}
console.log("ADMIN SMOKE RESULT: ALL OK");
