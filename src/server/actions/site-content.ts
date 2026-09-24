"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { siteServiceSchema, siteSettingsSchema } from "@/lib/validations/site-content";

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function slugify(value: string) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || "service";
}

function refreshSite() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/admin/contenu-site/services");
  revalidatePath("/admin/contenu-site/parametres");
}

async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title);
  let slug = base;
  let index = 2;
  while (
    await db.service.findFirst({
      where: { slug, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}

export async function createSiteService(formData: FormData) {
  await requireAdmin();
  const parsed = siteServiceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    isActive: checked(formData, "isActive"),
    isFeatured: checked(formData, "isFeatured"),
  });
  if (!parsed.success) return;

  const last = await db.service.aggregate({ _max: { order: true } });
  await db.service.create({
    data: {
      ...parsed.data,
      slug: await uniqueSlug(parsed.data.title),
      order: (last._max.order ?? -1) + 1,
    },
  });
  refreshSite();
  redirect("/admin/contenu-site/services");
}

export async function updateSiteService(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = siteServiceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    isActive: checked(formData, "isActive"),
    isFeatured: checked(formData, "isFeatured"),
  });
  if (!id || !parsed.success) return;

  const current = await db.service.findUnique({ where: { id }, select: { title: true, slug: true } });
  if (!current) return;
  const slug =
    current.title === parsed.data.title ? current.slug : await uniqueSlug(parsed.data.title, id);

  await db.service.update({ where: { id }, data: { ...parsed.data, slug } });
  refreshSite();
  redirect("/admin/contenu-site/services");
}

export async function setSiteServiceActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";
  if (!id) return;
  await db.service.update({ where: { id }, data: { isActive } });
  refreshSite();
}

export async function deleteSiteService(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.service.delete({ where: { id } });
  refreshSite();
}

export async function reorderSiteServices(orderedIds: string[]) {
  await requireAdmin();
  await db.$transaction(
    orderedIds.map((id, order) => db.service.update({ where: { id }, data: { order } })),
  );
  refreshSite();
}

export type SiteSettingsState = { ok: boolean; message: string };

export async function saveSiteSettings(
  _prev: SiteSettingsState,
  formData: FormData,
): Promise<SiteSettingsState> {
  await requireAdmin();
  const parsed = siteSettingsSchema.safeParse({
    heroTitle: formData.get("heroTitle"),
    heroSubtitle: formData.get("heroSubtitle"),
    aboutText: formData.get("aboutText") ?? "",
    address: formData.get("address") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    facebook: formData.get("facebook") ?? "",
    linkedin: formData.get("linkedin") ?? "",
    instagram: formData.get("instagram") ?? "",
    twitter: formData.get("twitter") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Vérifiez les champs du formulaire." };

  const { facebook, linkedin, instagram, twitter, whatsapp, email, ...rest } = parsed.data;
  await db.siteSettings.upsert({
    where: { id: "site" },
    update: {
      ...rest,
      email: email || null,
      socialLinks: { facebook, linkedin, instagram, twitter, whatsapp },
    },
    create: {
      id: "site",
      ...rest,
      email: email || null,
      socialLinks: { facebook, linkedin, instagram, twitter, whatsapp },
    },
  });
  refreshSite();
  return { ok: true, message: "Contenu du site enregistré." };
}
