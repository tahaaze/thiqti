# ADR-003: Moteur NLP (Analyse de Requêtes)

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Adam Chouikh, Younes Boumalek
**Réf**: VV-SLP-2026-001, §3.4

## Contexte

L'utilisateur tape une requête en langage naturel (ex: "SUV hybride autour de 350 000 DH"). Le moteur doit extraire des critères structurés de cette requête.

## Décision

### Approche: Rule-based NLP (regex + dictionnaires)

Le moteur `src/lib/nlp.ts` utilise:
1. **Normalisation**: lowercasing, suppression diacritiques (NFD), nettoyage
2. **Extraction par dictionnaire**: carrosseries (9 types), motorisations (5 types), marques (30+), villes (15)
3. **Extraction par regex**: budget ("autour de X", "sous X", "entre X et Y"), année ("depuis 2022"), kilométrage ("moins de 50 000 km")
4. **Détection d'intention**: familial, sportif, économique, confort, ville, route, tout-terrain

### Sortie: `SearchCriteria`

```typescript
interface SearchCriteria {
  carrosserie: string | null;      // "SUV", "Berline", ...
  motorisation: string | null;     // "Hybride", "Diesel", ...
  transmission: string | null;     // "Automatique", "Manuelle"
  marque: string | null;           // "Toyota", "Dacia", ...
  budgetMin: number | null;
  budgetMax: number | null;
  budgetTolerance: number;         // 0.15 ou 0.20 pour "autour de"
  ville: string | null;
  anneeMin: number | null;
  anneeMax: number | null;
  kmMax: number | null;
  intent: string[];                // ["familial", "economique"]
}
```

### Tolérance budget

- "autour de 350 000" → min=280K, max=420K (tolérance ±20%)
- "sous 300 000" → max=300K (tolérance 15%)
- "entre 200K et 400K" → min=200K, max=400K (tolérance 0%)

## Alternatives considérées

| Option | Avantage | Inconvénient | Choix |
|--------|----------|-------------|-------|
| Regex/dictionnaires | Rapide, pas de dépendance | Limité au vocabulaire défini | **Retenu** |
| LLM (GPT/Claude) | Compréhension riche | Coût API, latence, dépendance externe | Rejeté Phase 1 |
| Modèle local (spaCy/fr_core_news) | Bonne qualité | Poids modèle, setup complexe | Reporté Phase 2 |

## Conséquences

- **Positif**: Aucune dépendance externe, latence < 10ms, debug facile
- **Négatif**: Ne comprend pas les formulations non prévues (ex: "je veux un truc spacieux pour la famille")
- **Évolution Phase 2**: Remplacer par fine-tuning d'un modèle NLP ou intégration LLM pour la compréhension contextuelle
