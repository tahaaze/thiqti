# ETAT-URGENT — Veille de réunion encadrant (2026-08-04)

Objectif : corriger, dans l'ordre, les points bloquants pour la présentation de demain midi.
Mises à jour à la fin de chaque section traitée. Résumé final en bas de fichier.

---

## P1 — /login redirige vers /admin (404) : FAIT

### Décision
Option retenue : **créer une page /admin minimale fonctionnelle** (tableau de bord listant les véhicules),
plutôt que rediriger vers l'accueil. Un examinateur teste `/login` en premier : atterrir sur un vrai tableau
de bord est bien plus crédible qu'une redirection vers une page neutre.

### Changements
- `apps/web/src/app/admin/page.tsx` (nouveau) : vérifie la session via `GET /api/auth/me` (redirige vers
  `/login` si non authentifié), affiche 3 cartes de stats + la liste des 196 véhicules du catalogue
  (année, carburant, prix, source, score) avec lien vers la fiche véhicule, bouton déconnexion
  (`POST /api/auth/logout`).
- `apps/web/src/app/layout.tsx` : ajout du lien « Admin » (→ `/login`) dans la nav desktop et mobile
  pour rendre le flux découvrable.
- Le flux `login` → `router.push("/admin")` fonctionne désormais (plus de 404).

### Vérifications passées
- `npm run typecheck -w apps/web` : 0 erreur
- `npm run test -w apps/web` : 106/106
- `npm run build -w apps/web` : OK (route `/admin` statique)

### Reste à faire
Rien pour P1. Le reste des priorités (P2-P5) est traité ci-dessous.

---

## P2 — Baromètre de réputation : données réelles

État : EN COURS (section en cours de traitement).

---

## P3 — Lint apps/api

État : PAS ENCORE TRAITE.

---

## P4 — Placeholders url: "#"

État : PAS ENCORE TRAITE.

---

## P5 — npm audit par workspace

État : PAS ENCORE TRAITE.
