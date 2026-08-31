import type { FirecrawlResult } from './types';

const FIRECRAWL_API_BASE = 'https://api.firecrawl.dev/v1';

/**
 * Scrape a URL using Firecrawl API.
 * Requires FIRECRAWL_API_KEY env var.
 */
export async function scrapeUrl(url: string): Promise<FirecrawlResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn('[firecrawl] FIRECRAWL_API_KEY not set, skipping');
    return null;
  }

  try {
    const res = await fetch(`${FIRECRAWL_API_BASE}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!res.ok) {
      console.error('[firecrawl] Scrape failed:', res.status);
      return null;
    }

    const data = await res.json();
    if (!data.success || !data.data) {
      console.error('[firecrawl] Scrape returned no data');
      return null;
    }

    return {
      url,
      title: data.data.metadata?.title || '',
      markdown: data.data.markdown || '',
      metadata: data.data.metadata,
    };
  } catch (err) {
    console.error('[firecrawl] Error:', (err as Error).message);
    return null;
  }
}

/**
 * Search and scrape car review pages using Firecrawl.
 * Scrapes car review websites like autoevolution, edmunds, etc.
 */
export async function scrapeCarReviewPages(
  make: string,
  model: string,
  maxPages = 3
): Promise<FirecrawlResult[]> {
  const results: FirecrawlResult[] = [];
  
  const urls = [
    `https://www.autoevolution.com/${make.toLowerCase()}/${model.toLowerCase()}/`,
    `https://www.edmunds.com/${make.toLowerCase()}/${model.toLowerCase()}/`,
    `https://www.kbb.com/${make.toLowerCase()}/${model.toLowerCase()}/`,
  ];

  for (const url of urls.slice(0, maxPages)) {
    const result = await scrapeUrl(url);
    if (result && result.markdown.length > 100) {
      results.push(result);
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}

/**
 * Extract review text from Firecrawl markdown content.
 */
export function extractReviewsFromMarkdown(markdown: string): { text: string; rating?: number }[] {
  const reviews: { text: string; rating?: number }[] = [];
  
  // Look for review patterns
  const reviewPatterns = [
    /(?:pros?|avantages?)[\s:]+([\s\S]+?)(?:cons?|inconvénients?|drawbacks?)[\s:]+([\s\S]+?)(?:\n\n|$)/gi,
    /(?:rating|score|note)[\s:]+(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/gi,
    /(?:verdict|conclusion)[\s:]+([\s\S]+?)(?:\n\n|$)/gi,
  ];

  for (const pattern of reviewPatterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      if (match[1]) {
        reviews.push({
          text: match[1].trim().slice(0, 500),
          rating: match[2] ? parseFloat(match[2]) : undefined,
        });
      }
    }
  }

  // If no structured reviews found, extract paragraphs
  if (reviews.length === 0) {
    const paragraphs = markdown.split('\n\n').filter(p => p.trim().length > 100);
    for (const p of paragraphs.slice(0, 5)) {
      reviews.push({ text: p.trim().slice(0, 500) });
    }
  }

  return reviews;
}
