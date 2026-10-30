import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminOrderDetail } from "@/components/admin/admin-order-detail";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage(
  props: PageProps<"/admin/orders/[id]">,
) {
  const { id } = await props.params;
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!session) redirect("/admin");

  return <AdminOrderDetail id={id} />;
}
