import { requireCandidate } from "@/lib/dal";
import { db } from "@/lib/db";
import { MyOrdersPage } from "@/components/shop/my-orders-page";

export default async function CandidatePurchasesPage() {
  const { user } = await requireCandidate();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: { select: { title: true, type: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return <MyOrdersPage role={user.role} orders={orders} />;
}
