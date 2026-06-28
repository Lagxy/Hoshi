// Runs once on server startup. Fail any scans left mid-run by a previous process
// so the UI never shows a perpetually "running" ghost scan.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { markOrphanedScansInterrupted } = await import("@/lib/db/repo");
  try {
    const count = await markOrphanedScansInterrupted();
    if (count > 0) {
      console.log(`[hoshi] marked ${count} orphaned scan(s) as interrupted`);
    }
  } catch (err) {
    console.error("[hoshi] orphan recovery failed:", err);
  }
}
