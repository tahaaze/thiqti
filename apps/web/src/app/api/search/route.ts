import { NextRequest, NextResponse } from "next/server";
import { searchAllSources, fetchAllSources } from "@/lib/sources/aggregator";
import { parseQuery } from "@/lib/nlp";
import { rankVehicles } from "@/lib/matching";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";

  if (!q || q.trim().length < 2) {
    const allCars = await fetchAllSources();
    return NextResponse.json({
      results: allCars,
      total: allCars.length,
      criteria: null,
      sources: getSourceStats(allCars),
    });
  }

  const criteria = parseQuery(q);

  const allCars = q.trim().length >= 2
    ? await searchAllSources(q)
    : await fetchAllSources();

  const ranked = rankVehicles(allCars, criteria);

  return NextResponse.json({
    results: ranked,
    total: ranked.length,
    criteria,
    sources: getSourceStats(allCars),
  });
}

function getSourceStats(cars: { source: string }[]) {
  const stats: Record<string, number> = {};
  for (const car of cars) {
    stats[car.source] = (stats[car.source] || 0) + 1;
  }
  return stats;
}
