# ETAT-URGENT — Veille de réunion encadrant (2026-08-04)

Objectif : corriger, dans l'ordre, les points bloquants pour la présentation de demain midi.
Mises à jour à la fin de chaque section traitée. Résumé final en bas de fichier.

---

## P1 — /login redirige vers /admin (404) : FAIT

### Décision
Option retenue : **créer une page /admin minimale fonctionnelle** (tableau de bord listant les véhicules),
plutôt que rediriger vers l'accueil. Un examinateur teste `/login` en premier : atterrir sur un vrai tableau
de bord est bien plus crédible qu'une redirection vers une page neutre.

### Changements
- `apps/web/src/app/admin/page.tsx` (nouveau) : vérifie la session via `GET /api/auth/me` (redirige vers
  `/login` si non authentifié), affiche 3 cartes de stats + la liste des 196 véhicules du catalogue
  (année, carburant, prix, source, score) avec lien vers la fiche véhicule, bouton déconnexion
  (`POST /api/auth/logout`).
- `apps/web/src/app/layout.tsx` : ajout du lien « Admin » (→ `/login`) dans la nav desktop et mobile
  pour rendre le flux découvrable.
- Le flux `login` → `router.push("/admin")` fonctionne désormais (plus de 404).

### Vérifications passées
- `npm run typecheck -w apps/web` : 0 erreur
- `npm run test -w apps/web` : 106/106
- `npm run build -w apps/web` : OK (route `/admin` statique)

### Reste à faire
Rien pour P1. Le reste des priorités (P2-P5) est traité ci-dessous.

---

## P2 — Baromètre de réputation : données réelles : FAIT

### Ce qui a été fait
1. **Route web `/api/reputation` branchée sur PostgreSQL** (`apps/web/src/app/api/reputation/route.ts` réécrit) :
   - Lit la table `reviews` (+ `reputation_scores`) via `pg`, en joignant sur `vehicles` par make/model en minuscules.
   - Les 6 véhicules seedés (RAV4, Tucson, Sportage, Qashqai, Outlander, Kuga) renvoient un **vrai score** calculé
     depuis les 10 avis réels : `avgScore` (0-10), tags (top pros/cons de `reputation_scores` ou dérivés des avis),
     catégories dérivées des mots-clés pros/cons, extraits d'avis, volume, fiabilité (fiable/moyen de la base).
   - Les 190 autres véhicules (et tout véhicule sans avis en base) renvoient **« Données insuffisantes »**
     (`dataAvailable: false`, `totalReviews: 0`), plus aucun faux score généré.
   - DB injoignable : la route dégrade proprement en « Données insuffisantes » (aucun crash).
   - `POST` : insère un vrai avis dans `reviews` (plus d'ajout dans un cache simulé).
2. **Suppression du `seededRandom`** : plus aucune génération pseudo-aléatoire côté web.
3. **Suppression du `Math.random()` NestJS** (`apps/api/src/reputation/reputation.service.ts`) :
   `computeScore` calcule désormais le score UNIQUEMENT à partir des avis réels (`overall = moyenne des scores × 10`) ;
   les composantes sans source de données (`history`, `mechanical`, `price_value`) passent à `null`
   (colonnes déjà nullable dans l'entité). Tests api mis à jour en conséquence (19/19 verts).
4. **Frontend** (`apps/web/src/app/vehicle/[slug]/page.tsx`) : le baromètre s'affiche quand
   `reputation.dataAvailable === true` (données réelles en base), sinon l'état « Données insuffisantes »
   (le compteur de collecte X/30 reste affiché, honnête).
5. **Vérification** : aucun appel au service Python (`:8000`/`/ai/`) ni `random` restant dans `apps/web/src` et `apps/api/src`.

### Dépendance ajoutée
- `pg` + `@types/pg` dans `apps/web` (package.json + lockfile mis à jour).

### Vérifications passées
- web : typecheck 0, test 106/106, lint 0 (warnings préexistants), build OK
- api : typecheck 0, test 19/19, build OK

### Reste (à documenter pour la réunion)
- **Non testé en intégration réelle** : aucun PostgreSQL ne tourne sur cette machine (Docker absent).
  Le chemin réel sera activé par `docker-compose up` + variables `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`
  (défauts alignés sur docker-compose : localhost:5432, user `thiqti`, db `thiqti`, password défaut `thiqti_secret`).
- `apps/ai` (Python) : laissé en l'état (Phase 2 documentée), plus rien ne le consomme côté web/API.

---

## P3 — Lint apps/api : FAIT

- `apps/api/eslint.config.mjs` créé (flat config : `@eslint/js` recommended + `typescript-eslint` recommended,
  `no-unused-vars` en warning, ignores `dist`/`node_modules`/`coverage`).
- DevDeps ajoutées à `apps/api` : `@eslint/js`, `typescript-eslint` (lockfile mis à jour).
- `npm run lint --workspace=apps/api` : 0 erreur (3 warnings préexistants d'imports inutilisés).
- `npm run lint` racine (web + api) : **vert** (0 erreur, warnings seulement).

---

## P4 — Placeholders url: "#"

### Décision
Remplacement de tous les placeholders `url: "#"` / `sourceUrl: "#"` par des valeurs honnêtes : chaîne vide `""` (aucun lien). L'interface `UnifiedCar` type déjà ces champs en `string` ; aucun composant de l'UI ne rend `url` (seuls `href`/`Link` existent), donc aucun `#` mort ne subsiste.

### Changements
- `apps/web/src/lib/sources/fallback.ts` : les 196 entrées passent de `sourceUrl: "#", url: "#"` à `sourceUrl: "", url: ""`.
- `git grep` : plus aucune occurrence de `url: "#"`, `sourceUrl: "#"` ou `href="#"` dans `apps/web/src` ni `apps/web/tests`.

### Vérifications (web)
- `npm run typecheck --workspace=apps/web` : 0 erreur.
- `npm run test --workspace=apps/web` : 106/106 OK.
- `npm run build --workspace=apps/web` : OK.
- `npm run typecheck --workspace=apps/api` : 0 erreur.
- `npm run test --workspace=apps/api` : 19/19 OK.
- `npm run build --workspace=apps/api` : OK.

---

## P5 — npm audit par workspace

### Résultat `npm audit --workspace=apps/web` — **6 vulnérabilités (1 moderate, 5 high)**
| Paquet | Sévérité | Corrigé par |
|---|---|---|
| `brace-expansion` (transitif) | high | `npm audit fix` |
| `picomatch` (transitif) | high | `npm audit fix` |
| `esbuild` (transitif) | moderate | `npm audit fix` |
| `postcss` (via `next`) | high | `npm audit fix --force` → **next@16 (breaking)** |
| `sharp` (via `next`) | high | `npm audit fix --force` → **next@16 (breaking)** |

Aucun correctif appliqué : les fixes `--force` exigent `next@16.3.0`, une montée majeure (breaking). Les `npm audit fix` sans force concernent uniquement des dépendances transitives (brace-expansion, picomatch, esbuild) et pourraient être appliqués plus tard.

### Résultat `npm audit --workspace=apps/api` — **32 vulnérabilités (2 low, 18 moderate, 10 high, 2 critical)**
Principales : `@nestjs/core`/`platform-express` (moderate), `multer` (high, DoS), `glob` (high), `js-yaml` (high), `lodash` (high), `tmp` (high), `picomatch` (high), `body-parser`/`qs` (moderate), `ajv` (moderate), `uuid` (moderate), `file-type` (moderate), `brace-expansion` (high).

Aucun correctif appliqué : la quasi-totalité exige `npm audit fix --force` avec des montées majeures (ex. `@nestjs/core@11.1.28`, `@nestjs/cli@11.0.24`, `@nestjs/typeorm@11.0.3`, `vitest@4`). À planifier hors de cette passe (ne pas casser ce qui fonctionne).

### Suite proposée (hors périmètre P5)
- Monter `next` (16.x) et la pile `@nestjs` (11.1.x) dans un chantier dédié avec vérification complète typecheck/test/build.
- Idéalement un `npm audit` en CI pour suivre la dette.

---

# SYNTHÈSE FINALE

FAIT:
- P1 — `/login` → `/admin` corrigé : dashboard admin minimal créé (`apps/web/src/app/admin/page.tsx`), lien « Admin » dans la nav. Commit `ea972b1`.
- P3 — Lint `apps/api` réparé : `eslint.config.mjs` + devDeps ajoutées, lint racine vert. Commit `9ab271d`.
- P4 — Placeholders `url: "#"` supprimés (196 entrées → chaîne vide), plus aucun lien mort. Commit `be6b98b`.
- P5 — Audit npm réalisé sur les deux workspaces : **web 6 vulns** (1 moderate, 5 high), **api 32 vulns** (2 low, 18 moderate, 10 high, 2 critical). Aucun correctif appliqué (fixes = montées majeures cassantes).

PARTIELLEMENT FAIT:
- P2 — Données réelles de réputation depuis PostgreSQL : code livré et vérifié (typecheck/tests/build web + api verts), mais **non testé en intégration** : aucun PostgreSQL/Docker local. Retombe proprement sur « Données insuffisantes » sans base. Commit `7e194fc`.

PAS FAIT:
- Aucun correctif de vulnérabilités (`npm audit fix --force` refusé : montées majeures `next@16`, pile `@nestjs` — hors périmètre, ne pas casser ce qui fonctionne).
- Push des 4 commits locaux (`ea972b1`, `7e194fc`, `9ab271d`, `be6b98b`) sur `origin` : **volontairement différé**, à faire sur demande explicite.
