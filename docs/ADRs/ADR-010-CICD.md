# ADR-010: CI/CD

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Mohamed Taha Ait Ouahammi, Younes Boumalek
**Réf**: VV-SLP-2026-001

## Contexte

Le pipeline CI/CD doit garantir la qualité du code et automatiser le déploiement.

## Décision

### Phase 1: GitHub Actions (gratuit)

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  lint:
    - npm run lint (ESLint)
    - npm run typecheck (TypeScript strict)
  build:
    - npm run build
  test:
    - (aucun framework de test configuré en Phase 1)
```

### Checks obligatoires

| Check | Outil | Bloquant |
|-------|-------|----------|
| Lint | ESLint (next/core-web-vitals) | Oui |
| Type check | `tsc --noEmit` | Oui |
| Build | `next build` | Oui |
| Tests | (none Phase 1) | Non |

### Déploiement

| Environnement | Déclencheur | Action |
|---------------|-------------|--------|
| Preview | Pull request | Vercel Preview |
| Production | Push main | Vercel Production |

## Conséquences

- Le lint + typecheck bloquent les merges cassés
- Pas de tests unitaires en Phase 1 (reporté Phase 2)
- Le build vérifie que le code compile proprement
