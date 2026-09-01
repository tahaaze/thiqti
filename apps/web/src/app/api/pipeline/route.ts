import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSources, runFullAgent, PRIORITY_MODELS } from '@/lib/pipeline/agent';
import { getRecentPipelineRuns } from '@/lib/pipeline/db';

/**
 * GET /api/pipeline — Get recent pipeline runs
 * POST /api/pipeline — Run scraping agent
 *   Body: { action: 'scrape'|'full'|'status', make?: string, model?: string }
 */
export async function GET() {
  try {
    const runs = await getRecentPipelineRuns(20);
    return NextResponse.json({ runs });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, make, model } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'scrape': {
        if (!make || !model) {
          return NextResponse.json({ error: 'make and model are required' }, { status: 400 });
        }
        const result = await scrapeAllSources(make, model);
        return NextResponse.json({
          success: true,
          make,
          model,
          totalStored: result.total,
          bySource: result.bySource,
        });
      }
      case 'full': {
        // Run in background — return immediately
        runFullAgent().then(result => {
          console.log('[pipeline] Full agent run complete:', JSON.stringify(result, null, 2));
        }).catch(err => {
          console.error('[pipeline] Full agent run failed:', err);
        });
        return NextResponse.json({
          success: true,
          action: 'full',
          message: 'Universal scraping agent started in background',
          modelsQueued: PRIORITY_MODELS.length,
          models: PRIORITY_MODELS.map(m => `${m.make} ${m.model}`),
        });
      }
      case 'status': {
        const runs = await getRecentPipelineRuns(10);
        return NextResponse.json({ runs });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('[pipeline] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
