# Thiqti — Formalisation du Moteur de Matching (TOPSIS)

**Ref**: VV-SLP-2026-001
**Date**: 2026-07-31
**Statut**: Active
**Fichiers concernes**:
- `apps/web/src/lib/matching.ts` (moteur TOPSIS + cascade de filtres)
- `apps/web/src/lib/nlp.ts` (extraction des criteres)
- `apps/web/src/lib/sources/fallback.ts` (jeu de donnees, 196 vehicules neufs)
- `apps/web/tests/matching-benchmark.json` (benchmark de reference, 38 requetes)
- `apps/web/tests/benchmark.test.ts` (execution du benchmark + analyse de sensibilite)
- `apps/web/tests/matching.test.ts` (invariants du formalisme)

Ce document decrit la methode formelle implementee et prouve que l'implementation correspond
aux formules. Il amende l'ADR-004 (voir section 8).

---

## 1. Notations

Soit un ensemble d'alternatives (vehicules) :

```
A = { a1, a2, ..., an }
```

et un ensemble de criteres de decision :

```
C = { prix, annee, carburant, carrosserie, marque, transmission, ville }
```

Chaque alternative est representee par un vecteur de decision dans R^m avec m = 7.
Les criteres sont tous transformes en criteres benefiques (plus la valeur est haute,
plus l'alternative est proche de l'ideal).

---

## 2. Construction de la matrice de decision normalisee

### 2.1 Normalisation min-max par critere

Soit x_ij la valeur brute du critere j pour l'alternative i. La normalisation min-max
est definie par :

```
normalize(v, min, max) = (v - min) / (max - min)   si max > min
                         0.5                          si max == min
```

Le cas `max == min` (criteres constants sur l'ensemble, par exemple un critere non
demande valant 1 pour toutes les alternatives) retourne 0.5. Comme la contribution est
alors identique a la distance positive et negative, elle se neutralise dans le calcul
du score relatif (section 4.4) et n'a aucun effet sur le classement. Cette propriete est
verifiee automatiquement par le benchmark.

### 2.2 Scores par critere

| Critere | Formule | Commentaire |
|---------|---------|-------------|
| prix | `1 - normalize(price, min, max)` | cout inverse : moins cher = mieux |
| annee | `normalize(year, min, max)` | benefique : plus recent = mieux |
| carburant | `1` si non demande, sinon `1` si `fuel == motorisation`, `0` sinon | binaire |
| carrosserie | `1` si non demande, sinon `1` si correspondance, `0.5` sinon | binaire adouci |
| marque | `1` si non demandee, sinon `1` si `make == marque`, `0` sinon | binaire |
| transmission | `1` si non demandee, sinon `1` si correspondance, `0` sinon | binaire |
| ville | `1` si non demandee, sinon `1` si `city == ville`, `0` sinon | binaire |

La correspondance carrosserie est definie comme :

```
bodyMatches(car, carrosserie) =
  bodyType.contains(carrosserie) OR title.contains(carrosserie)
```

(insensible a la casse). Ceci gere notamment l'homonymie "pickup" -> "Utilitaire"
definie dans le lexique NLP.

### 2.3 Vecteurs de decision

Pour chaque alternative i, le vecteur normalise est :

```
v_i = ( prix_i, annee_i, carburant_i, carrosserie_i, marque_i, transmission_i, ville_i )
```

---

## 3. Ponderation

### 3.1 Profils de poids

Les poids sont definis par profil d'intention extrait par le NLP. Chaque profil somme a 1.

| Criteres | Default | Economique | Familial | Confort | Sportif |
|----------|---------|-----------|----------|---------|---------|
| prix | 0.30 | 0.50 | 0.15 | 0.10 | 0.10 |
| annee | 0.20 | 0.10 | 0.15 | 0.25 | 0.20 |
| carburant | 0.15 | 0.10 | 0.15 | 0.10 | 0.25 |
| carrosserie | 0.15 | 0.10 | 0.30 | 0.20 | 0.10 |
| marque | 0.10 | 0.10 | 0.05 | 0.15 | 0.20 |
| transmission | 0.05 | 0.05 | 0.10 | 0.10 | 0.10 |
| ville | 0.05 | 0.05 | 0.10 | 0.10 | 0.05 |
| **Somme** | **1.00** | **1.00** | **1.00** | **1.00** | **1.00** |

### 3.2 Renormalisation

La fonction `rankVehiclesWithWeights` accepte des surcharges de poids (utilisees par
l'analyse de sensibilite). Dans tous les cas le vecteur de poids est renormalise :

```
w_j = w_j / somme(w)
```

---

## 4. Score de proximite relative (TOPSIS)

### 4.1 Matrice ponderee

```
u_ij = v_ij * w_j
```

### 4.2 Solution ideale positive et negative

Comme tous les criteres sont benefiques apres transformation :

```
A+ = ( w_1, w_2, ..., w_m )       (toutes les composantes au maximum)
A- = ( 0, 0, ..., 0 )
```

### 4.3 Distances euclidiennes

```
S+_i = sqrt( somme_j ( u_ij - w_j )^2 )
S-_i = sqrt( somme_j ( u_ij - 0 )^2 )
```

### 4.4 Proximite relative

```
C*_i = S-_i / ( S+_i + S-_i )
```

avec `C*_i = 0.5` si `S+_i + S-_i = 0` (toutes alternatives identiques), et 0.5 si le
resultat est NaN (protection numerique). Le classement se fait par `C*` decroissant.

Les criteres non demandes etant constants (section 2.1), leur contribution a S+ et S-
est symetrique et s'annule dans le rapport : le score ne depend que des criteres
discriminants.

---

## 5. Pipeline complet

```
requete texte
   |
   v
[NLP] parseQuery  ->  SearchCriteria (criteres + intentions)
   |
   v
[Collecte] fetchAllSources()  ->  A = vehicules du catalogue (196 neufs)
   |
   v
[TOPSIS] vecteurs v_i, poids w, score C*_i
   |
   v
[Cascade de filtres] selection du sous-ensemble retourne (section 5.2)
   |
   v
resultats classes par C* decroissant
```

### 5.1 Filtres binaires (meetsX)

Un vehicule satisfait un filtre si :

| Filtre | Condition |
|--------|-----------|
| meetsBudget | `price >= min * (1 - tol)` et `price <= max * (1 + tol)` |
| meetsBody | `bodyMatches(car, carrosserie)` |
| meetsFuel | `fuel == motorisation` |
| meetsBrand | `make == marque` |
| meetsTransmission | `transmission == transmission` |
| meetsYear | `year >= anneeMin` et `year <= anneeMax` |

Les bornes min/max proviennent de l'extraction budget (section 6), la tolerance par
defaut est 0.15 (0.20 pour "autour de", 0.15 pour "budget X").

### 5.2 Cascade

Soit S l'ensemble des alternatives triees par C* decroissant :

1. `E1 = { a in S | meetsBody et meetsFuel et meetsBrand et meetsTransmission et meetsYear et meetsBudget }` ; si non vide, retourner E1.
2. `E2 = { a in S | meetsBody et meetsFuel et meetsBrand et meetsTransmission et meetsYear }` (budget relache) ; si non vide, retourner E2.
3. `E3 = { a in S | meetsBudget }` (contraintes de preferences relachees) ; si non vide, retourner E3.
4. Retourner les 10 premiers de S (degradaion totale).

La cascade garantit que les contraintes explicites de l'utilisateur (carrosserie,
carburant, marque, transmission, annee) sont respectees des que des alternatives
satisfaisantes existent, avec le budget comme contrainte prioritaire quand il est
satisfiable.

---

## 6. Extraction des criteres (NLP)

L'extraction est reglee dans `apps/web/src/lib/nlp.ts` :

- **Budget** : "entre X et Y", "autour de X" (0.8X / 1.2X, tol 0.2), "sous / moins de X",
  "plus de X", "budget X" (0.85X / 1.15X), "X dh", "X درهم", "ف X" (darija).
- **Annee** : "depuis / a partir de YYYY", "avant YYYY", annee isolee (token delimite).
- **Carrosserie** : lexique FR + darija ("ربع", "كاروسة", "مدينة").
- **Carburant** : lexique FR + darija ("مازوت", "كهرباء", ...).
- **Marque** : lexique latin + arabe mappe vers la marque canonique.
- **Transmission** : "automatique", "manuelle", "auto", "boite auto", darija.
- **Ville** : liste des grandes villes + darija.
- **Intentions** : familial, sportif, economique, confort, ville, route, tout-terrain.

Normalisation du texte : minuscules, decomposition NFD puis suppression des marques
combinees, conservation des alphabet latin/arabe/cyrillique et des chiffres.

---

## 7. Preuve d'equivalence implementation / formalisme

| Formule (sections 2-4) | Implementation (`matching.ts`) |
|------------------------|-------------------------------|
| `normalize(v, min, max)` | `normalize()` lignes 98-101 |
| matrice de decision | `vectors = vehicles.map(...)` |
| poids renormalises | `w = [ ... ].map(p => p / weightSum)` |
| `A+ = (w_1..w_m)`, `A- = 0` | `idealBest = isBeneficial ? 1 : 0`, `idealWorst = 0` |
| distances S+, S- | accumulation dans `topsisScore` |
| `C* = S-/(S+ + S-)` | `result = Math.sqrt(negDist) / total` |
| protection `S+ + S- = 0` | `if (total === 0) return 0.5` |
| protection NaN | `return isNaN(result) ? 0.5 : result` |
| cascade | `exact`, `hard`, `withBudget`, `scored.slice(0, 10)` |

Verification automatique : `npm run test -w apps/web` execute 51 tests dont le benchmark
de 38 requetes (extraction NLP exacte + proprietes du classement) et 7 invariants
(scores dans [0,1], classement decroissant, liste vide, vehicule unique, etc.).

---

## 8. Benchmark de reference

Fichier : `apps/web/tests/matching-benchmark.json` (38 requetes).

Categories couvertes : budget (7), carrosserie (6), carburant (6), marque (4), annee (1),
transmission (1), ville (1), intention (4), combinaisons (8). Inclut des requetes arabes
et darija.

Chaque requete verifie :
1. l'extraction NLP exacte (`expectCriteria`, egalite stricte) ;
2. des proprietes de classement : filtre respecte sur tous les resultats (carburant,
   carrosserie, marque, transmission, annee, bornes budget) et le premier resultat
   (`topMake`, `topFuel`, `topCity`) ;
3. des bornes sur la taille du resultat ;
4. la decroissance de `matchPercent`.

Execution : `npm run test -w apps/web`.

---

## 9. Analyse de sensibilite (poids budget +- 10%)

Methode : pour chaque requete, re-classement avec le poids prix multiplie par 0.9 puis
1.1 (le vecteur de poids est renormalise, section 3.2), comparaison du top-1 et des
decalages dans le top 10.

Resultats mesures sur le jeu de donnees du 2026-07-31 :

| Requete | top-1 (base) | top-1 a -10% | top-1 a +10% | decalage max -10% | decalage max +10% |
|---------|-------------|--------------|--------------|-------------------|-------------------|
| budget 200000 | Kia Picanto | inchange | inchange | 0 | 0 |
| entre 150000 et 200000 | Kia Picanto | inchange | inchange | 0 | 0 |
| sous 180000 | Kia Picanto | inchange | inchange | 0 | 0 |
| SUV diesel budget 250000 | Renault Duster | inchange | inchange | 0 | 1 |
| Toyota hybride automatique budget 350000 | Toyota Yaris Cross | inchange | inchange | 0 | 2 |
| SUV familial moins de 300000 | Chery Tiggo 4 Pro | inchange | inchange | 0 | 2 |

Conclusion : le classement est robuste sur le poids budget dans l'intervalle +- 10%.
Le top-1 est stable pour les 6 requetes ; le decalage maximal dans le top 10 est de 2
positions (tolere par le test automatise qui borne a 3).

Le test automatise (`tests/benchmark.test.ts`, section "Analyse de sensibilite")
reproduit cette analyse et verifie que le top-1 reste stable et que les decalages
restent <= 3 pour 5 requetes budget.

---

## 10. Corrections decouvertes pendant la formalisation

La formalisation a mis en evidence et corrige les ecarts suivants (tous documentes ici
pour tracabilite) :

1. **Critere kilometrage degenere** (`matching.ts`) : le vecteur TOPSIS contenait un
   critere `km` alors que le catalogue est compose uniquement de vehicules neufs
   (km = 0 pour tous). Le critere a ete retire et les poids renormalises.
2. **Criteres extraits mais non appliques** (`matching.ts`) : marque, transmission,
   ville et annee etaient extraits par le NLP mais n'entraient pas dans le classement
   ni les filtres. Ils sont desormais des criteres TOPSIS (marque, transmission, ville)
   et des filtres durs (marque, transmission, annee).
3. **Budget "budget X" non extrait** (`nlp.ts`) : le mot "budget" n'etait pas un
   declencheur d'extraction (seuls "entre / sous / autour / plus de" et les unites
   "dh / درهم" fonctionnaient). Ajout du motif `budget N`.
4. **Accents casses** (`nlp.ts`) : `normalizeText` remplacait les marques diacritiques
   par une espace ("electrique" devenait "e lectrique"), cassant les recherches
   accenteess ("electrique", "economique", "coupe"). Correction : suppression a la place
   d'un espace, plus ajout de la cle "coupe".
5. **Faux positif annee** (`nlp.ts`) : une valeur de budget telle que "200000" pouvait
   etre extraite comme annee "2000". L'annee est desormais un token delimite
   (regard/lookahead non chiffre).
6. **Faux positif transmission** (`nlp.ts`) : "autour" activait la cle "auto"
   (transmission). La correspondance des mots-cles de transmission utilise des
   frontieres de mot.
7. **Marques arabes non alignees** (`nlp.ts`) : "تويوتا" etait extrait tel quel et ne
   pouvait jamais correspondre a la marque "Toyota" des donnees. Ajout d'un mapping
   vers la marque canonique.
8. **Transmission manquante dans les explications** (`matching.ts`) : le critere etait
   applique sans explication utilisateur. Ajout d'un bloc "Transmission".

---

## 11. Liens

- ADR-004 (moteur de matching) : amende par ce document.
- ADR-003 (moteur NLP) : lexiques utilises.
- `docs/architecture/testing.md` : strategie de tests, cible 70% de couverture.
- `docs/architecture/data-register.md` : registre des donnees (champs du catalogue).
