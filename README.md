# SLEIPNIR

![Status](https://img.shields.io/badge/status-active-brightgreen)

Plateforme IA d'achat et de vente automobile au Maroc. Moteur de recherche en langage naturel (français et darija), matching multicritère TOPSIS, baromètre d'e-réputation.

## Quick Start

```bash
git clone https://github.com/your-org/thiqti.git
cd thiqti
npm install
npm run dev
```

Ouvrir `http://localhost:3000`. Aucune inscription requise.

## Architecture

```
Requête utilisateur ──▶ NLP Parser ──▶ Data Aggregator ──▶ TOPSIS Ranker ──▶ Résultats
(français/darija)     (critères)      (sources multiples)  (poids contextualisés)

Baromètre d'e-réputation ──▶ Pipeline sentiment ──▶ Score /10 + Tags + Fiabilité
```

- **NLP Engine**: Rule-based + dictionnaires français/darija/arabizi (carrosserie, motorisation, budget, marque, ville, intention)
- **Matching Engine**: TOPSIS avec pondération contextuelle (économique, familial, confort, sportif) + explicabilité
- **Baromètre**: Score /10, tags positifs/négatifs, intervalle de fiabilité, seuil de publication à 30 avis
- **Collecte**: Multi-sources (Auto24.ma, Avito.ma, SoeezAuto), déduplication, cache 5min

## Stack Technique

| Couche | Technologie |
|--------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 3.4 |
| API | Next.js API Routes |
| Matching | TOPSIS multi-critère |
| NLP | Regex + dictionnaires FR/Darija |
| Data | Playwright, sources Auto24/Avito |
| Icons | lucide-react |
| Infra | Docker, PostgreSQL 16 + pgvector |

## Structure

```
thiqti/
├── apps/
│   ├── web/          # Next.js 15 (frontend + API routes)
│   ├── api/          # NestJS API (Phase 2)
│   └── ai/           # Python FastAPI (reputation, Phase 2)
├── packages/
│   └── database/     # Schéma PostgreSQL + seeds
├── docs/
│   ├── ADRs/         # Architecture Decision Records
│   └── architecture/ # Modèles C4, déploiement, sécurité
```

## Périmètre MVP

- Barre de recherche unique en langage naturel (texte + vocal)
- Compréhension français et darija
- Matching multicritère avec explication
- Fiche véhicule complète
- Baromètre d'e-réputation avec seuil de fiabilité
- Comparateur côte à côte (3 véhicules)
- Favoris (stockage local)
- Responsive mobile/desktop
