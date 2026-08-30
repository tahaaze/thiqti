"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, Menu, X, LogIn, LogOut, UserCircle2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

const NAV_LINKS = [
  { href: "/", label: "Assistant" },
  { href: "/results", label: "Rechercher" },
  { href: "/compare", label: "Comparer" },
  { href: "/favorites", label: "Favoris" },
  { href: "/history", label: "Historique" },
];

export default function MarketingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const loginHref =
    pathname && pathname !== "/"
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";

  const AuthButton = (
    <>
      {user ? (
        <div className="hidden items-center gap-2 md:flex">
          <span className="flex items-center gap-2 rounded-full border border-line bg-white/50 px-3 py-2 text-sm font-semibold text-ink">
            <UserCircle2 className="h-4 w-4 text-primary" />
            {user.email.split("@")[0]}
          </span>
          <button
            onClick={() => logout()}
            title="Se déconnecter"
            className="rounded-full border border-line bg-white/50 p-2 text-muted hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Link
          href={loginHref}
          className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_16px_rgba(109,93,252,0.4)] transition hover:brightness-110 md:flex"
        >
          <LogIn className="h-4 w-4" /> Se connecter
        </Link>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 px-4 pt-4">
      <div className="glass mx-auto flex max-w-7xl items-center justify-between rounded-full py-2 pl-3 pr-3">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] text-white shadow-[0_4px_16px_rgba(109,93,252,0.45)]">
            <CarFront className="h-5 w-5" />
          </div>
          <span className="font-display text-2xl font-bold leading-none text-ink">
            Thiqti<span className="gradient-text">.</span>
          </span>
          <span className="hidden rounded-full border border-line bg-white/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted sm:inline">
            Maroc
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive(link.href) ? "bg-brand-tint text-primary" : "text-muted hover:bg-white/60 hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {AuthButton}
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full border border-line bg-white/50 p-2 text-muted hover:text-ink md:hidden">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {menuOpen && (
        <div className="glass mt-2 rounded-2xl p-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${isActive(link.href) ? "bg-brand-tint text-primary" : "text-muted hover:text-ink"}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-line pt-2">
              {user ? (
                <div className="flex items-center justify-between px-2">
                  <span className="truncate text-sm font-semibold text-ink">
                    <UserCircle2 className="mr-1 inline h-4 w-4 text-primary" />
                    {user.email}
                  </span>
                  <button
                    onClick={() => logout()}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-red-500"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link
                  href={loginHref}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-4 py-2 text-sm font-bold text-white"
                >
                  <LogIn className="h-4 w-4" /> Se connecter
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
