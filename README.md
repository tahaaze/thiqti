# SLEIPNIR

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

AI-powered vehicle search engine for the Moroccan market. Aggregates listings from multiple sources, ranks them using TOPSIS multi-criteria matching, and provides e-reputation scores per vehicle model.

## Quick Start

```bash
git clone https://github.com/your-org/thiqti.git
cd thiqti
npm install
npm run dev
```

Open `http://localhost:3000`. That's it.

## Architecture

```
User Query ──▶ NLP Parser ──▶ TOPSIS Ranker ──▶ Results
                    │                │
                    ▼                ▼
           SearchCriteria     Multi-criteria weights
           (body, fuel,       (price, year, km,
            budget, year,      fuelMatch, bodyMatch)
            intent...)
```

- **NLP Engine**: Rule-based regex + dictionaries for French/Arabic query parsing (body type, fuel, brand, budget, city, intent)
- **Matching Engine**: TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) with intent-aware weighting (economique, familial, confort, sportif)
- **Data Aggregator**: Fetches from multiple sources, deduplicates, scores, and caches results (5min TTL)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 3.4 |
| Backend API | Next.js API Routes |
| AI Service | Python / FastAPI (optional) |
| Database | PostgreSQL 16 + pgvector (optional for Phase 1) |
| Data Collection | Playwright |
| Icons | lucide-react |
| Monorepo | npm workspaces |

## Project Structure

```
thiqti/
├── apps/
│   ├── web/          # Next.js 15 app (frontend + API routes)
│   ├── api/          # NestJS API (Phase 2)
│   └── ai/           # Python FastAPI (reputation analysis)
├── packages/
│   └── database/     # PostgreSQL schema + seeds
├── docs/
│   ├── ADRs/         # Architecture Decision Records
│   └── architecture/ # C4 models, deployment, security
├── docker-compose.yml
└── package.json      # Monorepo root
```

## Data Sources

| Source | Type | Status |
|--------|------|--------|
| Auto24.ma | API | Active |
| SoeezAuto.ma | Scraping | Active |
| Avito.ma | Scraping | Active |
| Moteur.ma | SPA | Removed (not scrapable) |
| OVoiture.ma | SPA | Removed (not scrapable) |
| Fallback Dataset | Static JSON | 80+ vehicles, Moroccan market |

## API Endpoints

### `GET /api/search?q=...`

Natural language vehicle search. Returns ranked results with match explanations.

**Parameters:**
- `q` (string) — Search query in French (e.g., "SUV diesel sous 200000 DH à Casablanca")

**Response:**
```json
{
  "results": [{ "id", "title", "make", "model", "year", "price", "score", "matchPercent", "explanations", ... }],
  "total": 42,
  "criteria": { "carrosserie", "motorisation", "budgetMax", ... },
  "sources": { "Auto24": 25, "SoeezAuto": 12, "Fallback": 80 }
}
```

### `GET /api/reputation?make=...&model=...`

Get e-reputation score for a vehicle model.

**Parameters:**
- `make` (string) — e.g., "Toyota"
- `model` (string) — e.g., "Corolla"

**Response:**
```json
{
  "modelKey": "toyota_corolla",
  "totalReviews": 35,
  "avgScore": 78,
  "categories": [{ "name": "Confort", "score": 82 }, ...],
  "excerpts": [{ "text": "...", "sentiment": "positive", "score": 8 }],
  "volume": { "total": 35, "positive": 20, "negative": 5, "neutral": 10 }
}
```

### `POST /api/reputation`

Submit a new review for a vehicle model.

**Body:**
```json
{
  "make": "Toyota",
  "model": "Corolla",
  "text": "Excellent véhicule familial",
  "score": 8,
  "sentiment": "positive"
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | No | App base URL (default: localhost:3000) |
| `DATABASE_URL` | No | PostgreSQL connection string (Phase 2) |
| `AUTO24_API_KEY` | No | Auto24 API key (if available) |

Phase 1 works without any environment variables.

## Development

```bash
npm run dev          # Start all apps (web + api + ai) via concurrently
npm run build        # Build web app + copy static assets
npm run lint         # Lint web + api
npm run docker:up    # Start PostgreSQL + Redis + MeiliSearch
npm run docker:down  # Stop containers
```

### Docker (Optional)

```bash
docker-compose up -d    # PostgreSQL 16 (pgvector), Redis, MeiliSearch
```

## Deployment

**Primary**: Vercel (auto-deploy on push to `main`)

```bash
vercel --prod    # Manual production deploy
```

**Alternative**: Docker

```bash
docker build -t sleipnir .
docker run -p 3000:3000 sleipnir
```

## Contributing

1. Create a feature branch from `main`
2. Make changes with `npm run lint` passing
3. Open a PR — Vercel generates a preview URL automatically

## License

MIT
