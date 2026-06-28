import { NextResponse } from "next/server";
import * as repo from "@/lib/db/repo";
import { toHistoryItem } from "@/lib/scan/serialize";

export const dynamic = "force-dynamic";

/** List past scans, newest first. */
export async function GET() {
  const scans = await repo.listScans();
  return NextResponse.json({ scans: scans.map(toHistoryItem) });
}
