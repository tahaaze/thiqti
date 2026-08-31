"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center overflow-hidden rounded-[22px] border border-red-400/20 bg-white/45 px-8 py-16 text-center shadow-[0_8px_32px_rgba(13,18,48,0.06)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-300/25 bg-red-500/8 shadow-[0_4px_16px_rgba(239,68,68,0.08)]">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>

      <h3 className="mb-1.5 font-display text-lg font-bold tracking-tight text-ink">
        Une erreur est survenue
      </h3>
      <p className="mb-7 max-w-sm text-sm leading-relaxed text-muted">{message}</p>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-6 py-2.5 text-sm font-semibold text-ink shadow-[0_4px_16px_rgba(13,18,48,0.06)] backdrop-blur-md transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-brand-strong hover:shadow-[0_8px_24px_rgba(109,93,252,0.15)]"
      >
        <RefreshCw className="h-4 w-4" />
        Réessayer
      </button>
    </div>
  );
}
