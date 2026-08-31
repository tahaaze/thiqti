"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Trash2, CarFront, ArrowRight } from "lucide-react";
import {
  getHistory,
  clearHistory,
  removeHistory,
  relativeTime,
  criteriaTags,
  historyEntryRoute,
  type HistoryEntry,
} from "@/lib/history";
import { setVehicleBackUrl } from "@/lib/navigation";

function HistoryItem({
  entry,
  onDelete,
}: {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
}) {
  const tags = criteriaTags(entry.criteria);
  const hasThumbnail = !!entry.topResultThumbnail;

  return (
    <div className="group relative glass-card overflow-hidden transition-all duration-200 hover:shadow-[0_8px_24px_rgba(109,93,252,0.1)]">
      <Link
        href={historyEntryRoute(entry)}
        onClick={() => setVehicleBackUrl()}
        className="flex gap-4 p-4"
      >
        {/* Thumbnail */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-line/40">
          {hasThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.topResultThumbnail!}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#6d5dfc]/10 to-[#22a9f0]/10">
              <CarFront className="h-8 w-8 text-primary/30" />
            </div>
          )}
          {entry.topResultScore != null && entry.topResultScore >= 80 && (
            <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] text-[10px] font-bold text-white shadow-md">
              {entry.topResultScore}
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <p className="truncate text-base font-semibold text-ink">
            {entry.query || "Recherche"}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted">
            {entry.resultCount > 0 && (
              <span className="font-medium">{entry.resultCount} voitures</span>
            )}
            {entry.timestamp > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {relativeTime(entry.timestamp)}
              </span>
            )}
          </div>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 self-center text-muted/40 transition group-hover:text-primary" />
      </Link>

      {/* Bouton supprimer */}
      <button
        onClick={() => onDelete(entry.id)}
        className="absolute right-3 top-3 rounded-full p-2 text-muted/0 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-500 group-hover:text-muted group-hover:opacity-100"
        title="Supprimer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function handleDelete(id: string) {
    setHistory(removeHistory(id));
  }

  function handleClear() {
    clearHistory();
    setHistory([]);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Historique</h1>
            <p className="mt-1 text-sm text-muted">
              {history.length > 0
                ? `${history.length} recherche${history.length > 1 ? "s" : ""} récente${history.length > 1 ? "s" : ""}`
                : "Aucune recherche pour le moment"}
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition hover:border-red-300 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
              Tout effacer
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line py-20">
            <CarFront className="mb-4 h-12 w-12 text-muted/30" />
            <p className="text-sm text-muted">Commencez une recherche pour la retrouver ici.</p>
            <Link href="/" className="mt-4 btn-primary">
              Rechercher
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
  );
}
