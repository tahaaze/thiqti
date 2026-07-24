"use client";

// @ts-expect-error - lucide-react 0.400 lacks type declarations
import { SearchX, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  query: string;
  onReset: () => void;
}

export default function EmptyState({ query, onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 py-16 text-center backdrop-blur-xl">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
        <SearchX className="h-8 w-8 text-gray-500" />
      </div>

      <h3 className="mb-1 text-lg font-semibold text-white">
        Aucun résultat pour &laquo;&nbsp;{query}&nbsp;&raquo;
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-400">
        Essayez d&apos;élargir votre recherche en modifiant les filtres ou en
        utilisant des termes plus généraux.
      </p>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <RotateCcw className="h-4 w-4" />
        Réinitialiser la recherche
      </button>
    </div>
  );
}
