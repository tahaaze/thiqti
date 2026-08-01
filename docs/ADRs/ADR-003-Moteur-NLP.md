# ADR-003: Moteur NLP

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Le moteur NLP doit analyser des avis consommateurs en arabe, francais, anglais et extraire des entites (marque, modele, probleme) avec un score de sentiment.

## Options Considerees

### Option A (rejetee): API LLM externe (OpenAI / Claude)

- **Avantages**: Precision elevee, comprehension multilingue native, extraction d'entites fiable
- **Inconvenients**: Cout par requete, latence (>1s), dependance externe, donnees envoyees a un tiers
- **Motif du rejet**: Cout recurrent non budgetise; latence incompatible avec le budget <500ms; donnees utilisateurs exposees

### Option B (rejetee): Modele local Python (HuggingFace + FastAPI)

- **Avantages**: Performance, controle des donnees, pas de cout recurrent
- **Inconvenients**: Necessite un serveur Python separe, modele lourd (>2Go RAM), cold start lent
- **Motif du rejet**: Complexite d'infrastructure injustifiee pour Phase 1; le volume d'avis estime (< 1000/mois) ne justifie pas un microservice dedie

### Option C (retenue): NLP rule-based en TypeScript (regex + dictionnaires)

- **Tokenization**: Decoupage par espaces et ponctuation
- **Stemming**: Dictionnaire racines arabes/francais (fichier JSON)
- **Sentiment**: Lexique de termes positifs/negatifs multilingue
- **Entites**: Regex patterns pour marques, modeles, annees

## Decision

Moteur NLP rule-based en TypeScript avec regex, dictionnaires de stems, et lexiques de sentiment.

## Consequences

- **Positif**: Zero cout d'infrastructure, execution dans le meme processus Node.js, latence < 10ms
- **Negatif**: Couverture linguistique limitee aux termes dans les dictionnaires; pas de comprehension contextuelle
- **Risque**: Les avis en arabe dialectal (Darija) auront une precision reduite; mitigation: enrichir les dictionnaires avec des termes collectes lors des tests utilisateur
