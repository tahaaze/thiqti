# Architecture C4 — Thiqti (Phase 1)

## Niveau 1 — Diagramme de Contexte

```mermaid
C4Context
    title Diagramme de Contexte — Thiqti Phase 1

    Person(acheteur, "Acheteur de voitures\nneuves au Maroc", "Recherche des vehicules\nneufs avec classement\nmulticritere")

    System(thiqti, "Thiqti", "Plateforme de recherche\nintelligente avec NLP\net matching TOPSIS pour\nvehicules neufs")

    System_Ext(fallback, "Catalogue constructeur\n(transitoire Sprint 1)", "Dataset statique de\n196 vehicules neufs\n(code pour le demarrage)")
    System_Ext(googlecdn, "Google CDN", "Hebergement des images\net assets statiques")

    Rel(acheteur, thiqti, "Recherche et compare\ndes vehicules neufs")
    Rel(thiqti, fallback, "Charge le catalogue\ndepuis la base integree")
    Rel(thiqti, googlecdn, "Recupere les images\net CDN assets", "HTTPS")
```

## Niveau 2 — Diagramme de Conteneurs

```mermaid
C4Container
    title Diagramme de Conteneurs — Thiqti

    Person(acheteur, "Acheteur\nde voitures neuves", "Utilisateur final\nau Maroc")

    System_Boundary(thiqti, "Thiqti") {
        Container(nextjs, "Next.js 15 App", "TypeScript\nReact 19\nApp Router", "Interface utilisateur,\nAPI routes, logique\nmetier complete")
    }

    System_Ext(cdn, "Google CDN", "Images et\nassets statiques")

    Rel(acheteur, nextjs, "Interagit avec\nl'interface web")
    Rel(nextjs, cdn, "Charge les images\nde vehicules", "HTTPS")
```

## Niveau 3 — Diagramme de Composants (Next.js App)

```mermaid
C4Component
    title Diagramme de Composants — Application Next.js 15

    Container_Ext(nextjs, "Next.js 15 App", "TypeScript\nReact 19\nApp Router")

    Person(acheteur, "Acheteur\nde voitures neuves", "Utilisateur final")

    Component(searchbar, "SearchBar", "React Component\nTypeScript\nTailwind CSS", "Barre de recherche\navec autocompletion\net suggestions")
    Component(nlpengine, "Moteur NLP", "TypeScript\nRegex\nDictionnaires", "Extraction structuree\nmarque, modele,\nbudget, carrosserie")
    Component(matching, "Moteur de\nCorrespondance TOPSIS", "TypeScript\nAlgorithme\nproprietaire", "Classement multicritere\npondere avec\nexplicabilite")
    Component(aggregator, "Agregateur de\nDonnees (Fallback)", "TypeScript", "Cache du catalogue\nconstructeur, 196\nvehicules neufs")
    Component(reputation, "API Reputation", "Next.js API Route\nTypeScript", "Endpoint /api/reputation\nscore de fiabilite\npar modele")
    Component(searchapi, "API Recherche", "Next.js API Route\nTypeScript", "Endpoint /api/search\nRequete NLP\net matching")
    Component(compare, "Page Comparaison", "React Page\nTypeScript", "Comparaison de 2-3\nvehicules avec\nscores detailles")
    Component(carimage, "CarImage", "React Component\nNext.js Image", "Composant image\nresponsive avec\nlazy loading")
    Component(results, "Page Resultats", "React Page\nTypeScript", "Affichage du classement\ntopsis avec filtres\net barometre")
    Component(vehicle, "Page Vehicule", "React Page\nTypeScript", "Fiche detaillee\nd'un vehicule neuf\nindividuel")
    Component(auth, "Auth API", "Next.js API Route\nTypeScript\nbcrypt + JWT", "Login/logout admin\navec mots de passe\nhashes")

    Rel(acheteur, searchbar, "Saisit sa\nrecherche")
    Rel(searchbar, searchapi, "Envoie la\nrequete")
    Rel(searchapi, nlpengine, "Extrait les\ncriteres structures")
    Rel(nlpengine, matching, "Criteres\nstructures")
    Rel(matching, results, "Classement\nTopsis")
    Rel(results, carimage, "Affiche les\nimages")
    Rel(results, vehicle, "Navigation\nvers la fiche")
    Rel(results, compare, "Ajout a la\ncomparaison")
    Rel(searchapi, aggregator, "Interroge les\ndonnees en cache")
    Rel(aggregator, fallback, "Lit le catalogue\nconstructeur")
    Rel(reputation, results, "Scores de\nreputation")
```

## Vue de Sequence — Chemin Critique

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant SB as SearchBar
    participant SR as /api/search
    participant NLP as NLP Engine
    participant MAT as TOPSIS Matching
    participant AGG as Agregateur

    Note over U,AGG: Budget de latence total < 500ms

    U->>SB: Saisit requete (ex: SUV essence < 300K DH)
    Note over SB: Capture texte,<br/>debounce 100ms
    SB->>SR: GET /api/search?q=...

    Note over SR: Debut compteur temps

    SR->>NLP: parseQuery(query)
    Note over NLP: Extraction regex<br/>marque, budget,<br/>carrosserie, etc.
    Note over NLP: Budget: < 150ms
    NLP-->>SR: SearchCriteria

    SR->>AGG: searchAllSources(query)
    Note over AGG: Filtre 196 vehicules<br/>par mots-cles
    Note over AGG: Budget: < 100ms
    AGG-->>SR: UnifiedCar[]

    SR->>MAT: rankVehicles(cars, criteria)
    Note over MAT: Matrice TOPSIS<br/>Normalisation<br/>Classement
    Note over MAT: Budget: < 200ms
    MAT-->>SR: ScoredCar[]

    Note over SR: Fin compteur temps

    SR-->>SB: { results, criteria, sources }
    SB->>U: Affiche resultats classes

    Note over U,AGG: Total < 500ms
```

## Budget de Latence

| Etape | Budget | Outil |
|-------|--------|-------|
| Debounce saisie | 100ms | cote client |
| NLP parseQuery | < 150ms | regex in-memory |
| searchAllSources | < 100ms | cache + filtre |
| rankVehicles (TOPSIS) | < 200ms | matrice in-memory |
| Reponse reseau | < 50ms | Next.js local |
| **Total** | **< 500ms** | **Sprint 1** |
