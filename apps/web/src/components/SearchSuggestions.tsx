"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";

const PREDEFINED_SUGGESTIONS = [
  "SUV hybride autour de 350 000 DH, confortable pour la famille",
  "SUV هجين ف 350 000 درهم, راحة للعائلة",
  "Citadine économique essence",
  "Berline familiale automatique",
  "SUV 7 places diesel",
  "Voiture électrique moins de 300 000 DH",
  "Pick-up diesel utilitaire",
  "Crossover automatique essence",
  "Toyota RAV4 hybride",
  "Dacia Sandero pas cher",
  "Renault Clio citadine",
  "SUV 4x4 tout-terrain",
  "Voiture confortable pour longs trajets",
  "Petite voiture ville parking",
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
      <Sparkles className="h-4 w-4 text-amber-600/70 shrink-0" />
      {filtered.slice(0, 5).map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className="border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
