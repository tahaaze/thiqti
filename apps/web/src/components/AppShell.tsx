"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CarFront,
  Menu,
  X,
  Search,
  GitCompareArrows,
  Heart,
  Trash2,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  getHistory,
  clearHistory,
  removeHistory,
  relativeTime,
  criteriaTags,
  type HistoryEntry,
} from "@/lib/history";

const NAV_ITEMS = [
  { href: "/", label: "Assistant", icon: CarFront },
  { href: "/results", label: "Rechercher", icon: Search },
  { href: "/compare", label: "Comparer", icon: GitCompareArrows },
  { href: "/favorites", label: "Favoris", icon: Heart },
];

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

function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] text-white shadow-[0_4px_16px_rgba(109,93,252,0.45)]">
        <CarFront className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-xl font-bold leading-none text-sidebar-ink">
          Thiqti<span className="gradient-text">.</span>
        </span>
        <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.25em] text-sidebar-muted">
          Guide auto Maroc
        </span>
      </div>
    </Link>
  );
}

function HistoryCard({
  entry,
  onNavigate,
  onDelete,
}: {
  entry: HistoryEntry;
  onNavigate?: () => void;
  onDelete: (id: string) => void;
}) {
  const tags = criteriaTags(entry.criteria);
  const isSuggestion = entry.id.startsWith("__sug");
  const hasThumbnail = !!entry.topResultThumbnail;

  return (
    <div className="group relative">
      <Link
        href={`/results?q=${encodeURIComponent(entry.query)}`}
        onClick={onNavigate}
        className="flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-sidebar-hover"
      >
        {/* Thumbnail */}
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-sidebar-surface">
          {hasThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.topResultThumbnail!}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <CarFront className="h-5 w-5 text-sidebar-muted/40" />
            </div>
          )}
          {/* Badge score zellige */}
          {entry.topResultScore != null && entry.topResultScore >= 80 && (
            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] text-[7px] font-bold text-white shadow-sm">
              {entry.topResultScore}
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-sidebar-hover px-2 py-0.5 text-[9px] font-semibold text-sidebar-accent"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="inline-block rounded-full bg-sidebar-hover px-2 py-0.5 text-[9px] font-semibold text-sidebar-accent">
                {isSuggestion ? "Suggestion" : entry.query}
              </span>
            )}
          </div>

          {/* Ligne du bas : nb résultats + timestamp */}
          <div className="flex items-center gap-1.5 text-[10px] text-sidebar-muted">
            {isSuggestion ? (
              <Sparkles className="h-2.5 w-2.5 text-sidebar-accent" />
            ) : entry.resultCount > 0 ? (
              <span>{entry.resultCount} véhicules</span>
            ) : null}
            {!isSuggestion && entry.timestamp > 0 && (
              <>
                <span>·</span>
                <Clock className="h-2.5 w-2.5" />
                <span>{relativeTime(entry.timestamp)}</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Bouton supprimer (au hover, pas sur les suggestions) */}
      {!isSuggestion && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete(entry.id);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-sidebar-muted/0 opacity-0 transition hover:bg-sidebar-hover hover:text-error group-hover:text-sidebar-muted group-hover:opacity-100"
          title="Supprimer"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, [pathname]);

  useEffect(() => {
    const refresh = () => setHistory(getHistory());
    window.addEventListener("thiqti-history-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("thiqti-history-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const handleDelete = (id: string) => {
    setHistory(removeHistory(id));
  };

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const displayItems = history.length > 0 ? history.slice(0, 3) : SUGGESTIONS;
  const hasMore = history.length > 3;

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-sidebar-hover text-sidebar-ink" : "text-sidebar-muted hover:bg-white/60 hover:text-sidebar-ink"
                }`}
              >
                <item.icon className={`h-4 w-4 ${active ? "text-primary" : "opacity-60"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Section "Reprendre" */}
        <div className="mt-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-muted">
            {history.length > 0 ? "Reprendre" : "Idées de recherche"}
          </p>
          <div className="flex flex-col gap-0.5">
            {displayItems.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                onNavigate={onNavigate}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Lien "Voir tout" ou "Effacer" */}
          {history.length > 0 && (
            <div className="mt-1 flex items-center gap-2 px-3">
              {hasMore && (
                <Link
                  href="/results"
                  onClick={onNavigate}
                  className="flex items-center gap-1 text-[10px] font-semibold text-sidebar-accent transition hover:underline"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  Voir tout
                </Link>
              )}
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-muted transition hover:text-error"
              >
                <Trash2 className="h-2.5 w-2.5" />
                Effacer
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

interface AppShellProps {
  sidebar?: boolean;
  children: React.ReactNode;
}

export default function AppShell({ sidebar = true, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {sidebar && (
        <>
          <aside className="sticky top-0 z-40 hidden h-screen w-[220px] shrink-0 flex-col border-r border-sidebar-line bg-sidebar-bg backdrop-blur-xl lg:flex">
            <div className="border-b border-sidebar-line px-5 py-5">
              <Brand />
            </div>
            <SidebarInner />
          </aside>

          <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-sidebar-line bg-sidebar-bg px-4 py-3 backdrop-blur-xl lg:hidden">
            <Brand />
            <button onClick={() => setOpen(true)} className="rounded-full border border-sidebar-line p-2 text-sidebar-muted transition hover:text-sidebar-ink" aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
          </header>

          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
                <div className="absolute inset-y-0 left-0 flex w-[260px] flex-col overflow-y-auto bg-sidebar-bg shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-sidebar-line px-4 py-3.5">
                  <Brand />
                  <button onClick={() => setOpen(false)} className="rounded-full border border-sidebar-line p-2 text-sidebar-muted transition hover:text-sidebar-ink" aria-label="Fermer le menu">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <SidebarInner onNavigate={() => setOpen(false)} />
              </div>
            </div>
          )}
        </>
      )}
      <div className={`flex-1 ${sidebar ? "pt-14 lg:pt-0 lg:pl-0" : ""}`}>
        {children}
      </div>
    </div>
  );
}
