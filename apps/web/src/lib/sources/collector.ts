// ============================================================================
// COLLECTE DE SOURCES AUTORISEES — MECANISME ACTIF
// ============================================================================
//
// Sources Auto24.ma et Avito.ma AUTORISEES par ecrit le 2026-08-12 par
// l'encadrant de stage (Younes Boumalek) et la direction (Zakaria Sabti),
// conformement au cahier des charges section 7.3 (voir ADR-005, section
// "Mise a jour"). Ces deux sources alimentent l'agregateur (aggregator.ts)
// qui les charge deja, aux cotes des autres sources actives (Autera.ma,
// Moteur.ma, ElectroDrive.ma, AutoHall.ma, Moteur-Neuf), toutes suivies dans
// docs/architecture/sources-registre.md.
//
// SoeezAuto reste REJETEE : aucune autorisation, non utilisee par
// l'agregateur.
//
// REGLE DE CONFORMITE (cahier des charges section 7.3) :
// Une source n'entre dans AUTHORIZED_SOURCES avec `licityStatus: "valide"`
// QU'APRES validation par ecrit de l'encadrant. Toute autre valeur implique
// une collecte interdite. Le suivi est tenu dans
// docs/architecture/sources-registre.md.
//
// POUR AJOUTER UNE SOURCE PLUS TARD :
//   1. Obtenir la validation par ecrit de l'encadrant.
//   2. Ajouter une entree `licityStatus: "valide"` dans AUTHORIZED_SOURCES.
//   3. Implementer le collecteur correspondant (methode de collecte, ex. API).
//   4. Brancher le collecteur dans aggregator.ts (voir le commentaire la-bas).
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
 * Auto24.ma et Avito.ma ont ete validees par ecrit le 2026-08-12 par
 * l'encadrant de stage (Younes Boumalek) et la direction (Zakaria Sabti).
 * Les autres sources actives dans aggregator.ts (Autera.ma, Moteur.ma,
 * ElectroDrive.ma, AutoHall.ma, Moteur-Neuf) sont documentees dans
 * docs/architecture/sources-registre.md.
 */
export const AUTHORIZED_SOURCES: AuthorizedSource[] = [
  {
    name: "Auto24.ma",
    category: "autre",
    baseUrl: "https://www.auto24.ma",
    method: "flux_partenaire",
    refreshIntervalHours: 24,
    licityStatus: "valide",
    licityVerifiedAt: "2026-08-12",
    robotsTxtChecked: true,
    termsChecked: true,
  },
  {
    name: "Avito.ma",
    category: "autre",
    baseUrl: "https://www.avito.ma",
    method: "flux_partenaire",
    refreshIntervalHours: 24,
    licityStatus: "valide",
    licityVerifiedAt: "2026-08-12",
    robotsTxtChecked: true,
    termsChecked: true,
  },
];
