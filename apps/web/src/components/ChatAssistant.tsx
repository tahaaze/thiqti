"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CarFront, Fuel, Gauge, MapPin, MessageCircle, RefreshCw, Send, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import CarImage from "@/components/CarImage";
import SellerContact from "@/components/SellerContact";
import VoiceInput from "@/components/VoiceInput";
import {
  ChatState,
  BotReply,
  createInitialState,
  initialMessage,
  answer,
  buildSearchRequest,
  recommendationText,
  summaryText,
  CHAT_STEPS,
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
      className={`rounded-md px-2 py-1 text-xs font-semibold backdrop-blur ${
        isNew ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"
      }`}
    >
      {isNew ? "Neuf" : "Occasion"}
    </span>
  );
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [botState, setBotState] = useState<ChatState>(() => createInitialState());
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [results, setResults] = useState<ChatCar[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [input, setInput] = useState("");
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = initialMessage();
    setMessages([{ id: idRef.current++, role: "bot", text: init.text }]);
    setQuickReplies(init.quickReplies);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, results, searching]);

  const fetchResultsFor = useCallback(async (state: ChatState) => {
    setSearching(true);
    try {
      const req = buildSearchRequest(state);
      const params = new URLSearchParams();
      if (req.q) params.set("q", req.q);
      if (req.type) params.set("type", req.type);
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur réseau");
      const data = await res.json();
      const list = (data.results || []).slice(0, 6) as ChatCar[];
      setResults(list);
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "bot", text: recommendationText(list, state) },
      ]);
    } catch {
      setResults([]);
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "bot", text: recommendationText([], state) },
      ]);
    }
    setSearching(false);
  }, []);

  const reset = useCallback(() => {
    const init = initialMessage();
    setBotState(init.state);
    setQuickReplies(init.quickReplies);
    setResults(null);
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
        fetchResultsFor(botState);
        return;
      }

      const reply: BotReply = answer(botState, text);
      setBotState(reply.state);
      setQuickReplies(reply.quickReplies);
      setResults(null);
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "user", text },
        { id: idRef.current++, role: "bot", text: reply.text },
      ]);
      if (reply.done) {
        fetchResultsFor(reply.state);
      }
    },
    [botState, searching, reset, fetchResultsFor]
  );

  const resultsUrl = (() => {
    const req = buildSearchRequest(botState);
    const params = new URLSearchParams();
    if (req.q) params.set("q", req.q);
    if (req.type) params.set("type", req.type);
    const qs = params.toString();
    return `/results${qs ? `?${qs}` : ""}`;
  })();

  const stepIndex = CHAT_STEPS.findIndex((s) => s.stage === botState.stage);
  const progressPct = botState.stage === "done" ? 100 : stepIndex < 0 ? 0 : (stepIndex / CHAT_STEPS.length) * 100;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_300px]">
      <div className="glass flex h-[640px] flex-col overflow-hidden rounded-3xl shadow-2xl shadow-primary/10">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/50 bg-gradient-to-br from-[#eed9a1] to-[#c2923d] shadow-[0_0_18px_rgba(212,169,74,0.3)]">
            <CarFront className="h-5 w-5 text-[#1b1406]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              Assistant Thiqti
              <span className="flex h-2 w-2 items-center justify-center">
                <span className="absolute h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="h-2 w-2 rounded-full bg-green-400" />
              </span>
            </div>
            <p className="text-xs text-gray-400">Votre guide d&apos;achat en {CHAT_STEPS.length} étapes</p>
          </div>
          <button onClick={reset} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:text-white" title="Recommencer">
            <RefreshCw className="h-3.5 w-3.5" />
            Nouvelle recherche
          </button>
        </div>

        {/* Barre de progression */}
        <div className="flex gap-1.5 border-b border-white/5 px-5 py-3">
          {CHAT_STEPS.map((s, i) => {
            const isDone = i < stepIndex || botState.stage === "done";
            const isActive = botState.stage === s.stage;
            return (
              <div key={s.stage} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all ${isDone ? "bg-primary" : isActive ? "animate-pulse bg-primary/70" : "bg-white/10"}`} />
                <p className={`mt-1 text-center text-[10px] font-medium ${isDone || isActive ? "text-primary" : "text-gray-600"}`}>{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) =>
          m.role === "bot" ? (
            <div key={m.id} className="flex gap-2.5 animate-fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#eed9a1] to-[#c2923d] text-[#1b1406]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/10 bg-dark-800/80 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-gray-100">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end animate-fade-in">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#eed9a1] to-[#c2923d] px-4 py-3 text-sm leading-relaxed text-[#1b1406] shadow-[0_2px_16px_rgba(212,169,74,0.35)]">
                {m.text}
              </div>
            </div>
          )
        )}

        {searching && (
          <div className="flex gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#eed9a1] to-[#c2923d] text-[#1b1406]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/10 bg-dark-800/80 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {results && !searching && (
          <div className="animate-fade-in">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              {results.length > 0 ? `${results.length} suggestions pour vous` : "Aucun résultat exact"}
            </div>
            {results.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {results.map((car) => (
                  <Link key={car.id} href={`/vehicle/${car.id}`} className="group overflow-hidden rounded-2xl border border-white/5 bg-dark-800/60 transition hover:border-primary/40">
                    <div className="relative h-32 overflow-hidden">
                      <CarImage src={car.image} sources={car.photos} alt={car.title} make={car.make} model={car.model} bodyType={car.bodyType} className="h-full w-full object-cover transition group-hover:scale-105" />
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute left-2 top-2">
                        <InventoryBadge type={car.inventoryType} />
                      </div>
                      {car.reputation?.verified && (
                        <div className="absolute bottom-2 left-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary backdrop-blur">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Vérifiée
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="truncate text-sm font-semibold">{car.title}</h4>
                      <p className="mt-0.5 text-xs text-gray-500">{car.year} &middot; {car.km.toLocaleString("fr-FR")} km</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-bold text-primary">{car.priceFormatted}</span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <MapPin className="h-3 w-3" />{car.city}
                        </span>
                      </div>
                      <div className="mt-2">
                        <SellerContact contact={car.contact} reputation={car.reputation} compact showButtons={false} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-white/5 bg-dark-800/60 p-4 text-sm text-gray-400">
                Aucune correspondance exacte. Essayez d&apos;élargir le budget ou la carrosserie.
              </p>
            )}
            {results.length > 0 && (
              <Link href={resultsUrl} className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20">
                Voir tous les résultats
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick replies */}
      {quickReplies.length > 0 && !searching && (
        <div className="flex flex-wrap gap-2 border-t border-white/5 px-5 py-3">
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
      <div className="border-t border-white/5 px-5 py-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Send className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
          <Gauge className="h-3 w-3" />
          <Fuel className="h-3 w-3" />
          Dialogue en français et en darija &middot; Neuf et occasion &middot; Prix en DH
        </p>
      </div>
      </div>

      {/* Panneau profil (desktop) */}
      <aside className="sticky top-24 hidden gap-4 lg:flex lg:flex-col">
        <div className="glass-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold">Votre profil</h3>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-300">{summaryText(botState)}</p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            {botState.stage === "done" ? "Profil complet - recommandations prêtes !" : `${Math.round(progressPct / 20)}/${CHAT_STEPS.length} étapes renseignées`}
          </p>
          {botState.stage === "done" && (
            <Link href={resultsUrl} className="btn-primary mt-4 flex w-full items-center justify-center gap-2 text-sm">
              Voir mes résultats <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="glass-card p-4 text-xs leading-relaxed text-gray-500">
          <p className="mb-1 font-semibold text-gray-300">Astuce 💡</p>
          Décrivez votre besoin d&apos;un coup (« SUV diesel 200 000 DH ») ou répondez question par question. Dites «&nbsp;Passer&nbsp;» pour ignorer un critère.
        </div>
      </aside>
    </div>
  );
}
