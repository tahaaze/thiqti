# ADR-009: Observabilite

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Thiqti doit exposer des metriques de performance, de matching, et de sante du service pour le debugging et le monitoring.

## Options Considerees

### Option A (rejetee): Stack ELK (Elasticsearch + Logstash + Kibana)

- **Avantages**: Recherche de logs, dashboards, alerting
- **Inconvenients**: Infrastructure lourde, cout, maintenance
- **Motif du rejet**: Surdimensionne pour un projet Phase 1 sans trafic utilisateur significatif

### Option B (rejetee): Datadog / New Relic (plan gratuit)

- **Avantages**: APM, traces distribuees, alerting pret a l'emploi
- **Inconvenients**: Plan gratuit limite (retenue 24h), cout si depassement
- **Motif du rejet**: Donnees envoyees a un tiers; pas de controle sur la retention; cout si le trafic depasse le quota gratuit

### Option C (retenue): Logs structures + endpoint /api/health

- **Logs**: `console.log` structure (timestamp, niveau, correlationId, message)
- **Health**: Endpoint GET `/api/health` retournant (status, uptime, version, countVehicules)
- **Metriques**: Cachees dans le code (Map de compteurs accessibles via `/api/metrics`)

## Decision

Logs structures via console.log + endpoint health simple, sans infrastructure de monitoring dediee.

## Consequences

- **Positif**: Zero cout, zero dependance, donnees maitrisees, debug possible via Vercel Function Logs
- **Negatif**: Pas d'alerting automatique, pas de retention longue duree, pas de dashboards visuels
- **Risque**: En cas de panne, pas d'alerte proactive; mitigation: check manuel quotidien du health endpoint
