"use client";

import { SearchX, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  query: string;
  onReset: () => void;
}

export default function EmptyState({ query, onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center overflow-hidden rounded-[22px] border border-white/60 bg-white/45 px-8 py-16 text-center shadow-[0_8px_32px_rgba(13,18,48,0.06)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-white/40 shadow-[0_4px_16px_rgba(109,93,252,0.1)]">
        <SearchX className="h-8 w-8 text-brand" />
      </div>

      <h3 className="mb-1.5 font-display text-xl font-bold tracking-tight text-ink">
        Aucun résultat pour &laquo;&nbsp;{query}&nbsp;&raquo;
      </h3>
      <p className="mb-7 max-w-sm text-sm leading-relaxed text-muted">
        Essayez d&apos;élargir votre recherche en modifiant les filtres ou en
        utilisant des termes plus généraux.
      </p>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-ink shadow-[0_4px_16px_rgba(13,18,48,0.06)] backdrop-blur-md transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-brand-strong hover:shadow-[0_8px_24px_rgba(109,93,252,0.15)]"
      >
        <RotateCcw className="h-4 w-4" />
        Réinitialiser la recherche
      </button>
    </div>
  );
}
