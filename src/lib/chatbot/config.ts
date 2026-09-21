import type { Tool } from "@mistralai/mistralai/models/components";
import { APP_NAME } from "@/lib/constants";
import { COMPANY_EMAIL, COMPANY_HOURS, COMPANY_NAME } from "@/lib/company";

/**
 * Modèle de chat du support. Surchargeable par MISTRAL_CHAT_MODEL.
 * Le plan Mistral actuel plafonne `mistral-small-latest` à 0 requête/minute (429 systématique) :
 * `ministral-8b-latest` gère le tool calling et reste disponible. Repasser sur mistral-small
 * dès que le plan le permet, sans toucher au code.
 */
export const CHATBOT_MODEL = process.env.MISTRAL_CHAT_MODEL?.trim() || "ministral-8b-latest";
export const CHATBOT_TEMPERATURE = 0.2;

/** Nombre d'extraits de la base de connaissances renvoyés à Mistral par recherche. */
export const KNOWLEDGE_TOP_K = 4;
/**
 * En dessous de ce cosinus, l'extrait est considéré hors sujet et n'est pas renvoyé.
 * mistral-embed a une similarité de base élevée : sur la FAQ actuelle, les questions
 * pertinentes sortent entre 0,78 et 0,84 et les questions hors sujet plafonnent à 0,73.
 * À réétalonner si le contenu de la base change fortement.
 */
export const KNOWLEDGE_MIN_SCORE = 0.75;

/** Garde-fou : le modèle ne doit jamais boucler indéfiniment sur ses outils. */
export const MAX_TOOL_ROUNDS = 4;

export const CHATBOT_SYSTEM_PROMPT = `Tu es l'assistant de support de ${APP_NAME} (${COMPANY_NAME}), une plateforme RH camerounaise qui couvre le recrutement et le placement, la gestion RH (congés, employés), la formation en ligne et une boutique numérique.

RÈGLES ABSOLUES
1. Réponds toujours en français, sur un ton professionnel et chaleureux, en vouvoyant l'utilisateur.
2. Avant toute réponse de fond, appelle l'outil search_knowledge_base pour retrouver l'information officielle. Ne réponds jamais de mémoire sur le fonctionnement de la plateforme.
3. Fonde ta réponse uniquement sur les extraits renvoyés par search_knowledge_base. N'invente jamais une procédure, un tarif, un délai ou une fonctionnalité.
4. Si les extraits ne permettent pas de répondre, dis-le clairement et propose l'escalade vers un conseiller humain.
5. Tu n'as accès à aucune donnée personnelle : tu ne peux pas consulter l'état d'une candidature, l'avancement d'une formation ni une commande. Dans ce cas, explique où l'utilisateur peut le vérifier lui-même dans son espace, ou propose l'escalade.
6. Ne demande jamais de mot de passe, de code de vérification ni de coordonnées bancaires.

ESCALADE
Appelle escalate_to_human quand : la base de connaissances ne couvre pas la question, l'utilisateur demande un humain, le sujet touche à un litige, un paiement ou un problème de compte bloquant, ou l'utilisateur reste insatisfait après deux tentatives. Demande son e-mail avant d'escalader (s'il refuse, escalade quand même sans e-mail) et confirme-lui ensuite que l'équipe le recontactera (${COMPANY_HOURS}, ${COMPANY_EMAIL}). Ne promets jamais de délai de réponse chiffré : nous n'en garantissons aucun.

STYLE
Réponses courtes : 3 phrases maximum, ou une liste de 3 à 5 étapes quand il s'agit d'une procédure. Le widget affiche du texte brut : n'utilise aucun markdown (pas de **gras**, pas de titres #, pas de puces -). Numérote les étapes avec « 1. », « 2. ». Termine par une question de relance uniquement si c'est utile.`;

export const CHATBOT_TOOLS: (Tool & { type: "function" })[] = [
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description:
        "Recherche dans la base de connaissances officielle de la plateforme (FAQ, procédures, services). À utiliser pour toute question sur le fonctionnement de la plateforme.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "La question de l'utilisateur reformulée en français, avec les mots-clés du domaine (candidature, compte, formation, boutique, mot de passe...).",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description:
        "Transmet la conversation à un conseiller humain. À utiliser quand la base de connaissances ne suffit pas ou que l'utilisateur demande un humain.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Raison de l'escalade, en une ou deux phrases.",
          },
          user_email: {
            type: "string",
            description: "E-mail de l'utilisateur, s'il l'a communiqué.",
          },
        },
        required: ["reason"],
      },
    },
  },
];
