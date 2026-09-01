import type { ScrapedReview } from "./types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function detectLang(text: string): "fr" | "ar" | "en" {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/\b(the|is|are|this|that|good|bad|great|excellent|terrible)\b/i.test(text)) return "en";
  return "fr";
}

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#\d+;/g, "").trim().slice(0, 2000);
}

async function fetchPage(url: string, timeoutMs = 15000): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9,ar;q=0.8,en;q=0.7" },
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

/**
 * DuckDuckGo Lite — fiable, ne bloque pas les bots.
 * Retourne les snippets de recherche.
 */
async function scrapeDDG(make: string, model: string): Promise<ScrapedReview[]> {
  const query = encodeURIComponent(`${make} ${model} avis review test`);
  const html = await fetchPage(`https://lite.duckduckgo.com/lite/?q=${query}`);
  if (!html) return [];

  const reviews: ScrapedReview[] = [];
  // DDG lite uses <td> cells for results
  const cells = html.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
  const textCells = cells
    .map(c => cleanText(c))
    .filter(c => c.length > 30 && c.length < 800);

  // Extract snippets that look like reviews
  const reviewKeywords = /avis|test|review|opinion|expérience|satisfait|recommande|problème|fiable|déçu|consommation|confort|fiabilité/i;
  const urls: string[] = [];

  for (const text of textCells) {
    // Extract URLs
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch && !urlMatch[1].includes("duckduckgo")) {
      urls.push(urlMatch[1]);
    }

    if (reviewKeywords.test(text) && text.length > 50) {
      reviews.push({
        source: "duckduckgo",
        author: "Web",
        rating: null,
        text: text.replace(/(https?:\/\/[^\s]+)/g, "").trim(),
        date: new Date().toISOString(),
        url: urlMatch?.[1] || `https://lite.duckduckgo.com/lite/?q=${query}`,
        lang: detectLang(text),
      });
    }
  }

  // Scrape the top result URLs for more detailed reviews
  for (const url of urls.slice(0, 3)) {
    const pageHtml = await fetchPage(url);
    if (!pageHtml) continue;
    const pageReviews = extractReviewsFromPage(pageHtml, url, "web");
    reviews.push(...pageReviews.slice(0, 3));
  }

  return reviews.slice(0, 10);
}

/**
 * Extrait des avis depuis n'importe quelle page web.
 */
function extractReviewsFromPage(html: string, url: string, source: string): ScrapedReview[] {
  const reviews: ScrapedReview[] = [];
  const reviewPatterns = [
    /(?:avis|test|review|opinion|expérience|satisfait|recommande|problème|fiable|déçu|économie|confort|bruit|puissance)[^.!?\n]{20,400}/gi,
    /(?:très bien|pas mal|dommage|ennuyeux|impeccable|parfait|nul|top|geo|zwina|mzyan)[^.!?\n]{10,300}/gi,
  ];

  const seen = new Set<string>();
  for (const pat of reviewPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pat.exec(html)) !== null) {
      const text = cleanText(m[0]);
      const key = text.slice(0, 60).toLowerCase();
      if (text.length > 25 && !seen.has(key)) {
        seen.add(key);
        // Try to extract rating
        const ratingMatch = html.substring(Math.max(0, m.index - 100), m.index + m[0].length + 100)
          .match(/(\d+(?:[.,]\d+)?)\s*\/\s*5|(\d+(?:[.,]\d+)?)\s*étoiles?|note\s*:\s*(\d+)/i);
        const rating = ratingMatch
          ? parseFloat((ratingMatch[1] || ratingMatch[2] || ratingMatch[3] || "").replace(",", "."))
          : null;

        reviews.push({
          source,
          author: "Utilisateur web",
          rating: rating && rating <= 10 ? rating : null,
          text,
          date: new Date().toISOString(),
          url,
          lang: detectLang(text),
        });
      }
    }
  }
  return reviews;
}

/**
 * Scrape Reddit pour des avis automobiles.
 */
async function scrapeReddit(make: string, model: string): Promise<ScrapedReview[]> {
  const query = encodeURIComponent(`${make} ${model}`);
  const html = await fetchPage(`https://www.reddit.com/search.json?q=${query}&sort=relevance&limit=10`);
  if (!html) return [];

  const reviews: ScrapedReview[] = [];
  try {
    const data = JSON.parse(html);
    const posts = data?.data?.children || [];
    for (const post of posts) {
      const d = post.data;
      if (d.selftext && d.selftext.length > 30) {
        reviews.push({
          source: "reddit",
          author: d.author || "Reddit user",
          rating: null,
          text: cleanText(d.selftext).slice(0, 1000),
          date: new Date((d.created_utc || 0) * 1000).toISOString(),
          url: `https://reddit.com${d.permalink}`,
          lang: detectLang(d.selftext),
        });
      }
      // Also check top comments
      if (d.reviews) {
        for (const comment of (d.reviews.data?.children || []).slice(0, 3)) {
          if (comment.data?.body && comment.data.body.length > 20) {
            reviews.push({
              source: "reddit",
              author: comment.data.author || "Reddit user",
              rating: null,
              text: cleanText(comment.data.body).slice(0, 500),
              date: new Date((comment.data.created_utc || 0) * 1000).toISOString(),
              url: `https://reddit.com${d.permalink}`,
              lang: detectLang(comment.data.body),
            });
          }
        }
      }
    }
  } catch { /* parse error */ }

  return reviews.slice(0, 8);
}

/**
 * Scrape les pages de commentaires Dacia.fr / constructeurs.
 */
async function scrapeOEMReviews(make: string, model: string): Promise<ScrapedReview[]> {
  const reviews: ScrapedReview[] = [];
  const urls = [
    `https://www.${make.toLowerCase().replace(/[^a-z]/g, "")}.fr/gamme-electrique-et-hybride/${model.toLowerCase().replace(/[^a-z]/g, "-")}/avis-clients-certifies.html`,
  ];

  for (const url of urls) {
    const html = await fetchPage(url);
    if (!html) continue;
    reviews.push(...extractReviewsFromPage(html, url, "oem").slice(0, 5));
  }
  return reviews;
}

/**
 * Collecte tous les avis depuis toutes les sources.
 */
export async function scrapeAllReviews(make: string, model: string): Promise<ScrapedReview[]> {
  const results = await Promise.allSettled([
    scrapeDDG(make, model),
    scrapeReddit(make, model),
    scrapeOEMReviews(make, model),
  ]);

  const allReviews: ScrapedReview[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allReviews.push(...r.value);
  }

  // Dédupliquer par texte similaire
  const seen = new Set<string>();
  const unique: ScrapedReview[] = [];
  for (const rev of allReviews) {
    const key = rev.text.slice(0, 80).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(rev);
    }
  }

  return unique;
}
