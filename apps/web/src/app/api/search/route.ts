import { NextRequest, NextResponse } from "next/server";
import { searchAllSources, fetchAllSources } from "@/lib/sources/aggregator";
import { UnifiedCar, InventoryType } from "@/lib/sources/types";
import { parseQuery } from "@/lib/nlp";
import { rankVehicles } from "@/lib/matching";
import { SearchFilters, SearchFacets, parseFilters, applyFilters } from "@/lib/searchTypes";

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
}

function buildFacets(cars: UnifiedCar[]): SearchFacets {
  const prices = cars.map((c) => c.price);
  const years = cars.map((c) => c.year);
  const safetyStars = cars
    .map((c) => c.safety?.stars)
    .filter((s): s is number => typeof s === "number");
  return {
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
    yearMin: years.length ? Math.min(...years) : 0,
    yearMax: years.length ? Math.max(...years) : 0,
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

  if (!q || q.trim().length < 2) {
    const filtered = applyFilters(pool, filters);
    return NextResponse.json({
      results: filtered,
      total: filtered.length,
      criteria: null,
      sources: getSourceStats(filtered),
      facets: buildFacets(pool),
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
  });
}

function getSourceStats(cars: { source: string }[]) {
  const stats: Record<string, number> = {};
  for (const car of cars) {
    stats[car.source] = (stats[car.source] || 0) + 1;
  }
  return stats;
}
