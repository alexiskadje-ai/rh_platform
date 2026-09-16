-- CreateEnum
CREATE TYPE "FaqStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "name" TEXT,
    "email" TEXT,
    "status" "FaqStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "alerts" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

INSERT INTO "FaqItem" ("id", "question", "answer", "status", "createdAt", "answeredAt") VALUES
('faq_curated_postuler', 'Comment postuler à une offre ?', 'Créez un compte candidat, complétez votre profil (CV et compétences), puis postulez en un clic depuis l''offre.', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq_curated_recruteur', 'Un recruteur peut-il publier tout de suite ?', 'Le compte entreprise est validé par l''administrateur avant publication des offres, pour garder un réseau de confiance.', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq_curated_formations', 'Les formations sont-elles certifiantes ?', 'Oui : après le quiz au-dessus du seuil, un certificat PDF est généré automatiquement.', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq_curated_conges', 'Comment fonctionnent les congés ?', 'Le solde s''accumule selon les règles camerounaises (dont le report et la maternité). La validation passe par le supérieur, puis éventuellement le RH.', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq_curated_paiements', 'Quels paiements sont prévus ?', 'Le checkout boutique encaisse via Stripe (carte) et MTN MoMo. La commande reste en attente jusqu''au webhook, puis la facture PDF est générée. Orange Money et virement suivent dès les credentials sandbox.', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq_curated_mobile', 'Puis-je gérer mon équipe depuis mon téléphone ?', 'Oui. L''interface est conçue mobile-first : tableaux de bord, pointage et validations restent utilisables sur petit écran.', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
