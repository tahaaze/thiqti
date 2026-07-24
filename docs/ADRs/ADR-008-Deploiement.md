# ADR-008: Déploiement et Infrastructure

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Mohamed Taha Ait Ouahammi, Younes Boumalek
**Réf**: VV-SLP-2026-001, §9.4

## Contexte

Le MVP doit être déployé en production avec HTTPS pour la démo finale (M5, 13 août).

## Décision

### Phase 1: Vercel (recommandé)

| Aspect | Choix |
|--------|-------|
| Plateforme | Vercel (gratuit pour projets open-source/non-commercial) |
| Build | `next build` + output standalone |
| Domaine | Nom de domaine temporaire ou IP Vercel |
| SSL | Automatique via Vercel |
| Variables d'env | Vercel Dashboard |

### Docker (alternatif local)

```yaml
# docker-compose.yml
services:
  web:
    build: .
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
  api:
    build: ./apps/api
    ports: ["3001:3001"]
  ai:
    build: ./apps/ai
    ports: ["8000:8000"]
```

### Structure de déploiement

```
Production (M5)
  └── apps/web (Next.js standalone)
       ├── /api/search
       ├── /api/reputation
       ├── /results
       ├── /vehicle/[slug]
       └── / (landing page)
```

## Conséquences

- Vercel = zero-config pour Next.js, déploiement en 1 click
- Les API routes Next.js suffisent pour Phase 1 (pas besoin de NestJS en prod)
- Le Dockerfile existe pour un déploiement containerisé si nécessaire
