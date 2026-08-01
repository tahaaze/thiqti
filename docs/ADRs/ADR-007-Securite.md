# ADR-007: Securite

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Thiqti doit proteger les donnees utilisateurs, les secrets d'infrastructure, et prevenir les attaques OWASP Top 10. Le projet manipule des donnees personnelles (email admin) et des cles API.

## Options Considerees

### Option A (rejetee): Auth via Supabase Auth (magic link + OAuth)

- **Avantages**: Pret a l'emploi, MFA integre, passwordless
- **Inconvenients**: Dependance Supabase, cout, pas de controle sur le flux d'auth
- **Motif du rejet**: Supabase non utilise en Phase 1 (pas de DB); dependance externe pour un simple admin

### Option B (rejetee): Auth via NextAuth.js (Auth.js v5)

- **Avantages**: Standard, nombreux providers, securite eprouvee
- **Inconvenients**: Configuration complexe pour un seul utilisateur admin, surcharge fonctionnelle
- **Motif du rejet**: Trop de fonctionnalites pour un besoin simple (admin unique); dependance supplementaire

### Option C (retenue): JWT + bcrypt + cookie httpOnly

- **Implementation**: `jose` pour JWT, `bcryptjs` pour hash, cookie httpOnly secure sameSite strict
- **Endpoints**: POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/auth/me`
- **Protections**: Rate limiting (5 tentatives/min), validation email, headers de securite HSTS/CSP/XSS

### Protection des secrets

- `.env.example` commite sans valeurs reelles
- `GOOGLE_API_KEY` injectee via variable d'environnement, jamais dans le code
- `JWT_SECRET` genere par `openssl rand -hex 32`

## Decision

Auth JWT + bcrypt avec cookie httpOnly, secrets via variables d'environnement.

## Consequences

- **Positif**: Simple, auditable, zero cout, pas de dependance externe
- **Negatif**: Pas de MFA, pas de reset password automatique, admin unique uniquement
- **Risque**: Si JWT_SECRET est faible, les tokens peuvent etre forges; mitigation: utiliser une cle de 256 bits generee par `openssl rand -hex 32`
