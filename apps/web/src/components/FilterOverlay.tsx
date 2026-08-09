"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";

interface FilterOverlayProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  onReset: () => void;
  children: ReactNode;
}

export default function FilterOverlay({ open, onClose, activeCount, onReset, children }: FilterOverlayProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative flex w-full flex-col rounded-t-3xl border border-white/70 bg-white/80 shadow-2xl backdrop-blur-2xl sm:max-w-lg sm:rounded-3xl animate-slide-up overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-muted/30" />
        </div>

        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-bold text-ink">Filtres</h2>
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                onClick={onReset}
                className="text-xs text-muted transition hover:text-ink"
              >
                Réinitialiser
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10 text-muted transition hover:bg-muted/20 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        <div className="border-t border-line px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-[#6d5dfc] to-[#4b39f5] py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(109,93,252,0.35)] transition hover:shadow-[0_6px_20px_rgba(109,93,252,0.45)]"
          >
            Voir les résultats
          </button>
        </div>
      </div>
    </div>
  );
}
