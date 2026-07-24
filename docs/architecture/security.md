# SLEIPNIR — Security Analysis

**Ref**: VV-SLP-2026-001  
**Date**: 2026-07-17  
**Status**: Active

---

## 1. STRIDE Threat Model

### 1.1 Spoofing

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| User impersonation | Low | No auth in MVP; LocalStorage-only favorites | ✅ Accepted |
| API request spoofing | Medium | Same-origin policy, CORS | ✅ Mitigated |
| Scraper IP spoofing | Low | Playwright runs server-side, no user interaction | ✅ Accepted |

### 1.2 Tampering

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| Query parameter injection | Medium | Input validation (length, char whitelist) | ✅ Mitigated |
| Cache poisoning | Low | In-memory only, resets on restart | ✅ Accepted |
| Response manipulation | Low | HTTPS in production | ✅ Mitigated |

### 1.3 Repudiation

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| Malicious search abuse | Medium | Structured logging with query tags | ✅ Mitigated |
| No audit trail | Medium | Phase 2: database logging | ⏳ Deferred |

### 1.4 Information Disclosure

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| Stack traces in production | Low | Error boundaries, no verbose errors | ✅ Mitigated |
| Environment variables exposed | Medium | Vercel encrypted, `.env.local` gitignored | ✅ Mitigated |
| Server-side data leaks | Low | No PII collected in Phase 1 | ✅ Accepted |

### 1.5 Denial of Service

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| Query flooding | Medium | No rate limiting (Phase 1); Phase 2: rate limiter | ⏳ Deferred |
| Scraper blocking targets | Low | Fallback dataset always available | ✅ Mitigated |
| Large payload attack | Low | Next.js body size limits | ✅ Mitigated |

### 1.6 Elevation of Privilege

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| SQL injection | Low | Supabase parameterized queries (Phase 2) | ✅ Mitigated |
| SSRF via scraper | Medium | Whitelist allowed domains | ✅ Mitigated |
| XSS via search input | Medium | React auto-escaping + CSP | ✅ Mitigated |

---

## 2. OWASP Top 10 Review

### A01:2021 – Broken Access Control

- **Risk**: Low (no auth in MVP)
- **Mitigation**: LocalStorage-only favorites, no server-side user data
- **Phase 2**: Supabase RLS for user-scoped data

### A02:2021 – Cryptographic Failures

- **Risk**: Medium
- **Mitigation**: HTTPS enforced via Vercel, no passwords stored
- **Phase 2**: Supabase handles encryption at rest

### A03:2021 – Injection

| Injection Type | Risk | Mitigation |
|----------------|------|------------|
| SQL Injection | Low | Supabase client uses parameterized queries |
| XSS | Medium | React auto-escapes; CSP header blocks inline scripts |
| NoSQL Injection | N/A | Using PostgreSQL, not NoSQL |
| Command Injection | Low | No `exec()` or shell commands in user input |

### A04:2021 – Insecure Design

- **Mitigation**: MVP design minimizes attack surface (no auth, no payments, no PII)
- **Phase 2**: Add threat modeling for auth flows

### A05:2021 – Security Misconfiguration

- **Mitigation**: Security headers in `next.config.ts`, CSP enabled
- **Checklist**:
  - ✅ `X-Frame-Options: DENY`
  - ✅ `X-Content-Type-Options: nosniff`
  - ✅ `Strict-Transport-Security`
  - ✅ `Content-Security-Policy`
  - ✅ `Permissions-Policy`

### A06:2021 – Vulnerable and Outdated Components

- **Mitigation**: `npm audit` in CI, Dependabot enabled
- **Current**: Next.js 15, React 19, Playwright 1.61

### A07:2021 – Identification and Authentication Failures

- **Risk**: Low (no auth in MVP)
- **Phase 2**: Supabase Auth with email magic links

### A08:2021 – Software and Data Integrity Failures

- **Mitigation**: All dependencies from npm registry, lock file committed
- **Phase 2**: SRI for external scripts

### A09:2021 – Security Logging and Monitoring Failures

- **Phase 1**: Structured console logging
- **Phase 2**: Sentry for error tracking, Vercel Analytics for access patterns

### A10:2021 – Server-Side Request Forgery (SSRF)

- **Risk**: Medium (scraper makes outbound requests)
- **Mitigation**: Domain whitelist for scraper targets
- **Whitelist**: `auto24.ma`, `soeezauto.ma` only

---

## 3. Input Validation

### Search Bar Input

```typescript
// Validation rules applied to every search query
const SEARCH_VALIDATION = {
  maxLength: 200,          // Prevent payload abuse
  minLength: 2,            // Reject empty/too-short queries
  allowedChars: /^[a-zA-Z0-9\s\u0600-\u06FF,.\-()]+$/, // Arabic + Latin + basic punctuation
  blockedPatterns: [
    /<script/i,            // XSS
    /javascript:/i,        // XSS
    /data:/i,              // Data URI
    /vbscript:/i,          // VBScript
    /on\w+\s*=/i,          // Event handlers
  ],
};
```

### Prompt Injection Defense

| Attack Vector | Defense |
|---------------|---------|
| `"ignore previous instructions"` | Regex NLP parser does not interpret natural language commands |
| `"SELECT * FROM users"` | Parameterized queries (Phase 2), no raw SQL |
| `"<script>alert(1)</script>"` | React auto-escaping, CSP blocks inline |
| `"javascript:alert(1)"` | URL scheme validation blocked |

---

## 4. Rate Limiting (Phase 2)

```typescript
// Planned rate limiter configuration
const RATE_LIMITS = {
  search: {
    windowMs: 60 * 1000,   // 1 minute
    max: 30,                // 30 requests per minute per IP
  },
  reputation: {
    windowMs: 60 * 1000,
    max: 60,                // Less aggressive
  },
  metrics: {
    windowMs: 60 * 1000,
    max: 10,                // Admin only
  },
};
```

---

## 5. CORS Policy

```typescript
// next.config.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};
```

- **MVP**: Same-origin only (Vercel auto-handles)
- **Phase 2**: Explicit CORS for API consumers

---

## 6. Data Privacy — Loi 09-08 Compliance

### 6.1 Data Collected

| Category | Type | Storage | Retention |
|----------|------|---------|-----------|
| Vehicle specs | Public ( scraped) | Supabase | 24h refresh |
| User favorites | LocalStorage | Client browser | Until cleared |
| Search queries | Structured log | Server memory | 24h (rotating) |
| Navigation data | None | Not collected | N/A |

### 6.2 Privacy Principles

| Principle | Implementation |
|-----------|----------------|
| **Data minimization** | Only collect what's needed for search |
| **Purpose limitation** | Data used only for vehicle search |
| **Storage limitation** | No PII stored server-side in Phase 1 |
| **Transparency** | No hidden tracking, no analytics cookies |

### 6.3 User Rights (Phase 2)

| Right | Implementation |
|-------|----------------|
| Access | API endpoint: `GET /api/user/data` |
| Rectification | API endpoint: `PUT /api/user/data` |
| Deletion | API endpoint: `DELETE /api/user/data` |
| Portability | Export as JSON |

---

## 7. SSL Enforcement

| Environment | SSL | HSTS |
|-------------|-----|------|
| Development | None (localhost) | N/A |
| Staging | Auto (Vercel) | Enabled |
| Production | Auto (Vercel) | `max-age=63072000` |

- HTTP → HTTPS redirect: Automatic via Vercel
- Certificate: Let's Encrypt (auto-renewed)

---

## 8. SQL Injection Prevention

```typescript
// Supabase client (Phase 2) — parameterized by default
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('make', userInput)   // Auto-parameterized
  .ilike('model', `%${searchTerm}%`);  // Escaped

// NEVER: `SELECT * FROM vehicles WHERE make = '${userInput}'`
```

---

## 9. XSS Prevention

| Layer | Defense |
|-------|---------|
| React | Auto-escapes all rendered values |
| CSP | `script-src 'self'` — no inline scripts |
| Output encoding | `dangerouslySetInnerHTML` never used |
| URL schemes | `javascript:` and `data:` blocked in inputs |

---

## 10. Security Checklist — MVP

| Item | Status | Notes |
|------|--------|-------|
| HTTPS in production | ✅ | Vercel auto |
| Security headers | ✅ | `next.config.ts` |
| Input validation | ✅ | Max 200 chars, char whitelist |
| CSP enabled | ✅ | Restrictive policy |
| Secrets not in repo | ✅ | `.env.local` gitignored |
| No PII collected | ✅ | LocalStorage only |
| SQL injection safe | ✅ | Supabase parameterized (Phase 2) |
| XSS safe | ✅ | React + CSP |
| Rate limiting | ⏳ | Phase 2 |
| Auth | ⏳ | Phase 2 (Supabase) |
| Error tracking | ⏳ | Phase 2 (Sentry) |
