# ADR-007: Sécurité

**Statut**: Accepté
**Date**: 2026-07-17
**Décideurs**: Younes Boumalek, Adam Chouikh
**Réf**: VV-SLP-2026-001

## Contexte

La plateforme collecte des données publiques et n'exige pas d'authentification en Phase 1. Les risques de sécurité sont limités mais doivent être documentés.

## Décision

### Phase 1 (aucune authentification)

| Mesure | Implémentation |
|--------|---------------|
| HTTPS | Obligatoire en production (Let's Encrypt) |
| Headers sécurité | Next.js Security Headers (CSP, X-Frame-Options) |
| Input validation | Validation des paramètres de requête (longueur max, chars interdits) |
| Rate limiting | Non implémenté (MVP) |
| CORS | Same-origin par défaut |
| Secrets | Variables d'environnement (.env.local, jamais commitées) |
| Données utilisateur | LocalStorage uniquement (favoris) |

### Données sensibles

- Aucune donnée personnelle collectée en Phase 1
- Favoris stockés localement (pas de serveur)
- Pas de cookies de tracking

### Phase 2 (prévu)

- Supabase Auth pour l'authentification
- RLS (Row Level Security) pour les favoris
- Rate limiting sur les endpoints publics
- CSP strict

## Conséquences

- Le MVP est fonctionnel sans auth (acceptable pour une démo)
- Le passage à Phase 2 nécessitera migration favoris → serveur
