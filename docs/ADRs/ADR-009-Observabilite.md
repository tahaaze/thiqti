# ADR-009: Observabilité

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Younes Boumalek, Adam Chouikh
**Réf**: VV-SLP-2026-001, §9.4

## Contexte

Le MVP doit inclure un dashboard d'observabilité (§9.4) pour monitorer les performances et l'usage.

## Décision

### Phase 1: Logging structuré + métriques basiques

| Méthode | Implémentation |
|---------|---------------|
| Server logs | `console.log` structuré avec tags `[Sources]`, `[NLP]`, `[Matching]` |
| Métriques temps réel | Counters en mémoire (nb recherches, temps moyen, sources actives) |
| Dashboard | Page `/admin` ou endpoint `/api/metrics` |
| Erreurs | `console.error` avec stack trace |

### Métriques collectées

```typescript
interface Metrics {
  totalSearches: number;
  avgResponseTimeMs: number;
  sourceStats: Record<string, number>;  // { Auto24: 70, Fallback: 80 }
  topQueries: string[];                  // 10 dernières requêtes
  errorCount: number;
}
```

### Phase 2 (prévu)

- Prometheus/Grafana pour métriques time-series
- Sentry pour error tracking
- APM (Application Performance Monitoring)

## Conséquences

- Le logging structuré permet de diagnostiquer les problèmes en prod
- Le dashboard /api/metrics fournit une visibilité immédiate
- Pas de dépendance externe en Phase 1
