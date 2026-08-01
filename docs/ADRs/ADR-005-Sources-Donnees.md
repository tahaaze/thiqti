# ADR-005: Strategie de Collecte de Donnees

**Statut**: Accepte
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Thiqti doit alimenter son catalogue de vehicules neufs et d'occasion. Les sources externes (Auto24, Avito, SoeezAuto) presentent des risques legaux et techniques.

## Options Considerees

### Option A (rejetee): Scraping Playwright avec proxy tournant

- **Avantages**: Donnees fraiches, couverture large, automatisation
- **Inconvenients**: Risque legal (loi 09-08 protection donnees), blocage IP, maintenance continue, cout d'infrastructure
- **Motif du rejet**: Non-conforme a l'article 4 de la loi 09-08 (collecte sans consentement explicite); cout d'infrastructure recurrent; rate-limite par les plateformes

### Option B (rejetee): API partenaires (concessionnaires, constructeurs)

- **Avantages**: Donnees officielles, legal, fiable
- **Inconvenients**: Negociation contrat, NDA, developpement integration, cout
- **Motif du rejet**: Impossible a obtenir dans le cadre d'un projet de stage (3 mois); les API constructeurs sont fermees aux tiers

### Option C (retenue): Dataset statique construit manuellement

- **Source**: Donnees constructeurs collectees manuellement (fiches techniques, catalogues officiels)
- **Couverture**: 196 vehicules neufs disponibles au Maroc (tous les segments)
- **Mise a jour**: Manuelle, par mise a jour du fichier TypeScript
- **Processus**: Validation par verification croisee de 2 membres de l'equipe avant PR

## Decision

Dataset statique construit manuellement, sans collecte automatisee, en attendant une etude de conformite legale approfondie.

## Consequences

- **Positif**: Zero risque legal, zero cout d'infrastructure, donnees maitrisees
- **Negatif**: Mise a jour manuelle, fraicheur limitee, couverture restreinte
- **Risque**: Le catalogue peut devenir obsolete si les prix constructeurs changent; mitigation: revue trimestrielle du dataset
