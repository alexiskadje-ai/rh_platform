export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { assertStorageConfig } = await import("@/lib/storage");
  assertStorageConfig();
}
