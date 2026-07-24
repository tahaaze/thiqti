# ADR-005: Sources de Données et Collecte

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Mohamed Taha Ait Ouahammi, Adam Chouikh
**Réf**: VV-SLP-2026-001, §7.3

## Contexte

La plateforme a besoin de données automobiles marocaines en temps réel. Les sources potentielles incluent des sites d'annonces, des sites de prix neuf, et un dataset de référence.

## Décision

### Sources activées (Phase 1)

| Source | Type | Méthode | Statut | Volume |
|--------|------|---------|--------|--------|
| Données Maroc (fallback) | Référence | Dataset statique TS | **Actif** | 80+ véhicules |
| Auto24.ma | Occasions | API REST | **Actif** | ~70 annonces |
| SoeezAuto.ma | Prix neuf | Scraping HTML | **Partiel** | ~35 marques |
| Moteur.ma | Annonces | Scraping SPA | **Inactif** | 157K (inaccessible) |
| O'Voiture | Argus | Scraping SPA | **Inactif** | Prices only |

### Architecture d'agrégation

```
src/lib/sources/aggregator.ts
  ├── Auto24Collector      → fetch() API REST
  ├── SoeezAutoCollector   → fetch() HTML parsing
  ├── FallbackDataset      → getFallbackCars() (statique)
  └── Dedup + Cache 5min
```

### Déduplication

Clé: `{make}_{model}_{year}_{price}` (normalisée lowercase)
- Si collision: priorité au km le plus bas
- Si collision Auto24/Moteur: merge images

### Cache

- In-memory Map avec TTL de 5 minutes
- Reset au redémarrage du serveur

## Conformité légale (§7.3)

| Source | Robots.txt | ToS | Risque | Décision |
|--------|-----------|-----|--------|----------|
| Auto24.ma | Non vérifié | Non vérifié | Faible (API publique) | Accepté Phase 1 |
| SoeezAuto.ma | Non vérifié | Non vérifié | Faible (données publiques) | Accepté Phase 1 |
| Moteur.ma | SPA, non scrapable | N/A | Bloqué techniquement | Reporté Phase 2 (Playwright) |

## Conséquences

- **Positif**: Pas de dépendance externe critique (fallback couvre toujours)
- **Négatif**: Le dataset fallback est statique, pas de prix temps réel
- **Phase 2**: Playwright pour sites SPA, auto-refresh quotidien (§7.3)
