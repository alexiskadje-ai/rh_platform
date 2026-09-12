import { db } from "@/lib/db";
import { createPresignedDownload } from "@/lib/storage";

export type OrderRow = {
  id: string;
  total: number;
  status: string;
  createdAt: Date;
  payment: {
    status: string;
    invoiceUrl: string | null;
    invoiceHref: string | null;
    failureReason: string | null;
  } | null;
  items: {
    id: string;
    quantity: number;
    product: { title: string; type: string };
  }[];
};

export async function loadUserOrders(userId: string): Promise<OrderRow[]> {
  const orders = await db.order.findMany({
    where: { userId },
    include: {
      payment: true,
      items: { include: { product: { select: { title: true, type: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    orders.map(async (order) => {
      const invoiceUrl = order.payment?.invoiceUrl ?? null;
      return {
        id: order.id,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        payment: order.payment
          ? {
              status: order.payment.status,
              invoiceUrl,
              invoiceHref: invoiceUrl ? await createPresignedDownload(invoiceUrl) : null,
              failureReason: order.payment.failureReason ?? null,
            }
          : null,
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          product: { title: item.product.title, type: item.product.type },
        })),
      };
    }),
  );
}
