import { requireEmployee } from "@/lib/dal";
import { loadUserOrders } from "@/lib/orders";
import { MyOrdersPage } from "@/components/shop/my-orders-page";

export default async function EmployeePurchasesPage() {
  const { user } = await requireEmployee();
  const orders = await loadUserOrders(user.id);
  return <MyOrdersPage role={user.role} orders={orders} />;
}
