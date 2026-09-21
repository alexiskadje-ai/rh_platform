export const TRADE_CATALOG = {
  "Technicien fibre optique / FTTH": [
    "Soudure fibre",
    "Raccordement FTTH",
    "Mesure OTDR",
    "Lecture de plans réseau",
    "Installation client",
    "Dépannage dernière mile",
  ],
  "Technicien radio / transmission": [
    "Installation BTS",
    "Alignement faisceau hertzien",
    "Maintenance radio",
    "Sécurité en hauteur",
    "Lecture de plans site",
    "Tests de transmission",
  ],
  "Ingénieur télécoms": [
    "Architecture réseau",
    "Planification radio",
    "IP / transmission",
    "Supervision NOC",
    "Gestion de projet",
    "Rédaction de spécifications",
  ],
  "Développeur / informaticien": [
    "JavaScript / TypeScript",
    "SQL",
    "APIs REST",
    "Git",
    "Support applicatif",
    "Analyse des besoins",
  ],
  "Technicien support IT": [
    "Helpdesk",
    "Windows / Office",
    "Réseau local",
    "Installation poste de travail",
    "Gestion des incidents",
    "Active Directory",
  ],
  "Assistant(e) administratif(ve)": [
    "Secrétariat",
    "Rédaction de courriers",
    "Classement et archivage",
    "Accueil / standard",
    "Pack Office",
    "Organisation de réunions",
  ],
  "Chargé(e) de recrutement / RH": [
    "Sourcing",
    "Conduite d'entretiens",
    "Rédaction d'offres",
    "Suivi des candidatures",
    "Droit du travail",
    "Paie de base",
  ],
  "Comptable": [
    "Saisie comptable",
    "Rapprochements bancaires",
    "Déclarations fiscales",
    "Trésorerie",
    "Excel",
    "Logiciel comptable",
  ],
  "Commercial / chargé d'affaires": [
    "Prospection",
    "Négociation",
    "Suivi client",
    "Reporting commercial",
    "Présentation de l'offre",
    "Closing",
  ],
  "Chef de chantier / BTP": [
    "Conduite de travaux",
    "Lecture de plans",
    "Coordination des équipes",
    "Sécurité chantier",
    "Suivi des quantités",
    "Relation client / maître d'ouvrage",
  ],
  "Électricien": [
    "Installation électrique",
    "Dépannage",
    "Lecture de schémas",
    "Normes de sécurité",
    "Tableaux électriques",
    "Câblage",
  ],
  "Technicien génie civil": [
    "Topographie de base",
    "Contrôle qualité béton",
    "Lecture de plans",
    "Suivi d'exécution",
    "Métré",
    "Sécurité chantier",
  ],
  "Infirmier(ère)": [
    "Soins infirmiers",
    "Accueil patient",
    "Hygiène hospitalière",
    "Administration de traitements",
    "Dossier médical",
    "Urgences de premier niveau",
  ],
  "Chauffeur / logisticien": [
    "Conduite (permis B/C/D)",
    "Livraison",
    "Chargement / déchargement",
    "Entretien véhicule",
    "Suivi des tournées",
    "Gestion de stock",
  ],
  "Technicien énergie / mines": [
    "Maintenance d'équipements",
    "Électricité industrielle",
    "Sécurité HSE",
    "Lecture de plans techniques",
    "Diagnostics de pannes",
    "Interventions terrain",
  ],
  "Formateur / enseignant": [
    "Animation de formation",
    "Conception pédagogique",
    "Évaluation des apprenants",
    "Bureautique",
    "Gestion de groupe",
    "Rédaction de supports",
  ],
  "Technicien agricole": [
    "Suivi de production",
    "Intrants agricoles",
    "Conseil aux producteurs",
    "Traçabilité",
    "Hygiène et qualité",
    "Collecte terrain",
  ],
  "Agent de sécurité": [
    "Surveillance",
    "Contrôle d'accès",
    "Rondes",
    "Gestion des incidents",
    "Rédaction de rapports",
    "Premiers secours",
  ],
  Autre: [
    "Pack Office",
    "Communication",
    "Organisation",
    "Travail en équipe",
    "Français",
    "Anglais",
  ],
} as const;

export type TradeName = keyof typeof TRADE_CATALOG;

export const TRADE_NAMES = Object.keys(TRADE_CATALOG) as [TradeName, ...TradeName[]];

export function skillsForTrade(trade: string): readonly string[] {
  if (isTradeName(trade)) return TRADE_CATALOG[trade];
  return [];
}

export function isTradeName(value: string): value is TradeName {
  return Object.hasOwn(TRADE_CATALOG, value);
}

export function isSkillOfTrade(trade: string, skill: string) {
  return skillsForTrade(trade).includes(skill);
}
