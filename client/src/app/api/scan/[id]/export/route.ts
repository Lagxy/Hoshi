import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import * as repo from "@/lib/db/repo";
import type { ColumnValue } from "@/lib/scan/columns";
import { toScanResults } from "@/lib/scan/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function cell(value: ColumnValue): string | number | null {
  if (Array.isArray(value)) return value.join("; ");
  return value;
}

/** Download the matched tokens as CSV. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const scan = await repo.getScan(id);
  if (!scan) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { columns, rows } = toScanResults(scan);
  const headers = [
    "Name",
    "Symbol",
    "Price (USD)",
    "Market Cap (USD)",
    ...columns.map((c) => c.label),
  ];
  const csvRows = rows.map((r) => [
    r.name,
    r.symbol.toUpperCase(),
    r.current_price,
    r.market_cap,
    ...columns.map((c) => cell(r.values[c.key] ?? null)),
  ]);

  const csv = toCsv(headers, csvRows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hoshi-scan-${id}.csv"`,
    },
  });
}
