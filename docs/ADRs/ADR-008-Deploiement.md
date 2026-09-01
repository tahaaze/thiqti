# ADR-008: Deploiement

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Thiqti doit etre deploye sur une plateforme supportant Next.js 15 (App Router), avec un budget proche de zero et une disponibilite minimale requise.

## Options Considerees

### Option A (rejetee): Serveur VPS (DigitalOcean / Hetzner)

- **Avantages**: Controle total, cout fixe (~5$/mois), pas de limits serverless
- **Inconvenients**: Gestion du serveur (OS, securite, mises a jour), SSL manuel, pas de CI/CD integre
- **Motif du rejet**: Cout d'administration > cout financier; l'equipe n'a pas d'ops dedie

### Option B (rejetee): Railway / Fly.io

- **Avantages**: Deploiement simple, scaling automatique
- **Inconvenients**: Cout variable, moins de fonctionnalites que Vercel pour Next.js
- **Motif du rejet**: Vercel offre un support Next.js natif (zero configuration); Railway n'optimise pas le SSR

### Option C (retenue): Vercel (Hobby, $0/mois)

- **Configuration**: Projet lie au depot GitHub, deploiement automatique par branche
- **Domaine**: thiqti.vercel.app (Phase 1), domaine personnalise (Phase 2)
- **Limites**: 100 Go bandwidth, 10s fonction timeout, 50Mo fonction size (suffisant pour Phase 1)

## Decision

Deploiement sur Vercel (plan Hobby, gratuit), avec deploiement automatique par branche.

## Consequences

- **Positif**: Zero cout, deploiement automatique, SSL automatique, preview deploy par PR
- **Negatif**: Limite a 10s par fonction serverless; pas de cron jobs natifs (script build-time seulement)
- **Risque**: Si le dataset depasse 500 vehicules, le bundle peut depasser 50Mo; mitigation: deplacer le dataset vers un CDN ou API externe
