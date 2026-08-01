# Thiqti — Runbook

## Vue d'Ensemble du Service

Thiqti est un moteur de recommandation automobile pour le Maroc. Il utilise un dataset statique de 196 vehicules neufs, les analyse via NLP rule-based, et les classe via matching TOPSIS multicritere.

**Composants cles (Phase 1):**
- **Next.js 15** — Frontend + API routes (search, auth)
- **Dataset statique** — 196 vehicules neufs (fichier TypeScript)
- **Cache** — In-memory (Map + TTL 5min)

## Architecture

Voir `docs/architecture/deployment.md` pour le diagramme Mermaid.

```
Browser -> Next.js (Vercel) -> API Routes -> Cache -> Dataset statique
                                                        |
                                                 196 vehicules neufs
```

## Demarrage Rapide

```bash
git clone https://github.com/your-org/thiqti.git
cd thiqti
npm install
cp .env.example .env
npm run dev
```

## Problemes Courants

### Le serveur Dev ne demarre pas

**Symptome:** `npm run dev` echoue ou port 3000 occupe.

```bash
netstat -ano | findstr :3000
taskkill /PID <pid> /F
npm run dev
```

### La compilation TypeScript echoue

**Symptome:** Erreurs TypeScript lors du build.

```bash
npm run typecheck
```

Corriger les erreurs avant de commit.

### Le login admin ne fonctionne pas

**Symptome:** 401 sur `/api/auth/login`.

**Causes:**
- `JWT_SECRET` non defini dans `.env`
- `ADMIN_PASSWORD_HASH` non defini ou invalide
- Mot de passe incorrect

**Solution:** Verifier les variables dans `.env`. Regenerer le hash:

```bash
npx tsx apps/web/scripts/generate-password-hash.ts
```

### Pas de resultats de recherche

**Symptome:** Page de resultats vide.

**Causes:**
- Filtres trop restrictifs
- Dataset non charge

**Solution:** Le dataset a 196 vehicules couvrant tous les segments. Si la requete est specifique, essayer une recherche plus large (ex: "Toyota" au lieu de "Toyota Corolla 2022 essence").

## Maintenance

### Mettre a jour le catalogue

1. Editer `apps/web/src/lib/sources/fallback.ts`
2. Ajouter/modifier les entrees vehicles
3. Verifier le format (tous les champs requis)
4. Commiter avec message descriptif

### Ajouter un admin

1. Generer le hash: `npx tsx apps/web/scripts/generate-password-hash.ts`
2. Ajouter `ADMIN_EMAIL` et `ADMIN_PASSWORD_HASH` dans `.env`

## Monitoring

| Aspect | Methode |
|--------|---------|
| Sante | `GET /api/health` (status, uptime, version, count) |
| Erreurs | Vercel Function Logs |
| Performance | Timing dans les logs |

## Securite

- Ne jamais commit `.env`
- Faire tourner `JWT_SECRET` si compromis
- La `GOOGLE_API_KEY` est visible dans l'historique git — REVOQUER dans Google Cloud Console
