# ADR-006: Barometre de Reputation

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Le barometre doit agreger des avis consommateurs multilingues (arabe, francais, anglais) et produire un score de reputation fiable par modele/marque.

## Options Considerees

### Option A (rejetee): API de sentiment tierce (MeaningCloud, Aylien)

- **Avantages**: Precision, multilingue pret a l'emploi, pas de maintenance NLP
- **Inconvenients**: Cout par appel, donnees envoyees a un tiers, dependance externe
- **Motif du rejet**: Cout recurrent; latence reseau; les donnees d'avis utilisateurs ne doivent pas quitter le serveur

### Option B (rejetee): Modele BERT multilingue fine-tuné (mBERT)

- **Avantages**: Etat de l'art en sentiment, support arabe natif
- **Inconvenients**: GPU requis, inference lente sans acceleration, modele >500Mo
- **Motif du rejet**: Impossibe a heberger sur Vercel (serverless, limite 50Mo); necessite un serveur Python dedie non prevu au budget

### Option C (retenue): Lexique de termes positif/negatif + scoring pondere

- **Lexiques**: Fichiers JSON par langue (arabe/francais/anglais) avec poids (-2 a +2)
- **Pipeline**: Tokenisation -> filtrage stopwords -> lookup lexique -> moyenne ponderee -> normalisation [-1, +1]
- **Aggregation**: Moyenne par modele, ponderee par recence (avis plus recents = poids plus eleve)

## Decision

Barometre base sur lexiques multilingues avec scoring pondere, sans apprentissage automatique.

## Consequences

- **Positif**: Execution < 5ms par avis, zero cout, controle total des donnees, pas de GPU requis
- **Negatif**: Couverture lexicale limitee; sarcasme et contexte non detectes
- **Risque**: Les avis en Darija melangeant arabe/francais peuvent etre mal interpretes; mitigation: ajout progressif de termes Darija dans les lexiques
