# Changelog

Toutes les modifications notables de SLEIPNIR.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added
- 11 documents ADR (Architecture Decision Records) pour M2
- Composant `CarImage` avec placeholder Marque (couleur + initiales + icone)
- Page fiche véhicule avec onglets Caractéristiques / Réputation / Offres
- Baromètre d'e-réputation avec seuil de 30 avis, volume, répartition, categories
- API `/api/reputation` pour les données de réputation
- Système de favoris (localStorage)
- Système de Toast et Modal
- Calculateur de financement (24/36/48 mois)
- Filtres IA affinables (carrosserie, motorisation, budget, année, km, marque, ville)
- Explicabilité par résultat (bouton "Pourquoi ce résultat ?")
- Badges "Hors budget" et "% match"

### Fixed
- TOPSIS: correction du bug NaN (normalisation sur toutes les voitures)
- Budget: application des bornes inférieures ET supérieures avec tolérance
- Body matching: utilisation de `bodyType` via cast explicite
- Résultats: filtrage hiérarchique (body+fuel > budget > top 10)
- Recherche multi-mots: chaque mot est matché indépendamment

### Changed
- Images fallback: ajout de 66 URLs autoevolution CDN pour tous les véhicules du dataset marocain

### Removed
- Toutes les références picsum.photos (remplacées par autoevolution CDN + placeholders Marque)
- MoteurCollector et OVoitureCollector (sites SPA, non scrapables en HTTP)
- Auth Supabase (Phase 1: localStorage uniquement)
- MeiliSearch (Phase 1: PostgreSQL FTS uniquement)
- Module NestJS dealers/favorites
- Pages B2B (concessionnaires, dashboard)

## [0.1.0] - 2026-07-17

### Added
- Structure monorepo (apps/web, apps/api, apps/ai, packages/database)
- Moteur NLP rule-based (regex + dictionnaires)
- Moteur de matching TOPSIS avec explicabilité
- Agrégateur multi-sources (Auto24, SoeezAuto, Fallback)
- Dataset fallback 80+ véhicules marché marocain
- Page de recherche avec grille/liste
- Schéma PostgreSQL avec pgvector
