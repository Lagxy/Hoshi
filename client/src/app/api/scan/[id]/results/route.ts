import { NextResponse } from "next/server";
import * as repo from "@/lib/db/repo";
import { toScanResults } from "@/lib/scan/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Matched tokens + dynamic columns for a scan (also used to reopen history). */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const scan = await repo.getScan(id);
  if (!scan) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(toScanResults(scan));
}
