# ADR-001: Stack Technique

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Adam Chouikh, Mohamed Taha Ait Ouahammi, Younes Boumalek
**Réf**: VV-SLP-2026-001

## Contexte

Le projet SLEIPNIR nécessite une stack technique capable de:
- Servir une interface web réactive (SPA/SSR)
- Exécuter des algorithmes NLP et de matching multicritère en temps réel
- Intégrer des sources de données multiples (scraping, API)
- Respecter le budget infrastructure d'un projet de stage (pas de services cloud coûteux)

## Décision

| Couche | Technologie | Justification |
|--------|------------|---------------|
| Frontend | Next.js 15 (App Router) + TypeScript strict + Tailwind CSS | SSR pour SEO, React 19, routing file-system, CSS utility-first |
| Backend API | Next.js API Routes (route handlers) | Monolithe simplifié, pas de service NestJS séparé pour Phase 1 |
| Backend AI | Python / FastAPI (optionnel, si modèle local requis) | NLP/statistiques en Python natif |
| Base de données | PostgreSQL 16 + pgvector | Recherche vectorielle + FTS natif, extension pgvector pour embeddings |
| Recherche texte | PostgreSQL FTS (pg_trgm + tsvector) | Évite dépendance MeiliSearch en Phase 1 |
| Cache | Mémoire en Node.js (Map + TTL 5min) | Suffisant pour MVP, évite Redis |
| Auth | LocalStorage (Phase 1) | Pas d'auth Supabase en Phase 1 |
| UI Components | lucide-react | Icônes légères, tree-shakeable |

## Conséquences

- **Positif**: Déploiement simple (un seul runtime Node.js), pas de coordination inter-services, debug facile
- **Négatif**: Le moteur NLP sera rule-based (regex) plutôt qu'un modèle LLM; la recherche vectorielle est prête (pgvector installé) mais pas encore utilisée
- **Risque**: Le scraping côté serveur peut être bloqué par les sites targets; mitigé par le dataset fallback
