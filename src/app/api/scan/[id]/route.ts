import { NextResponse } from "next/server";
import * as repo from "@/lib/db/repo";
import { getActiveScanId } from "@/lib/scan/runner";
import { toScanState } from "@/lib/scan/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Poll a scan's state. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const scan = await repo.getScan(id);
  if (!scan) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(toScanState(scan));
}

/** Delete a history entry (not allowed while it's running). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (getActiveScanId() === id) {
    return NextResponse.json(
      { error: "cannot delete a running scan" },
      { status: 409 },
    );
  }
  const scan = await repo.getScan(id);
  if (!scan) return NextResponse.json({ error: "not found" }, { status: 404 });
  await repo.deleteScan(id);
  return NextResponse.json({ ok: true });
}
