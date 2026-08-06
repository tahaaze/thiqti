const KEY = "thiqti_history";
const MAX = 8;

export function getHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function addHistory(query: string): string[] {
  const q = query.trim();
  if (!q) return getHistory();
  const next = [q, ...getHistory().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* stockage indisponible */
    }
  }
  return next;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible */
  }
}
