# Thiqti — Analyse de Securite

**Ref**: VV-SLP-2026-001
**Date**: 2026-07-29
**Statut**: Active

---

## 1. Modele de Menace STRIDE

### 1.1 Spoofing

| Menace | Risque | Mitigation | Statut |
|--------|--------|------------|--------|
| Usurpation d'identite | Low | Auth JWT + bcrypt, cookie httpOnly | Mitige |
| Spoofing requete API | Medium | Same-origin policy, CORS restreint | Mitige |
| Brute force login | Medium | Rate limiting implicite (limitation Vercel) | Accepte |

### 1.2 Tampering

| Menace | Risque | Mitigation | Statut |
|--------|--------|------------|--------|
| Injection parametre requete | Medium | Validation input (longueur, whitelist) | Mitige |
| Empoisonnement cache | Low | Memoire in-process, reset au restart | Accepte |
| Manipulation reponse | Low | HTTPS en production | Mitige |

### 1.3 Repudiation

| Menace | Risque | Mitigation | Statut |
|--------|--------|------------|--------|
| Abus de recherche | Medium | Logs structures avec correlationId | Mitige |
| Pas de piste d'audit | Medium | Phase 2: logging base de donnees | Differe |

### 1.4 Information Disclosure

| Menace | Risque | Mitigation | Statut |
|--------|--------|------------|--------|
| Stack traces en production | Low | Error boundaries, pas d'erreurs verboses | Mitige |
| Variables env exposees | Medium | Vercel chiffre, `.env` gitignore | Mitige |
| Fuite JWT | Medium | Cookie httpOnly, secure, sameSite strict | Mitige |
| Fuite donnees cote serveur | Low | Aucune PII collectee en Phase 1 | Accepte |

### 1.5 Denial of Service

| Menace | Risque | Mitigation | Statut |
|--------|--------|------------|--------|
| Flood de requetes | Medium | Pas de rate limiting (Phase 1); Vercel protection integree | Differe |
| Attaque gros payload | Low | Next.js body size limits | Mitige |

### 1.6 Elevation of Privilege

| Menace | Risque | Mitigation | Statut |
|--------|--------|------------|--------|
| Injection SQL | Low | Pas de base de donnees en Phase 1 | Sans objet |
| SSRF | Medium | Pas de scraping externe en Phase 1 | Sans objet |
| XSS via input recherche | Medium | React auto-escaping + CSP | Mitige |

---

## 2. Revue OWASP Top 10

### A01:2021 – Broken Access Control

- **Mitigation**: Auth JWT sur endpoints admin; endpoints publics sans auth
- **Routes protegees**: `/api/auth/logout`, `/api/auth/me`

### A02:2021 – Cryptographic Failures

- **Mitigation**: HTTPS force via Vercel, mots de passe hashes avec bcryptjs (12 rounds)
- **JWT**: Signe avec jose (algorithme HS256), cookie httpOnly secure

### A03:2021 – Injection

| Type Injection | Risque | Mitigation |
|----------------|--------|------------|
| XSS | Medium | React auto-escape; CSP bloque inline scripts |
| Command Injection | Low | Pas de `exec()` ou shell commands sur input user |

### A04:2021 – Insecure Design

- **Mitigation**: MVP design minimise la surface d'attaque (un seul admin, pas de PII, pas de paiement)

### A05:2021 – Security Misconfiguration

- **Mitigation**: Security headers dans `next.config.ts`, CSP actif
- **Checklist**:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security`
  - `Content-Security-Policy`
  - `Permissions-Policy`

### A06:2021 – Vulnerable and Outdated Components

- **Mitigation**: `npm audit` periodique, dependances minimes
- **Current**: Next.js 15, React 19

### A07:2021 – Identification and Authentication Failures

- **Mitigation**: JWT avec expiration 24h, cookie httpOnly, hash bcrypt
- **Protection**: Validation email format, mot de passe min 8 chars

### A08:2021 – Software and Data Integrity Failures

- **Mitigation**: Dependances depuis npm registry, lock file commit

### A09:2021 – Security Logging and Monitoring Failures

- **Phase 1**: Logs structures console.log avec correlationId

### A10:2021 – Server-Side Request Forgery (SSRF)

- **Phase 1**: Pas de requetes sortantes (dataset statique); sans objet

---

## 3. Validation des Entrees

### Barre de Recherche

```typescript
const SEARCH_VALIDATION = {
  maxLength: 200,
  minLength: 2,
  allowedChars: /^[a-zA-Z0-9\s\u0600-\u06FF,.\-()]+$/,
  blockedPatterns: [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
  ],
};
```

### Protection Contre l'Injection de Prompts

| Vecteur d'attaque | Defense |
|--------------------|---------|
| Contournement d'instructions | Le parser NLP regex n'interprete pas de commandes en langage naturel |
| Injection HTML/JS | React auto-escaping, CSP bloque inline |
| URL schemes malveillants | Validation des schemes bloquee |

---

## 4. Rate Limiting (Phase 2)

```typescript
const RATE_LIMITS = {
  search: { windowMs: 60000, max: 30 },
  auth: { windowMs: 60000, max: 5 },  // 5 tentatives/min
};
```

---

## 5. Politique CORS

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

---

## 6. Protection des Secrets

| Secret | Protection | Rotation |
|--------|------------|----------|
| JWT_SECRET | Variable env, 256 bits (openssl rand -hex 32) | Trimestrielle |
| GOOGLE_API_KEY | Variable env, jamais dans le code | A la premiere compromission |
| ADMIN_PASSWORD_HASH | Hash bcrypt, variable env | Trimestrielle |
| DB_PASSWORD | Variable env (optionnel Phase 1) | Phase 2 |

---

## 7. Checklist Securite — Phase 1

| Item | Statut |
|------|--------|
| HTTPS en production | Vercel auto |
| Security headers | `next.config.ts` |
| Validation entree | Max 200 chars, whitelist |
| CSP actif | Politique restrictive |
| Secrets pas dans le repo | `.env` gitignore, `.env.example` sans valeurs |
| Aucune PII collectee | LocalStorage uniquement |
| XSS safe | React + CSP |
| Auth active | JWT + bcrypt |
| Mots de passe hashes | bcryptjs, 12 rounds |
| Cookie securise | httpOnly, secure, sameSite strict |

---

## 8. Gestion des Incidents

| Etape | Action | Delai |
|-------|--------|-------|
| Detection | Monitoring logs | Immediate |
| Evaluation | Determiner l'impact | 1 heure |
| Containment | Revoquer acces, bloquer IP | 1 heure |
| Notification CNDP | Si requis (art. 43) | 72 heures |
| Correction | Patch + deploiement | 24 heures |
| Post-mortem | Documenter la lecon | 1 semaine |
