import { Worker } from "bullmq";
import { ERP_HIRE_QUEUE, getRedisConnection, type ErpHireJobData } from "@/jobs/queue";
import { db } from "@/lib/db";
import { runHireDelivery } from "@/lib/erp/run-hire";

const globalForWorker = globalThis as unknown as {
  erpHireWorker?: Worker<ErpHireJobData>;
};

export function startErpHireWorker() {
  if (globalForWorker.erpHireWorker) return globalForWorker.erpHireWorker;
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker<ErpHireJobData>(
    ERP_HIRE_QUEUE,
    async (job) => {
      await runHireDelivery(job.data.applicationId);
    },
    { connection, concurrency: 2 },
  );

  worker.on("failed", (job, error) => {
    const attempts = job?.opts.attempts ?? 5;
    const tried = job?.attemptsMade ?? 0;
    const applicationId = job?.data.applicationId;
    if (!applicationId || tried < attempts) return;
    void db.application
      .updateMany({
        where: { id: applicationId, erpSyncStatus: { in: ["PENDING", "FAILED"] } },
        data: { erpSyncStatus: "FAILED" },
      })
      .catch(() => {});
    console.error("[erp] envoi embauche épuisé", { applicationId, name: error?.name ?? "Error" });
  });

  globalForWorker.erpHireWorker = worker;
  return worker;
}
