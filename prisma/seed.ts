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

  const services = [
    {
      slug: "gestion-administrative-du-personnel",
      title: "Gestion administrative du personnel",
      description:
        "Optimisez la gestion de vos collaborateurs grâce à un suivi RH rigoureux : contrats, dossiers, présences, congés et administration du personnel.",
      icon: "ClipboardList",
      order: 0,
      isFeatured: false,
    },
    {
      slug: "audit-et-accompagnement-rh",
      title: "Audit et accompagnement RH",
      description:
        "Analysez vos pratiques RH, identifiez les axes d'amélioration et bénéficiez d'un accompagnement personnalisé pour renforcer la performance de votre entreprise.",
      icon: "Handshake",
      order: 1,
      isFeatured: false,
    },
    {
      slug: "mise-a-disposition-du-personnel",
      title: "Mise à disposition du personnel",
      description:
        "Accédez rapidement à des collaborateurs qualifiés et opérationnels pour répondre à vos besoins temporaires ou permanents, en toute sérénité.",
      icon: "Users",
      order: 2,
      isFeatured: false,
    },
    {
      slug: "accompagnement-des-chercheurs-d-emploi",
      title: "Accompagnement des chercheurs d'emploi",
      description:
        "Valorisez votre profil avec un accompagnement personnalisé : CV, préparation aux entretiens et conseils pour accélérer votre retour à l'emploi.",
      icon: "Search",
      order: 3,
      isFeatured: false,
    },
    {
      slug: "externalisation-du-recrutement-rpo",
      title: "Externalisation du recrutement (RPO)",
      description:
        "Confiez vos recrutements à nos experts et bénéficiez d'un processus complet, rapide et efficace pour attirer les meilleurs talents.",
      icon: "Briefcase",
      order: 4,
      isFeatured: false,
    },
    {
      slug: "formation-professionnelle-en-ligne",
      title: "Formation professionnelle en ligne",
      description:
        "Développez les compétences de vos équipes et des chercheurs d'emploi avec des parcours e-learning conçus pour le terrain.",
      icon: "GraduationCap",
      order: 5,
      isFeatured: true,
    },
  ];

  for (const service of services) {
    await db.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    });
  }

  await db.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      heroTitle: "Faites la différence en boostant votre carrière",
      heroSubtitle:
        "Nous mettons à votre disposition les talents et les opportunités dont vous avez besoin. Le recrutement peut être long, coûteux et complexe — comme la recherche d'un emploi. Confiez-nous cette mission et concentrez-vous sur le développement de votre activité et de votre carrière.",
      aboutText:
        "PES-RH (Pôle Emploi Services RH) est une plateforme innovante dédiée à l'emploi et aux ressources humaines. Notre mission est de rapprocher les talents des opportunités et d'accompagner les entreprises dans la gestion, le recrutement et le développement de leur capital humain. Nous mettons notre expertise au service des chercheurs d'emploi, des entreprises, des PME, des grandes organisations et des institutions en proposant des solutions RH modernes, efficaces et adaptées aux réalités du marché.",
      address: "Logpom Andem, Douala",
      phone: "+237 675 599 830",
      email: "contact@pes-rh.com",
      socialLinks: {},
    },
  });

  console.log("Contenu du site prêt : 6 services et paramètres.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
