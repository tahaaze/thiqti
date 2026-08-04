# Thiqti — Registre des Sources de Collecte

**Statut**: Pret mais inactif
**Date**: 2026-08-04
**Ref**: VV-SLP-2026-001
**Conformite**: Cahier des charges section 7.3 — toute collecte externe exige une validation par ecrit de l'encadrant (Volund) avant mise en service.

---

## 1. Objet

Ce registre liste les sources autorisees a alimenter le catalogue vehicules et
les avis de Thiqti. Il est volontairement **VIDE** : aucune source n'a encore
ete communiquee ni validee par l'encadrant (dependance J0 non honoree). Aucune
collecte n'est active tant qu'une source ne porte pas la mention **valide**.

| Type de donnee | Categories de sources attendues |
|---|---|
| Vehicules | Constructeur, concession, presse specialisee |
| Avis | Reseau social, forum, presse specialisee |

---

## 2. Registre des sources

> Remplir uniquement apres validation par ecrit de chaque source.
> Statuts possibles : `a_verifier` / `valide` / `rejete`.

| Nom de la source | Type | URL | Statut de lecite | Date de verification | robots.txt verifie | Conditions d'utilisation verifiees |
|---|---|---|---|---|---|---|
| | | | | | | |

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

## 4. Mecanisme de rafraichissement quotidien (documente, inactif)

Aucun job planifie (cron) n'est fonctionnel a ce jour. Le mecanisme suivant est
**prevu et documente**, a activer uniquement quand une source aura ete validee
par ecrit. Il s'articule avec l'aggregator existant
(`apps/web/src/lib/sources/aggregator.ts`).

1. Un job quotidien (ex. Vercel Cron `cron: "0 6 * * *"` ou `node-cron`)
   appellerait une fonction `refreshCatalogue()`.
2. `refreshCatalogue()` itere `AUTHORIZED_SOURCES`
   (`apps/web/src/lib/sources/collector.ts`) et ne conserve que les entrees
   `licityStatus === "valide"`.
3. Chaque collecteur autorise renvoie des `UnifiedCar[]` qui remplacent ou
   fusionnent le cache actuel de `getCars()` (TTL actuel 5 minutes).
4. **Secours inchange** : le dataset statique fallback
   (`apps/web/src/lib/sources/fallback.ts`) reste le comportement par defaut si
   aucune source n'est active ou si une source echoue.
5. Garde-fous obligatoires a la mise en service : robots.txt verifie,
   conditions d'utilisation verifiees, frequence <= `refreshIntervalHours`,
   aucune donnee personnelle collectee (registre des traitements
   `docs/architecture/data-register.md`).

**Activation (a ne PAS faire maintenant)** : `COLLECTION_ENABLED=true` + au
moins une entree `valide` dans le registre. Tant que ces conditions ne sont pas
reunies, aucun comportement applicatif ne change.

---

## 5. Suivi

| Date | Evenement |
|---|---|
| 2026-08-04 | Registre cree, vide. Dependance J0 (liste des sources) non honoree. Aucune collecte active. |
