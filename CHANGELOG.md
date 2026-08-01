# Changelog

Toutes les modifications notables de Thiqti.

Format base sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added
- Authentification admin (JWT + bcrypt + cookie httpOnly)
- Endpoints `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Page login (`/login`)
- Script `generate-password-hash.ts`
- Fichier `.env.example` avec toutes les variables documentees
- Contrat OpenAPI 3.1 (`docs/architecture/openapi.yaml`)
- 11 ADRs au format MADR avec 2+ options rejetees par ADR
- Conformite CDC Volund Ventures (branche `fix/cdc-compliance`)

### Changed
- Renommage SLEIPNIR -> Thiqti dans tous les fichiers de documentation
- `vehicle.entity.ts` alignee sur le schema cible (suppression km, color, engine; ajout trim, body_type, fuel_type, dimensions, CO2)
- Documentation securite mise a jour (STRIDE, OWASP, auth)
- Deployment.md reflete architecture Phase 1 (dataset statique seulement)
- Registre des traitements de donnees mis a jour (pas de scraping, pas de PII)
- README simplifie pour Phase 1

### Removed
- Collecteurs Auto24.ma, Avito.ma, SoeezAuto.ma de l'agregateur
- Section "Occasion populaire" du dataset fallback
- Secrets hardcodes (Google API key, DB password fallback)
- References Playwright dans la documentation
- References Supabase dans la documentation Phase 1

### Security
- Secrets deplaces vers variables d'environnement
- Mots de passe stockes en hash bcrypt (12 rounds)
- Tokens JWT signes avec jose (HS256, cookie httpOnly)
- `GOOGLE_API_KEY` retiree du code source (toujours visible dans l'historique git — action requise: revocation)

## [0.1.0] - 2026-07-17

### Added
- Structure monorepo (apps/web, apps/api, apps/ai, packages/database)
- Moteur NLP rule-based (regex + dictionnaires)
- Moteur de matching TOPSIS avec explicabilite
- Agregateur multi-sources (Auto24, SoeezAuto, Fallback)
- Dataset fallback 196 vehicules marche marocain
- Page de recherche avec grille/liste
- Schema PostgreSQL avec pgvector
