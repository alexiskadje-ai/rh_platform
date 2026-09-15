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
    downloadHref: string | null;
    product: { title: string; type: string };
  }[];
};

export async function loadUserOrders(userId: string): Promise<OrderRow[]> {
  const orders = await db.order.findMany({
    where: { userId },
    include: {
      payment: true,
      items: { include: { product: { select: { title: true, type: true, fileUrl: true } } } },
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
        items: await Promise.all(
          order.items.map(async (item) => ({
            id: item.id,
            quantity: item.quantity,
            downloadHref:
              order.status === "paid"
                ? await createPresignedDownload(item.product.fileUrl)
                : null,
            product: { title: item.product.title, type: item.product.type },
          })),
        ),
      };
    }),
  );
}
