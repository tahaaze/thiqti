# ADR-002: Architecture des Donnees

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Thiqti doit stocker des donnees vehicules structures (neufs, occasion), des textes d'avis, des embeddings vectoriels, et des scores de matching.

## Options Considerees

### Option A (rejetee): Base documentaire MongoDB

- **Avantages**: Schema flexible, aggregation pipeline, passage a l'echelle horizontal
- **Inconvenients**: Pas de recherche plein texte native, pas de vectoriel, pas de jointures
- **Motif du rejet**: Impossible de faire du matching vectoriel + FTS + relations sans couche supplementaire

### Option B (rejetee): Supabase (PostgreSQL managé) avec Supabase Vector

- **Avantages**: pgvector integre, policies RLS, auth integree, interface web
- **Inconvenients**: Cout mensuel, verrouillage plateforme, limite de taille en phase 1
- **Motif du rejet**: Cout non justifie en Phase 1 (fallback dataset); sera reconsidere en Phase 2 si le catalogue depasse 1000 vehicules

### Option C (retenue): Dataset statique integre + PostgreSQL preparé

- **Phase 1**: Donnees dans le code TypeScript (`apps/web/src/lib/sources/fallback.ts`), 196 vehicules neufs
- **Phase 2**: Migration vers PostgreSQL 16 avec pgvector pour recherche vectorielle

## Decision

Dataset statique integre en Phase 1 (fichier TypeScript, 196 vehicules neufs). Migration PostgreSQL en Phase 2 si necessaire.

## Consequences

- **Positif**: Zero cout d'infrastructure DB en Phase 1, deploiement instantane, pas de migration a gerer
- **Negatif**: Pas de recherche plein texte avancee en Phase 1; les donnees sont figees jusqu'a la mise a jour manuelle
- **Risque**: Si le catalogue doit depasser 500 vehicules avant la Phase 2, la memoire Node.js sera insuffisante
