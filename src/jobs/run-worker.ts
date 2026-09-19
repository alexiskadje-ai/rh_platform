import { startNotificationWorker } from "@/jobs/worker";

const worker = startNotificationWorker();
if (!worker) {
  console.error("[notifications] Redis indisponible — worker non démarré.");
  process.exit(1);
}
