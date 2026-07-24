"use client";

import { useState, useEffect, useCallback } from "react";
// @ts-expect-error - lucide-react 0.400 lacks type declarations
import { Sparkles } from "lucide-react";

const PREDEFINED_SUGGESTIONS = [
  "SUV hybride",
  "Citadine économique",
  "Berline familiale",
  "SUV 7 places",
  "Voiture électrique",
  "Pick-up diesel",
  "Crossover automatique",
];

interface SearchSuggestionsProps {
  query: string;
  onSelect: (value: string) => void;
}

export default function SearchSuggestions({ query, onSelect }: SearchSuggestionsProps) {
  const [filtered, setFiltered] = useState<string[]>([]);

  const filterSuggestions = useCallback(() => {
    if (!query.trim()) {
      setFiltered(PREDEFINED_SUGGESTIONS);
      return;
    }
    const lower = query.toLowerCase();
    const matches = PREDEFINED_SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(lower)
    );
    setFiltered(matches);
  }, [query]);

  useEffect(() => {
    filterSuggestions();
  }, [filterSuggestions]);

  if (filtered.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <Sparkles className="h-4 w-4 text-amber-400/70 shrink-0" />
      {filtered.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-md transition-all hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
