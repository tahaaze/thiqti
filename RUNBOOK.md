# SLEIPNIR Runbook

## Service Overview

SLEIPNIR is an AI-powered vehicle search engine for Morocco. It aggregates listings from Auto24.ma, SoeezAuto.ma, Avito.ma, and a fallback dataset, then ranks results using NLP parsing + TOPSIS multi-criteria matching. An e-reputation barometer provides sentiment scores per vehicle model.

**Key components:**
- **Next.js 15 app** — Frontend + API routes (search, reputation)
- **NestJS API** — Vehicle CRUD, reputation service (Phase 2)
- **Python AI** — FastAPI for reputation analysis (Phase 2)
- **PostgreSQL** — Vehicle storage + pgvector (Phase 2)

## Architecture Diagram

See `docs/architecture/deployment.md` for the full Mermaid diagram.

```
Browser → Next.js (Vercel) → API Routes → In-Memory Cache
                ↓                              ↓
        SSR Pages                     Aggregator → Sources
                                          ↓
                                   [Auto24 | SoeezAuto | Avito | Fallback]
```

## Common Issues and Fixes

### Dev Server Won't Start

**Symptom:** `npm run dev` fails or port 3000 in use.

```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Reinstall dependencies
rm -rf node_modules
npm install

# Try again
npm run dev
```

### Build Errors

**Symptom:** `npm run build` fails with TypeScript errors.

```bash
# Check types first
npx tsc --noEmit -p apps/web/tsconfig.json

# Fix lint issues
npm run lint

# Then rebuild
npm run build
```

### Data Collection Failures

**Symptom:** Search returns only fallback data, no live scraping results.

**Causes:**
- Source websites changed HTML structure (selector breakage)
- Rate limiting / IP blocking
- Network timeout

**Fixes:**
1. Check source site manually — verify pages load
2. Run Playwright scraper in debug mode:
   ```bash
   npx playwright test --headed
   ```
3. If blocked, increase delay between requests in collector files
4. Fallback dataset always works — users still get results

### TOPSIS Returns NaN Scores

**Symptom:** Match percentages show as NaN or 0.

**Cause:** All vehicles have identical values in a dimension (division by zero in normalization).

**Fix:** Already handled — `normalize()` returns 0.5 when min equals max. If recursing, check that the vehicle array is not empty before ranking.

### Memory Leak in Production

**Symptom:** Vercel function memory usage climbs steadily.

**Cause:** In-memory cache (`cachedAllCars`) never clears in long-running functions.

**Fix:** Vercel serverless functions restart automatically. For persistent issues, add a `MAX_CACHE_SIZE` limit or switch to Redis (Phase 2).

## Health Checks

### Quick Check

```bash
# API responds
curl http://localhost:3000/api/search?q=test

# Reputation endpoint
curl http://localhost:3000/api/reputation?make=Toyota&model=Corolla
```

### Vercel Production

```
GET https://thiqti.vercel.app/api/search?q=SUV
```

Expected: JSON with `results` array, `total` count, `sources` breakdown.

### Docker Services

```bash
docker-compose ps

# Expected: postgres (healthy), redis (healthy), meilisearch (running)
```

## Scaling Notes

| Load | Action |
|------|--------|
| < 100 searches/day | Free tier, no changes needed |
| ~1,000 searches/day | Upgrade Vercel to Pro ($20/mo) |
| ~10,000 searches/day | Add Supabase Pro ($25/mo), CDN caching |
| 50,000+ searches/day | Edge functions, Redis cache, DB read replicas |

**Current capacity:** In-memory cache handles ~500 concurrent users comfortably.

## Rollback Procedure

### Vercel (Primary)

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "Promote to Production"
4. Instant rollback, zero downtime

### Database (Phase 2)

```bash
# Restore from Supabase backup
# Dashboard → Database → Backups → Restore to point-in-time
```

### Scraper Failure

1. Disable broken collector by commenting it out in `apps/web/src/lib/sources/aggregator.ts`
2. Fallback dataset continues to serve results
3. Fix the collector and redeploy

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Lead Developer | Adam Chouikh | [Insert contact] |
| Backend Engineer | Mohamed Taha Ait Ouahammi | [Insert contact] |
| Frontend Engineer | Younes Boumalek | [Insert contact] |
| Supervisor | [Insert name] | [Insert contact] |

## On-Call Playbook

### P1: Site Down

1. Check Vercel status: `https://vercel-status.com`
2. Check deployment logs in Vercel Dashboard
3. If Vercel is down — wait (out of our control)
4. If our code broke — rollback to previous deployment

### P2: Search Returns Empty Results

1. Test API directly: `curl /api/search?q=SUV`
2. Check server logs for `[Sources]` errors
3. If all sources failed, fallback dataset should still work
4. If fallback is missing, check `apps/web/src/lib/sources/fallback.ts`

### P3: Slow Response Times

1. Check if cache is warm (first request after cold start is slower)
2. Monitor `/api/metrics` endpoint if available
3. If persistent, check for N+1 queries or unbounded data fetching

### P4: Wrong Rankings

1. Test with a simple query: `curl /api/search?q=SUV diesel`
2. Check NLP parsing: verify `criteria` in response
3. Check TOPSIS weights in `apps/web/src/lib/matching.ts`
4. Verify vehicle data quality in fallback dataset
