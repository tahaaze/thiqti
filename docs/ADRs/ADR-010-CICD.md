# ADR-010: CI/CD

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Thiqti doit garantir la qualite du code avant deploiement: verification TypeScript, lint, build, et tests.

## Options Considerees

### Option A (rejetee): GitHub Actions custom (Docker build + tests + scan securite)

- **Avantages**: Controle total, etapes customisees, scan securite (Trivy)
- **Inconvenients**: Configuration complexe, temps d'execution long, cout compute
- **Motif du rejet**: Surdimensionne; les scans de securite sont inutiles sans base de donnees ni API externe

### Option B (rejetee): Husky + lint-staged + pre-commit hooks

- **Avantages**: Verification immediate avant commit, pas de boucle CI longue
- **Inconvenients**: Contournable (--no-verify), pas de verification centralisee, pas de gate de deploiement
- **Motif du rejet**: Ne remplace pas une CI; les developpeurs peuvent contourner les hooks; pas de trace des verifications

### Option C (retenue): GitHub Actions minimal + Vercel auto-deploy

- **CI**: `npm run typecheck` + `npm run lint` sur chaque PR (ubuntu-latest, Node 20)
- **CD**: Vercel auto-deploy sur chaque push (branche = preview, main = production)
- **Gate**: Pipeline CI doit passer pour merger; Vercel Checks bloque si build echoue

## Decision

GitHub Actions (typecheck + lint) comme gate de PR, Vercel auto-deploy pour le CD.

## Consequences

- **Positif**: Zero cout (GitHub Actions gratuit), deploiement automatique, gate de qualite minimal
- **Negatif**: Pas de tests end-to-end, pas de scan de securite automatise
- **Risque**: Si `npm run typecheck` echoue sur un commit non lie au changement, le developeur peut etre bloque; mitigation: `tsconfig.json` strict mais avec `skipLibCheck: true`
