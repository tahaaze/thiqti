"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CarFront, Fuel, Gauge, MapPin, MessageCircle, RefreshCw, Send, Sparkles, ArrowRight, ExternalLink, Heart } from "lucide-react";
import { ThiqtiShield, ZelligeStar } from "@/components/icons";
import CarImage from "@/components/CarImage";
import VoiceInput from "@/components/VoiceInput";
import { addHistory } from "@/lib/history";
import { saveFavorite, removeFavorite, loadFavoriteIds } from "@/lib/favorites";
import { setVehicleBackUrl } from "@/lib/navigation";
import {
  ChatState,
  BotReply,
  createInitialState,
  initialMessage,
  answer,
  buildSearchRequest,
  recommendationText,
  relaxedText,
  criteriaSummary,
  criteriaLine,
  hasEnoughForResults,
} from "@/lib/chatbot";
import type {
  ChatMessage,
  ChatCar,
} from "@/lib/chatSession";
import {
  saveChatSession,
  loadChatSession,
  clearChatSession,
  maxMessageId,
} from "@/lib/chatSession";

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
  chatOnly = false,
  onClose, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  onStart?: () => void;
  chatOnly?: boolean;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [botState, setBotState] = useState<ChatState>(() => createInitialState());
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [results, setResults] = useState<ChatCar[] | null>(null);
  const [resultLimit, setResultLimit] = useState(2);
  const [searching, setSearching] = useState(false);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const searchSeqRef = useRef(0);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    return new Set(loadFavoriteIds());
  });

  // Restaurer la session sauvegardée ou commencer avec le message d'accueil
  useEffect(() => {
    const saved = loadChatSession();
    if (saved && saved.messages.length > 0) {
      setMessages(saved.messages);
      setBotState(saved.botState);
      setQuickReplies(saved.quickReplies);
      setResults(saved.results);
      setResultLimit(saved.resultLimit);
      idRef.current = maxMessageId(saved.messages);
    } else {
      const init = initialMessage();
      setMessages([{ id: idRef.current++, role: "bot", text: init.text }]);
      setQuickReplies(init.quickReplies);
      setBotState(init.state);
      setResults(null);
      setResultLimit(4);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, results, searching]);

  // Sauvegarder la session à chaque changement d'état
  useEffect(() => {
    if (messages.length === 0) return;
    saveChatSession({
      messages,
      botState,
      results,
      resultLimit,
      quickReplies,
    });
  }, [messages, botState, results, resultLimit, quickReplies]);

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
    if (f.brand) params.set("brand", f.brand);
    if (f.bodyType) params.set("bodyType", f.bodyType);
    if (f.fuel) params.set("fuel", f.fuel);
    if (f.city) params.set("city", f.city);
    if (f.transmission) params.set("transmission", f.transmission);
    return params;
  }, []);

  const fetchResultsFor = useCallback(async (state: ChatState, more = false, queryText = "") => {
    setSearching(true);
    const seq = ++searchSeqRef.current;
    try {
      const params = reqParams(state);
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur réseau");
      const data = await res.json();
      if (seq !== searchSeqRef.current) return;
      const list = (data.results || []) as ChatCar[];
      const relaxed: string[] = data.relaxed || [];
      const expandedBudget: boolean = data.expandedBudget || false;
      setResults(list);
      setResultLimit((n) => (more ? Math.max(n + 4, 10) : 4));

      // Enregistrer dans l'historique avec les critères enrichis
      if (queryText && !more) {
        const top = list[0] ?? null;
        addHistory(
          queryText,
          {
            carrosserie: state.criteria.carrosserie,
            motorisation: state.criteria.motorisation,
            transmission: state.criteria.transmission,
            marque: state.criteria.marque,
            budgetMin: state.criteria.budgetMin,
            budgetMax: state.criteria.budgetMax,
            ville: state.criteria.ville,
          },
          list.length,
          top
            ? { thumbnail: top.image || null, id: top.id || null, score: top.score ?? null }
            : null
        );
      }

      if (list.length === 0) {
        setMessages((prev) => [
          ...prev,
          { id: idRef.current++, role: "bot", text: recommendationText([], state) },
        ]);
        setQuickReplies(["Voir plus de résultats", "Élargir le budget", "Changer de marque"]);
      } else if (relaxed.length > 0) {
        setMessages((prev) => [
          ...prev,
          { id: idRef.current++, role: "bot", text: relaxedText(state, relaxed, expandedBudget) },
        ]);
        setQuickReplies(["Voir plus de résultats", "C'est bon"]);
      } else {
        const followUp = state.lang === "darija"
          ? `هاهي ${list.length} طوموبيلات مطابقة للمعايير ديالك. بغيتي تزيد معايير ولا هاك هذو كفاهم ؟`
          : `Voici ${list.length} voitures qui correspondent à vos critères. Vous voulez affiner ou ces options vous conviennent ?`;
        setMessages((prev) => [
          ...prev,
          { id: idRef.current++, role: "bot", text: followUp },
        ]);
        setQuickReplies(state.lang === "darija"
          ? ["زيد معايير", "C'est bon"]
          : ["Affiner", "C'est bon"]);
      }
    } catch {
      if (seq !== searchSeqRef.current) return;
      setResults([]);
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "bot", text: recommendationText([], state) },
      ]);
    } finally {
      if (seq === searchSeqRef.current) setSearching(false);
    }
  }, [reqParams]);

  const reset = useCallback(() => {
    const init = initialMessage();
    setBotState(init.state);
    setQuickReplies(init.quickReplies);
    setResults(null);
    setResultLimit(4);
    setSearching(false);
    setMessages([{ id: idRef.current++, role: "bot", text: init.text }]);
    clearChatSession();
  }, []);

  const toggleFavorite = useCallback((car: ChatCar) => {
    const isFav = favorites.has(car.id);
    if (isFav) {
      removeFavorite(car.id);
      setFavorites((prev) => {
        const next = new Set(prev);
        next.delete(car.id);
        return next;
      });
    } else {
      saveFavorite(car.id, {
        id: car.id,
        title: car.title,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        priceFormatted: car.priceFormatted,
        km: car.km,
        fuel: car.fuel,
        city: car.city,
        image: car.image,
        photos: car.photos,
        score: car.score,
        source: car.source,
        url: car.url,
        inventoryType: car.inventoryType,
        bodyType: car.bodyType,
        contact: car.contact,
        reputation: car.reputation,
      });
      setFavorites((prev) => {
        const next = new Set(prev);
        next.add(car.id);
        return next;
      });
    }
  }, [favorites]);

  const handleSend = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      if (text.toLowerCase() === "recommencer") {
        reset();
        return;
      }

      if (!startedRef.current) {
        startedRef.current = true;
        onStart?.();
      }

      const isViewResults = text.toLowerCase() === "voir les résultats";

      if (isViewResults) {
        setMessages((prev) => [
          ...prev,
          { id: idRef.current++, role: "user", text },
        ]);
        fetchResultsFor(botState, false, criteriaLine(botState));
        return;
      }

      const isMore = /voir (?:plus|tous)|afficher plus|plus de r.sultats|d'autres options/i.test(text);
      if (isMore && results) {
        setMessages((prev) => [
          ...prev,
          { id: idRef.current++, role: "user", text },
        ]);
        fetchResultsFor(botState, true, "");
        return;
      }
      // addHistory est appelé dans fetchResultsFor avec les critères et résultats enrichis

      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "user", text },
      ]);
      setAiLoading(true);

      try {
        const reply: BotReply = answer(botState, text);
        setBotState(reply.state);
        setQuickReplies(reply.quickReplies);
        setMessages((prev) => [
          ...prev,
          { id: idRef.current++, role: "bot", text: reply.text },
        ]);
        if (reply.search) {
          const isMore = /voir (?:plus|tous)|afficher plus|plus de r.sultats|d'autres options/i.test(text);
          fetchResultsFor(reply.state, isMore, isMore ? "" : text);
        } else if (chatOnly && hasEnoughForResults(reply.state)) {
          // Dans le widget : lancer la recherche automatiquement
          // car les quick replies (« Voir les résultats ») sont masquées
          fetchResultsFor(reply.state, false, text);
        }
      } finally {
        setAiLoading(false);
      }
    },
    [botState, messages, reset, fetchResultsFor, onStart]
  );

  const resultsUrl = (() => {
    const qs = reqParams(botState).toString();
    return `/results?${qs ? `${qs}&` : ""}from=chat`;
  })();

  const chips = criteriaSummary(botState);
  const visibleResults = results ? results.slice(0, resultLimit) : null;

  return (
    <div className={`w-full ${chatOnly ? "h-full" : "flex flex-1 flex-col min-h-0"}`}>
      <div className={`glass flex min-h-0 flex-1 flex-col ${chatOnly ? "h-full overflow-clip" : "overflow-hidden"}`}>
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] text-white shadow-[0_4px_16px_rgba(109,93,252,0.4)] sm:h-10 sm:w-10">
            <CarFront className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="truncate font-display text-base font-bold leading-tight text-ink sm:text-xl">
                Assistant <span className="gradient-text">Thiqti</span>
              </h2>
              <span className="flex h-2 w-2 shrink-0 items-center justify-center">
                <span className="absolute h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="h-2 w-2 rounded-full bg-green-400" />
              </span>
            </div>
            <p className="hidden text-xs text-muted sm:block">
              {botState.lang === "darija" ? "مستشارك ديال السيارات — وصف لنا شنو بغيتي" : "Votre conseiller auto — décrivez votre envie"}
            </p>
          </div>
          <button
            onClick={reset}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-muted transition hover:text-ink sm:h-auto sm:w-auto sm:px-3 sm:py-1.5"
            title={botState.lang === "darija" ? "ابدأ من جديد" : "Recommencer"}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{botState.lang === "darija" ? "بداية جديدة" : "Nouvelle recherche"}</span>
          </button>
        </div>

        {/* Recommandations contextualisées — masquées dans le widget */}
        {!chatOnly && chips.length > 0 && (
          <div className="border-b border-line px-3 py-2 sm:px-5 sm:py-3">
            <p className="text-[11px] text-muted sm:text-xs">
              {botState.lang === "darija" ? "على حساب المعايير ديالك : " : "D'après vos critères : "}
              <span className="text-primary">{criteriaLine(botState)}</span>
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-2 sm:gap-1.5">
              {chips.map((chip) => (
                <span key={chip} className="chip text-[10px] sm:text-[11px]">{chip}</span>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:space-y-4 sm:px-5 sm:py-5 chat-scroll" style={{ WebkitOverflowScrolling: "touch", scrollPaddingBottom: "1rem" }}>
        {messages.map((m) =>
          m.role === "bot" ? (
            <div key={m.id} className="flex gap-2.5 animate-fade-in">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc]/15 to-[#22a9f0]/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-white/70 bg-white/80 px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line text-ink shadow-[0_2px_12px_rgba(13,18,48,0.06)] backdrop-blur sm:max-w-[80%] sm:text-sm">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end animate-fade-in">
              <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] px-4 py-3 text-[15px] leading-relaxed text-white shadow-[0_4px_16px_rgba(109,93,252,0.35)] sm:max-w-[80%] sm:text-sm">
                {m.text}
              </div>
            </div>
          )
        )}

        {(searching || aiLoading) && (
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
              {results.length > 0
                ? botState.lang === "darija"
                  ? `${Math.min(visibleResults?.length ?? 0, results.length)} من أصل ${results.length} اقتراحات`
                  : `${Math.min(visibleResults?.length ?? 0, results.length)} sur ${results.length} résultats`
                : botState.lang === "darija"
                  ? "ما لقينا حتى نتيجة دقيقة"
                  : "Aucun résultat exact"}
            </div>
            {results.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {visibleResults?.map((car) => (
                    <div key={car.id} className="group relative flex flex-col rounded-2xl border border-white/70 bg-white/60 shadow-[0_2px_12px_rgba(13,18,48,0.06)] backdrop-blur transition hover:shadow-[0_8px_24px_rgba(109,93,252,0.15)]">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(car)}
                        className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur transition hover:bg-black/60"
                        aria-label={favorites.has(car.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Heart className={`h-3.5 w-3.5 transition ${favorites.has(car.id) ? "fill-red-500 text-red-500" : "text-white"}`} />
                      </button>
                      <Link href={`/vehicle/${car.id}`} onClick={() => setVehicleBackUrl()} className="flex-1">
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
              </>
            ) : (
              <p className="rounded-2xl border border-white/70 bg-white/60 p-4 text-sm text-muted backdrop-blur">
                {botState.lang === "darija"
                  ? "ما لقينا حتى تطابق دقيق. جرب توسيع الميزانية ولا نوع الطوموبيل."
                  : "Aucune correspondance exacte. Essayez d'élargir le budget ou la carrosserie."}
              </p>
            )}
            {results.length > 0 && chatOnly && visibleResults && visibleResults.length < results.length && (
              <button
                onClick={() => { window.location.href = resultsUrl; }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary/10"
              >
                {botState.lang === "darija" ? `شوف ${results.length} نتائج كاع` : `Voir les ${results.length} résultats`}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {results.length > 0 && !chatOnly && (
              <Link href={resultsUrl} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(109,93,252,0.4)] transition hover:brightness-110">
                {botState.lang === "darija" ? "شوف جميع النتائج" : "Voir tous les résultats"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}

        {/* Bouton "Voir les résultats" — visible dans le widget (chatOnly) ou sur mobile */}
        {(() => {
          const c = botState.criteria;
          const hasAny = !!(c.budgetMax || c.budgetMin || c.motorisation || c.carrosserie || c.marque || c.ville);
          const showButton = chatOnly ? hasAny : hasEnoughForResults(botState);
          return showButton && !results && !searching ? (
            <div className={`sticky bottom-0 px-3 py-2 ${chatOnly ? "" : "sm:hidden"}`}>
              <button
                onClick={() => handleSend("Voir les résultats")}
                className="w-full rounded-full bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(109,93,252,0.4)] transition hover:brightness-110"
              >
                {botState.lang === "darija" ? "شوف النتائج" : "Voir les résultats"}
              </button>
            </div>
          ) : null;
        })()}
      </div>

      {/* Quick replies */}
      {quickReplies.length > 0 && !searching && !aiLoading && (
        <div className="flex overflow-x-auto border-t border-line px-3 py-2 sm:flex-wrap sm:gap-2 sm:px-5 sm:py-3">
          {quickReplies.map((label) => {
            const isPrimary = /voir les r.sultats|tous les r.sultats|voir tous|c est bon|c'est bon/i.test(label);
            return (
              <button
                key={label}
                onClick={() => handleSend(label)}
                className={
                  isPrimary
                    ? "shrink-0 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(109,93,252,0.4)] transition hover:brightness-110 sm:w-auto sm:shrink-0"
                    : "shrink-0 whitespace-nowrap rounded-full border border-line bg-white/70 px-3.5 py-2.5 text-[13px] text-ink backdrop-blur transition hover:bg-white sm:w-auto sm:shrink-0"
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-line bg-white/60 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-5 sm:py-3">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { handleSend(input); setInput(""); } }}
              placeholder={botState.lang === "darija" ? "كتب جوابك هنا..." : "Écrivez votre réponse ici..."}
              className="input-field rounded-full pl-4 text-base sm:text-sm"
            />
          </div>
          <VoiceInput onTranscript={(t) => { setInput(t); handleSend(t); }} />
          <button
            onClick={() => { handleSend(input); setInput(""); }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] text-white shadow-[0_4px_16px_rgba(109,93,252,0.45)] transition hover:scale-105 hover:brightness-110 disabled:opacity-50 sm:h-12 sm:w-12"
            disabled={searching || aiLoading}
            aria-label="Envoyer"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 hidden items-center gap-1.5 text-[11px] text-muted sm:mt-3 sm:flex">
          <Gauge className="h-3 w-3" />
          <Fuel className="h-3 w-3" />
          {botState.lang === "darija"
            ? "هضرة بالفرنسية والداريجة · جديدة ومستعملة · الثمن بالدرهم"
            : "Dialogue en français et en darija · Neuf et occasion · Prix en DH"}
        </p>
      </div>
      </div>
    </div>
  );
}
