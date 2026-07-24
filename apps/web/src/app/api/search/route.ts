import { NextRequest, NextResponse } from "next/server";
import { searchCars } from "@/lib/car-search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const results = await searchCars(q);
  return NextResponse.json({ results, total: results.length });
}
