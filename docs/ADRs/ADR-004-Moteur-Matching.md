# ADR-004: Moteur de Matching Multicritere

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Le moteur de matching doit classer des vehicules selon la requete texte de l'utilisateur en combinant similarite textuelle, filtres de prix, budget essence/ permis, et preference reputation.

## Options Considerees

### Option A (rejetee): Matching par embedding vectoriel pur (pgvector + OpenAI embeddings)

- **Avantages**: Comprisension semantique, pas de regles explicites, passage a l'echelle
- **Inconvenients**: Cout API embeddings, necessite PostgreSQL, opacite du scoring
- **Motif du rejet**: Opacite non conforme a l'exigence CDC de "methode formelle documentee"; cout recurrent; indisponible en Phase 1 (pas de DB)

### Option B (rejetee): Simple filtrage SQL (WHERE + ORDER BY)

- **Avantages**: Performant, simple, transparent
- **Inconvenients**: Pas de scoring inter-criteres, pas de classement pertinent (ordre alphabetique ou prix uniquement)
- **Motif du rejet**: La requete "citadine fiable" ne peut pas etre traduite en SQL; necessite un scoring multicritere

### Option C (retenue): TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)

- **Definition**: Methode MCDA classant les alternatives selon leur distance a une solution ideale et une solution anti-ideale
- **Criteres**: Prix (negatif), consommation (negatif), puissance (positif), fiabilite note (positif), budget essence (binaire), budget permis (binaire)
- **Ponderation**: Definie dans un fichier JSON (`config/topsis-weights.json`), ajustable sans deployement
- **Pipeline**: 1) Filtrage pre-TOPSIS (prix max, type, budget), 2) Normalisation vectorielle, 3) Calcul distances ideale/anti-ideale, 4) Score de similarite relatif

## Decision

TOPSIS comme methode de matching, avec ponderation configurable et pipeline en 4 etapes.

## Consequences

- **Positif**: Methode transparente et documentee, conforme CDC; ponderation ajustable sans code; execution < 50ms pour 200 vehicules
- **Negatif**: Pas d'apprentissage automatique; les poids sont statiques jusqu'a revision manuelle
- **Risque**: Si le nombre de criteres depasse 15, la normalisation vectiorielle peut devenir instable; mitigation: limiter a 10 criteres max

---

## Amendement (2026-07-31)

La formalisation complete de l'implementation (mathematiques, preuve d'equivalence,
benchmark de 38 requetes, analyse de sensibilite) est documentee dans
`docs/architecture/matching-formalisation.md`.

La liste initiale de criteres (consommation, puissance, fiabilite, budget essence,
budget permis) refletait l'ambition de la phase 2. En phase 1, le catalogue est limite
aux vehicules neufs et les champs disponibles sont : prix, annee, carburant,
carrosserie, marque, transmission, ville. L'implementation TOPSIS porte donc sur ces
7 criteres (voir la table des poids du document de formalisation). Les criteres
consommation/puissance/fiabilite restent a ajouter en phase 2 quand les donnees seront
disponibles (collecteurs reels, barometre reputation ADR-006).

Corrections apportees a l'implementation pendant la formalisation : retrait du critere
kilometrage (degenere sur un catalogue de vehicules neufs), application effective des
criteres marque/transmission/ville/annee au classement et aux filtres durs, correction
de bugs d'extraction NLP (budget "budget X", accents, faux positifs annee et
transmission, marques arabes). Detail dans la section 10 du document de formalisation.
