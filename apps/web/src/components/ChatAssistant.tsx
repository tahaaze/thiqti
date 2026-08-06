"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CarFront, Fuel, Gauge, MapPin, MessageCircle, RefreshCw, Send, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { ThiqtiShield, ZelligeStar } from "@/components/icons";
import CarImage from "@/components/CarImage";
import VoiceInput from "@/components/VoiceInput";
import { addHistory } from "@/lib/history";
import {
  ChatState,
  BotReply,
  createInitialState,
  initialMessage,
  answer,
  buildSearchRequest,
  recommendationText,
  criteriaSummary,
  criteriaLine,
} from "@/lib/chatbot";

interface ChatMessage {
  id: number;
  role: "bot" | "user";
  text: string;
}

interface ChatCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceFormatted: string;
  km: number;
  fuel: string;
  city: string;
  image: string;
  photos?: string[];
  source: string;
  url: string;
  score: number;
  inventoryType?: "new" | "used";
  bodyType?: string;
  contact?: {
    name?: string;
    phone?: string;
    phoneHref?: string;
    whatsappHref?: string;
    url?: string;
  };
  reputation?: {
    verified?: boolean;
    trustBadge?: boolean;
    views?: number;
    label?: string;
  };
}

function InventoryBadge({ type }: { type?: "new" | "used" }) {
  if (!type) return null;
  const isNew = type === "new";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur ${
        isNew ? "bg-green-500/80 text-white" : "bg-amber-500/80 text-white"
      }`}
    >
      {isNew ? "Neuf" : "Occasion"}
    </span>
  );
}

export default function ChatAssistant({
  onStart,
  heightClassName = "h-[640px]",
}: {
  onStart?: () => void;
  heightClassName?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [botState, setBotState] = useState<ChatState>(() => createInitialState());
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [results, setResults] = useState<ChatCar[] | null>(null);
  const [resultLimit, setResultLimit] = useState(4);
  const [searching, setSearching] = useState(false);
  const [input, setInput] = useState("");
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const init = initialMessage();
    setMessages([{ id: idRef.current++, role: "bot", text: init.text }]);
    setQuickReplies(init.quickReplies);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, results, searching]);

  const reqParams = useCallback((state: ChatState) => {
    const req = buildSearchRequest(state);
    const params = new URLSearchParams();
    if (req.q) params.set("q", req.q);
    if (req.type) params.set("type", req.type);
    const f = req.filters;
    if (f.minPrice != null) params.set("minPrice", String(f.minPrice));
    if (f.maxPrice != null) params.set("maxPrice", String(f.maxPrice));
    if (f.minYear != null) params.set("minYear", String(f.minYear));
    if (f.maxKm != null) params.set("maxKm", String(f.maxKm));
    return params;
  }, []);

  const fetchResultsFor = useCallback(async (state: ChatState, more = false) => {
    setSearching(true);
    try {
      const params = reqParams(state);
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur réseau");
      const data = await res.json();
      const list = (data.results || []) as ChatCar[];
      setResults(list);
      setResultLimit((n) => (more ? Math.max(n + 4, 10) : 4));
      if (list.length === 0) {
        setMessages((prev) => [
          ...prev,
          { id: idRef.current++, role: "bot", text: recommendationText([], state) },
        ]);
      }
    } catch {
      setResults([]);
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "bot", text: recommendationText([], state) },
      ]);
    }
    setSearching(false);
  }, [reqParams]);

  const reset = useCallback(() => {
    const init = initialMessage();
    setBotState(init.state);
    setQuickReplies(init.quickReplies);
    setResults(null);
    setResultLimit(4);
    setSearching(false);
    setMessages([{ id: idRef.current++, role: "bot", text: init.text }]);
  }, []);

  const handleSend = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || searching) return;
      if (text.toLowerCase() === "recommencer") {
        reset();
        return;
      }
      if (text.toLowerCase() === "voir les résultats") {
        fetchResultsFor(botState, true);
        return;
      }

      if (!startedRef.current) {
        startedRef.current = true;
        onStart?.();
      }
      if (text.toLowerCase() !== "voir plus" && text.toLowerCase() !== "voir tous" && text.toLowerCase() !== "afficher plus") {
        addHistory(text);
      }

      const reply: BotReply = answer(botState, text);
      setBotState(reply.state);
      setQuickReplies(reply.quickReplies);
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "user", text },
        { id: idRef.current++, role: "bot", text: reply.text },
      ]);
      if (reply.search) {
        fetchResultsFor(reply.state, /voir (?:plus|tous)|afficher plus|plus de r.sultats|d'autres options/i.test(text));
      }
    },
    [botState, searching, reset, fetchResultsFor, onStart]
  );

  const resultsUrl = (() => {
    const qs = reqParams(botState).toString();
    return `/results${qs ? `?${qs}` : ""}`;
  })();

  const chips = criteriaSummary(botState);
  const visibleResults = results ? results.slice(0, resultLimit) : null;

  return (
    <div className="w-full">
      <div className={`glass flex ${heightClassName} flex-col overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] text-white shadow-[0_4px_16px_rgba(109,93,252,0.4)]">
            <CarFront className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold leading-tight text-ink">
                Assistant <span className="gradient-text">Thiqti</span>
              </h2>
              <span className="flex h-2 w-2 items-center justify-center">
                <span className="absolute h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="h-2 w-2 rounded-full bg-green-400" />
              </span>
            </div>
            <p className="text-xs text-muted">Votre conseiller auto — décrivez votre envie</p>
          </div>
          <button onClick={reset} className="btn-secondary flex items-center gap-1.5" title="Recommencer">
            <RefreshCw className="h-3.5 w-3.5" />
            Nouvelle recherche
          </button>
        </div>

        {/* Recommandations contextualisées */}
        <div className="border-b border-line px-5 py-3">
          {chips.length > 0 ? (
            <>
              <p className="text-xs text-muted">
                D&apos;après vos critères : <span className="text-primary">{criteriaLine(botState)}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span key={chip} className="chip text-[11px]">{chip}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted">Aucun critère pour l&apos;instant — décrivez votre envie.</p>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) =>
          m.role === "bot" ? (
            <div key={m.id} className="flex gap-2.5 animate-fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc]/15 to-[#22a9f0]/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-white/70 bg-white/70 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-ink shadow-[0_2px_12px_rgba(13,18,48,0.06)] backdrop-blur">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end animate-fade-in">
              <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] px-4 py-3 text-sm leading-relaxed text-white shadow-[0_4px_16px_rgba(109,93,252,0.35)]">
                {m.text}
              </div>
            </div>
          )
        )}

        {searching && (
          <div className="flex gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc]/15 to-[#22a9f0]/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-3 backdrop-blur">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {results && !searching && (
          <div className="animate-fade-in">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              {results.length > 0 ? `${visibleResults?.length} suggestions pour vous` : "Aucun résultat exact"}
            </div>
            {results.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {visibleResults?.map((car) => (
                    <div key={car.id} className="group flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/60 shadow-[0_2px_12px_rgba(13,18,48,0.06)] backdrop-blur transition hover:shadow-[0_8px_24px_rgba(109,93,252,0.15)]">
                      <Link href={`/vehicle/${car.id}`} className="flex-1">
                        <div className="relative h-32 overflow-hidden">
                        <CarImage src={car.image} sources={car.photos} alt={car.title} make={car.make} model={car.model} bodyType={car.bodyType} className="h-full w-full object-cover transition group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute left-2 top-2">
                          <InventoryBadge type={car.inventoryType} />
                        </div>
                        {car.reputation?.verified && (
                          <div className="absolute bottom-2 left-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur">
                              <ThiqtiShield className="h-2.5 w-2.5" />
                              Vérifiée
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="truncate text-sm font-semibold">{car.title}</h4>
                        <p className="mt-0.5 text-xs text-muted">{car.year} &middot; {car.km.toLocaleString("fr-FR")} km</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-display text-base font-bold text-primary">{car.priceFormatted}</span>
                          <span className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-xs font-bold ${car.score >= 85 ? "text-green-600" : car.score >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                              <ZelligeStar className="h-3 w-3" />{car.score}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-muted">
                              <MapPin className="h-3 w-3" />{car.city}
                            </span>
                          </span>
                        </div>
                      </div>
                      </Link>
                      {car.url && (
                        <div className="border-t border-line px-3 py-2.5">
                          <a
                            href={car.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-semibold text-primary transition hover:text-primary-dark"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Voir sur {car.source || "la source"}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {visibleResults && visibleResults.length < results.length && (
                  <button
                    onClick={() => handleSend("Voir plus")}
                    className="btn-secondary mt-3 flex w-full items-center justify-center gap-2"
                  >
                    Voir plus d&apos;options
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </>
            ) : (
              <p className="rounded-2xl border border-white/70 bg-white/60 p-4 text-sm text-muted backdrop-blur">
                Aucune correspondance exacte. Essayez d&apos;élargir le budget ou la carrosserie.
              </p>
            )}
            {results.length > 0 && (
              <Link href={resultsUrl} className="btn-primary mt-3 flex items-center justify-center gap-2">
                Voir tous les résultats
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick replies */}
      {quickReplies.length > 0 && !searching && (
        <div className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
          {quickReplies.map((label) => (
            <button
              key={label}
              onClick={() => handleSend(label)}
              className="chip text-xs"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-line px-5 py-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Send className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { handleSend(input); setInput(""); } }}
              placeholder="Écrivez votre réponse ici..."
              className="input-field pl-10"
            />
          </div>
          <VoiceInput onTranscript={(t) => { setInput(t); handleSend(t); }} />
          <button
            onClick={() => { handleSend(input); setInput(""); }}
            className="btn-primary flex items-center gap-2"
            disabled={searching}
          >
            <Send className="h-4 w-4" />
            Envoyer
          </button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <Gauge className="h-3 w-3" />
          <Fuel className="h-3 w-3" />
          Dialogue en français et en darija &middot; Neuf et occasion &middot; Prix en DH
        </p>
      </div>
      </div>
    </div>
  );
}
