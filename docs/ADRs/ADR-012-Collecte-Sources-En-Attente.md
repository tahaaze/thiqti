# ADR-012: Collecte de Sources en Attente

**Statut**: Accepte (partiellement resolu le 2026-08-12)
**Date**: 2026-08-04
**Decideurs**: Equipe Thiqti
**Ref**: VV-SLP-2026-001
**Conformite**: Cahier des charges section 7.3

## Contexte

Le cahier des charges (section 7.3) subordonne toute collecte de donnees
externe (vehicules ou avis) a une validation par ecrit des sources par
l'encadrant. La dependance J0 n'a pas ete honoree initialement : la liste des
sources n'avait pas ete communiquee a l'equipe. L'ADR-005 (decision initiale)
avait rejete les sources Auto24, Avito et SoeezAuto (risque legal, loi 09-08
article 4).

Sans infrastructure preparee, la reception tardive de la liste des sources
rallongerait l'integration. Sans garde-fou, une integration prematuree
violerait la section 7.3 du cahier des charges et la loi 09-08.

## Options Considerees

### Option A (rejetee): Activer une collecte des maintenant

- **Avantages**: Donnees fraiches immediatement, catalogue automatise
- **Inconvenients**: Violation de la section 7.3 (aucune source validee par
  ecrit), risque legal (loi 09-08 article 4), reactivation implicite de sources
  deja desactivees (Auto24, Avito, SoeezAuto)
- **Motif du rejet**: La lecite n'est pas verifiee; aucune source n'est
  autorisee a ce stade

### Option B (rejetee): Ne rien preparer et attendre la liste

- **Avantages**: Zero code ni documentation "en attente"
- **Inconvenients**: Integration rallongee des que la liste arrive; aucun cadre
  d'enregistrement des sources; tracabilite nulle
- **Motif du rejet**: L'etat de preparation et la tracabilite de la decision
  sont des livrables attendus en soutenance

### Option C (retenue): Preparer l'infrastructure, sans rien collecter

- **Interface**: `AuthorizedSource` dans `apps/web/src/lib/sources/collector.ts`
  (nom, URL de base, methode de collecte, frequence, statut de lecite avec date
  de verification, robots.txt / conditions d'utilisation).
- **Registre**: `docs/architecture/sources-registre.md`, vide et pret a remplir,
  avec exemple grise de format.
- **Rafraichissement**: mecanisme quotidien documente dans le registre et en
  commentaire d'`aggregator.ts`, sans cron fonctionnel.
- **Comportement**: dataset statique fallback inchange comme secours.

## Decision

Preparer l'infrastructure de collecte (interface + registre + mecanisme de
rafraichissement documente) sans activer aucune source, et ne rien collecter
tant que la lecite n'est pas verifiee par ecrit par l'encadrant (Volund),
conformement a la section 7.3 du cahier des charges.

## Consequences

- **Positif**: Infrastructure prer a recevoir la liste des sources des
  validation; tracabilite de la decision (ADR + registre); zero risque legal;
  comportement applicatif strictement inchange.
- **Negatif**: Aucune donnee externe collectee ce jour; le catalogue reste
  alimente par le dataset statique construit manuellement.
- **Risque**: La liste des sources peut ne jamais arriver (J0 indefini);
  mitigation: suivi formel du J0, relance de l'encadrant, et procedure de
  bascule manuelle documentee.

## Mise a jour (2026-08-12)

La dependance J0 est partiellement levee : l'encadrant de stage (Younes
Boumalek) et la direction (Zakaria Sabti) ont autorise par ecrit les sources
**Auto24.ma** et **Avito.ma** (voir l'ADR-005, section "Mise a jour"). Le
statut "en attente" est leve pour ces deux sources : elles sont declarees
`valide` dans `apps/web/src/lib/sources/collector.ts` et inscrites au registre
des sources (`docs/architecture/sources-registre.md`). Le mecanisme prepare
(interface `AuthorizedSource`, registre, rafraichissement documente) reste
inchange et sert desormais de cadre d'enregistrement des sources autorisees.
SoeezAuto demeure non autorisee.
