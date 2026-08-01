# ADR-011: Conventions de Code

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Thiqti est developpe par une equipe de 3 personnes. Des conventions claires sont necessaires pour maintenir la coherence du code et permettre les revues croisees.

## Options Considerees

### Option A (rejetee): ESLint + Prettier + Biome (outillage multiple)

- **Avantages**: Couverture large, formatage automatique, regles personnalisees
- **Inconvenients**: Outils multiples, conflits de regles, configuration complexe
- **Motif du rejet**: Trop d'outils pour une equipe de 3; chaque outil ajoute de la friction sans gain proportionnel

### Option B (rejetee): Aucune convention (libere totale)

- **Avantages**: Zero friction, zero configuration
- **Inconvenients**: Code incoherent, revues difficiles, dette technique
- **Motif du rejet**: Impossible pour une equipe de 3 personnes de maintenir la coherence sans regles explicites; les revues de code deviennent un enfer

### Option C (retenue): Conventions explicites + ESLint minimal

- **TypeScript**: Strict mode, pas de `any`, pas de `@ts-ignore`
- **Imports**: Tri alphabetique, pas de `*` wildcard
- **Noms**: camelCase variables/fonctions, PascalCase classes/types, kebab-case fichiers
- **Tests**: Pas de tests unitaires obligatoires en Phase 1 (projet en exploration)
- **Commits**: Pas de convention stricte (pas de commitlint en Phase 1)
- **Lint**: ESLint avec regles minimales (no-unused-vars, no-console interdit sauf `console.log` explicite)

## Decision

Conventions explicites documentees + ESLint minimal, sans outillage lourd.

## Consequences

- **Positif**: Zero friction outillage, conventions claires, revues rapides
- **Negatif**: Pas d'enforcement automatique pour les conventions de nommage (revue manuelle)
- **Risque**: Les conventions peuvent etre ignorees si pas rappelees en revue; mitigation: ajouter un fichier CONTRIBUTING.md
