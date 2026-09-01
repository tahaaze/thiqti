import { NextRequest, NextResponse } from "next/server";
import { fetchAllSources } from "@/lib/sources/aggregator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const allCars = await fetchAllSources();
    const found = allCars.find((c) => c.id === id);
    if (!found) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
    return NextResponse.json(found, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
