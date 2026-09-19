import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { allocateUniqueSlug, courseSlugBase } from "../src/lib/public-slug";
import { PACK_IDS, PACK_PRICES } from "../src/lib/shop-packs";

const db = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@rh-platform.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMeAdmin1";

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      firstName: "Admin",
      lastName: "Plateforme",
      phone: "+237600000000",
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
    },
  });

  console.log(`Admin prêt : ${email}`);

  await db.platformSetting.upsert({
    where: { key: "leave_accrual_rate" },
    update: {},
    create: { key: "leave_accrual_rate", value: "1.5" },
  });
  await db.platformSetting.upsert({
    where: { key: "max_carryover_days" },
    update: {},
    create: { key: "max_carryover_days", value: "15" },
  });

  const packCarriereTitle = "Pack Carrière — entretien et positionnement";
  const course = await db.course.upsert({
    where: { id: PACK_IDS.packCarriereCourse },
    update: { price: 0 },
    create: {
      id: PACK_IDS.packCarriereCourse,
      slug: await allocateUniqueSlug({
        base: courseSlugBase(packCarriereTitle),
        isTaken: async (slug) =>
          Boolean(await db.course.findUnique({ where: { slug }, select: { id: true } })),
      }),
      title: packCarriereTitle,
      description:
        "Parcours premium offert avec le Pack Carrière : CV, pitch et préparation aux entretiens.",
      category: "Carrière",
      price: 0,
    },
  });

  await db.product.upsert({
    where: { id: PACK_IDS.boosterCv },
    update: {
      title: "Booster CV",
      type: "modele_cv",
      price: PACK_PRICES.boosterCv,
    },
    create: {
      id: PACK_IDS.boosterCv,
      title: "Booster CV",
      type: "modele_cv",
      price: PACK_PRICES.boosterCv,
      fileUrl: "packs/booster-cv.pdf",
      excerpt: "CV optimisé par IA et lettre de motivation assortie. Export illimité.",
      description:
        "Achat unique. Pas de renouvellement automatique. CV optimisé par IA + lettre de motivation, export illimité.",
    },
  });

  await db.product.upsert({
    where: { id: PACK_IDS.packCarriere },
    update: {
      title: "Pack Carrière",
      type: "formation_premium",
      price: PACK_PRICES.packCarriere,
      courseId: course.id,
    },
    create: {
      id: PACK_IDS.packCarriere,
      title: "Pack Carrière",
      type: "formation_premium",
      price: PACK_PRICES.packCarriere,
      fileUrl: "packs/pack-carriere.pdf",
      courseId: course.id,
      excerpt: "Booster CV + formation premium + mise en avant du profil 30 jours.",
      description:
        "Achat unique. Pas de renouvellement automatique. Inclut Booster CV, une formation premium et la mise en avant du profil pendant 30 jours.",
    },
  });

  await db.product.upsert({
    where: { id: PACK_IDS.premiumCandidat },
    update: {
      title: "Premium Candidat",
      type: "abonnement",
      price: PACK_PRICES.premiumCandidat,
    },
    create: {
      id: PACK_IDS.premiumCandidat,
      title: "Premium Candidat",
      type: "abonnement",
      price: PACK_PRICES.premiumCandidat,
      fileUrl: "packs/premium-candidat.pdf",
      excerpt: "Profil mis en avant, alertes de matching, formations illimitées — 30 jours.",
      description:
        "Abonnement mensuel explicite (3 000 FCFA). Aucun renouvellement automatique : un nouvel achat prolonge la période. Profil mis en avant, alertes de matching, formations illimitées.",
    },
  });

  console.log("Packs Boutique prêts : Booster CV, Pack Carrière, Premium Candidat");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
