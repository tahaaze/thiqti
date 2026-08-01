# Thiqti

Plateforme de recommandation automobile intelligente au Maroc. Moteur de recherche en langage naturel (francais et darija) avec matching multicritere TOPSIS.

## Quick Start

```bash
git clone https://github.com/your-org/thiqti.git
cd thiqti
npm install
cp .env.example .env  # editer avec vos secrets
npm run dev
```

Ouvrir `http://localhost:3000`.

## Architecture (Phase 1)

```
Requete utilisateur --> NLP Parser --> Moteur Matching TOPSIS --> Resultats classes
(francais/darija)     (criteres)     (196 vehicules neufs)
```

- **NLP**: Rule-based + dictionnaires francais/arabe (marque, budget, type, carburant)
- **Matching**: TOPSIS avec ponderation contextuelle + score d'explication
- **Catalogue**: Dataset statique de 196 vehicules neufs disponibles au Maroc
- **Auth**: Admin unique via JWT + bcrypt (cookie httpOnly)

## Stack

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 3.4 |
| API | Next.js API Routes |
| Matching | TOPSIS multicritere |
| NLP | Regex + dictionnaires FR/AR |
| Auth | jose + bcryptjs |
| Cache | In-memory (Map + TTL 5min) |
| Icons | lucide-react |

## Structure

```
thiqti/
 apps/
   web/        Next.js 15 (frontend + API routes)
   api/        NestJS API (Phase 2)
 packages/
   database/   Schema PostgreSQL + seeds (Phase 2)
 docs/
   ADRs/       Architecture Decision Records (MADR)
   architecture/  C4, deploiement, securite, registre donnees
```

## Administration

- **Login**: `/login` — email + mot de passe admin
- **Generer hash**: `npx tsx apps/web/scripts/generate-password-hash.ts`

## Licence

Projet de stage — ENSIAS 2026
