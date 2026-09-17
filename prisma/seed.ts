import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  const course = await db.course.upsert({
    where: { id: "course_pack_carriere" },
    update: {},
    create: {
      id: "course_pack_carriere",
      title: "Pack Carrière — entretien et positionnement",
      description:
        "Parcours premium lié au pack Boutique : CV, pitch et préparation aux entretiens.",
      category: "Carrière",
      price: 15000,
    },
  });

  await db.product.upsert({
    where: { id: "product_booster_cv" },
    update: {
      title: "Booster CV",
      type: "modele_cv",
      price: 5000,
    },
    create: {
      id: "product_booster_cv",
      title: "Booster CV",
      type: "modele_cv",
      price: 5000,
      fileUrl: "packs/booster-cv.pdf",
      excerpt: "Modèle et relecture pour un CV qui passe vraiment.",
      description:
        "Achat unique. Pas de renouvellement automatique. Modèle de CV et conseils de relecture pour le marché camerounais.",
    },
  });

  await db.product.upsert({
    where: { id: "product_pack_carriere" },
    update: {
      title: "Pack Carrière",
      type: "formation_premium",
      price: 15000,
      courseId: course.id,
    },
    create: {
      id: "product_pack_carriere",
      title: "Pack Carrière",
      type: "formation_premium",
      price: 15000,
      fileUrl: "packs/pack-carriere.pdf",
      courseId: course.id,
      excerpt: "Formation premium + outils de positionnement.",
      description:
        "Achat unique. Pas de renouvellement automatique. Accès à la formation Pack Carrière (entretien et positionnement).",
    },
  });

  console.log("Packs Boutique prêts : Booster CV, Pack Carrière");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
