import { NextResponse } from "next/server";
import { ACTIVE_STATUSES } from "@/lib/db/repo";
import * as repo from "@/lib/db/repo";
import { requestCancel } from "@/lib/scan/runner";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Request cancellation of a running scan; the runner stops between API calls. */
export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const scan = await repo.getScan(id);
  if (!scan) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!ACTIVE_STATUSES.includes(scan.status as (typeof ACTIVE_STATUSES)[number])) {
    return NextResponse.json(
      { error: "scan is not running" },
      { status: 409 },
    );
  }

  requestCancel(id);
  return NextResponse.json({ ok: true });
}
