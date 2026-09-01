# Reponses aux Questions Ouvertes de l'Audit CDC

**Date**: 2026-07-31
**Branche**: `fix/cdc-compliance`
**Reference**: points J, K, L, M de `docs/AUDIT-CDC.md` + alignement entite/schema (point 5.2)

---

## 1. Point J - La page /compare utilise-t-elle encore des vehicules occasion ?

**Reponse**: NON. La page `/compare` ne manipule que des vehicules neufs.

**Constat**:
- `apps/web/src/app/compare/page.tsx` utilise l'interface `CarListing` definie dans `apps/web/src/lib/sources/types.ts`, dont les donnees proviennent exclusivement du dataset statique `apps/web/src/lib/sources/fallback.ts` (196 vehicules neufs, `km = 0` partout).
- Les vehicules sont charges via `getCarListings()` qui branche directement sur le fallback sans aucun collecteur externe.

**Verifications effectuees** (grep, resultat vide):
- `occasion|Avito|Wandaloo|Moteur\.ma|auto24` dans `apps/web/src/app/compare`: aucun resultat.
- Les collecteurs (`auto24.ts`, `avito.ts`, `soeezauto.ts`, `ovoiture.ts`, `moteur.ts`) et `car-search.ts` ont ete supprimes de l'arborescence lors de l'audit precedent.

**Conclusion**: conforme au perimetre CDC (neuf uniquement).

---

## 2. Point K - Le composant CarImage depend-il encore de Google API ?

**Reponse**: NON. `apps/web/src/components/CarImage.tsx` n'utilise aucune Google API.

**Constat**:
- Le composant affiche un placeholder degrade (initiales du modele + couleur de la marque) lorsque `image_url` est absent.
- Le seul usage de la Google API dans tout le projet etait le script `apps/web/scripts/fetch-images.ts`, qui lit desormais `process.env.GOOGLE_API_KEY` (plus aucune cle hardcodee).

**Verifications effectuees**:
- grep `googleapis|GOOGLE_API_KEY|maps\.googleapis` dans `apps/web/src/components/CarImage.tsx`: aucun resultat.
- grep `AIzaSy` dans `apps/web/src` (hors `docs/`): aucun resultat.
- La cle compromise est restee dans l'historique git (commits `d751cd4`, `9a1c1a1`, `fb59fcc`) : revocation manuelle requise dans Google Cloud Console (voir `docs/SECURITY-INCIDENTS.md`).

**Conclusion**: conforme.

---

## 3. Point L - Le calculateur de financement 24/36/48 mois est-il dans le scope CDC ?

**Reponse**: NON, et il n'existe pas dans le code.

**Constat**:
- `apps/web/src/app/vehicle/[slug]/page.tsx` (ligne 202-207) affiche un onglet "Offres & Financement" strictement statique : "Contactez le concessionnaire pour les offres en cours." Aucun calculateur, aucun taux, aucune mensualite.
- Aucune reference a un calcul de financement n'existe dans `apps/web/src`.

**Verifications effectuees** (grep, resultat vide):
- `mensualité|mensualite|simulateur|simul\w*|24 mois|36 mois|48 mois|taux|credit|crédit` dans `apps/web/src`: aucun resultat.
- Le calculateur 24/36/48 mois n'apparait que dans `docs/dossier-soutenance.md`, hors perimetre (document de soutenance, non modifiable).

**Conclusion**: hors scope CDC; l'onglet est un placeholder de presentation. Aucune action requise.

---

## 4. Point M - SLEIPNIR dans m3-startup et dossier-soutenance : historique OK ?

**Reponse**: OUI, autorise.

**Constat**:
- Le nom SLEIPNIR n'apparait QUE dans des documents historiques ou d'audit, jamais dans le code applicatif :
  - `docs/m3-startup/*` (dossier concours startup, hors perimetre)
  - `docs/dossier-soutenance.md` (document de soutenance genere, hors perimetre)
  - `CHANGELOG.md` (entree historique du renommage SLEIPNIR -> Thiqti)
  - `docs/AUDIT-CDC.md` et `docs/PROMPT-CLAUDE-AUDIT.md` (documents d'audit qui decrivent le renommage)

**Verifications effectuees**:
- grep `SLEIPNIR` dans `apps/` (web + api): aucun resultat.
- grep `SLEIPNIR` hors `docs/` et `CHANGELOG.md`: aucun resultat.

**Conclusion**: le nom SLEIPNIR dans ces fichiers est un historique legitime; la contrainte de ne pas toucher `docs/m3-startup/` et `docs/dossier-soutenance.md` est respectee.

---

## 5. Alignement entite / schema SQL (point 5.2 de AUDIT-CDC)

**Reponse**: divergence controlee et documentee; pas d'erreur de conformite.

**Constat** (comparaison `apps/api/src/vehicles/vehicle.entity.ts` et `packages/database/schema.sql`):

Champs presents dans les deux :
`id, make, model, year, trim, body_type, fuel_type, transmission, seats, price_mad, price_old_mad, power_ch, consumption_l100, co2_gkm, accel_0_100, trunk_liters, length_mm, width_mm, height_mm, wheelbase_mm, image_url, created_at, updated_at`

Champs specifiques entite (absents du schema SQL) :
- tous nullable et sans index dedie. La table `vehicles` du schema SQL les declare aussi, donc la colonne existe dans la base si on applique `schema.sql`. En pratique TypeORM ne cree pas de migration, la base est creee via `schema.sql` : la liste est identique, seuls les typages TypeORM (`@Column()` vs `INT`) different legerement.

Corrigeons ce constat en verifiant champ a champ : le schema SQL declare `power_ch INT`, `consumption_l100 REAL`, `co2_gkm INT`, `accel_0_100 REAL`, `trunk_liters INT`, `length_mm INT`, `width_mm INT`, `height_mm INT`, `wheelbase_mm INT`, `image_url TEXT`. L'entite declare `power_ch: number`, `consumption_l100: number | null`, `co2_gkm: number | null`, `accel_0_100: number | null`, `trunk_liters: number | null`, `length_mm: number | null`, `width_mm: number | null`, `height_mm: number | null`, `wheelbase_mm: number | null`, `image_url: string`. La difference de typage est mineure (les colonnes `REAL`/`INT` sont mappees en `number`). Aucun champ "occasion" (`km`, `color`, `engine`, `doors`, `score`, `dealer_id`, `is_active`) ne subsiste dans l'entite.

Champs specifiques schema SQL (absents de l'entite) :
- `embedding vector(1536)` : index IVFFlat pour recherche vectorielle (phase 2 embeddings).
- `search_vector tsvector` + trigger `vehicles_search_vector_trigger` + index GIN : recherche full-text.

Ces deux colonnes sont gerees cote PostgreSQL (trigger / fill factor), jamais ecrites par l'application NestJS, donc leur absence de l'entite TypeORM est volontaire : l'application ne doit ni les lire ni les ecrire via l'ORM.

**Conclusion**: l'entite est alignee sur le perimetre applicatif (lecture/ecriture via TypeORM); les colonnes `embedding` et `search_vector` sont des artefacts de base geres par PostgreSQL, hors responsabilite de l'ORM. Aucune action de code requise. A revoir en phase 2 (embeddings) si l'API doit executer des requetes vectorielles.

---

## 6. Synthese

| Point | Question | Reponse | Action requise |
|-------|----------|---------|----------------|
| J | /compare utilise-t-il des vehicules occasion ? | Non, neufs uniquement | Aucune |
| K | CarImage depend-il de Google API ? | Non (placeholder degrade) | Rotation cle (action utilisateur) |
| L | Calculateur financement 24/36/48 dans le scope ? | Hors scope, absent du code | Aucune |
| M | SLEIPNIR dans les docs : historique OK ? | Oui, docs uniquement | Aucune |
| 5.2 | Entite vs schema SQL | Alignees, divergence controlee | Aucune |
