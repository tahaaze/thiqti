import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SentimentResult } from './types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Classify sentiment of a car review using Gemini LLM.
 * Falls back to local NLP if Gemini is unavailable.
 */
export async function classifySentiment(
  text: string,
  context?: { make?: string; model?: string; language?: string }
): Promise<SentimentResult> {
  if (!process.env.GEMINI_API_KEY || text.length < 20) {
    return localClassifySentiment(text);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    const prompt = `Analyze this car review and return a JSON object with:
- sentiment: "positive", "neutral", or "negative"
- score: confidence between 0 and 1
- language: "fr", "en", "ar", or "darija"
- summary: 1 sentence summary in French

Review: "${text.slice(0, 1000)}"
${context?.make ? `Brand: ${context.make} ${context.model || ''}` : ''}

Return ONLY valid JSON, no other text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text().trim();
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return localClassifySentiment(text);
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(1, parsed.score)) : 0.5,
      language: parsed.language || 'en',
      summary: parsed.summary || undefined,
    };
  } catch (err) {
    console.error('[classifier] Gemini error:', (err as Error).message);
    return localClassifySentiment(text);
  }
}

/**
 * Batch classify multiple reviews using Gemini.
 */
export async function classifyBatch(
  reviews: { text: string; id: string }[],
  context?: { make?: string; model?: string }
): Promise<Map<string, SentimentResult>> {
  const results = new Map<string, SentimentResult>();
  
  if (!process.env.GEMINI_API_KEY) {
    for (const r of reviews) {
      results.set(r.id, localClassifySentiment(r.text));
    }
    return results;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    // Process in batches of 5
    for (let i = 0; i < reviews.length; i += 5) {
      const batch = reviews.slice(i, i + 5);
      const batchTexts = batch.map((r, idx) => `[${idx}] ${r.text.slice(0, 500)}`).join('\n---\n');
      
      const prompt = `Analyze these ${batch.length} car reviews and return a JSON array.
For each review, return: { "sentiment": "positive"|"neutral"|"negative", "score": 0-1, "language": "fr"|"en"|"ar"|"darija" }

Reviews:
${batchTexts}

${context?.make ? `Brand: ${context.make} ${context.model || ''}` : ''}

Return ONLY a JSON array of ${batch.length} objects, no other text.`;

      const result = await model.generateContent(prompt);
      const rawText = result.response.text().trim();
      
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        for (const r of batch) results.set(r.id, localClassifySentiment(r.text));
        continue;
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      for (let j = 0; j < batch.length; j++) {
        const p = parsed[j];
        results.set(batch[j].id, {
          sentiment: ['positive', 'neutral', 'negative'].includes(p?.sentiment) ? p.sentiment : 'neutral',
          score: typeof p?.score === 'number' ? Math.max(0, Math.min(1, p.score)) : 0.5,
          language: p?.language || 'en',
        });
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error('[classifier] Batch error:', (err as Error).message);
    for (const r of reviews) {
      if (!results.has(r.id)) results.set(r.id, localClassifySentiment(r.text));
    }
  }
  
  return results;
}

/**
 * Local NLP sentiment classifier (no API needed).
 */
function localClassifySentiment(text: string): SentimentResult {
  const lower = text.toLowerCase();
  
  const positiveWords = [
    'excellent', 'parfait', 'super', 'génial', 'formidable', 'incroyable',
    'best', 'great', 'amazing', 'love', 'perfect', 'awesome', 'fantastic',
    'recommend', 'satisfied', 'happy', 'reliable', 'solid', 'comfortable',
    'fiable', 'confortable', 'satisfait', 'recommande', 'bien', 'bon',
    'économique', 'efficace', 'moderne', 'élégant', 'puissant',
  ];
  const negativeWords = [
    'nul', 'mauvais', 'horrible', 'catastrophique', 'problème', 'panne',
    'bad', 'terrible', 'awful', 'worst', 'problem', 'issue', 'broken',
    'disappointing', 'overpriced', 'unreliable', 'defaut', 'casse',
    'évier', 'lent', 'bruyant', 'cher', 'ennuyeux',
  ];
  
  const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lower.includes(w)).length;
  
  let rating = 5;
  if (positiveCount > negativeCount) rating = 7 + Math.min(positiveCount - negativeCount, 2);
  else if (negativeCount > positiveCount) rating = 3 - Math.min(negativeCount - positiveCount, 2);
  
  const sentiment = rating >= 7 ? 'positive' : rating <= 4 ? 'negative' : 'neutral';
  const score = Math.abs(positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
  
  return {
    sentiment,
    score: Math.min(1, score),
    language: detectLanguage(text),
  };
}

function detectLanguage(text: string): string {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const frenchWords = ['le', 'la', 'les', 'un', 'une', 'des', 'est', 'sont', 'voiture', 'très', 'bien', 'aussi'];
  const frenchCount = frenchWords.filter(w => text.toLowerCase().includes(` ${w} `)).length;
  
  if (arabicChars > text.length * 0.1) return 'ar';
  if (frenchCount >= 2) return 'fr';
  return 'en';
}
