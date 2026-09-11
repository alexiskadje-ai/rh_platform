"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser, requireAdmin, requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { fieldErrorsFromZod } from "@/lib/users";
import { checkoutSchema, productSchema } from "@/lib/validations/shop";

export type ShopActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export type CheckoutState = {
  ok?: boolean;
  needsAuth?: boolean;
  orderId?: string;
  message?: string;
};

function productPayload(formData: FormData) {
  return productSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    price: formData.get("price"),
    fileUrl: formData.get("fileUrl"),
  });
}

function mergeQuantities(items: { productId: string; quantity: number }[]) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  return [...quantities.entries()].map(([productId, quantity]) => ({
    productId,
    quantity: Math.min(99, quantity),
  }));
}

export async function createProduct(
  _prev: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  await requireAdmin();
  const parsed = productPayload(formData);
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  const product = await db.product.create({ data: parsed.data });
  revalidatePath("/admin/boutique");
  revalidatePath("/boutique");
  redirect(`/admin/boutique/${product.id}`);
}

export async function updateProduct(
  _prev: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  await requireAdmin();
  const id = String(formData.get("productId") ?? "");
  if (!id) return { message: "Produit introuvable." };
  const parsed = productPayload(formData);
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };
  await db.product.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath("/admin/boutique");
  revalidatePath(`/admin/boutique/${id}`);
  revalidatePath("/boutique");
  return { ok: true, message: "Produit enregistré." };
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("productId") ?? "");
  if (!id) redirect("/admin/boutique");
  try {
    await db.product.delete({ where: { id } });
  } catch (error) {
    const fk =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
    redirect(`/admin/boutique/${id}?error=${fk ? "ordered" : "delete"}`);
  }
  revalidatePath("/admin/boutique");
  revalidatePath("/boutique");
  redirect("/admin/boutique");
}

export async function checkoutCart(
  items: { productId: string; quantity: number }[],
): Promise<CheckoutState> {
  const user = await getSessionUser();
  if (!user) return { needsAuth: true };
  if (user.role === "CANDIDATE" && !user.isVerified) {
    return { message: "Vérifiez votre compte (e-mail et SMS) avant de commander." };
  }
  if (user.role === "RECRUITER" && user.status === "PENDING") {
    return { message: "Votre espace recruteur n'est pas encore validé." };
  }

  const parsed = checkoutSchema.safeParse({ items });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Panier invalide." };
  }

  const lines = mergeQuantities(parsed.data.items);
  const products = await db.product.findMany({
    where: { id: { in: lines.map((line) => line.productId) } },
  });
  if (products.length !== lines.length) {
    return { message: "Un produit n'est plus disponible. Mettez à jour le panier." };
  }

  const byId = new Map(products.map((product) => [product.id, product]));
  const total = lines.reduce((sum, line) => {
    const product = byId.get(line.productId);
    return sum + (product?.price ?? 0) * line.quantity;
  }, 0);

  if (total < 1) {
    return { message: "Le montant de la commande est invalide." };
  }

  const existing = await db.order.findFirst({
    where: { userId: user.id, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  const order = existing
    ? await db.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { orderId: existing.id } });
        return tx.order.update({
          where: { id: existing.id },
          data: {
            total,
            items: {
              create: lines.map((line) => ({
                productId: line.productId,
                quantity: line.quantity,
              })),
            },
          },
        });
      })
    : await db.order.create({
        data: {
          userId: user.id,
          total,
          status: "pending",
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
            })),
          },
        },
      });

  revalidatePath("/boutique/commandes");
  revalidatePath("/candidate/achats");
  revalidatePath("/employee/achats");
  return { ok: true, orderId: order.id };
}

export async function requireOwnOrder(orderId: string) {
  const user = await requireUser();
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { title: true, type: true } },
        },
      },
    },
  });
  if (!order || order.userId !== user.id) return null;
  return { user, order };
}
