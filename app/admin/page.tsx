import { cookies } from "next/headers";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Owner admin",
  robots: { index: false, follow: false },
};

/**
 * Private owner area. The page itself is protected: unauthenticated visitors
 * only ever see the login form. (Hiding the link is not security — the admin
 * APIs authorize every request server-side.)
 */
export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value);

  if (!session) {
    return <AdminLogin />;
  }
  return <AdminDashboard adminEmail={session.sub} />;
}
