import { PrismaClient } from "@prisma/client";
import {
  auditMetadata,
  auditStore,
  extractEntityId,
  shouldAudit,
} from "@/lib/audit";

function createPrismaClient() {
  const base = new PrismaClient();
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);
          if (model === "ActivityLog" || !shouldAudit(model, operation)) {
            return result;
          }
          const userId = auditStore.getStore()?.userId;
          void base.activityLog
            .create({
              data: {
                userId,
                action: operation,
                entity: model,
                entityId: extractEntityId(args, result),
                metadata: auditMetadata(args),
              },
            })
            .catch((error) => {
              console.error("[audit] log failed", error);
            });
          return result;
        },
      },
    },
  });
}

type DbClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma?: DbClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
