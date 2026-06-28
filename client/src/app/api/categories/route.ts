import { NextResponse } from "next/server";
import { CATEGORIES_TTL_MS } from "@/lib/cache";
import { CoinGeckoError, fetchCategoriesList } from "@/lib/coingecko/client";
import * as repo from "@/lib/db/repo";

export const dynamic = "force-dynamic";

/** Category list for the multi-select (cached ~24h). */
export async function GET() {
  const cached = await repo.getFreshCategories(CATEGORIES_TTL_MS);
  if (cached) {
    return NextResponse.json({
      categories: cached.map((c) => ({ id: c.categoryId, name: c.name })),
    });
  }

  try {
    const list = await fetchCategoriesList();
    await repo.replaceCategories(
      list.map((c) => ({ categoryId: c.category_id, name: c.name })),
    );
    return NextResponse.json({
      categories: list.map((c) => ({ id: c.category_id, name: c.name })),
    });
  } catch (err) {
    const status =
      err instanceof CoinGeckoError ? (err.status ?? 502) : 500;
    return NextResponse.json(
      { error: (err as Error).message },
      { status },
    );
  }
}
