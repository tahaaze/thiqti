# ADR-004: Moteur de Matching Multicritère

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Mohamed Taha Ait Ouahammi, Adam Chouikh
**Réf**: VV-SLP-2026-001, §7.4

## Contexte

Le moteur de matching doit classer les véhicules par pertinence par rapport aux critères extraits par le NLP, tout en fournissant une explication pour chaque résultat.

## Décision

### Algorithme: TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)

TOPSIS est une méthode MCDM (Multi-Criteria Decision Making) qui:
1. Normalise les critères (prix, année, kilométrage, correspondance carburant, correspondance carrosserie)
2. Calcule les distances à l'idéal positif et négatif
3. Donne un score de 0 à 1 (closer to 1 = better)

### Pondérations adaptatives

| Profil détecté | Prix | Année | Km | Carburant | Carrosserie |
|---------------|------|-------|----|-----------|-------------|
| Défaut | 0.30 | 0.20 | 0.20 | 0.15 | 0.15 |
| Économique | 0.50 | 0.10 | 0.15 | 0.10 | 0.15 |
| Familial | 0.20 | 0.15 | 0.25 | 0.15 | 0.25 |
| Confort | 0.15 | 0.30 | 0.20 | 0.15 | 0.20 |
| Sportif | 0.15 | 0.25 | 0.15 | 0.25 | 0.20 |

### Filtrage hiérarchique

```
1. Priorité: véhicules correspondant bodyType + fuel demandés
2. Fallback: véhicules dans le budget
3. Dernier recours: top 10 par score TOPSIS
```

### Explicabilité

Chaque résultat inclut `MatchExplanation[]`:
```typescript
interface MatchExplanation {
  label: string;        // "Budget", "Carrosserie", ...
  value: string;        // "350 000 DH"
  impact: "positive" | "negative" | "neutral";
  reason: string;       // "Dans votre budget"
}
```

## Implémentation

- `src/lib/matching.ts`: fonction `rankVehicles()` + `topsisScore()` + `buildExplanations()`
- Score final: `baseScore * 0.4 + matchScore * 100 * 0.6`
- Tri par `matchScore` décroissant

## Alternatives considérées

| Option | Avantage | Inconvénient | Choix |
|--------|----------|-------------|-------|
| TOPSIS | Simple, interprétable, rapide | Sensible aux poids fixes | **Retenu** |
| AHP (pairwise) | Poids plus rigoureux | Complexe à implémenter | Reporté Phase 2 |
| BWM (Best-Worst) | Moins de comparaisons qu'AHP | Même complexité | Reporté Phase 2 |
| VIKOR | Gère les compromis | Moins intuitif | Rejeté |
| Simple scoring | Ultra-simple | Pas de normalisation multicritère | Rejeté |

## Conséquences

- TOPSIS est un standard reconnu en recherche opérationnelle (30+ références citées dans le §12.3)
- La sensibilité aux poids sera testée (§12.3, Piste A)
- L'explicabilité est-native (chaque critère génère une explication)
