// ============================================================================
// COLLECTE DE SOURCES AUTORISEES — MECANISME PRET MAIS INACTIF
// ============================================================================
//
// AVERTISSEMENT (conformite au cahier des charges, section 7.3) :
// ---------------------------------------------------------------
// Aucune source externe (vehicules ou avis) n'est autorisee a alimenter
// Thiqti a ce stade. Les sources Auto24, Avito et SoeezAuto sont desactivees
// et rejetees (voir ADR-005). Aucune implementation concrete de collecteur ne
// doit etre branchee tant que la source n'a pas ete VALIDEE PAR ECRIT par
// l'encadrant (Volund). Cette validation conditionne la lecite de la collecte
// (loi 09-08, article 4) et la conformite au cahier des charges section 7.3.
//
// Ce fichier ne contient QUE des types et un registre VIDE : il decrit le
// mecanisme ("pret"), il ne collecte rien ("inactif"). Aucune fonction
// executable n'est exposee, donc aucun declenchement de collecte n'est
// possible tant que le mecanisme n'est pas active volontairement.
//
// POUR ACTIVER UNE SOURCE PLUS TARD (a ne pas faire maintenant) :
//   1. Ajouter une entree `licityStatus: "valide"` dans AUTHORIZED_SOURCES,
//      apres validation par ecrit de l'encadrant.
//   2. Implementer le collecteur correspondant (methode de collecte, ex. API).
//   3. Brancher le collecteur dans aggregator.ts (voir le commentaire la-bas).
// ============================================================================

/**
 * Categorie de la source, conformement au cahier des charges section 7.3.
 * - Vehicules : constructeur / concession / presse specialisee
 * - Avis : reseau social / forum
 */
export type SourceCategory =
  | "constructeur"
  | "concession"
  | "presse"
  | "reseau_social"
  | "forum"
  | "autre";

/**
 * Methode de collecte prevue pour la source.
 */
export type CollectionMethod =
  | "api"
  | "flux_partenaire"
  | "collecte_manuelle"
  | "autre";

/**
 * Statut de lecite de la source.
 * Seul le statut "valide" (validation par ecrit de l'encadrant) autorise la
 * collecte. Toute autre valeur implique une collecte interdite.
 */
export type LicityStatus = "a_verifier" | "valide" | "rejete";

/**
 * Contrat d'un "collecteur de source autorisee".
 *
 * Entree purement declarative : aucun appel reseau, aucune methode de collecte
 * executable. La methode de collecte reelle sera ajoutee a l'activation, ce qui
 * garantit qu'aucune donnee ne peut etre recueillie par accident.
 */
export interface AuthorizedSource {
  /** Nom lisible de la source (ex. "API Constructeur X"). */
  name: string;
  /** Categorie de la source (vehicules ou avis). */
  category: SourceCategory;
  /** URL de base de la source. */
  baseUrl: string;
  /** Methode de collecte prevue (api, flux, manuelle, ...). */
  method: CollectionMethod;
  /** Frequence de rafraichissement souhaitee, en heures. */
  refreshIntervalHours: number;
  /** Statut de lecite. Seul "valide" autorise la collecte. */
  licityStatus: LicityStatus;
  /** Date de verification de la lecite (YYYY-MM-DD), null si jamais verifiee. */
  licityVerifiedAt: string | null;
  /** true si le fichier robots.txt de la source a ete verifie. */
  robotsTxtChecked: boolean;
  /** true si les conditions d'utilisation de la source ont ete verifiees. */
  termsChecked: boolean;
}

/**
 * Registre central des sources autorisees.
 *
 * VIDE PAR DECISION : la liste des sources n'a pas encore ete communiquee par
 * l'encadrant (J0 non honore). Ce registre est rempli uniquement apres
 * validation par ecrit de chaque source (suivi dans
 * docs/architecture/sources-registre.md). Ne pas ajouter de source reelle ici
 * sans validation.
 */
export const AUTHORIZED_SOURCES: AuthorizedSource[] = [];
