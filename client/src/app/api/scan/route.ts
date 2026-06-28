import { type NextRequest, NextResponse } from "next/server";
import { hasApiKey } from "@/lib/coingecko/client";
import * as repo from "@/lib/db/repo";
import { startScan } from "@/lib/scan/runner";
import { toScanState } from "@/lib/scan/serialize";
import { validateScanRequest } from "@/lib/scan/validate";

export const dynamic = "force-dynamic";

/** Start a scan. 400 on bad input / missing key, 409 if one is already running. */
export async function POST(request: NextRequest) {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "COINGECKO_API_KEY is not set in .env.local" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const result = validateScanRequest(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const active = await repo.getActiveScan();
  if (active) {
    return NextResponse.json(
      { error: "a scan is already running", activeId: active.id },
      { status: 409 },
    );
  }

  const scan = await repo.createScan({
    universeSize: result.config.universeSize,
    logic: result.config.logic,
    conditions: JSON.stringify(result.config.conditions),
  });

  startScan(scan.id);

  return NextResponse.json({ id: scan.id }, { status: 201 });
}

/** The currently active scan (for the UI to resume polling after a reload). */
export async function GET() {
  const active = await repo.getActiveScan();
  return NextResponse.json({ active: active ? toScanState(active) : null });
}
