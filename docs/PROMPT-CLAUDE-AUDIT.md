# PROMPT POUR CLAUDE — Audit de conformité CDC du projet Thiqti

Tu es un auditeur technique senior. Tu dois auditer le projet Thiqti (moteur de recommandation automobile au Maroc) par rapport à un Cahier des Charges (CDC) nommé VV-SLP-2026-001, puis corriger les erreurs que tu trouves.

## Contexte du projet

- **Produit**: Thiqti (renommé depuis "SLEIPNIR") — moteur de recherche automobile en langage naturel (français/arabe) pour le marché marocain
- **Phase actuelle**: Phase 1 — catalogue de 196 véhicules NEUFS uniquement, dataset statique, pas de collecte automatisée
- **Stack**: Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS, auth JWT + bcrypt (cookie httpOnly)
- **Structure**: monorepo npm (apps/web = Next.js fonctionnel, apps/api = NestJS cassé, apps/ai = absent)
- **Branche git active**: `fix/cdc-compliance` (le travail a été fait sur cette branche, pas push sur main)

## Les 8 exigences du CDC (VV-SLP-2026-001)

1. **Aucun secret hardcodé** dans le code (clés API, mots de passe) — tout doit passer par des variables d'environnement
2. **Entités base de données alignées sur le schéma cible** — le périmètre a été réduit au NEUF uniquement (supprimer tout champ "occasion" : km, couleur, etc.)
3. **Documentation d'architecture complète** : modèles C4, diagramme de séquence avec budget de latence, contrat OpenAPI, diagramme de déploiement
4. **Au moins 11 ADRs (Architecture Decision Records) au format MADR**, chacun avec au moins 2 options écartées avec motif du rejet
5. **Formalisation de la méthode de matching TOPSIS** (méthode formelle de classement multicritère)
6. **Stratégie de collecte de données documentée et licite** (conformité loi 09-08 marocaine) — le scraping non autorisé est INTERDIT
7. **Sécurité documentée** : STRIDE, OWASP Top 10, protection contre l'injection de prompts
8. **Documentation projet à jour** : README, CHANGELOG, conventions de code

## Ce qui a déjà été fait (à vérifier, pas à refaire)

### Point 1 — Secrets & Auth
- Créé `.env.example` (toutes variables documentées, valeurs "changeme")
- Retiré `GOOGLE_API_KEY` du code (`apps/web/scripts/fetch-images.ts` → `process.env.GOOGLE_API_KEY`)
- Retiré le fallback `"thiqti_secret"` du mot de passe DB (`apps/api/src/app.module.ts`)
- `docker-compose.yml` : secrets → `${VAR:-default}`
- Implémenté auth admin : JWT (jose) + bcrypt (bcryptjs), cookie httpOnly
- Endpoints : `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Page login : `apps/web/src/app/login/page.tsx`
- Script hash : `apps/web/scripts/generate-password-hash.ts`
- Module auth : `apps/web/src/lib/auth.ts`

### Point 2 — Entités DB
- Réécrit `apps/api/src/vehicles/vehicle.entity.ts` : supprimé km, color, engine, doors, score, dealer_id, is_active ; ajouté trim, body_type, fuel_type, price_mad, price_old_mad, power_ch, consumption_l100, co2_gkm, accel_0_100, trunk_liters, length_mm, width_mm, height_mm, wheelbase_mm
- Mis à jour DTOs (create-vehicle.dto.ts, search-vehicles.dto.ts) et vehicles.service.ts

### Point 3 — Architecture
- Réécrit `docs/architecture/c4-models.md` (Phase 1, diagramme de séquence avec budget latence <500ms)
- Créé `docs/architecture/openapi.yaml` (OpenAPI 3.1, tous les endpoints)
- Réécrit `docs/architecture/deployment.md` (Phase 1 : dataset statique, pas de scraper)

### Point 4 — ADRs (11 au format MADR)
`docs/ADRs/ADR-001` à `ADR-011` : Stack, Données, NLP, Matching (TOPSIS), Sources, Réputation, Sécurité, Déploiement, Observabilité, CI/CD, Conventions. Chacun avec 2+ options rejetées et motif.

### Point 5 — TOPSIS
- Documenté dans ADR-004 et c4-models.md (normalisation vectorielle, distances idéale/anti-idéale, pondération configurable)

### Point 6 — Collecte
- ADR-005 : dataset statique manuel = seule source licite, scraping désactivé
- `docs/architecture/data-register.md` : registre des traitements conforme loi 09-08
- Dataset : `apps/web/src/lib/sources/fallback.ts` (196 véhicules neufs, km=0)

### Point 7 — Sécurité
- `docs/architecture/security.md` : STRIDE complet, OWASP A01-A10, protection injection de prompts, protection secrets

### Point 8 — Documentation
- README.md, CHANGELOG.md, RUNBOOK.md réécrits (renommage SLEIPNIR→Thiqti, Phase 1)
- `.github/workflows/ci.yml` renommé
- `docs/architecture/testing.md`, `cost-model.md` mis à jour Phase 1

## Erreurs CORRIGÉES le 2026-07-31
- Supprimé 6 fichiers orphelins : `apps/web/src/lib/sources/{auto24,avito,soeezauto,ovoiture,moteur}.ts` et `apps/web/src/lib/car-search.ts` (car-search appelait ENCORE l'API Auto24 avec fallback occasion)
- Corrigé `package.json` root : `npm run dev` ne lance plus que `apps/web` (avant : échouait sur apps/api sans script dev + apps/ai absent)
- `npx tsc --noEmit` dans apps/web : **0 erreur**

## Problèmes restants (à traiter ou à documenter)

1. **Google API key compromise** : `AIzaSyAdlPEXkhqIHhQBxvqYu5_pHxMa6hPjcjY` visible dans l'historique git (commits `9a1c1a1`, `fb59fcc`). Action utilisateur requise : la révoquer dans Google Cloud Console.
2. **apps/api ne compile pas** : `Cannot find module 'lodash/toArray'` (erreur préexistante, indépendante du CDC). Nécessite d'installer `lodash` dans apps/api.
3. **apps/ai absent** : le workspace est référencé dans package.json mais le dossier n'existe pas.

## Ce que tu dois faire

1. **Vérifier** chaque point du CDC ci-dessus en lisant les fichiers du repo (branche actuelle `fix/cdc-compliance`)
2. **Corriger** les erreurs que tu trouves (surtout : secrets restants, références occasion, références SLEIPNIR, incohérences doc/code, champs entité non conformes)
3. **Répondre** aux questions restées ouvertes :
   - La page `/compare` utilise-t-elle encore des données occasion ?
   - Le composant `CarImage` dépend-il toujours de l'API Google ?
   - Le calculateur de financement (24/36/48 mois) est-il dans le scope CDC ?
   - Des références à SLEIPNIR ou à l'ancien périmètre subsistent-elles dans le code ?
   - Les champs `vehicle.entity.ts` correspondent-ils réellement au schéma de `packages/database` ?
4. **Rapporter** dans ta réponse finale : pour chaque point du CDC, CONFORME / NON CONFORME / À VÉRIFIER, avec le fichier exact et la ligne si non conforme.

## Règles
- Ne pas toucher aux dossiers `docs/m3-startup/` et `docs/dossier-soutenance.md` (documents historiques du concours startup, gardés tels quels)
- Ne pas modifier le périmètre : Phase 1 = véhicules neufs uniquement, dataset statique, pas de scraping
- Zéro tiret cadratin dans les fichiers (contrainte du CDC)
- Si tu corriges du code, vérifier avec `npm run typecheck -w apps/web` et `npm run build -w apps/web`
