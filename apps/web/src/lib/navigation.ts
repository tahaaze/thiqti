// ---------------------------------------------------------------------------
// NAVIGATION — retour contextuel vers la recherche filtrée
// ---------------------------------------------------------------------------
//
// Quand l'utilisateur ouvre une fiche véhicule depuis une page de résultats
// (filtrée ou non), on mémorise l'URL de départ dans sessionStorage. Le bouton
// « Retour aux résultats » de la fiche renvoie alors vers cette URL : les
// critères de recherche (issus du chat par exemple) sont conservés au lieu de
// retomber sur le catalogue complet.

const BACK_KEY = "thiqti_back_url";

/** Mémorise l'URL courante (page en cours) comme destination du bouton Retour. */
export function setVehicleBackUrl(url?: string) {
  if (typeof window === "undefined") return;
  const current = url ?? window.location.pathname + window.location.search;
  sessionStorage.setItem(BACK_KEY, current);
}

export function getVehicleBackUrl(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(BACK_KEY);
}

export function clearVehicleBackUrl() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BACK_KEY);
}
