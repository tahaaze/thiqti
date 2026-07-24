# ADR-006: Baromètre d'E-Réputation

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Adam Chouikh, Younes Boumalek
**Réf**: VV-SLP-2026-001, §3.6

## Contexte

Chaque fiche véhicule doit afficher un baromètre d'e-réputation aggregant les avis sur un modèle. Le baromètre doit être fiable et transparent.

## Décision

### Seuil de fiabilité

- **Minimum 30 avis** exploitables avant publication du score
- En dessous de 30: afficher le volume, pas le score (avec indicateur "En collecte")
- Pourcentage de complétion: `{total}/30`

### Données affichées

| Élément | Condition | Affichage |
|---------|-----------|-----------|
| Score global | >= 30 avis | Note /100 |
| Volume | Toujours | "{total} avis collectés" |
| Répartition | Toujours | positif/négatif/neutre |
| Fenêtre | Toujours | "12 mois" + date dernière MAJ |
| Catégories | >= 30 avis | 6 anneaux (Confort, Consommation, Fiabilité, Qualité/Prix, Tenue de route, Finition) |
| Excerpts | Toujours | Anonymisés, 6 max |
| Incertitude | < 30 avis | Badge jaune "Seuil insuffisant" |

### Excerpts anonymisés

- Pas de nom d'auteur affiché
- "Utilisateur anonyme" + lettre aléatoire (A, B, C...)
- Texte tronqué à 200 caractères
- Sentiment: positif/négatif/neutre

### API

```
GET /api/reputation?make=Toyota&model=RAV4
```

Réponse:
```json
{
  "modelKey": "toyota_rav4",
  "totalReviews": 42,
  "avgScore": 78,
  "windowMonths": 12,
  "categories": [...],
  "excerpts": [...],
  "volume": { "total": 42, "positive": 28, "negative": 8, "neutral": 6 }
}
```

## Phase 1 vs Phase 2

| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| Source des avis | Génération déterministe (seed) | Scraping sites d'avis |
| Score | Simulé | Calculé à partir de vrais avis |
| Persistance | Mémoire (reset au restart) | PostgreSQL |
| Seuil | 30 avis | 30 avis (inchangé) |

## Conséquences

- Le seuil de 30 avis est un standard journalistique/produit pour la fiabilité statistique
- L'anonymisation protège la vie privée (RGPD-compatible)
- La fenêtre de 12 mois évite l'obsolescence des scores
