# Thiqti — Modele de Cout

**Ref**: VV-SLP-2026-001
**Date**: 2026-07-29
**Statut**: Active

---

## 1. Hypotheses de Cout

| Parametre | Valeur | Justification |
|-----------|--------|---------------|
| Recherches par mois | 1 000 | Cible MVP pour demo |
| Utilisateurs concurrents | 1-10 | Scenario demo/entretien |

---

## 2. Cout par Composant

### 2.1 NLP Matching

| Methode | Cout par Requete | Mensuel (1 000 req) | Notes |
|---------|------------------|---------------------|-------|
| Extraction regex | $0.000 | $0.00 | Tourne dans Node.js, pas d'appels externes |
| Matching TOPSIS | $0.000 | $0.00 | Calcul in-memory |

**Total NLP + Matching: $0.00/mois**

### 2.2 Hebergement

| Service | Cout | Plan |
|---------|------|------|
| Vercel | $0.00/mois | Hobby (100 Go bandwidth, 10s timeout) |
| Domaine | $0.00 | thiqti.vercel.app (gratuit) |

**Total Hebergement: $0.00/mois**

### 2.3 APIs Externes

| Service | Cout | Usage |
|---------|------|-------|
| Google Custom Search | $0.00 | 100 requetes/jour gratuites |
| Google CDN | $0.00 | Images hebergees gratuitement |

**Total APIs: $0.00/mois**

---

## 3. Cout Total Phase 1

| Poste | Cout Mensuel |
|-------|-------------|
| Hebergement | $0.00 |
| NLP/Matching | $0.00 |
| APIs | $0.00 |
| **Total** | **$0.00/mois** |

---

## 4. Projection Phase 2

| Poste | Cout Mensuel Estime | Notes |
|-------|---------------------|-------|
| Supabase Pro | $25.00 | Base de donnees + auth |
| Domaine personnalise | $1.00/mois | .ma domaine |
| Vercel Pro | $20.00 | Si depassement Hobby |
| **Total Phase 2** | **$46.00/mois** | |
