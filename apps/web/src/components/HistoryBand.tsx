"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CarFront, Clock, Trash2, Sparkles, Search } from "lucide-react";
import {
  getHistory,
  removeHistory,
  clearHistory,
  relativeTime,
  criteriaTags,
  historyEntryRoute,
  type HistoryEntry,
} from "@/lib/history";
import { useAuth } from "@/lib/useAuth";
import { setVehicleBackUrl } from "@/lib/navigation";

const SUGGESTIONS: HistoryEntry[] = [
  {
    id: "__sug1",
    query: "SUV familial hybride",
    criteria: { carrosserie: "SUV", motorisation: "Hybride" },
    resultCount: 0,
    topResultThumbnail: null,
    topResultId: null,
    topResultScore: null,
    timestamp: 0,
  },
  {
    id: "__sug2",
    query: "Citadine économique essence",
    criteria: { carrosserie: "Citadine", motorisation: "Essence" },
    resultCount: 0,
    topResultThumbnail: null,
    topResultId: null,
    topResultScore: null,
    timestamp: 0,
  },
  {
    id: "__sug3",
    query: "Berline automatique diesel",
    criteria: { carrosserie: "Berline", motorisation: "Diesel", transmission: "Automatique" },
    resultCount: 0,
    topResultThumbnail: null,
    topResultId: null,
    topResultScore: null,
    timestamp: 0,
  },
];

function BandCard({
  entry,
  onDelete,
}: {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
}) {
  const tags = criteriaTags(entry.criteria);
  const isSuggestion = entry.id.startsWith("__sug");
  const hasThumbnail = !!entry.topResultThumbnail;

  return (
    <div className="group relative flex w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-[0_2px_16px_rgba(13,18,48,0.06)] backdrop-blur transition hover:shadow-[0_10px_28px_rgba(109,93,252,0.16)] sm:w-[240px] sm:shrink-0 sm:snap-align-none">
      <Link
        href={historyEntryRoute(entry)}
        onClick={() => setVehicleBackUrl()}
        className="flex flex-1 flex-col"
      >
        {/* Vignette / visuel */}
        <div className="relative flex h-24 items-center justify-center overflow-hidden bg-gradient-to-br from-[#6d5dfc]/12 to-[#22a9f0]/12">
          {hasThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.topResultThumbnail!}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6d5dfc]/15 to-[#22a9f0]/15 text-primary">
              {isSuggestion ? <Sparkles className="h-6 w-6" /> : <CarFront className="h-6 w-6" />}
            </div>
          )}
          {entry.topResultScore != null && entry.topResultScore >= 80 && (
            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] text-[10px] font-bold text-white shadow">
              {entry.topResultScore}
            </span>
          )}
        </div>

        {/* Corps de la carte */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <p className="line-clamp-1 text-sm font-semibold text-ink">{entry.query}</p>
          <div className="flex flex-wrap gap-1">
            {(tags.length > 0 ? tags : [isSuggestion ? "Suggestion" : entry.query])
              .slice(0, 2)
              .map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary"
                >
                  {tag}
                </span>
              ))}
          </div>
          <div className="mt-auto flex items-center gap-1.5 text-[10px] text-muted">
            {isSuggestion ? (
              <>
                <Search className="h-3 w-3" />
                <span>Idée de recherche</span>
              </>
            ) : (
              <>
                {entry.resultCount > 0 && <span>{entry.resultCount} véhicules</span>}
                {entry.timestamp > 0 && (
                  <>
                    {entry.resultCount > 0 && <span>·</span>}
                    <Clock className="h-3 w-3" />
                    <span>{relativeTime(entry.timestamp)}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Link>

      {!isSuggestion && (
        <button
          onClick={() => onDelete(entry.id)}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-error"
          aria-label="Supprimer de l'historique"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default function HistoryBand() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (user) setHistory(getHistory());
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const refresh = () => setHistory(getHistory());
    window.addEventListener("thiqti-history-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("thiqti-history-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [user]);

  const items = history.length > 0 ? history.slice(0, 6) : SUGGESTIONS;

  const handleDelete = (id: string) => {
    setHistory(removeHistory(id));
  };

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const handleReturnToChat = () => {
    const el = document.getElementById("assistant");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (authLoading || !user) return null;

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-end justify-between px-1">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {history.length > 0 ? "Reprendre une recherche" : "Idées de recherche"}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReturnToChat}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary transition hover:text-primary-dark"
          >
            Retour au chat
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted transition hover:text-error"
            >
              <Trash2 className="h-3 w-3" />
              Effacer
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-3">
        {items.map((entry) => (
          <BandCard key={entry.id} entry={entry} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
