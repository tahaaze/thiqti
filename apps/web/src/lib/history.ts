const KEY = "thiqti_history";
const MAX = 4;

export interface HistoryEntry {
  /** Identifiant unique de l'entrée */
  id: string;
  /** Texte brut de la recherche (pour affichage fallback) */
  query: string;
  /** Critères structurés extraits */
  criteria: {
    carrosserie?: string | null;
    motorisation?: string | null;
    transmission?: string | null;
    marque?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    ville?: string | null;
  };
  /** Nombre de résultats trouvés */
  resultCount: number;
  /** URL de la miniature du meilleur résultat */
  topResultThumbnail: string | null;
  /** ID du meilleur résultat */
  topResultId: string | null;
  /** Score du meilleur résultat (0-100) */
  topResultScore: number | null;
  /** Timestamp de la recherche */
  timestamp: number;
}

/** Critères vides par défaut */
const EMPTY_CRITERIA: HistoryEntry["criteria"] = {};

/** Génère un ID unique pour une entrée */
function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Récupère l'historique complet.
 * Gère la migration depuis l'ancien format (string[]) vers le nouveau (HistoryEntry[]).
 */
export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Migration : ancien format string[] → nouveau format HistoryEntry[]
    const migrated: HistoryEntry[] = [];
    for (const item of parsed) {
      if (typeof item === "string") {
        // Ancien format : créer une entrée minimale
        migrated.push({
          id: makeId(),
          query: item,
          criteria: {},
          resultCount: 0,
          topResultThumbnail: null,
          topResultId: null,
          topResultScore: null,
          timestamp: Date.now() - migrated.length * 3600000,
        });
      } else if (item && typeof item === "object" && typeof item.query === "string") {
        // Nouveau format : valider et garder
        migrated.push(item as HistoryEntry);
      }
    }

    // Sauvegarder la migration si on a trouvé de l'ancien format
    if (parsed.some((x: unknown) => typeof x === "string")) {
      window.localStorage.setItem(KEY, JSON.stringify(migrated));
    }

    return migrated.slice(0, MAX);
  } catch {
    return [];
  }
}

/**
 * Ajoute ou met à jour une recherche dans l'historique.
 * Si une entrée avec le même texte existe, elle est remplacée.
 */
export function addHistory(
  query: string,
  criteria: HistoryEntry["criteria"] = {},
  resultCount = 0,
  topResult: { thumbnail: string | null; id: string | null; score: number | null } | null = null
): HistoryEntry[] {
  const q = query.trim();
  if (!q) return getHistory();

  const existing = getHistory();
  const filtered = existing.filter(
    (e) => e.query.toLowerCase() !== q.toLowerCase()
  );

  const newEntry: HistoryEntry = {
    id: makeId(),
    query: q,
    criteria: { ...EMPTY_CRITERIA, ...criteria },
    resultCount,
    topResultThumbnail: topResult?.thumbnail ?? null,
    topResultId: topResult?.id ?? null,
    topResultScore: topResult?.score ?? null,
    timestamp: Date.now(),
  };

  const next = [newEntry, ...filtered].slice(0, MAX);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* stockage indisponible */
    }
  }

  return next;
}

/**
 * Supprime une entrée spécifique par son ID.
 */
export function removeHistory(id: string): HistoryEntry[] {
  const existing = getHistory().filter((e) => e.id !== id);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(existing));
    } catch {
      /* stockage indisponible */
    }
  }
  return existing;
}

/**
 * Efface tout l'historique.
 */
export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible */
  }
}

/**
 * Formate un timestamp relatif en français.
 */
export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days === 1) return "Hier";
  if (days < 7) return `il y a ${days}j`;
  return new Date(timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Extrait les tags courts à afficher depuis les critères.
 */
export function criteriaTags(criteria: HistoryEntry["criteria"]): string[] {
  const tags: string[] = [];
  if (criteria.carrosserie) tags.push(criteria.carrosserie);
  if (criteria.motorisation) tags.push(criteria.motorisation);
  if (criteria.marque) tags.push(criteria.marque);
  if (criteria.transmission) tags.push(criteria.transmission === "Automatique" ? "Auto" : "Manuelle");
  if (criteria.budgetMax) {
    const max = criteria.budgetMax;
    if (max >= 1000000) tags.push(`${(max / 1000000).toFixed(1)}M DH`);
    else tags.push(`${Math.round(max / 1000)}k DH`);
  }
  return tags.slice(0, 3);
}
