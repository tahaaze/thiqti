# ADR-001: Stack Technique

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Thiqti necessite une stack technique capable de servir une interface web reactive, executer des algorithmes NLP et matching multicritere en temps reel, et respecter un budget infrastructure de projet de stage.

## Options Considerees

### Option A (rejetee): Monolithe Python (Django + DRF)

- **Avantages**: NLP natif, ORM integre, ecosysteme mature
- **Inconvenients**: Performances SSR limitees, cout serveur, pas de separation front/back native
- **Motif du rejet**: Mauvaise experience developpeur pour le frontend, pas de SSR performant, surcout d'hebergement

### Option B (rejetee): Stack separee (FastAPI back + React front)

- **Avantages**: Separation claire, scaling independant
- **Inconvenients**: Deux deploiements, coordination CORS, complexite de CI/CD pour un MVP
- **Motif du rejet**: Complexite inutile pour Phase 1; le trafic estime ne justifie pas la separation

### Option C (retenue): Next.js 15 (App Router) monolythique

- **Frontend**: React 19 + Tailwind CSS + TypeScript strict
- **Backend**: Next.js API Routes (route handlers)
- **Base de donnees**: Fallback integre en Phase 1 (dataset statique)
- **Cache**: In-memory (Map + TTL 5min)
- **Auth**: JWT + bcrypt (cote serveur, cookie httpOnly)

## Decision

Next.js 15 App Router monolythique avec TypeScript strict.

## Consequences

- **Positif**: Un seul runtime Node.js, deploiement simple (Vercel), pas de CORS, debug facile
- **Negatif**: NLP rule-based (regex) plutot que LLM; pas de separation back/front pour Phase 1
- **Risque**: Si le trafic depasse 10K req/jour, le monolythique devra etre decompose; mitige par le cache in-memory
