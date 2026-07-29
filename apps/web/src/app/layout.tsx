"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-dark-900 text-white antialiased">
        <ToastProvider>
          <nav className="sticky top-0 z-50 glass border-b border-white/5">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-400 text-sm font-bold text-white">
                  S
                </div>
                <span className="text-xl font-bold tracking-tight">Thiqti</span>
              </Link>
              <div className="hidden items-center gap-8 md:flex">
                <Link href="/results" className="text-sm text-gray-400 transition hover:text-white">Rechercher</Link>
                <Link href="/compare" className="text-sm text-gray-400 transition hover:text-white">Comparer</Link>
                <Link href="/favorites" className="text-sm text-gray-400 transition hover:text-white">Favoris</Link>
              </div>
              <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-gray-400 hover:text-white md:hidden">
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
            {menuOpen && (
              <div className="border-t border-white/5 px-6 py-4 md:hidden">
                <div className="flex flex-col gap-4">
                  <Link href="/results" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white">Rechercher</Link>
                  <Link href="/compare" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white">Comparer</Link>
                  <Link href="/favorites" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white">Favoris</Link>
                </div>
              </div>
            )}
          </nav>
          <main>{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
