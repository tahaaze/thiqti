# Audit de Conformite CDC — Thiqti

**Date**: 2026-07-31
**Branche**: `fix/cdc-compliance`
**Objectif**: Verifier que le projet respecte le Cahier des Charges VV-SLP-2026-001 et identifier les erreurs restantes.

---

## 1. Contexte Projet

- **Produit**: Thiqti — moteur de recommandation automobile au Maroc
- **Phase 1**: Recherche langage naturel (FR/AR) + matching TOPSIS sur 196 vehicules neufs
- **Stack**: Next.js 15 App Router, TypeScript strict, Tailwind, auth JWT+bcrypt
- **Historique**: Projet renomme de SLEIPNIR a Thiqti; scope reduit du neuf+occasion multi-sources au neuf uniquement

---

## 2. Exigences CDC et Etat

| # | Exigence | Statut | Remarques |
|---|----------|--------|-----------|
| 1 | Pas de secrets hardcodes (cles API, mots de passe) | Fait (sauf historique git) | Google API key encore visible dans git log — REVOQUER |
| 2 | Entites DB alignees sur schema (pas de champs occasion) | Fait | `vehicle.entity.ts` reecrit |
| 3 | Documentation architecture (C4, sequence, OpenAPI, deploiement) | Fait | 4 fichiers a jour |
| 4 | 11 ADRs format MADR, 2+ options rejetees | Fait | 11 ADRs reformates |
| 5 | Formalisation methode TOPSIS | Fait | ADR-004 + c4-models |
| 6 | Strategie collecte donnees documentee + licite | Fait | ADR-005 + data-register; collecte automatisee desactivee |
| 7 | Securite (STRIDE, OWASP, injection prompts) | Fait | security.md reecrit |
| 8 | Documentation projet (README, CHANGELOG, conventions) | Fait | Renommage SLEIPNIR->Thiqti |

---

## 3. Points d'attention / Erreurs possibles a verifier

### 3.1 CORRIGE pendant l'audit (2026-07-31)

| # | Probleme | Fichiers | Action |
|---|----------|----------|--------|
| A | **Collecteurs orphelins dans le repo** | `auto24.ts`, `avito.ts`, `soeezauto.ts`, `ovoiture.ts`, `moteur.ts` | **SUPPRIMES** (non importes, referenciaient occasion/scraping) |
| A2 | **car-search.ts appelait encore l'API Auto24** | `apps/web/src/lib/car-search.ts` | **SUPPRIME** (orphelin, fallback occasion avec km, score) |
| D | **package.json root casse** | root `package.json` | **CORRIGE**: `npm run dev` ne lance plus que `apps/web` (api/ai retires) |

### 3.2 A CORRIGER (reste)

| # | Probleme | Fichiers | Action |
|---|----------|----------|--------|
| B | **Google API key compromise** | Historique git (commits `9a1c1a1`, `fb59fcc`) | **REVOQUER** dans Google Cloud Console (retiree du code mais visible dans git log) |
| C | **NestJS API ne compile pas** | `apps/api/src/...` | Erreur preexistante `Cannot find module 'lodash/toArray'`. Independante du CDC mais bloque le build root et CI |
| E | **apps/api pas de script "dev"** | `apps/api/package.json` | Le workspace existe mais sans script dev (utilise nest build/start) |
| F | **Fichier README quick start** | README.md | Dit `cp .env.example .env` mais le repo a deja un `.env.example` — verifier que les instructions correspondent a la realite |
| G | **docker-compose.yml** | root | Verifier que `${DB_PASSWORD:-postgres}` est coherent avec .env.example (`changeme`) |

### 3.3 A VERIFIER (potentiellement hors CDC)

| # | Question | Fichiers |
|---|----------|----------|
| H | Le site affiche encore des sections B2B / concessionnaires ? | `apps/web/src/app` — **VERIFIE: plus de pages B2B** |
| I | Des references "occasion" persistent dans l'UI ? | grep `occasion` — **VERIFIE: plus aucune (fichiers supprimes)** |
| J | La page /compare utilise encore des vehicules occasion ? | apps/web/src/app/compare |
| K | Le composant `CarImage` depend-il de Google API toujours ? | apps/web/src/components |
| L | Les calculs de financement (calculateur 24/36/48 mois) sont-ils dans le scope CDC ? | apps/web/src/lib |
| M | Le dossier `m3-startup/` et `dossier-soutenance.md` utilisent encore SLEIPNIR — historique OK ? | docs/ |

---

## 4. Inventaire des Fichiers (branche fix/cdc-compliance)

### 4.1 Crees (13)

| Fichier | Contenu |
|---------|---------|
| `.env.example` | Template toutes variables d'env |
| `apps/web/src/lib/auth.ts` | verifySession, createSession, hashPassword, JWT |
| `apps/web/src/app/api/auth/login/route.ts` | POST /api/auth/login |
| `apps/web/src/app/api/auth/logout/route.ts` | POST /api/auth/logout |
| `apps/web/src/app/api/auth/me/route.ts` | GET /api/auth/me |
| `apps/web/src/app/login/page.tsx` | Page login admin |
| `apps/web/scripts/generate-password-hash.ts` | Script hash bcrypt CLI |
| `docs/architecture/openapi.yaml` | Contrat OpenAPI 3.1 |
| `docs/ADRs/ADR-002-Architecture-Donnees.md` | MADR dataset statique |
| `docs/ADRs/ADR-005-Sources-Donnees.md` | MADR strategie collecte |

### 4.2 Modifies (24+)

| Fichier | Changement principal |
|---------|----------------------|
| `apps/web/src/lib/sources/aggregator.ts` | Supprime collecteurs, fallback only |
| `apps/web/src/lib/sources/fallback.ts` | 196 vehicules neufs, km=0 |
| `apps/api/src/vehicles/vehicle.entity.ts` | Aligne sur schema (champs neufs) |
| `apps/api/src/vehicles/create-vehicle.dto.ts` | Aligne entite |
| `apps/api/src/vehicles/search-vehicles.dto.ts` | Retire km |
| `apps/api/src/vehicles/vehicles.service.ts` | Retire km |
| `apps/api/src/app.module.ts` | Retire fallback password |
| `apps/web/scripts/fetch-images.ts` | Google API key -> env |
| `docker-compose.yml` | Secrets -> env vars |
| `apps/web/package.json` | +bcryptjs, +jose |
| `README.md` | Renommage + Phase 1 |
| `CHANGELOG.md` | Historique a jour |
| `RUNBOOK.md` | Phase 1 + auth |
| `.github/workflows/ci.yml` | Renommage |
| `docs/architecture/c4-models.md` | Phase 1 + sequence budget |
| `docs/architecture/deployment.md` | Phase 1 |
| `docs/architecture/security.md` | STRIDE/OWASP/prompts |
| `docs/architecture/data-register.md` | Traitements conformes |
| `docs/architecture/testing.md` | Phase 1 |
| `docs/architecture/cost-model.md` | $0/mois Phase 1 |
| 11x `docs/ADRs/*.md` | Format MADR + options rejetees |

### 4.3 Supprimes (2)

| Fichier | Raison |
|---------|--------|
| `docs/ADRs/ADR-002-Architecture-Données.md` | Remplacé (accent) |
| `docs/ADRs/ADR-005-Sources-Données.md` | Remplacé (accent) |

### 4.4 Non modifie (historique)

- `docs/m3-startup/*` — Docs concours startup (SLEIPNIR)
- `docs/dossier-soutenance.md` — Doc soutenance generee
- `apps/api/` — erreur lodash preexistante

---

## 5. Points CDC Verifies par la Documentation

### 5.1 Secrets
- `GOOGLE_API_KEY` retiree de fetch-images.ts -> `process.env.GOOGLE_API_KEY`
- `DB_PASSWORD` sans fallback dans app.module.ts
- docker-compose utilise `${VAR:-default}`
- `.env.example` commite sans valeurs reelles (tout = changeme)
- **RESTE**: key visible dans git history

### 5.2 Entites
- `vehicle.entity.ts`: plus de km/color/engine/doors/score/dealer_id/is_active
- Ajouts: trim, body_type, fuel_type, price_mad, price_old_mad, power_ch, consumption_l100, co2_gkm, accel_0_100, trunk_liters, dimensions mm

### 5.3 Architecture
- C4 contexte Phase 1 (fallback only)
- Sequence critique avec budget <500ms documentee
- OpenAPI 3.1: /api/search, /api/reputation, /api/auth/*

### 5.4 ADRs — 11 sujets
1. Stack technique
2. Architecture donnees
3. Strategie NLP
4. Matching multicritere (TOPSIS)
5. Strategie collecte
6. Barometre reputation
7. Securite
8. Deploiement
9. Observabilite
10. CI/CD
11. Conventions code

### 5.5 TOPSIS
- Methode formelle: distances ideale/anti-ideale, normalisation, ponderation
- Documentee ADR-004 + c4-models.md

### 5.6 Collecte
- Dataset statique manuel = seule source (conforme loi 09-08)
- Scraping Auto24/Avito/SoeezAuto DESACTIVE dans aggregator
- ADR-005 documente l'arbitrage

### 5.7 Securite
- STRIDE complet
- OWASP A01-A10 revu
- Prompt injection (parser regex ne traite pas de commandes)
- Auth: bcrypt 12 rounds, JWT HS256, cookie httpOnly secure sameSite strict

### 5.8 Docs
- README: phase 1, auth, structure
- CHANGELOG: [Unreleased] complet
- RUNBOOK: ops a jour
- Zero tiret cadratin dans code/docs/commits (verifie)

---

## 6. Commande pour Relancer

```bash
# Le serveur web (workspace fonctionnel)
npm run dev
# URL: http://localhost:3000
```

```bash
# Verification TypeScript
npm run typecheck -w apps/web
```

---

## 7. Recommandations Prioritaires

1. **Revoquer** la Google API key (action utilisateur, Google Cloud Console)
2. ~~Supprimer les collecteurs orphelins~~ — **FAIT**
3. ~~Corriger package.json root~~ — **FAIT** (`npm run dev` lance uniquement apps/web)
4. **Installer** `lodash` dans apps/api pour resoudre le build (erreur preexistante)
5. **Verifier** les pages restantes: compare, CarImage, calculatrice financement (points J, K, L)

---

## 8. Erreurs Detectees et Corrigees (journal)

| Date | Erreur | Correction |
|------|--------|------------|
| 2026-07-31 | 5 fichiers collecteurs (auto24, avito, soeezauto, ovoiture, moteur) encore dans le repo bien que desactives | Fichiers supprimes |
| 2026-07-31 | `car-search.ts` appelait encore l'API Auto24 avec fallback occasion (km, score) | Fichier supprime |
| 2026-07-31 | `npm run dev` root echouait (apps/ai absent, apps/api sans script dev) | Script dev root simplifie a `apps/web` |
| 2026-07-31 | 2 ADRs avec accents dans les noms de fichiers | Renommes sans accents |
| 2026-07-31 | typecheck apres suppression | **0 erreur** |
