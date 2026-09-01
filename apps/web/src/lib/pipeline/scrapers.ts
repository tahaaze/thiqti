// ============================================================================
// UNIVERSAL SCRAPER — Scrape ALL accessible sources
// ============================================================================

export interface ScrapedItem {
  source: string;
  platform: string;
  url: string;
  title: string;
  body: string;
  author?: string;
  rating?: number;
  likes?: number;
  views?: number;
  comments?: number;
  publishedAt?: Date;
  language?: string;
  subreddit?: string;
}

// --- 1. DuckDuckGo Lite (works from anywhere, no API key) ---

export async function scrapeDuckDuckGo(
  query: string,
  maxResults = 10
): Promise<ScrapedItem[]> {
  try {
    const params = new URLSearchParams({ q: query, kl: 'fr-fr' });
    const res = await fetch(`https://lite.duckduckgo.com/lite/?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseDuckDuckGoLite(html, maxResults);
  } catch (err) {
    console.error('[scraper] DuckDuckGo error:', (err as Error).message);
    return [];
  }
}

function parseDuckDuckGoLite(html: string, max: number): ScrapedItem[] {
  const results: ScrapedItem[] = [];
  // DuckDuckGo Lite has results in <a class="result-link"> and snippets in <td class="result-snippet">
  const linkRegex = /<a[^>]*class="result-link"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
  const snippetRegex = /<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;

  const links: { url: string; title: string }[] = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null && links.length < max) {
    links.push({ url: match[1], title: match[2].trim() });
  }

  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null && snippets.length < max) {
    snippets.push(match[1].replace(/<[^>]*>/g, '').trim());
  }

  for (let i = 0; i < links.length; i++) {
    results.push({
      source: 'duckduckgo',
      platform: 'web',
      url: links[i].url,
      title: links[i].title,
      body: snippets[i] || '',
    });
  }
  return results;
}

// --- 2. Google Search (via scraping, no API key) ---

export async function scrapeGoogleSearch(
  query: string,
  maxResults = 10
): Promise<ScrapedItem[]> {
  try {
    const params = new URLSearchParams({ q: query, num: String(maxResults), hl: 'fr' });
    const res = await fetch(`https://www.google.com/search?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseGoogleSearch(html, maxResults);
  } catch (err) {
    console.error('[scraper] Google error:', (err as Error).message);
    return [];
  }
}

function parseGoogleSearch(html: string, max: number): ScrapedItem[] {
  const results: ScrapedItem[] = [];
  // Google search results: <a href="/url?q=..."> with <h3> titles
  const regex = /<a[^>]*href="\/url\?q=([^&"]*)"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  let match;
  while ((match = regex.exec(html)) !== null && results.length < max) {
    const url = decodeURIComponent(match[1]);
    const title = match[2].replace(/<[^>]*>/g, '').trim();
    if (url && title && !url.startsWith('/')) {
      results.push({
        source: 'google',
        platform: 'web',
        url,
        title,
        body: '',
      });
    }
  }
  return results;
}

// --- 3. Old Reddit (bypasses 403 from cloud IPs) ---

export async function scrapeOldReddit(
  query: string,
  subreddits: string[] = ['cars', 'whatcarshouldIbuy', 'Morocco'],
  maxResults = 20
): Promise<ScrapedItem[]> {
  const allResults: ScrapedItem[] = [];

  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://old.reddit.com/r/${sub}/search?q=${encodeURIComponent(query)}&restrict_sr=on&sort=relevance&t=year&limit=10`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      allResults.push(...parseOldReddit(html, sub));
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`[scraper] old.reddit r/${sub} error:`, (err as Error).message);
    }
  }

  const seen = new Set<string>();
  return allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  }).slice(0, maxResults);
}

function parseOldReddit(html: string, subreddit: string): ScrapedItem[] {
  const results: ScrapedItem[] = [];
  // Old Reddit search results: <a class="search-title" href="..."> and <div class="search-result-meta">
  const titleRegex = /<a[^>]*class="search-title[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const metaRegex = /<div class="search-result-meta">([\s\S]*?)<\/div>/gi;

  const titles: { url: string; title: string }[] = [];
  let match;
  while ((match = titleRegex.exec(html)) !== null) {
    titles.push({ url: match[1], title: match[2].replace(/<[^>]*>/g, '').trim() });
  }

  const metas: string[] = [];
  while ((match = metaRegex.exec(html)) !== null) {
    metas.push(match[1].replace(/<[^>]*>/g, ' ').trim());
  }

  for (let i = 0; i < titles.length; i++) {
    const url = titles[i].url.startsWith('http') ? titles[i].url : `https://old.reddit.com${titles[i].url}`;
    results.push({
      source: 'reddit',
      platform: 'reddit',
      url,
      title: titles[i].title,
      body: metas[i] || '',
      author: undefined,
      subreddit,
    });
  }
  return results;
}

// --- 4. Car Review Sites (direct scraping) ---

export async function scrapeAutoevolution(
  make: string,
  model: string
): Promise<ScrapedItem[]> {
  try {
    const slug = `${make.toLowerCase()}/${model.toLowerCase()}`;
    const res = await fetch(`https://www.autoevolution.com/${slug}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseCarReviewSite(html, 'autoevolution', `https://www.autoevolution.com/${slug}/`);
  } catch (err) {
    console.error('[scraper] autoevolution error:', (err as Error).message);
    return [];
  }
}

export async function scrapeEdmunds(
  make: string,
  model: string
): Promise<ScrapedItem[]> {
  try {
    const slug = `${make.toLowerCase()}/${model.toLowerCase()}`;
    const res = await fetch(`https://www.edmunds.com/${slug}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseCarReviewSite(html, 'edmunds', `https://www.edmunds.com/${slug}/`);
  } catch (err) {
    console.error('[scraper] edmunds error:', (err as Error).message);
    return [];
  }
}

export async function scrapeKbb(
  make: string,
  model: string
): Promise<ScrapedItem[]> {
  try {
    const slug = `${make.toLowerCase()}/${model.toLowerCase()}`;
    const res = await fetch(`https://www.kbb.com/${slug}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseCarReviewSite(html, 'kbb', `https://www.kbb.com/${slug}/`);
  } catch (err) {
    console.error('[scraper] kbb error:', (err as Error).message);
    return [];
  }
}

function parseCarReviewSite(html: string, source: string, baseUrl: string): ScrapedItem[] {
  const results: ScrapedItem[] = [];

  // Extract review blocks — look for rating patterns
  const ratingRegex = /(?:rating|score|note|verdict)[\s:]*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/gi;
  const reviewRegex = /(?:review|avis|test|verdict|conclusion|pros?|cons?)[\s:]+([\s\S]{50,500}?)(?:\n\n|<\/p>|<\/div>)/gi;

  let match;
  const ratings: number[] = [];
  while ((match = ratingRegex.exec(html)) !== null) {
    ratings.push(parseFloat(match[1]));
  }

  const texts: string[] = [];
  while ((match = reviewRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text.length > 50) texts.push(text);
  }

  // Extract meta description
  const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
  if (metaMatch) {
    texts.unshift(metaMatch[1]);
  }

  for (let i = 0; i < Math.max(texts.length, 1); i++) {
    results.push({
      source,
      platform: source,
      url: baseUrl,
      title: `Review from ${source}`,
      body: texts[i] || '',
      rating: ratings[i] || undefined,
    });
  }

  return results;
}

// --- 5. Moroccan Sites (autera, moteur, avito reviews) ---

export async function scrapeMoroccanForums(
  make: string,
  model: string
): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];

  // Try AutoHall forum/reviews
  try {
    const res = await fetch(`https://www.autohall.ma/recherche?q=${encodeURIComponent(make + ' ' + model)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (res.ok) {
      const html = await res.text();
      const items = parseCarReviewSite(html, 'autohall', 'https://www.autohall.ma');
      results.push(...items);
    }
  } catch { /* ignore */ }

  // Try Moteur.ma reviews
  try {
    const res = await fetch(`https://www.moteur.ma/recherche/${encodeURIComponent(make + '-' + model)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (res.ok) {
      const html = await res.text();
      const items = parseCarReviewSite(html, 'moteur', 'https://www.moteur.ma');
      results.push(...items);
    }
  } catch { /* ignore */ }

  return results;
}

// --- 6. Firecrawl (needs API key, but most powerful) ---

export async function scrapeWithFirecrawl(
  url: string
): Promise<ScrapedItem | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !data.data?.markdown) return null;

    return {
      source: 'firecrawl',
      platform: 'web',
      url,
      title: data.data.metadata?.title || '',
      body: data.data.markdown.slice(0, 5000),
    };
  } catch (err) {
    console.error('[scraper] Firecrawl error:', (err as Error).message);
    return null;
  }
}

// --- 7. AutoScout24 (European car reviews) ---

export async function scrapeAutoscout24(
  make: string,
  model: string
): Promise<ScrapedItem[]> {
  try {
    const res = await fetch(`https://www.autoscout24.com/lst/${make.toLowerCase()}/${model.toLowerCase()}?sort=standard&desc=0`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    // Extract listing titles and prices
    const results: ScrapedItem[] = [];
    const listingRegex = /<article[^>]*>[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>[\s\S]*?<div[^>]*class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let match;
    while ((match = listingRegex.exec(html)) !== null) {
      results.push({
        source: 'autoscout24',
        platform: 'marketplace',
        url: `https://www.autoscout24.com/lst/${make.toLowerCase()}/${model.toLowerCase()}`,
        title: match[1].replace(/<[^>]*>/g, '').trim(),
        body: match[2].replace(/<[^>]*>/g, '').trim(),
      });
    }
    return results.slice(0, 10);
  } catch (err) {
    console.error('[scraper] autoscout24 error:', (err as Error).message);
    return [];
  }
}
