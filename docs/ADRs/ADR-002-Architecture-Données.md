# ADR-002: Architecture Données

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Mohamed Taha Ait Ouahammi, Adam Chouikh
**Réf**: VV-SLP-2026-001

## Contexte

La plateforme doit stocker des véhicules, des avis utilisateurs, des scores de réputation, et supporter la recherche full-text + vectorielle.

## Décision

### Schéma principal (Phase 1)

```sql
vehicles          -- Véhicules (80+ fallback + Auto24 + SoeezAuto)
  id UUID PK
  make, model, year, trim, body_type, fuel_type, transmission
  price_mad INT, km INT
  image_url TEXT
  embedding vector(1536)   -- prêt pour Phase 2
  search_vector tsvector   -- FTS PostgreSQL

reviews           -- Avis bruts
  id UUID PK, vehicle_id FK
  rating REAL, body TEXT, sentiment
  source VARCHAR

reputation_scores -- Scores agrégés (materialisés)
  vehicle_id FK UNIQUE
  avg_rating, total_reviews, reliability
  top_pros[], top_cons[]
```

### Stratégie Phase 1 vs Phase 2

| Aspect | Phase 1 (actuel) | Phase 2 |
|--------|-----------------|---------|
| Stockage | JSON en mémoire + fallback TS | PostgreSQL persistant |
| Recherche | FTS PostgreSQL (tsvector) | pgvector + MeiliSearch |
| Auth | LocalStorage | Supabase Auth |
| Requêtes vectorielles | Non utilisées | Embeddings 1536d |

### Données initiales (fallback)

Dataset de 80+ véhicules couvrant le marché marocain:
- 20+ marques (Dacia, Renault, Peugeot, Toyota, Hyundai, Kia, VW, BMW, Mercedes, BYD, MG...)
- Prix en DH, villes marocaines, motorisations variées
- Source: `apps/web/src/lib/sources/fallback.ts`

## Conséquences

- Le schéma est conçu pour évoluer vers PostgreSQL sans migration lourde
- Le champ `embedding vector(1536)` est prêt mais pas encore alimenté
- Les reviews sont simulées en Phase 1 (génération déterministe par seed)
