# Dossier de Soutenance — SLEIPNIR

**Stage de Fin d'Études — Volund Ventures**
**Étudiants** : Adam Chouikh, Mohamed Taha Ait Ouahammi, Younes Boumalek
**Année universitaire** : 2025–2026
**Référence** : VV-SLP-2026-001

---

## 1. Résumé du Projet

SLEIPNIR est une plateforme IA de recherche automobile pour le marché marocain, développée dans le cadre d'un stage chez Volund Ventures par 2 étudiants.

**Phase 1 MVP** : moteur de recherche en langage naturel, classement multicritère TOPSIS avec explicabilité, baromètre d'e-réputation et comparateur de véhicules. Le système agrège les données depuis 4 sources (Auto24.ma, SoeezAuto.ma, Avito.ma, dataset fallback) et indexe **170+ véhicules**.

**Positionnement** : le premier moteur de recherche automobile au Maroc combinant NLP, matching adaptatif et réputation agrégée.

---

## 2. Rappel des Objectifs

| Objectif | Statut | Détail |
|----------|--------|--------|
| Barre de recherche en langage naturel | ✅ | Extraction regex + dictionnaires (français, arabe) |
| Moteur de matching TOPSIS | ✅ | 5 profils adaptatifs (économique, familial, confort, sportif, défaut) |
| Fiches véhicules avec réputation | ✅ | Baromètre avec seuil de 30 avis, 6 catégories |
| Comparateur côte à côte | ✅ | Vue side-by-side, calculateur de financement |
| Saisie vocale | ✅ | Web Speech API intégrée |
| Démonstration 30 minutes | ✅ | Script de démo structuré |

---

## 3. Architecture Technique

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Next.js 15  │────▶│  NLP Engine  │────▶│ TOPSIS Ranker│
│  + React 19  │     │ (regex/NLP)  │     │  (multicritère)│
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       ▼                                         ▼
┌──────────────┐                         ┌──────────────┐
│  PostgreSQL   │                         │   Results    │
│  (Phase 2)    │                         │ + explication│
└──────────────┘                         └──────────────┘
       ▲                                         │
       │           ┌──────────────┐              │
       └───────────│   Playwright  │◀─────────────┘
                   │  (scraping)   │
                   └──────────────┘
```

| Couche | Technologie | Choix justifié |
|--------|------------|----------------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS | SSR pour SEO, React 19, CSS utility-first |
| API | Next.js API Routes | Monolithe simplifié pour MVP |
| Base de données | PostgreSQL 16 + pgvector | Recherche vectorielle prête pour Phase 2 |
| Collecte | Playwright | Gestion des sites SPA (Avito, Avito) |
| Matching | TOPSIS | Algorithme MCDM standard, interprétable |
| NLP | Regex + dictionnaires | Zéro dépendance externe, latence < 10ms |

---

## 4. Résultats Obtenus

### 4.1 Fonctionnalités livrées

- **170+ véhicules indexés** depuis 4 sources (Auto24, SoeezAuto, Avito, Fallback)
- **NLP en français** : extraction de marque, modèle, budget, carrosserie, motorisation, ville, année, kilométrage
- **TOPSIS avec explicabilité** : chaque résultat inclut un score et les raisons du classement
- **Baromètre d'e-réputation** : seuil de fiabilité à 30 avis, 6 catégories (confort, consommation, fiabilité, etc.)
- **Comparateur** : vue côte à côte avec calculateur de financement (24/36/48 mois)
- **Saisie vocale** : Web Speech API pour la recherche mains-libres
- **Filtres affinables** : carrosserie, motorisation, budget, année, km, marque, ville
- **Dashboard d'observabilité** : métriques en temps réel (recherches, latence, sources)
- **Responsive design** : adapté mobile, tablette, desktop

### 4.2 Métriques techniques

| Métrique | Valeur |
|----------|--------|
| Latence NLP | < 10 ms |
| Latence matching | < 50 ms (170 véhicules) |
| Coût infrastructure MVP | **$0.00/mois** (Vercel Free) |
| Sources actives | 4 (Auto24, SoeezAuto, Avito, Fallback) |
| Tests unitaires | Vitest + Playwright |
| Pipeline CI/CD | GitHub Actions → Vercel |

---

## 5. Difficultés Rencontres

| Difficulté | Impact | Résolution |
|-----------|--------|------------|
| **Avito SPA** (Single Page Application) | Scraping impossible en HTTP simple | Playwright pour le rendu côté client |
| **Déduplication** entre sources | Véhicules en double avec prix/année différents | Clé composite `{make}_{model}_{year}_{price}` + merge images |
| **Google Custom Search API** | Pas de recherche image en gratuit | Images CDN autoevolution + placeholders par marque |
| **Normalisation des scores** | Formats de prix/km différents par source | Pipeline de normalisation (`normalize.ts`) avec tolérance |

---

## 6. Perspectives

| Phase | Priorité | Détail |
|-------|----------|--------|
| **Phase 2 — Marketplace occasion** | Haute | PostgreSQL persistant, auth Supabase, favoris serveur, Playwright pour SPA |
| **Phase 3 — Marketplace KYC** | Moyenne | Système de messagerie, vérification concessionnaires, paiement sécurisé |
| **Whisper pour darija** | Haute | Voice input en dialecte marocain via OpenAI Whisper |
| **Intégration LLM** | Moyenne | Compréhension contextuelle ("je veux un truc spacieux pour la famille") |
| **Application mobile** | Basse | React Native pour iOS/Android |

---

## 7. Démonstration (30 minutes)

### Script de démo

| Durée | Sujet | Détail |
|-------|-------|--------|
| 5 min | Architecture | Vue d'ensemble, flux de données |
| 5 min | NLP | Démonstration extraction de critères (français + arabe) |
| 5 min | Matching TOPSIS | Requête "SUV diesel budget 300K" → résultats + explicabilité |
| 5 min | Réputation | Baromètre, seuil 30 avis, catégories, excerpts |
| 5 min | Comparateur | Vue side-by-side, calculateur financement |
| 5 min | Code walkthrough | ADRs, structure monorepo, pipeline CI |

### Points clés à démontrer

1. Requête : *"Je cherche un SUV diesel familial autour de 350 000 DH à Casablanca"*
2. Résultats classés TOPSIS avec badge "% match" et explications
3. Fiche véhicule avec baromètre de réputation (score /100, 6 anneaux)
4. Comparateur : 2 véhicules côte à côte
5. Dashboard `/api/metrics` : nombre de recherches, latence moyenne

---

## 8. Annexes

### Références documentaires

| Document | Chemin | Contenu |
|----------|--------|---------|
| ADR-001 | `docs/ADRs/ADR-001-Stack-Technique.md` | Choix de stack et justifications |
| ADR-002 | `docs/ADRs/ADR-002-Architecture-Données.md` | Schéma de données |
| ADR-003 | `docs/ADRs/ADR-003-Moteur-NLP.md` | Approche NLP (regex vs LLM) |
| ADR-004 | `docs/ADRs/ADR-004-Moteur-Matching.md` | TOPSIS, pondérations, explicabilité |
| ADR-005 | `docs/ADRs/ADR-005-Sources-Données.md` | Sources, collecte, déduplication |
| ADR-006 | `docs/ADRs/ADR-006-Barometre-Reputation.md` | Baromètre, seuil 30 avis |
| ADR-007 | `docs/ADRs/ADR-007-Securite.md` | STRIDE, OWASP, conformité |
| ADR-008 | `docs/ADRs/ADR-008-Deploiement.md` | Stratégie de déploiement |
| ADR-009 | `docs/ADRs/ADR-009-Observabilite.md` | Logging structuré, métriques |
| ADR-010 | `docs/ADRs/ADR-010-CICD.md` | Pipeline CI/CD GitHub Actions |
| ADR-011 | `docs/ADRs/ADR-011-Conventions-Code.md` | Conventions de code |
| Security | `docs/architecture/security.md` | Analyse STRIDE, OWASP Top 10 |
| Testing | `docs/architecture/testing.md` | Stratégie de tests (pyramide) |
| Cost Model | `docs/architecture/cost-model.md` | Modèle de coûts ($0 MVP) |
| C4 Models | `docs/architecture/c4-models.md` | Diagrammes d'architecture |
| Deployment | `docs/architecture/deployment.md` | Guide de déploiement |

---

*Document généré pour la soutenance de stage — Volund Ventures × SLEIPNIR*
