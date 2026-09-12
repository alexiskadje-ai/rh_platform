import { requireCandidate } from "@/lib/dal";
import { loadUserOrders } from "@/lib/orders";
import { MyOrdersPage } from "@/components/shop/my-orders-page";

export default async function CandidatePurchasesPage() {
  const { user } = await requireCandidate();
  const orders = await loadUserOrders(user.id);
  return <MyOrdersPage role={user.role} orders={orders} />;
}
