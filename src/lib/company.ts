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
    title: "Gestion administrative du personnel",
    body: "Optimisez la gestion de vos collaborateurs grâce à un suivi RH rigoureux : contrats, dossiers, présences, congés et administration du personnel.",
  },
  {
    title: "Audit et accompagnement RH",
    body: "Analysez vos pratiques RH, identifiez les axes d'amélioration et bénéficiez d'un accompagnement personnalisé pour renforcer la performance de votre entreprise.",
  },
  {
    title: "Mise à disposition du personnel",
    body: "Accédez rapidement à des collaborateurs qualifiés et opérationnels pour répondre à vos besoins temporaires ou permanents, en toute sérénité.",
  },
  {
    title: "Accompagnement des chercheurs d'emploi",
    body: "Valorisez votre profil avec un accompagnement personnalisé : CV, préparation aux entretiens et conseils pour accélérer votre retour à l'emploi.",
  },
  {
    title: "Externalisation du recrutement (RPO)",
    body: "Confiez vos recrutements à nos experts et bénéficiez d'un processus complet, rapide et efficace pour attirer les meilleurs talents.",
  },
] as const;

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
