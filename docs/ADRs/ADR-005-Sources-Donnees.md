# ADR-005: Strategie de Collecte de Donnees

**Statut**: Accepte (amende le 2026-08-12)
**Date**: 2026-07-29
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001

## Contexte

Thiqti doit alimenter son catalogue de vehicules neufs et d'occasion. Les sources externes (Auto24, Avito, SoeezAuto) presentaient des risques legaux et techniques, ce qui a conduit au choix initial d'un dataset statique (decision initiale ci-dessous, 2026-07-29).

## Options Considerees (historique initial, 2026-07-29)

### Option A (rejetee): Scraping Playwright avec proxy tournant

- **Avantages**: Donnees fraiches, couverture large, automatisation
- **Inconvenients**: Risque legal (loi 09-08 protection donnees), blocage IP, maintenance continue, cout d'infrastructure
- **Motif du rejet**: Non-conforme a l'article 4 de la loi 09-08 (collecte sans consentement explicite); cout d'infrastructure recurrent; rate-limite par les plateformes

### Option B (rejetee): API partenaires (concessionnaires, constructeurs)

- **Avantages**: Donnees officielles, legal, fiable
- **Inconvenients**: Negociation contrat, NDA, developpement integration, cout
- **Motif du rejet**: Impossible a obtenir dans le cadre d'un projet de stage (3 mois); les API constructeurs sont fermees aux tiers

### Option C (retenue initialement): Dataset statique construit manuellement

- **Source**: Donnees constructeurs collectees manuellement (fiches techniques, catalogues officiels)
- **Couverture**: 196 vehicules neufs disponibles au Maroc (tous les segments)
- **Mise a jour**: Manuelle, par mise a jour du fichier TypeScript
- **Processus**: Validation par verification croisee de 2 membres de l'equipe avant PR

## Decision

### Decision initiale (2026-07-29)

Dataset statique construit manuellement, sans collecte automatisee, en attendant une etude de conformite legale approfondie.

### Decision amendee (2026-08-12)

Auto24.ma et Avito.ma sont **autorisees** comme sources de donnees (validation par ecrit de l'encadrant, voir section "Mise a jour" ci-dessous). Elles alimentent l'agregateur multi-sources (`apps/web/src/lib/sources/aggregator.ts`) aux cotes des autres sources actives (Autera.ma, Moteur.ma, ElectroDrive.ma, AutoHall.ma, Moteur-Neuf). **SoeezAuto reste rejetee** (aucune autorisation, non utilisee par l'agregateur). Le dataset statique (`apps/web/src/lib/sources/fallback.ts`, 196 vehicules) conserve son role de secours lorsque toutes les sources live echouent.

## Consequences

- **Positif**: Catalogue alimente par de vraies annonces marocaines (prix MAD, km, photos, contact); sources autorisees et documentees; le dataset statique conserve un role de secours sans risque.
- **Negatif**: Les donnees live sont moins stables que le dataset maitrise (lenteurs de chargement, sources parfois vides); la fraicheur du catalogue depend des sources.
- **Risque**: Changement de format des sources; mitigation: anti-regression dans `aggregator.ts` (un rechargement partiel ne remplace jamais un catalogue plus riche) et fallback en secours.

## Mise a jour (2026-08-12)

Autorisation des sources Auto24.ma et Avito.ma.

- **Autorisation accordee par**: encadrant de stage **Younes Boumalek** / direction (**Zakaria Sabti**).
- **Date**: 2026-08-12.
- **Nature**: validation par ecrit des sources, conformement au cahier des charges section 7.3.
- **Portee**: Auto24.ma (annonces occasion) et Avito.ma (annonces occasion) autorisees comme sources de donnees. SoeezAuto demeure rejetee.
- **Tracabilite**: l'ancienne decision (rejet de ces sources) est conservee ci-dessus a titre historique, elle n'est pas reecrite. Le registre des sources (`docs/architecture/sources-registre.md`) et `apps/web/src/lib/sources/collector.ts` ont ete mis a jour en consequence a la meme date.
