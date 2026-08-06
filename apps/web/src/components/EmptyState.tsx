"use client";

import { SearchX, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  query: string;
  onReset: () => void;
}

export default function EmptyState({ query, onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface px-8 py-16 text-center shadow-[0_1px_2px_rgba(28,30,34,0.05),0_8px_24px_-16px_rgba(28,30,34,0.12)]">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/10">
        <SearchX className="h-8 w-8 text-muted" />
      </div>

      <h3 className="mb-1 text-lg font-semibold text-ink">
        Aucun résultat pour &laquo;&nbsp;{query}&nbsp;&raquo;
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted">
        Essayez d&apos;élargir votre recherche en modifiant les filtres ou en
        utilisant des termes plus généraux.
      </p>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-all hover:border-primary/40 hover:bg-muted/10 hover:text-ink"
      >
        <RotateCcw className="h-4 w-4" />
        Réinitialiser la recherche
      </button>
    </div>
  );
}
