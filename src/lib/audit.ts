import { AsyncLocalStorage } from "node:async_hooks";
import type { Prisma } from "@prisma/client";

export const auditStore = new AsyncLocalStorage<{ userId?: string }>();

const SENSITIVE_MODELS = new Set([
  "User",
  "Company",
  "JobOffer",
  "Application",
  "Payment",
  "Order",
  "LeaveRequest",
  "Subscription",
  "Employee",
]);

const MUTATIONS = new Set([
  "create",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
]);

export function shouldAudit(model: string, operation: string) {
  return SENSITIVE_MODELS.has(model) && MUTATIONS.has(operation);
}

export function extractEntityId(args: unknown, result: unknown) {
  const payload = args as { where?: { id?: unknown }; data?: { id?: unknown } };
  if (typeof payload?.where?.id === "string") return payload.where.id;
  if (result && typeof result === "object" && "id" in result) {
    const id = (result as { id?: unknown }).id;
    if (typeof id === "string") return id;
  }
  return null;
}

export function auditMetadata(args: unknown): Prisma.InputJsonValue | undefined {
  const payload = args as { data?: Record<string, unknown> };
  if (!payload?.data || typeof payload.data !== "object") return undefined;
  const keys = Object.keys(payload.data).filter(
    (key) => !/password|secret|token|hash/i.test(key),
  );
  return { fields: keys.slice(0, 12) };
}
