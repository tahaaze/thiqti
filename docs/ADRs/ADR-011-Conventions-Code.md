# ADR-011: Conventions de Code

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Adam Chouikh, Mohamed Taha Ait Ouahammi
**Réf**: VV-SLP-2026-001

## Contexte

Deux développeurs travaillent sur le même codebase. Des conventions claires évitent les conflits et maintiennent la lisibilité.

## Décision

### Formatage

| Règle | Outil |
|-------|-------|
| Indentation | 2 espaces |
| Quotes | Guillemets simples (') |
| Semicolons | Non |
| Trailing commas | Toujours |
| Line width | 100 chars |

### Structure fichiers

```
apps/web/src/
  app/
    page.tsx              -- Page racine
    layout.tsx            -- Layout global (Navbar)
    results/page.tsx      -- Page résultats
    vehicle/[slug]/page.tsx -- Fiche véhicule
    api/
      search/route.ts     -- API recherche
      reputation/route.ts -- API réputation
  components/
    CarImage.tsx          -- Composant image véhicule
    Toast.tsx             -- Système de toast
    Modal.tsx             -- Composant modal
  lib/
    nlp.ts                -- Moteur NLP
    matching.ts           -- Moteur matching
    car-search.ts         -- Recherche legacy
    sources/
      types.ts            -- Types unifiés
      aggregator.ts       -- Agrégateur multi-sources
      auto24.ts           -- Source Auto24
      soeezauto.ts        -- Source SoeezAuto
      fallback.ts         -- Dataset fallback
      moteur.ts           -- Source Moteur (inactive)
      ovoiture.ts         -- Source O'Voiture (inactive)
```

### Naming

| Élément | Convention |
|---------|-----------|
| Composants React | PascalCase (`CarImage`) |
| Fonctions | camelCase (`parseQuery`) |
| Types/Interfaces | PascalCase (`SearchCriteria`) |
| Constantes | UPPER_SNAKE (`MOROCCAN_CARS`) |
| Fichiers | kebab-case (`car-search.ts`) |
| CSS classes | Tailwind utility-first |

### Règles TypeScript

- `strict: true` obligatoire
- Pas de `any` sauf casts explicites `(car as any).bodyType`
- Toutes les fonctions exportées ont des types de retour explicites
- Interfaces préférées aux types pour les objets

### Git

| Règle | Valeur |
|-------|--------|
| Branches | `feature/`, `fix/`, `chore/` |
| Commits | Conventionnels: `feat:`, `fix:`, `chore:` |
| Pas de tiret cadratin (--) | Vérifié par recherche automatisée |

## Conséquences

- Le lint automatique (ESLint) applique ces règles
- Le `typecheck` TypeScript vérifie la cohérence des types
- Les deux développeurs peuvent contribuer sans conflits de style
