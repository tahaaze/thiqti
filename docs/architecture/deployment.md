# Thiqti — Architecture de Deploiement

**Ref**: VV-SLP-2026-001  
**Date**: 2026-07-29  
**Status**: Active

---

## 1. Diagramme de Deploiement (Phase 1)

```mermaid
graph TB
    subgraph "Utilisateurs"
        U1[" Navigateur"]
        U2[" Mobile Navigateur"]
    end

    subgraph "Vercel (Hebergement Principal)"
        direction TB
        VER[Next.js 15 App]
        VER --> APP["Pages<br>/ /results /vehicle /compare"]
        VER --> API["API Routes<br>/api/search<br>/api/reputation"]
        VER --> STATIC["Assets statiques<br>/_next/static/*"]
    end

    subgraph "Couche Donnees"
        direction TB
        CACHE[("Cache In-Memory<br>TTL 10min + cache disque")]
        CATALOG["Agregateur 7 sources live<br>Autera, Moteur, ElectroDrive,<br>AutoHall, Auto24, Avito, Moteur-Neuf"]
        FALLBACK["Fallback offline<br>196 vehicules demo<br>(secours uniquement)"]
    end

    subgraph "Services Externes"
        CDN["Google CDN<br>Images vehicules"]
    end

    subgraph "Monitoring"
        LOGS["Logs<br>console.log"]
    end

    U1 -->|HTTPS| VER
    U2 -->|HTTPS| VER
    API --> DB
    API --> CACHE
    CRON --> A24
    CRON --> SZ
    CRON -->|Fallback| FB
    SSR --> CDN
    API --> LOGS
    API --> METRICS
```

---

## 2. Matrice d'Environnements

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| URL | `localhost:3000` | `thiqti-staging.vercel.app` | `thiqti.vercel.app` |
| Branch | `fix/cdc-compliance` | `develop` | `main` (tagged) |
| Node | 20.x | 20.x | 20.x |
| Base de donnees | Sources live + fallback secours | Sources live + fallback secours | Sources live + fallback secours |
| Cache | In-memory TTL 10min + cache disque | In-memory TTL 10min + cache disque | In-memory TTL 10min + cache disque |
| SSL | None (local) | Vercel auto | Vercel auto |
| Collecte donnees | Auto (sources live, a la demande) + fallback secours | Auto (sources live) + fallback secours | Auto (sources live) + fallback secours |
| Logs | Console | Vercel Function Logs | Vercel Function Logs |
| CDN | Local /public | Google CDN | Google CDN |

---

## 3. Gestion des Secrets

### Variables d'Environnement Requises

| Secret | Usage | Source |
|--------|-------|--------|
| `GOOGLE_API_KEY` | Google Custom Search (images) | Google Cloud Console |
| `GOOGLE_CX` | Google Custom Search Engine ID | Google Cloud Console |
| `DB_PASSWORD` | Mot de passe PostgreSQL | Defini par l'equipe (optionnel Phase 1) |

### Regles de Secrets

1. **Ne jamais** commit `.env*` fichiers (`.gitignore` enforce)
2. Utiliser `.env.example` comme template (commit)
3. Copier vers `.env` avec valeurs reelles (gitignore)
4. Faire tourner les cles API si compromise
5. Utiliser Vercel Environment Variables (chiffrees au repos) en production

---

## 4. SSL & Security Headers

```typescript
// next.config.ts — Security Headers
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' https://*.googleapis.com https://*.gstatic.com data:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" },
];
```

- **SSL**: Automatic via Vercel (Let's Encrypt)
- **HSTS**: Enabled with 2-year max-age
- **CSP**: Restrictive policy, images from Google CDN only

---

## 5. Monitoring & Observability

### Phase 1 (MVP)

| Layer | Tool | Purpose |
|-------|------|---------|
| Application logs | `console.log` structured | `[Sources]`, `[NLP]`, `[Matching]` tags |
| Error logs | `console.error` | Stack traces |
| Metrics endpoint | `/api/metrics` | Real-time counters |
| Uptime | Vercel Dashboard | Built-in |

### Phase 2 (Post-MVP)

| Layer | Tool | Purpose |
|-------|------|---------|
| APM | Vercel Analytics | Web Vitals, response times |
| Error tracking | Sentry | Error grouping, alerts |
| Database | Supabase Dashboard | Query performance, storage |

### Metrics Collected

```typescript
interface Metrics {
  totalSearches: number;        // Total search requests
  avgResponseTimeMs: number;    // Average /api/search latency
  sourceStats: Record<string, number>;  // { auto24: 70, fallback: 80 }
  topQueries: string[];         // Last 10 queries
  errorCount: number;           // Total errors
}
```

---

## 6. CI/CD Pipeline

```mermaid
gitgraph
    commit id: "feat: new feature"
    branch develop
    checkout develop
    commit id: "lint + typecheck pass"
    checkout main
    merge develop id: "PR merged"
    commit id: "Vercel auto-deploy → Production"
```

### Pipeline Steps

| Step | Tool | Command |
|------|------|---------|
| 1. Lint | ESLint | `npm run lint` |
| 2. Typecheck | tsc | `npm run typecheck` |
| 3. Test | Vitest | `npm run test` |
| 4. Build | Next.js | `npm run build` |
| 5. Deploy | Vercel | Auto on push to `main` |

### Deployment Trigger

- **Production**: Push/merge to `main` branch
- **Preview**: Any PR (Vercel generates preview URL)
- **Manual**: `vercel --prod` CLI

---

## 7. Rollback Strategy

| Scenario | Action |
|----------|--------|
| Bad deploy | Vercel instant rollback to previous deployment |
| DB migration failure | Restore from Supabase daily backup |
| Scraper broken | Disable cron, use fallback dataset |

---

## 8. Scaling Considerations (Phase 2+)

| Load Level | Action |
|------------|--------|
| 100 searches/day | No change (free tier) |
| 1000 searches/day | Upgrade Vercel Pro ($20/mo) |
| 10,000 searches/day | Add Supabase Pro ($25/mo), CDN cache |
| 50,000+ searches/day | Edge functions, Redis cache, DB read replicas |
