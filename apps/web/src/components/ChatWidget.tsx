"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, MessageCircle } from "lucide-react";
import ChatAssistant from "@/components/ChatAssistant";

/**
 * Widget de chat flottant, affiché sur toutes les pages sauf celle de
 * l'assistant principal (`/`) où le grand assistant est déjà intégré.
 * Bien visible en bas à droite ; ouvre un panneau avec l'assistant.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const panelRef = useRef<HTMLDivElement>(null);

  const isAssistantPage = pathname === "/";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handlePanelClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (anchor) setOpen(false);
  }, []);

  if (isAssistantPage) return null;

  return (
    <>
      {/* Bouton flottant bien visible */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le conseiller Thiqti"
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] py-3 pl-4 pr-5 text-white shadow-[0_8px_28px_rgba(109,93,252,0.55)] transition hover:scale-105 hover:brightness-110"
      >
        <span className="relative">
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
          </span>
          <MessageCircle className="h-6 w-6" />
        </span>
        <span className="text-sm font-bold text-white sm:inline">Aide&nbsp;?</span>
      </button>

      {/* Panneau */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div ref={panelRef} onClick={handlePanelClick} className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-white/90 shadow-2xl backdrop-blur-xl sm:h-[80vh] sm:rounded-t-3xl sm:border sm:border-white/70 sm:bg-white/70 lg:rounded-3xl lg:pb-6 lg:pr-6">
            <div className="flex items-center justify-between border-b border-line px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 sm:py-3 sm:pt-3">
              <span className="font-display text-base font-bold text-ink sm:text-lg">
                Assistant <span className="gradient-text">Thiqti</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition hover:text-ink"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ChatAssistant chatOnly heightClassName="h-full" onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
