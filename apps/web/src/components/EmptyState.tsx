"use client";

import { SearchX, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  query: string;
  onReset: () => void;
}

export default function EmptyState({ query, onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border border-line bg-surface px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center border border-line bg-canvas">
        <SearchX className="h-8 w-8 text-muted" />
      </div>

      <h3 className="mb-1 font-display text-xl font-bold text-ink">
        Aucun résultat pour &laquo;&nbsp;{query}&nbsp;&raquo;
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted">
        Essayez d&apos;élargir votre recherche en modifiant les filtres ou en
        utilisant des termes plus généraux.
      </p>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 border border-ink bg-surface px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ink transition hover:bg-ink hover:text-canvas"
      >
        <RotateCcw className="h-4 w-4" />
        Réinitialiser la recherche
      </button>
    </div>
  );
}
