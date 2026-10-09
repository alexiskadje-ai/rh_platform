import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ConversationThread } from "@/components/messaging/conversation-thread";
import {
  loadAdvisorThread,
  sendAdvisorMessage,
} from "@/server/actions/messaging";

export default async function AdminAdvisorThreadPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const user = await requireAdmin();
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true },
  });
  if (!company) notFound();

  const thread = await loadAdvisorThread(company.id);

  return (
    <DashboardShell role={Role.ADMIN} title="Administration">
      <h1 className="font-display text-3xl font-medium text-primary">
        Conseiller · {company.name}
      </h1>
      <div className="mt-6">
        <ConversationThread
          title={`Fil conseiller · ${company.name}`}
          currentUserId={user.id}
          messages={thread.messages}
          action={sendAdvisorMessage}
          hiddenFields={{ companyId: company.id }}
          closed={thread.conversation.isClosed}
        />
      </div>
    </DashboardShell>
  );
}
