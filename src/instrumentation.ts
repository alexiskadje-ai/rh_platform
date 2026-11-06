export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { assertStorageConfig } = await import("@/lib/storage");
  assertStorageConfig();

  // Keep BullMQ workers out of the web process by default — they compete with
  // request cold starts. Opt in with ENABLE_INLINE_WORKERS=1 or run `npm run jobs:notifications`.
  if (process.env.ENABLE_INLINE_WORKERS !== "1") return;

  const { startNotificationWorker } = await import("@/jobs/worker");
  startNotificationWorker();
  const { startErpHireWorker } = await import("@/jobs/erp-worker");
  startErpHireWorker();
}
