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
  LogIn,
  LogOut,
  UserCircle2,
  History,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";

const NAV_ITEMS = [
  { href: "/", label: "Assistant", icon: CarFront },
  { href: "/results", label: "Rechercher", icon: Search },
  { href: "/compare", label: "Comparer", icon: GitCompareArrows },
  { href: "/favorites", label: "Favoris", icon: Heart },
  { href: "/history", label: "Historique", icon: History },
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

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;

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
      </nav>

      {/* Auth footer */}
      <div className="shrink-0 border-t border-sidebar-line px-4 py-4">
        {user ? (
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-sidebar-ink transition hover:bg-white/60"
            >
              <UserCircle2 className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate">{user.fullName || user.email.split("@")[0]}</span>
            </Link>
            <button
              onClick={() => logout()}
              title="Se déconnecter"
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-sidebar-muted transition hover:bg-white/60 hover:text-error"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        ) : (
          <Link
            href={loginHref}
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(109,93,252,0.4)] transition hover:brightness-110"
          >
            <LogIn className="h-4 w-4" /> Se connecter
          </Link>
        )}
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
  const { user } = useAuth();
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;

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

          <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-sidebar-line bg-sidebar-bg px-4 pb-3 pt-safe backdrop-blur-xl lg:hidden">
            <Brand />
            <div className="flex items-center gap-2">
              {!user && (
                <Link
                  href={loginHref}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-3 py-1.5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(109,93,252,0.4)] transition hover:brightness-110"
                >
                  <LogIn className="h-3.5 w-3.5" /> Se connecter
                </Link>
              )}
              <button onClick={() => setOpen(true)} className="rounded-full border border-sidebar-line p-2 text-sidebar-muted transition hover:text-sidebar-ink" aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>

          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
                <div className="absolute inset-y-0 left-0 flex w-[260px] flex-col overflow-y-auto bg-sidebar-bg pb-safe shadow-2xl backdrop-blur-xl">
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
      <div className={`flex-1 ${sidebar ? "pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0 lg:pl-0" : ""}`}>
        {children}
      </div>
    </div>
  );
}
