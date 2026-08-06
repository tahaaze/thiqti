"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, Menu, X, Search, GitCompareArrows, Heart, History, Trash2, User, ShieldCheck } from "lucide-react";
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
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-primary/50 bg-gradient-to-br from-[#eed9a1] to-[#c2923d] shadow-[0_0_16px_rgba(196,128,46,0.28)] transition group-hover:shadow-[0_0_24px_rgba(196,128,46,0.45)]">
        <CarFront className="h-5 w-5 text-[#1b1406]" />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-xl leading-none tracking-wide text-sidebar-ink">
          Thiqti<span className="text-primary">.</span>
        </span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-sidebar-accent">
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
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-muted">Menu</p>
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive(item.href)
                  ? "bg-sidebar-hover text-sidebar-accent"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {isActive(item.href) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          ))}
        </div>

        <p className="mt-6 flex items-center gap-1.5 px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-muted">
          <History className="h-3 w-3" />
          Historique
        </p>
        {history.length === 0 ? (
          <p className="px-3 py-1 text-xs text-sidebar-muted opacity-70">Aucune recherche récente.</p>
        ) : (
          <div className="space-y-0.5">
            {history.map((q) => (
              <Link
                key={q}
                href={`/results?q=${encodeURIComponent(q)}`}
                onClick={onNavigate}
                className="block truncate rounded-lg px-3 py-1.5 text-xs text-sidebar-muted transition hover:bg-sidebar-hover hover:text-sidebar-ink"
                title={q}
              >
                {q}
              </Link>
            ))}
            <button
              onClick={() => {
                clearHistory();
                setHistory([]);
              }}
              className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] text-sidebar-muted transition hover:text-error"
            >
              <Trash2 className="h-3 w-3" />
              Effacer
            </button>
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-line px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-hover text-sidebar-accent">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-sidebar-ink">Invité</p>
            <p className="text-[11px] text-sidebar-muted">Non connecté</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link
            href="/login"
            onClick={onNavigate}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-sidebar-line px-3 py-2 text-xs font-semibold text-sidebar-ink transition hover:border-primary/50 hover:text-sidebar-accent"
          >
            <User className="h-3.5 w-3.5" />
            Connexion
          </Link>
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-sidebar-line px-3 py-2 text-xs font-semibold text-sidebar-ink transition hover:border-primary/50 hover:text-sidebar-accent"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </Link>
        </div>
      </div>
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
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-sidebar-line bg-sidebar-bg lg:flex">
            <div className="border-b border-sidebar-line px-5 py-5">
              <Brand />
            </div>
            <SidebarInner />
          </aside>

          <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-sidebar-line bg-sidebar-bg px-4 py-3 lg:hidden">
            <Brand />
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-sidebar-muted transition hover:text-sidebar-ink" aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
          </header>

          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
              <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col overflow-y-auto bg-sidebar-bg shadow-2xl">
                <div className="flex items-center justify-between border-b border-sidebar-line px-4 py-3.5">
                  <Brand />
                  <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-sidebar-muted transition hover:text-sidebar-ink" aria-label="Fermer le menu">
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
