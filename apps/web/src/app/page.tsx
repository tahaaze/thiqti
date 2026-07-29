"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import VoiceInput from "@/components/VoiceInput";
import SearchSuggestions from "@/components/SearchSuggestions";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const doSearch = (q: string) => {
    const term = q.trim();
    if (term) {
      router.push(`/results?q=${encodeURIComponent(term)}`);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
          <span className="gradient-text">Thiqti</span>
        </h1>
        <p className="mb-10 text-base text-gray-400 md:text-lg">
          Décrivez votre besoin en une phrase. Notre moteur comprend, cherche et classe.
        </p>

        <div className="glass p-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
                placeholder="Ex: SUV hybride autour de 350 000 DH, confortable pour la famille"
                className="input-field pl-10"
                autoFocus
              />
            </div>
            <VoiceInput onTranscript={(text) => { setQuery(text); doSearch(text); }} />
            <button onClick={() => doSearch(query)} className="btn-primary flex items-center gap-2">
              <Search className="h-4 w-4" />
              Rechercher
            </button>
          </div>
        </div>

        <SearchSuggestions query={query} onSelect={(s) => { setQuery(s); doSearch(s); }} />

        <p className="mt-8 text-xs text-gray-600">
          Recherche en français et en darija &middot; Résultats instantanés &middot; Baromètre d&apos;e-réputation
        </p>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 border-t border-white/5 px-6 py-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between text-xs text-gray-600">
          <span>&copy; 2026 Thiqti. Propulsé par Volund Ventures.</span>
          <div className="flex gap-4">
            <span>Recherche intelligente</span>
            <span>Matching multicritère</span>
            <span>Baromètre réputation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
