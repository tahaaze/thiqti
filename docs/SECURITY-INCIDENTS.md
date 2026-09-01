# Registre des Incidents de Securite

**Ref**: VV-SLP-2026-001, section 7.8
**Statut**: Ouvert — rotation de cle en attente d'action manuelle

---

## INC-001: Exposition de cle API Google dans l'historique Git

### Identification

| Champ | Valeur |
|-------|--------|
| **ID Incident** | INC-001 |
| **Date de detection** | 2026-07-29 (audit conformite CDC) |
| **Severite** | Elevee |
| **Type** | Divulgation de secret (cle API) |
| **Cle concernees** | `AIzaSyAdlPEXkhqIHhQBxvqYu5_pHxMa6hPjcjY` (Google Custom Search) |

### Chronologie

| Date | Evenement |
|------|-----------|
| 2026-07-17 | Cle introduite en dur dans `apps/web/scripts/fetch-images.ts:4` (commit `d751cd4`) |
| 2026-07-17 a 2026-07-29 | Cle presente dans tous les commits descendants de `d751cd4`, y compris HEAD `3966cf4` |
| 2026-07-29 | Detection lors de l'audit CDC : la cle est visible dans l'historique git |
| 2026-07-29 | Correction du code : `fetch-images.ts` lit desormais `process.env.GOOGLE_API_KEY` et `process.env.GOOGLE_CX` |
| 2026-07-31 | Verification : plus aucune occurrence dans le working tree (hors document d'audit documentant l'incident) |

### Perimetre de l'exposition

- **Code impacte**: `apps/web/scripts/fetch-images.ts` uniquement (script de fetch d'images, non critique)
- **Nature du secret**: Cle Google Custom Search (lecture seule, budget gratuit 100 requetes/jour)
- **Quota**: Toute personne ayant acces au repo peut consommer le quota gratuit de la cle
- **Impact financier**: Limite au quota gratuit Google (pas de facturation possible via cette cle)

### Action prise

1. **Retrait du code** : `process.env.GOOGLE_API_KEY` + `process.env.GOOGLE_CX` (le script echoue proprement si absent)
2. **Commit de la correction** : a effectuer sur la branche `fix/cdc-compliance`
3. **Rotation de la cle** : a faire MANUELLEMENT dans Google Cloud Console — voir ci-dessous

### Action REQUISE de l'utilisateur (impossible depuis le code)

La rotation de la cle doit etre effectuee manuellement par un administrateur dans la Google Cloud Console :

1. Ouvrir [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Revoquer la cle `AIzaSyAdlPEXkhqIHhQBxvqYu5_pHxMa6hPjcjY` (voir l'historique des cles)
3. Creer une nouvelle cle API
4. Restreindre la nouvelle cle : par domaine (referent HTTP) et par API (Custom Search API uniquement)
5. Mettre a jour la variable d'environnement `GOOGLE_API_KEY` dans `.env` et Vercel

> **Important** : tant que la rotation n'est pas confirmee faite, la cle exposee reste valide et doit etre consideree comme compromise.

### Retour d'experience

- **Cause racine** : developpement rapide sans revue de code sur les scripts d'outillage (scripts/ n'etaient pas traites comme du code de production)
- **Lecon** : tout fichier contenant une cle API doit utiliser `process.env.*` des la premiere ecriture
- **Prevention** : ajout d'une recherche de patterns de secrets dans le CI (a faire, point 5 de l'audit)

### Statut

- [x] Detection et documentation
- [x] Retrait du code source
- [x] Verification de l'absence dans le working tree
- [ ] Rotation de la cle (action manuelle utilisateur — Google Cloud Console)
- [ ] Suppression de la cle de l'historique git (optionnel, via git filter-repo ou BFG)
- [ ] Cloture de l'incident (apres rotation confirmee)

---

## Registre des verifications (scans secrets)

### Scan 1 — 2026-07-31 (audit)

| Pattern recherche | Resultat |
|-------------------|----------|
| `AIza[0-9A-Za-z_-]{35}` (Google API) | 1 occurrence : `docs/PROMPT-CLAUDE-AUDIT.md` (documentation de l'incident, intentionnelle) |
| `sk-[A-Za-z0-9]{20,}` (OpenAI) | Aucune |
| `AKIA[0-9A-Z]{16}` (AWS) | Aucune |
| `gh[pousr]_[A-Za-z0-9]{20,}` (GitHub) | Aucune |
| `xox[baprs]-[A-Za-z0-9-]{10,}` (Slack) | Aucune |
| `eyJhbGciOi...` (JWT) | Aucune |
| `-----BEGIN PRIVATE KEY-----` (cle privee) | Aucune |
| `mongodb+srv://`, `postgres://` (chaines de connexion) | Aucune |
| `password="..."` / `password='...'` en dur | Aucune |
| `.env` commite dans git | Aucun (fichier ignore via `.gitignore:15`) |
| Secrets docker-compose | `${DB_PASSWORD:-thiqti_secret}` (fallback local dev uniquement, surchargeable par env) |
