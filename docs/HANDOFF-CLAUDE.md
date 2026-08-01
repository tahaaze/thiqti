# Passation Claude — Etat complet de la branche fix/cdc-compliance

**Date**: 2026-07-31
**Auteur**: session de mise en conformite CDC (P1 a P5)
**Objectif**: donner a un nouvel agent (Claude ou autre) le contexte complet de tout ce qui a ete fait, pour qu'il n'ait pas a tout redecouvrir.

---

## 1. Rappel du contexte

- **Produit**: Thiqti (renomme depuis SLEIPNIR), moteur de recommandation automobile au Maroc.
- **Phase 1**: recherche en langage naturel (FR/AR/darija) + matching TOPSIS sur 196 vehicules NEUFS uniquement (dataset statique, `km = 0`, aucune collecte automatisee).
- **Stack**: monorepo npm. `apps/web` = Next.js 15 (App Router), React 19, TypeScript strict, Tailwind, auth JWT (jose) + bcrypt (bcryptjs), cookie httpOnly. `apps/api` = NestJS 10 + TypeORM + PostgreSQL (compile et demarre, attend une DB). `apps/ai` = dossier FastAPI Python, PHASE 2, PAS un workspace npm.
- **Branche git active**: `fix/cdc-compliance`. Rien n'a encore ete commite pour P1 a P5 (working tree entier pret).
- **Regles du projet**: zero tiret cadratin dans code/docs/commits ; ne pas toucher `docs/m3-startup/` ni `docs/dossier-soutenance.md` ; perimetre vehicules neufs uniquement ; pas de scraping (loi 09-08).

---

## 2. P1 — Securite / secret expose : FAIT (sauf rotation)

**Incident INC-001**: la cle Google `AIzaSyAdlPEXkhqIHhQBxvqYu5_pHxMa6hPjcjY` a ete introduite dans `apps/web/scripts/fetch-images.ts` (commit `d751cd4`) et est encore visible dans l'historique git. Elle a ete retiree du code (le script lit desormais `process.env.GOOGLE_API_KEY`) mais la revocation doit etre faite a la main dans Google Cloud Console (action utilisateur, non verifiable depuis le code).

- `docs/SECURITY-INCIDENTS.md` cree : registre INC-001 complet + historique des scans de secrets.
- Scan complet realise : aucun autre secret (pas de cle OpenAI/AWS/GitHub/Slack, JWT, cle privee, chaine de connexion, `.env` commite).
- Exception documentee : la cle apparait volontairement dans `docs/SECURITY-INCIDENTS.md` et `docs/PROMPT-CLAUDE-AUDIT.md` (documentation).

---

## 3. P2 — Build apps/api reparable : FAIT

- Installe `lodash` + `@types/lodash` dans apps/api (corrige l'erreur preexistante `Cannot find module 'lodash/toArray'` qui bloquait le build).
- Supprime `apps/api/src/common/types.d.ts` : ce fichier shadowait les typings de class-validator (effacait `IsIn`, `IsNotIn`, `IsInt`...).
- `typeorm` + `pg` ajoutes aux devDependencies racine (non hoistes).
- `npm run typecheck` racine (web + api) : 0 erreur. `npm run build -w apps/api` : 0 erreur.
- L'API demarre jusqu'a `ECONNREFUSED` PostgreSQL (Docker non installe sur la machine).
- Script racine `dev:api` cree (`npm run start:dev -w apps/api`).
- `apps/ai` documente comme Phase 2 Python dans le README, pas associe au script dev racine.

---

## 4. P3 — Formalisation scientifique TOPSIS : FAIT

### 4.1 Corrections de fond (traçabilite dans matching-formalisation.md, section 10)

| Bug | Correction |
|-----|-----------|
| Criteres extraits par NLP (marque, transmission, ville, annee) jamais appliques au classement ni aux filtres | Desormais 7 criteres TOPSIS + cascade de filtres durs |
| Criterium km degenere (catalogue 100% neuf, km=0 partout) | Retire du vecteur TOPSIS |
| `budget: X` non extrait par NLP | Regex `budget`/`ميزانية` ajoutee (min 0.85X / max 1.15X) |
| `normalizeText` remplacait les accents par une espace ("e lectrique" cassait "electrique") | Suppression des accents au lieu d'espace |
| Faux positifs annee ("200000" -> annee 2000) | Token annee delimite (lookbehind/lookahead non chiffre) |
| "autour" activait a tort la transmission "auto" | `hasKeyword` avec frontieres de mot |
| Marques arabes non reconnues | `CANONICAL_BRANDS` (تويوتا -> Toyota, ...) |
| Cle "coupe" absente | Ajoutee (l'accent est retire avant matching) |

### 4.2 Code

- `apps/web/src/lib/matching.ts` reecrit : interface `CriterionWeights` exportee ; profils default/economique/familial/confort/sportif sommant a 1 ; `rankVehiclesWithWeights` exportee (overrides + renormalisation) ; cascade de filtres (exact -> hard -> budget -> top10) ; `meetsBrand`/`meetsTransmission`/`meetsYear` ajoutes a `ScoredCar` ; `bodyMatches` typé avec `bodyType`.
- `apps/web/src/lib/nlp.ts` corrige (voir tableau ci-dessus).

### 4.3 Documentation

- `docs/architecture/matching-formalisation.md` cree : notations, normalisation min-max (cas max==min -> 0.5), table des 7 scores et des poids par profil, A+ = w/0, distances euclidiennes, C* = S-/(S++S-), pipeline complet, preuve formule <-> code, benchmark 38 requetes, analyse de sensibilite (top-1 stable, decalage max 2), corrections section 10.
- `docs/ADRs/ADR-004-Moteur-Matching.md` amende (section 2026-07-31) : renvoie vers matching-formalisation.md, explique l'ecart de criteres (consommation/puissance/fiabilite = phase 2).

---

## 5. P4 — Reponses aux questions ouvertes de l'audit : FAIT

`docs/audit-reponses.md` cree, repond aux 5 questions avec grep a l'appui :

| Point | Question | Reponse | Preuve |
|-------|----------|---------|--------|
| J | /compare utilise-t-il des vehicules occasion ? | Non, neufs uniquement | interface `CarListing`, fallback 196 neufs, aucun collecteur |
| K | CarImage depend-il de Google API ? | Non | placeholder degrade (initiales + couleur marque) |
| L | Calculateur 24/36/48 mois dans le scope ? | Hors scope, absent du code | onglet statique `vehicle/[slug]/page.tsx:202-207` |
| M | SLEIPNIR dans m3-startup / dossier-soutenance ? | Historique autorise | 0 reference dans apps/, uniquement docs |
| 5.2 | entity <-> schema SQL ? | Alignees, divergence controlee | voir ci-dessous |

**Divergence entity/schema controlee**: `apps/api/src/vehicles/vehicle.entity.ts` est aligne sur `packages/database/schema.sql` pour tous les champs applicatifs. Le schema a 2 colonnes supplementaires gerees par PostgreSQL et jamais ecrites par l'ORM : `embedding vector(1536)` (index IVFFlat, phase 2 embeddings) et `search_vector tsvector` + trigger FTS + index GIN. Leur absence dans l'entite TypeORM est volontaire.

---

## 6. P5 — Tests et plan vers 70% (exigence 7.6) : FAIT

### 6.1 Resultat global

**125 tests verts** (106 web + 19 api). `npm run test` (racine) chaine les deux workspaces. `npm run typecheck` : 0 erreur.

### 6.2 Couverture (Vitest v8, perimetres configures)

| Workspace | Perimetre | Stmts | Branch | Funcs | Lines |
|-----------|-----------|-------|--------|-------|-------|
| apps/web | `src/lib/**` (NLP, matching, sources) | 93.31% | 88.01% | 84.44% | 93.43% |
| apps/api | `src/**/*.service.ts` (vehicles, reputation) | 100% | 92.1% | 100% | 100% |

Toutes les metriques de la logique metier sont au-dessus de 70% (exigence 7.6).

### 6.3 Inventaire des fichiers de test

| Fichier | Zone | Tests |
|---------|------|-------|
| `apps/web/tests/matching.test.ts` | Invariants TOPSIS (scores 0-1, decroissance, liste vide, vehicule unique, priorite diesel, renormalisation) | 7 |
| `apps/web/tests/benchmark.test.ts` | Benchmark 38 requetes JSON + 5 analyses de sensibilite | 43 |
| `apps/web/tests/nlp.test.ts` | Extraction NLP FR/AR/darija, budget, annee, km, XSS, cas limites | 39 |
| `apps/web/tests/sources.test.ts` | Normalisation fuel/body/brand, generateId, computeScore, catalogue, cache, recherche multi-mots | 17 |
| `apps/api/test/reputation.service.test.ts` | ReputationService (repos mocks, Math.random mocke) | 6 |
| `apps/api/test/vehicles.service.test.ts` | VehiclesService (query builder mock, CRUD, NotFoundException) | 13 |

### 6.4 Points techniques a connaitre

- **apps/api sous vitest** : les entites TypeORM ne peuvent pas etre chargees sous esbuild (pas d'`emitDecoratorMetadata`), donc les tests mockent les modules entite avec `vi.mock` et instancient les services directement (injection constructeur). Aucune DB requise.
- `apps/api` utilise vitest 2.x ; `apps/web` est passe a vitest 4.x via `@vitest/coverage-v8`. Les deux fonctionnent.
- Coverage scope : apps/web -> `src/lib/**`, apps/api -> `src/**/*.service.ts` (les entites mockees ne sont pas comptees).
- Scripts ajoutes : `test`, `test:watch`, `test:coverage` dans apps/api et apps/web ; scripts racine chaines.

### 6.5 Documentation

- `docs/architecture/testing.md` mis a jour : section 5.1 "Etat des lieux" (tableaux de couverture + inventaire + limites connues) et section 10 "Plan vers 70%" (7 etapes : seuil CI, tests integration @nestjs/testing + PostgreSQL, render tests React, E2E Playwright).

---

## 7. Blocages et actions restantes

1. **Rotation cle Google** : action manuelle utilisateur dans Google Cloud Console (cle `AIzaSyAdlPEXkhqIHhQBxvqYu5_pHxMa6hPjcjY` encore dans l'historique git). Non verifiable depuis le code.
2. **Tests integration HTTP complets** (`/api/search`, `/api/reputation`, `/api/auth/*`) : necessitent PostgreSQL (Docker) + `@nestjs/testing`. Non installes.
3. **Aucun commit fait** : tout le travail P1 a P5 est dans le working tree de `fix/cdc-compliance` (fetch-images.ts, SECURITY-INCIDENTS.md, matching.ts, nlp.ts, tests, vitest.config, matching-formalisation.md, ADR-004, audit-reponses.md, HANDOFF-CLAUDE.md, package.json root+web+api).
4. **Render tests React et E2E Playwright** : pas encore faits (plan etapes 6-7).

---

## 8. Verification rapide (commandes)

```bash
npm run test            # 125 tests verts (web + api)
npm run test:coverage   # couverture web (src/lib) + api (services)
npm run typecheck       # 0 erreur web + api
npm run build -w apps/web   # build web OK (standalone)
npm run dev             # web sur :3000
npm run dev:api         # api NestJS (attend PostgreSQL)
```

---

## 9. Fichiers cles a lire en priorite

- `docs/audit-reponses.md` : reponses aux questions ouvertes (P4)
- `docs/architecture/matching-formalisation.md` : formalisation TOPSIS (P3)
- `docs/architecture/testing.md` : etat des lieux + plan 70% (P5)
- `docs/SECURITY-INCIDENTS.md` : registre INC-001 (P1)
- `apps/web/src/lib/matching.ts` + `apps/web/src/lib/nlp.ts` : code metier corrige (P3)
- `apps/web/tests/*.test.ts` + `apps/api/test/*.test.ts` : tests (P5)
