export const COMPANY_NAME = "Pôle Emploi Services";
export const COMPANY_SHORT = "PES-RH";
export const COMPANY_WEBSITE = "https://pes-rh.net";
export const COMPANY_EMAIL = "contact@pes-rh.com";
export const COMPANY_HOURS = "Lun–Sam, 08h – 18h";
export const COMPANY_SLOGAN = "Changer des vies grâce à l'insertion professionnelle";
export const COMPANY_TAGLINE =
  "Votre partenaire de confiance pour l'insertion socio-professionnelle et la gestion des ressources humaines.";

export const COMPANY_ABOUT =
  "PES-RH (Pôle Emploi Services RH) est une plateforme innovante dédiée à l'emploi et aux ressources humaines. Notre mission est de rapprocher les talents des opportunités et d'accompagner les entreprises dans la gestion, le recrutement et le développement de leur capital humain. Nous mettons notre expertise au service des chercheurs d'emploi, des entreprises, des PME, des grandes organisations et des institutions en proposant des solutions RH modernes, efficaces et adaptées aux réalités du marché.";

export const COMPANY_VISION =
  "Devenir la plateforme de référence en Afrique centrale dans les domaines de l'emploi, du recrutement, de l'externalisation des services RH.";

export const COMPANY_MISSION =
  "Faciliter l'accès à l'emploi, valoriser les compétences des candidats et accompagner les entreprises dans leur gestion RH.";

export const COMPANY_VALUES = [
  {
    title: "Professionnalisme",
    body: "Des prestations réalisées avec rigueur et exigence.",
  },
  {
    title: "Intégrité",
    body: "Une relation de confiance avec nos clients et partenaires.",
  },
  {
    title: "Engagement",
    body: "Un accompagnement personnalisé à chaque étape.",
  },
  {
    title: "Excellence",
    body: "La recherche permanente de la qualité et de la satisfaction client.",
  },
] as const;

export const COMPANY_SERVICES = [
  {
    slug: "gestion-administrative-du-personnel",
    title: "Gestion administrative du personnel",
    excerpt:
      "Optimisez la gestion de vos collaborateurs grâce à un suivi RH rigoureux : contrats, dossiers, présences, congés et administration du personnel.",
    intro:
      "La gestion administrative du personnel est le socle d'une organisation sereine. PES-RH prend en charge le quotidien RH pour que vos équipes se concentrent sur l'activité, pas sur la paperasse.",
    paragraphs: [
      "Contrats incomplets, dossiers éparpillés, congés suivis à la main : l'administratif RH ralentit trop d'entreprises. Nous structurons le suivi de vos collaborateurs avec des process clairs, traçables et adaptés au cadre camerounais.",
      "Vous gardez la vision d'ensemble ; nous assurons la régularité des documents, des présences et des échéances, pour limiter les risques et gagner du temps chaque mois.",
    ],
    points: [
      "Contrats, avenants et dossiers individuels à jour",
      "Suivi des présences, congés, absences et justificatifs",
      "Administration du personnel conforme aux pratiques locales",
      "Tableaux de bord RH pour piloter vos effectifs",
    ],
    audience: "Entreprises, PME et organisations",
    ctaHref: "/register/company",
    ctaLabel: "Parler à un conseiller RH",
    featured: false,
  },
  {
    slug: "audit-et-accompagnement-rh",
    title: "Audit et accompagnement RH",
    excerpt:
      "Analysez vos pratiques RH, identifiez les axes d'amélioration et bénéficiez d'un accompagnement personnalisé pour renforcer la performance de votre entreprise.",
    intro:
      "Un audit RH met en lumière ce qui fonctionne, ce qui freine, et ce qu'il faut corriger. Nous vous accompagnons ensuite dans la mise en œuvre, à la mesure de votre organisation.",
    paragraphs: [
      "Recrutement, dossiers, congés, paie : les écarts s'accumulent souvent sans que la direction en ait une lecture claire. L'audit PES-RH dresse un état des lieux honnête, priorisé, et actionnable.",
      "Nous ne nous arrêtons pas au diagnostic. Un accompagnement suit les recommandations, avec les responsables RH et les managers, jusqu'à des pratiques plus solides au quotidien.",
    ],
    points: [
      "Diagnostic des processus recrutement, paie, congés et dossiers",
      "Recommandations concrètes, priorisées et applicables",
      "Accompagnement des responsables RH et des managers",
      "Mise en conformité progressive des pratiques internes",
    ],
    audience: "Directions et responsables RH",
    ctaHref: "/contact",
    ctaLabel: "Demander un diagnostic",
    featured: false,
  },
  {
    slug: "mise-a-disposition-du-personnel",
    title: "Mise à disposition du personnel",
    excerpt:
      "Accédez rapidement à des collaborateurs qualifiés et opérationnels pour répondre à vos besoins temporaires ou permanents, en toute sérénité.",
    intro:
      "Nous recrutons, sélectionnons et mettons à votre disposition du personnel adapté à vos besoins — surcroît d'activité, remplacement ou renforcement durable des équipes.",
    paragraphs: [
      "Notre cabinet accompagne les recruteurs dans la recherche, la sélection et la mise à disposition de profils adaptés, qu'il s'agisse de recrutements permanents, temporaires ou de solutions d'externalisation du personnel.",
      "Vous exprimez le besoin ; nous sourçons, briefons et suivons les collaborateurs mis à disposition pour que l'intégration reste fluide, côté entreprise comme côté candidat.",
    ],
    points: [
      "Mise à disposition temporaire pour un pic d'activité ou un remplacement",
      "Mise à disposition longue durée pour renforcer vos équipes",
      "Recrutement sur mesure pour des profils spécifiques",
      "Sélection, briefing et suivi des collaborateurs mis à disposition",
    ],
    audience: "Recruteurs et entreprises",
    ctaHref: "/register/company",
    ctaLabel: "Exprimer un besoin",
    featured: false,
  },
  {
    slug: "accompagnement-des-chercheurs-d-emploi",
    title: "Accompagnement des chercheurs d'emploi",
    excerpt:
      "Valorisez votre profil avec un accompagnement personnalisé : CV, préparation aux entretiens et conseils pour accélérer votre retour à l'emploi.",
    intro:
      "Un seul dépôt, plusieurs opportunités. Nous créons des CV professionnels qui mettent en valeur vos compétences et captent l'attention des recruteurs, puis nous vous préparons aux entretiens.",
    paragraphs: [
      "Chercher un emploi seul prend du temps et décourage. Un CV mal structuré n'atteint souvent jamais le recruteur. PES-RH vous aide à présenter un profil lisible, adapté au marché camerounais.",
      "Après le dépôt, l'accompagnement continue : conseils pour postuler, préparation aux entretiens, et mise en relation avec des offres et des recruteurs partenaires.",
    ],
    points: [
      "Relecture et structuration de CV adaptés au marché camerounais",
      "Conseils pour postuler et suivre vos candidatures",
      "Préparation aux entretiens (argumentaire, questions fréquentes)",
      "Mise en relation avec des offres et des recruteurs partenaires",
    ],
    audience: "Chercheurs d'emploi",
    ctaHref: "/candidat/depot-libre",
    ctaLabel: "Déposer son CV gratuitement",
    featured: false,
  },
  {
    slug: "externalisation-du-recrutement-rpo",
    title: "Externalisation du recrutement (RPO)",
    excerpt:
      "Confiez vos recrutements à nos experts et bénéficiez d'un processus complet, rapide et efficace pour attirer les meilleurs talents.",
    intro:
      "Le recrutement peut être long, coûteux et complexe. En RPO, PES-RH porte tout ou partie du process : sourcing, présélection, entretiens, shortlist — vous gardez la décision finale.",
    paragraphs: [
      "Publier une offre ne suffit plus. Il faut sourcer, trier, relancer, organiser les entretiens et garder une trace de chaque décision. Nous prenons ce cycle en charge pour que vous vous concentriez sur l'activité.",
      "Vous validez les profils et le choix final. Nous livrons une shortlist argumentée, un reporting clair, et un suivi jusqu'à la prise de poste.",
    ],
    points: [
      "Sourcing ciblé et vivier de candidats qualifiés",
      "Présélection, scoring et shortlist argumentée",
      "Organisation des entretiens et suivi des décisions",
      "Reporting clair jusqu'à la prise de poste",
    ],
    audience: "Entreprises qui recrutent régulièrement",
    ctaHref: "/register/company",
    ctaLabel: "Externaliser un recrutement",
    featured: false,
  },
  {
    slug: "formation-professionnelle-en-ligne",
    title: "Formation professionnelle en ligne",
    excerpt:
      "Développez les compétences de vos équipes et des chercheurs d'emploi avec des parcours e-learning conçus pour le terrain.",
    intro:
      "La formation en ligne est notre différenciant : des modules accessibles, suivis et certifiants, pour monter en compétence sans interrompre l'activité.",
    paragraphs: [
      "Candidats, employés et entreprises accèdent au même catalogue, avec un suivi de progression depuis l'espace dédié. Les parcours sont conçus pour le terrain : courts, concrets, avec quiz et attestation.",
      "C'est le module qui distingue PES-RH d'une simple vitrine de recrutement : la montée en compétence reste dans la plateforme, du premier module jusqu'à l'attestation.",
    ],
    points: [
      "Catalogue de formations professionnelles en ligne",
      "Parcours progressifs avec quiz et attestation",
      "Accès candidats, employés et entreprises",
      "Suivi de la progression depuis l'espace dédié",
    ],
    audience: "Candidats, employés et entreprises",
    ctaHref: "/formations",
    ctaLabel: "Voir les formations",
    featured: true,
  },
] as const;

export type CompanyService = (typeof COMPANY_SERVICES)[number];

export function getServiceBySlug(slug: string) {
  return COMPANY_SERVICES.find((service) => service.slug === slug);
}

/** Liens tels qu'ils apparaissent sur pes-rh.net (icônes présentes, sans URL réelle). */
export const COMPANY_SOCIALS: { label: "Facebook" | "LinkedIn" | "Instagram"; href: string }[] =
  [];

export const COMPANY_OFFICES: {
  country: string;
  phone: string;
  phoneAlt?: string;
  address: string;
}[] = [
  {
    country: "Cameroun",
    phone: "+237 675 599 830",
    address: "Logpom Andem, Douala",
  },
];

export const BRAND = {
  dark: "#042963",
  orange: "#f26200",
  gold: "#f4a900",
} as const;

export function telHref(phone: string) {
  return `tel:${phone.replace(/[\s.-]/g, "")}`;
}

export function mailHref(email: string) {
  return `mailto:${email}`;
}
