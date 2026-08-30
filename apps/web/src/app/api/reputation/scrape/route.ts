import { NextRequest, NextResponse } from "next/server";
import { getReputation, refreshReputation } from "@/lib/reputation/reputationService";

/**
 * GET /api/reputation/scrape?make=Toyota&model=RAV4
 * Retourne la réputation (cache ou scraping frais).
 *
 * POST /api/reputation/scrape  { make, model }
 * Force un refresh complet (scrape + LLM).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get("make");
  const model = searchParams.get("model");
  if (!make || !model) {
    return NextResponse.json({ error: "make and model are required" }, { status: 400 });
  }

  try {
    const { data, fresh } = await getReputation(make, model);
    return NextResponse.json({ ...data, fresh });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { make, model } = body;
    if (!make || !model) {
      return NextResponse.json({ error: "make and model are required" }, { status: 400 });
    }

    const result = await refreshReputation(make, model);
    return NextResponse.json({ ...result, fresh: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
