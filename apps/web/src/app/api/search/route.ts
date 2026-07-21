import { NextRequest, NextResponse } from "next/server";
import { searchCars } from "@/lib/car-search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const results = await searchCars(q);
  return NextResponse.json({ results, total: results.length });
}
