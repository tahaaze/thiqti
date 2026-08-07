"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, Menu, X, Search, GitCompareArrows, Heart, Trash2 } from "lucide-react";
import { clearHistory, getHistory } from "@/lib/history";

const NAV_ITEMS = [
  { href: "/", label: "Assistant", icon: CarFront },
  { href: "/results", label: "Rechercher", icon: Search },
  { href: "/compare", label: "Comparer", icon: GitCompareArrows },
  { href: "/favorites", label: "Favoris", icon: Heart },
];

function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] text-white shadow-[0_4px_16px_rgba(109,93,252,0.45)]">
        <CarFront className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-2xl font-bold leading-none text-sidebar-ink">
          Thiqti<span className="gradient-text">.</span>
        </span>
        <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.28em] text-sidebar-muted">
          Guide auto Maroc
        </span>
      </div>
    </Link>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

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

        <p className="px-4 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-muted">Historique</p>
        {history.length === 0 ? (
          <p className="px-4 py-1 text-xs text-sidebar-muted opacity-70">Aucune recherche récente.</p>
        ) : (
          <div>
            {history.map((q, i) => (
              <Link
                key={q}
                href={`/results?q=${encodeURIComponent(q)}`}
                onClick={onNavigate}
                className="flex items-baseline gap-2 rounded-full px-4 py-2 text-xs text-sidebar-muted transition hover:bg-white/60 hover:text-sidebar-ink"
                title={q}
              >
                <span className="font-display text-[10px] text-sidebar-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="truncate">{q}</span>
              </Link>
            ))}
            <button
              onClick={() => {
                clearHistory();
                setHistory([]);
              }}
              className="mt-2 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-sidebar-muted transition hover:bg-white/60 hover:text-error"
            >
              <Trash2 className="h-3 w-3" />
              Effacer
            </button>
          </div>
        )}
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
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-sidebar-line bg-sidebar-bg backdrop-blur-xl lg:flex">
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
              <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col overflow-y-auto bg-sidebar-bg shadow-2xl backdrop-blur-xl">
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
      <div className={`flex-1 ${sidebar ? "pt-14 lg:pt-0 lg:pl-[264px]" : ""}`}>
        {children}
      </div>
    </div>
  );
}
