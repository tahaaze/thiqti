import { NextRequest, NextResponse } from "next/server";
import { searchAllSources, fetchAllSources } from "@/lib/sources/aggregator";
import { UnifiedCar, InventoryType } from "@/lib/sources/types";
import { parseQuery } from "@/lib/nlp";
import { rankVehicles } from "@/lib/matching";
import { SearchFacets, parseFilters, applyFilters, searchWithFallback } from "@/lib/searchTypes";

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
}

function buildFacets(cars: UnifiedCar[]): SearchFacets {
  const validPrices = cars.map((c) => c.price).filter((p) => p > 1000 && p < 5000000);
  const validYears = cars.map((c) => c.year).filter((y) => y >= 2000 && y <= 2026);
  const safetyStars = cars
    .map((c) => c.safety?.stars)
    .filter((s): s is number => typeof s === "number");
  return {
    priceMin: validPrices.length ? Math.min(...validPrices) : 0,
    priceMax: validPrices.length ? Math.max(...validPrices) : 600000,
    yearMin: validYears.length ? Math.min(...validYears) : 2018,
    yearMax: validYears.length ? Math.max(...validYears) : 2026,
    brands: uniqueSorted(cars.map((c) => c.make)),
    bodyTypes: uniqueSorted(cars.map((c) => c.bodyType)),
    fuels: uniqueSorted(cars.map((c) => c.fuel)),
    cities: uniqueSorted(cars.map((c) => c.city)),
    safety: {
      evaluated: safetyStars.length,
      fiveStars: safetyStars.filter((s) => s >= 5).length,
    },
  };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const rawType = request.nextUrl.searchParams.get("type");
  const type: InventoryType | undefined =
    rawType === "new" || rawType === "used" ? rawType : undefined;

  const filters = parseFilters(request.nextUrl.searchParams);

  const allCars = await fetchAllSources();
  const pool = type ? allCars.filter((c) => c.inventoryType === type) : allCars;
  const demoData = allCars.length > 0 && allCars.every((c) => c.isDemoData);

  if (!q || q.trim().length < 2) {
    const fallback = searchWithFallback(pool, filters);
    const sorted = [...fallback.results].sort((a, b) => b.score - a.score);
    return NextResponse.json({
      results: sorted,
      total: sorted.length,
      criteria: null,
      sources: getSourceStats(sorted),
      facets: buildFacets(pool),
      demoData,
      relaxed: fallback.relaxed,
      expandedBudget: fallback.expandedBudget,
    }, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  }

  const criteria = parseQuery(q);
  const matched = await searchAllSources(q, type);
  const filtered = applyFilters(matched, filters);
  const ranked = rankVehicles(filtered, criteria);

  return NextResponse.json({
    results: ranked,
    total: ranked.length,
    criteria,
    sources: getSourceStats(filtered),
    facets: buildFacets(pool),
    demoData,
  }, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
  });
}

function getSourceStats(cars: { source: string }[]) {
  const stats: Record<string, number> = {};
  for (const car of cars) {
    stats[car.source] = (stats[car.source] || 0) + 1;
  }
  return stats;
}
