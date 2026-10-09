import { Role } from "@prisma/client";
import Link from "next/link";
import { requireRecruiter } from "@/lib/dal";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ConversationThread } from "@/components/messaging/conversation-thread";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  loadAdvisorThread,
  sendAdvisorMessage,
} from "@/server/actions/messaging";

export default async function CompanyAdvisorPage() {
  const { user, companyId, company } = await requireRecruiter();
  const tier = company.recruiterSubscription?.tier;
  const active = company.recruiterSubscription?.status === "ACTIVE";
  const isGold = active && tier === "GOLD";

  if (!isGold) {
    return (
      <DashboardShell role={Role.RECRUITER} title="Espace recruteur">
        <h1 className="font-display text-3xl font-medium text-primary">Conseiller RH</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Le fil avec un conseiller PES-RH est inclus dans le pack Gold.
        </p>
        <Link
          href="/company/onboarding/pack"
          className={cn(buttonVariants(), "mt-6 inline-flex")}
        >
          Voir les packs
        </Link>
      </DashboardShell>
    );
  }

  const thread = await loadAdvisorThread(companyId);

  return (
    <DashboardShell role={Role.RECRUITER} title="Espace recruteur">
      <h1 className="font-display text-3xl font-medium text-primary">Conseiller RH</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Échangez avec l&apos;équipe PES-RH sur vos recrutements (pack Gold).
      </p>
      <div className="mt-6">
        <ConversationThread
          title={`Fil conseiller · ${company.name}`}
          currentUserId={user.id}
          messages={thread.messages}
          action={sendAdvisorMessage}
          closed={thread.conversation.isClosed}
        />
      </div>
    </DashboardShell>
  );
}
