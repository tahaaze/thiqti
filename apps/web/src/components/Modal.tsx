"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-md"
        style={{ animation: "fade-in 0.15s ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[22px] border border-white/60 bg-white/55 p-6 shadow-[0_24px_80px_rgba(13,18,48,0.18)] backdrop-blur-xl backdrop-saturate-150"
        style={{ animation: "slide-up 0.25s ease-out" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight text-ink">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/40 text-muted transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-brand-strong"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
