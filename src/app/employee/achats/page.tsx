import { requireEmployee } from "@/lib/dal";
import { db } from "@/lib/db";
import { MyOrdersPage } from "@/components/shop/my-orders-page";

export default async function EmployeePurchasesPage() {
  const { user } = await requireEmployee();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: {
      payment: true,
      items: { include: { product: { select: { title: true, type: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return <MyOrdersPage role={user.role} orders={orders} />;
}
