import { FaqStatus } from "@prisma/client";
import { currentProcessFacts } from "@/lib/chatbot/process-facts";
import { db } from "@/lib/db";
import { SERVICE_AUDIENCE_LABELS, type ServiceAudienceName } from "@/lib/nav";
import { FALLBACK_SERVICES, loadSiteSettings } from "@/lib/site-content";

export async function loadCurrentPlatformBrief() {
  const [settings, faqs, services] = await Promise.all([
    loadSiteSettings().catch(() => null),
    db.faqItem
      .findMany({
        where: { status: FaqStatus.PUBLISHED, answer: { not: null } },
        orderBy: { answeredAt: "desc" },
        take: 40,
        select: { question: true, answer: true },
      })
      .catch(() => []),
    db.service
      .findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { title: "asc" }],
        select: { title: true, description: true, audience: true },
      })
      .catch(() => []),
  ]);

  const serviceLines =
    services.length > 0
      ? services.map((service) => {
          const audience =
            SERVICE_AUDIENCE_LABELS[service.audience as ServiceAudienceName] ?? service.audience;
          return `${service.title} (${audience}) : ${service.description}`;
        })
      : FALLBACK_SERVICES.map((service) => `${service.title} : ${service.excerpt}`);

  const faqLines = faqs
    .filter((item) => item.answer?.trim())
    .map((item) => `Question : ${item.question}\nRéponse : ${item.answer}`);

  const contact = settings
    ? `Coordonnées affichées sur le site : ${settings.email}, ${settings.phone}, ${settings.address}. Présentation : ${settings.aboutText}`
    : "";

  return [
    "INFORMATIONS À JOUR. Les procédures et les tarifs décrivent le fonctionnement actuel : ils priment sur la FAQ publiée et sur tout extrait plus ancien.",
    "Procédures et tarifs :",
    currentProcessFacts(),
    contact,
    "Services actuellement publiés :",
    ...serviceLines,
    faqLines.length > 0 ? "FAQ publiée, à suivre seulement si elle ne contredit pas les procédures :" : "",
    ...faqLines,
  ]
    .filter(Boolean)
    .join("\n");
}
