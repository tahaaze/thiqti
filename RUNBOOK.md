# Thiqti — Runbook

## Vue d'Ensemble du Service

Thiqti est un moteur de recommandation automobile pour le Maroc. Il agrege de **vraies annonces marocaines** (prix MAD, km, photos et reponsabilite reels) depuis trois sources nationales, analyse les requetes via NLP rule-based, et classe via matching TOPSIS multicritere.

**Composants cles (Phase 1):**
- **Next.js 15** — Frontend + API routes (search, auth)
- **Sources reelles marocaines** — Autera.ma (API), Moteur.ma (annonces), ElectroDrive.ma (API)
- **Catalogue hors-ligne** — fallback.ts (196 vehicules) utilise QU'EN SECOURS
- **Cache** — In-memory (Map + TTL 10min)

## Architecture

Voir `docs/architecture/deployment.md` pour le diagramme Mermaid.

```
Browser -> Next.js -> API Routes -> Aggregator -> Cache (TTL 10min)
                                              |
                              +---------------|---------------+
                              | Autera.ma (API JSON, occasion) |
                              | Moteur.ma (annonces, occasion) |
                              | ElectroDrive.ma (API, neuf EV) |
                              | fallback.ts (catalogue secours)|
                              +-------------------------------+
```

## Demarrage Rapide

```bash
git clone https://github.com/your-org/thiqti.git
cd thiqti
npm install
cp .env.example .env
# IMPORTANT : `next dev` ne charge QUE .env situe dans le repertoire de l'app.
# Copier aussi vers apps/web/.env :
cp .env apps/web/.env

# 1) Base de donnees reelle (avis, concessionnaires, offres) : Docker + PostgreSQL
#    Demarre le conteneur et applique schema.sql + seed.sql automatiquement.
docker compose up -d postgres

# 2) (Optionnel) Regenerer les photos reelles par modele depuis Wikimedia Commons
#    Deja fait : les URLs sont dans apps/web/scripts/image-cache.json.
#    npx tsx apps/web/scripts/fetch-images.ts

# 3) Les sources marocaines (Autera.ma, Moteur.ma, ElectroDrive.ma) sont
#    gratuites et sans cle. Aucune configuration requise.

npm run dev
```

## Lancement en production (standalone)

`next start` echoue sur ce projet ; utiliser le serveur standalone genere par le build.

```powershell
# Build
npm run build -w apps/web

# Lancer (les variables .env sont chargees via --env-file ; le standalone ne
# charge PAS .env automatiquement)
node --env-file=.env apps/web/.next/standalone/apps/web/server.js
```

`Start-Process`/`Start-Job` sont tues quand la session PowerShell se termine.
Pour un serveur **persistant** (survit aux sessions, redemarrage automatique),
lancer ce script dans un PowerShell WMI-detache (niveau utilisateur, pas d'admin) :

```powershell
$ps = @'
$ErrorActionPreference = "SilentlyContinue"
Set-Location "C:\Users\user\Documents\GitHub\thiqti"
$env:HOSTNAME = "0.0.0.0"
$env:PORT = "3000"
while ($true) {
  Add-Content -Path "C:\Users\user\Documents\GitHub\thiqti\server.log" -Value ("[serverloop] starting " + (Get-Date -Format "HH:mm:ss"))
  node --env-file="C:\Users\user\Documents\GitHub\thiqti\.env" "apps/web/.next/standalone/apps/web/server.js" 2>&1 | Out-File -FilePath "C:\Users\user\Documents\GitHub\thiqti\server.log" -Append
  Add-Content -Path "C:\Users\user\Documents\GitHub\thiqti\server.log" -Value ("[serverloop] exited " + (Get-Date -Format "HH:mm:ss"))
  Start-Sleep -Seconds 5
}
'@
$enc = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($ps))
Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "powershell -NoProfile -EncodedCommand $enc" }
```

En dev, `npm run dev` charge `.env` automatiquement (clé incluse) et reste
stable tant que le terminal reste ouvert.

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

### Le serveur retourne "Donnees Maroc" au lieu des vraies annonces

**Symptome:** `/api/search` renvoie uniquement les vehicules du catalogue (fallback) au lieu des annonces reelles d'Autera/Moteur/ElectroDrive.

**Causes:**
- En `npm run dev`, Next ne charge que `apps/web/.env`. Copier `.env` vers `apps/web/.env`.
- En standalone, le serveur ne charge pas `.env` : lancer avec `node --env-file=.env ...`
- Une source est temporairement indisponible (ex. ElectroDrive.ma est instable : 503/timeout). Le systeme est resilient : les autres sources continuent, et si TOUTES echouent, le catalogue de secours est servi.
- Moteur.ma peut bloquer les requetes trop rapides (changer d'User-Agent ou ralentir). Le scraping est non officiel : si le HTML change, la source renvoie une liste vide sans casser le reste.

**Solution:** relancer le build apres toute modification des fichiers `apps/web/src/lib/sources/*.ts`, puis le serveur standalone avec `--env-file`, ou le dev avec `apps/web/.env`.

### Pas de resultats de recherche

**Symptome:** Page de resultats vide.

**Causes:**
- Filtres trop restrictifs
- Toutes les sources live sont vides ET le catalogue de secours ne contient pas de correspondance

**Solution:** Verifier le flux `/api/search` (sources : Autera.ma, Moteur.ma, ElectroDrive.ma). Si toutes les sources renvoient une liste vide, le catalogue de 196 vehicules prend le relais. Essayer une recherche plus large (ex: "Toyota" au lieu de "Toyota Corolla 2022 essence").

## Maintenance

### Sources marocaines (aggregation)

| Source | Type | Methode | Fichier |
|--------|------|---------|---------|
| Autera.ma | Occasion, verifiee | API JSON (`/api/listings`) | `apps/web/src/lib/sources/autera.ts` |
| Moteur.ma | Occasion (115 000+) | Scraping HTML leger (15 pages de recherche) | `apps/web/src/lib/sources/moteur.ts` |
| ElectroDrive.ma | Neuf electrique/hybride | API JSON (`action=search&limit=50`) | `apps/web/src/lib/sources/electrodrive.ts` |

Chaque annonce porte sa **reputation reelle** et un **lien de contact direct**. Moteur.ma charge la **fiche detail de chaque annonce** en parallele : nom du vendeur, anciennete (« Vendeur depuis ... »), note /5 et nombre d'avis reels, telephone `tel:`, WhatsApp `wa.me`, page d'annonce. En production reelle : ~440 vehicules, 100 % avec reputation et lien de contact, ~90 % avec telephone + WhatsApp. Si Moteur.ma change son HTML, adapter les regex dans `moteur.ts` (`parseCard`, `fetchDetail`).

### Mettre a jour le catalogue de secours

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
