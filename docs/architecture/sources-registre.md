# Thiqti — Registre des Sources de Collecte

**Statut**: Actif (Auto24.ma et Avito.ma validees le 2026-08-12)
**Date**: 2026-08-04
**Ref**: VV-SLP-2026-001
**Conformite**: Cahier des charges section 7.3 — toute collecte externe exige une validation par ecrit de l'encadrant (Volund) avant mise en service.

---

## 1. Objet

Ce registre liste les sources autorisees a alimenter le catalogue vehicules et
les avis de Thiqti. Le 2026-08-12, l'encadrant de stage (Younes Boumalek) et
la direction (Zakaria Sabti) ont autorise par ecrit les sources **Auto24.ma**
et **Avito.ma** (voir ADR-005, section "Mise a jour"). Ces deux sources sont
desormais actives dans l'agregateur (`apps/web/src/lib/sources/aggregator.ts`),
tout comme les autres sources live qu'il charge deja (voir tableau ci-dessous).

| Type de donnee | Categories de sources attendues |
|---|---|
| Vehicules | Constructeur, concession, presse specialisee, places de marche |
| Avis | Reseau social, forum, presse specialisee |

---

## 2. Registre des sources

> Remplir uniquement apres validation par ecrit de chaque source.
> Statuts possibles : `a_verifier` / `valide` / `rejete`.

| Nom de la source | Type | URL | Statut de lecite | Date de verification | robots.txt verifie | Conditions d'utilisation verifiees |
|---|---|---|---|---|---|---|
| Auto24.ma | place de marche | https://www.auto24.ma | valide | 2026-08-12 | Oui | Oui |
| Avito.ma | place de marche | https://www.avito.ma | valide | 2026-08-12 | Oui | Oui |
| Autera.ma | place de marche | https://autera.ma | a_verifier | — | Non | Non |
| Moteur.ma | presse specialisee | https://www.moteur.ma | a_verifier | — | Non | Non |
| ElectroDrive.ma | concession | https://electrodrive.ma | a_verifier | — | Non | Non |
| AutoHall.ma | place de marche | https://autohall.ma | a_verifier | — | Non | Non |
| Moteur-Neuf | constructeur | https://www.moteur.ma/neuf | a_verifier | — | Non | Non |

> Note: les cinq sources marquees `a_verifier` sont deja chargees par
> l'agregateur (celles qui alimentent le catalogue en live). Leur validation
> formelle ecrite reste a obtenir pour etre portees a `valide` dans ce registre
> et dans `apps/web/src/lib/sources/collector.ts`.

---

## 3. Exemple de remplissage (ligne grisee, DONNEES FICTIVES — a supprimer)

La ligne ci-dessous n'illustre que le format attendu. Son contenu est fictif et
ne constitue en aucun cas une source reelle ou validee.

<table>
<thead>
<tr><th>Nom de la source</th><th>Type</th><th>URL</th><th>Statut de lecite</th><th>Date de verification</th><th>robots.txt verifie</th><th>Conditions d'utilisation verifiees</th></tr>
</thead>
<tbody>
<tr style="color:#9ca3af;">
<td><em>Exemple Constructeur SA</em></td>
<td><em>constructeur</em></td>
<td><em>https://exemple-constructeur.ma/api</em></td>
<td><em>a_verifier</em></td>
<td><em>—</em></td>
<td><em>Non</em></td>
<td><em>Non</em></td>
</tr>
</tbody>
</table>

---

## 4. Mecanisme de rafraichissement quotidien (documente)

Aucun job planifie (cron) n'est fonctionnel a ce jour : la collecte des sources
live (Auto24.ma, Avito.ma et les autres sources de l'agregateur) est declenchee
a la demande via `aggregator.ts`, avec cache memoire TTL 10 min + cache disque.
Le mecanisme suivant est **documente**, a activer quand un rafraichissement
planifie sera souhaite. Il s'articule avec l'aggregator existant
(`apps/web/src/lib/sources/aggregator.ts`).

1. Un job quotidien (ex. Vercel Cron `cron: "0 6 * * *"` ou `node-cron`)
   appellerait une fonction `refreshCatalogue()`.
2. `refreshCatalogue()` itere `AUTHORIZED_SOURCES`
   (`apps/web/src/lib/sources/collector.ts`) et ne conserve que les entrees
   `licityStatus === "valide"`.
3. Chaque collecteur autorise renvoie des `UnifiedCar[]` qui remplacent ou
   fusionnent le cache actuel de `getCars()` (TTL actuel 10 minutes).
4. **Secours inchange** : le dataset statique fallback
   (`apps/web/src/lib/sources/fallback.ts`) reste le comportement par defaut si
   aucune source n'est active ou si une source echoue.
5. Garde-fous obligatoires a la mise en service : robots.txt verifie,
   conditions d'utilisation verifiees, frequence <= `refreshIntervalHours`,
   aucune donnee personnelle collectee (registre des traitements
   `docs/architecture/data-register.md`).

**Activation d'un cron** : `COLLECTION_ENABLED=true` + au moins une entree
`valide` dans le registre (c'est le cas pour Auto24.ma et Avito.ma depuis le
2026-08-12). Tant qu'aucun job n'est planifie, la collecte reste declenchee a
la demande par l'agregateur.

---

## 5. Suivi

| Date | Evenement |
|---|---|
| 2026-08-04 | Registre cree, vide. Dependance J0 (liste des sources) non honoree. Aucune collecte active. |
| 2026-08-12 | Auto24.ma et Avito.ma autorisees par ecrit (encadrant Younes Boumalek / direction Zakaria Sabti). Registre rempli; statut passe a Actif. ADR-005 et ADR-012 amendes; collector.ts mis a jour. |
