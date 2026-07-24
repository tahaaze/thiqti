# SLEIPNIR — Cost Model

**Ref**: VV-SLP-2026-001  
**Date**: 2026-07-17  
**Status**: Active

---

## 1. Cost Assumptions

| Parameter | Value | Justification |
|-----------|-------|---------------|
| Searches per month | 1,000 | MVP target for demo |
| Pages scraped per refresh | 4 | Auto24 + SoeezAuto (API + HTML) |
| Refreshes per day | 1 | Daily cron at 03:00 UTC |
| Scraper pages/month | 120 | 4 pages × 30 days |
| Users concurrent | 1-10 | Demo/interview scenario |

---

## 2. Cost Breakdown per Component

### 2.1 NLP Processing

| Method | Cost per Query | Monthly (1000 queries) | Notes |
|--------|---------------|------------------------|-------|
| Regex-based extraction | $0.000 | **$0.00** | Runs in Node.js, no external calls |
| Fuzzy string matching | $0.000 | **$0.00** | In-memory computation |

**Total NLP: $0.00/month**

### 2.2 Matching Engine (TOPSIS)

| Method | Cost per Query | Monthly (1000 queries) | Notes |
|--------|---------------|------------------------|-------|
| TOPSIS in-memory | $0.000 | **$0.00** | Pure math, no API calls |
| Scoring + ranking | $0.000 | **$0.00** | Array operations in Node.js |

**Total Matching: $0.00/month**

### 2.3 Data Collection (Playwright Scraper)

| Item | Calculation | Cost |
|------|-------------|------|
| Playwright instances | Open-source, self-hosted | $0.00 |
| Infrastructure | Runs on Vercel cron or local Docker | $0.00 |
| Compute time | ~2 min per page × 4 pages × 30 days = 240 min/month | $0.00 (free tier) |
| External API calls (Auto24) | Public API, no key required | $0.00 |
| HTML parsing | Server-side, no external service | $0.00 |

**Total Data Collection: $0.00/month**

> **Note**: If hosted on a paid function (e.g., AWS Lambda), compute would cost ~$0.0002/100ms. For 240 min = $0.29. Vercel free tier covers this.

### 2.4 Hosting (Vercel)

| Plan | Bandwidth | Builds | Serverless | Cost |
|------|-----------|--------|------------|------|
| **Free** | 100 GB/mo | 6,000 min/mo | 100 GB-hrs/mo | **$0.00** |
| Pro | 1 TB/mo | 24,000 min/mo | 1,000 GB-hrs/mo | $20.00/mo |

**MVP estimate**: Free tier is sufficient for 1,000 searches/month.

- Average response size: ~50 KB (JSON + HTML)
- 1,000 searches × 50 KB = 50 MB bandwidth (well under 100 GB limit)
- Build minutes: ~5 min/build × 30 builds = 150 min (well under 6,000)

**Total Hosting: $0.00/month (Free tier)**

### 2.5 Database (Supabase — Phase 2)

| Plan | Storage | DB Size | API Requests | Cost |
|------|---------|---------|--------------|------|
| **Free** | 500 MB | 500 MB | 50,000/mo | **$0.00** |
| Pro | 8 GB | 8 GB | Unlimited | $25.00/mo |

**MVP estimate**: Free tier is sufficient.

- Vehicle data: ~80 vehicles × 2 KB = 160 KB
- Reputation data: ~80 × 1 KB = 80 KB
- Total: ~240 KB (well under 500 MB)

**Total Database: $0.00/month (Free tier)**

### 2.6 LLM Integration (Future — Phase 3)

| Model | Cost per Query | Monthly (1000 queries) | Notes |
|-------|---------------|------------------------|-------|
| GPT-4o-mini | $0.00015/1K tokens | **$0.15** | ~500 tokens per query |
| GPT-4o | $0.005/1K tokens | **$2.50** | Higher quality |
| Claude 3 Haiku | $0.00025/1K tokens | **$0.25** | Alternative |
| Local (Ollama) | $0.00 | **$0.00** | Self-hosted, requires GPU |

**Estimated LLM cost: $0.15 – $2.50/month** (depending on model choice)

### 2.7 Voice Interface (Whisper API — Phase 3)

| Item | Calculation | Cost |
|------|-------------|------|
| Whisper API | $0.006/minute | — |
| Average query length | 5 seconds | $0.001/query |
| 1,000 queries/month | 5,000 seconds = 83 min | **$0.50** |

**Total Voice: $0.50/month**

---

## 3. Total Cost Summary

### 3.1 MVP (Phase 1) — Current

| Component | Monthly Cost |
|-----------|-------------|
| NLP Processing | $0.00 |
| Matching (TOPSIS) | $0.00 |
| Data Collection (Playwright) | $0.00 |
| Hosting (Vercel Free) | $0.00 |
| Database (Fallback Dataset) | $0.00 |
| **TOTAL MVP** | **$0.00/month** |

### 3.2 Phase 2 — With Database

| Component | Monthly Cost |
|-----------|-------------|
| NLP Processing | $0.00 |
| Matching (TOPSIS) | $0.00 |
| Data Collection (Playwright) | $0.00 |
| Hosting (Vercel Free) | $0.00 |
| Database (Supabase Free) | $0.00 |
| **TOTAL Phase 2** | **$0.00/month** |

### 3.3 Phase 3 — With LLM + Voice

| Component | Monthly Cost |
|-----------|-------------|
| NLP Processing | $0.00 |
| Matching (TOPSIS) | $0.00 |
| Data Collection (Playwright) | $0.00 |
| Hosting (Vercel Free) | $0.00 |
| Database (Supabase Free) | $0.00 |
| LLM (GPT-4o-mini) | $0.15 |
| Voice (Whisper) | $0.50 |
| **TOTAL Phase 3** | **$0.65/month** |

### 3.4 Production Scale (10K searches/month)

| Component | Monthly Cost |
|-----------|-------------|
| NLP Processing | $0.00 |
| Matching (TOPSIS) | $0.00 |
| Data Collection (Playwright) | $0.00 |
| Hosting (Vercel Pro) | $20.00 |
| Database (Supabase Pro) | $25.00 |
| LLM (GPT-4o-mini, 10K queries) | $1.50 |
| Voice (Whisper, 10K queries) | $5.00 |
| **TOTAL Production** | **$51.50/month** |

---

## 4. Cost per Search

| Scale | Total Cost | Cost per Search |
|-------|-----------|-----------------|
| MVP (1K searches) | $0.00 | **$0.000** |
| Phase 3 (1K searches) | $0.65 | **$0.00065** |
| Production (10K searches) | $51.50 | **$0.00515** |

---

## 5. Cost Optimization Strategies

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| Use free tiers | 100% | Vercel Free + Supabase Free |
| Cache aggressively | 30-50% | 5-min in-memory cache, CDN for images |
| Regex over LLM | 99% | Rule-based NLP for MVP |
| Local models (Ollama) | 100% on LLM | Self-hosted, no API costs |
| Batch scraping | 20% | Single Playwright session, multiple pages |

---

## 6. Budget Justification

> **For a stage/academic project with zero budget:**
>
> - MVP runs entirely on free tiers (Vercel + fallback dataset)
> - No paid services required for demo
> - LLM/Voice costs are optional and scale with usage
> - At 1,000 searches/month, total cost is **under $1/month** even with LLM
