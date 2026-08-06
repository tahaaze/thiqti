"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, Menu, MessageCircle, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Assistant" },
  { href: "/results", label: "Rechercher" },
  { href: "/compare", label: "Comparer" },
  { href: "/favorites", label: "Favoris" },
];

export default function MarketingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur-lg shadow-[0_1px_0_rgba(28,30,34,0.04),0_6px_16px_-12px_rgba(28,30,34,0.12)]">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-gradient-to-br from-[#f3d9a3] to-[#d4a94a] shadow-[0_0_16px_rgba(196,128,46,0.25)] transition group-hover:shadow-[0_0_24px_rgba(196,128,46,0.4)]">
            <CarFront className="h-5 w-5 text-[#241505]" />
          </div>
          <span className="font-display text-2xl tracking-wide text-ink">
            Thiqti<span className="text-primary">.</span>
          </span>
          <span className="hidden rounded-full border border-primary/40 bg-primary-tint px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-dark sm:inline">
            Maroc
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative rounded-lg px-3.5 py-2 text-sm font-medium uppercase tracking-widest transition ${
                isActive(link.href) ? "text-primary-dark" : "text-muted hover:text-ink"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
            </Link>
          ))}
          <Link
            href="/login"
            className="ml-2 flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary-tint px-4 py-2 text-sm font-semibold text-primary-dark transition hover:bg-primary/15 hover:shadow-[0_0_16px_rgba(196,128,46,0.2)]"
          >
            <MessageCircle className="h-4 w-4" />
            Admin
          </Link>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-muted hover:text-ink md:hidden">
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      <div className="gold-hairline" />
      {menuOpen && (
        <div className="border-t border-line px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm uppercase tracking-widest ${isActive(link.href) ? "font-semibold text-primary-dark" : "text-muted hover:text-ink"}`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm uppercase tracking-widest text-primary-dark">Admin</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
