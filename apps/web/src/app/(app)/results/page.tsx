"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, Fuel, Grid3X3, List, Brain, CheckCircle2, AlertTriangle, MessageSquare, X, GitCompareArrows, ExternalLink } from "lucide-react";
import { ZelligeStar, FavHeart, ThiqtiShield } from "@/components/icons";
import CarImage from "@/components/CarImage";
import SafetyBadge from "@/components/SafetyBadge";
import FilterPanel from "@/components/FilterPanel";
import VoiceInput from "@/components/VoiceInput";
import SearchSuggestions from "@/components/SearchSuggestions";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import Skeleton from "@/components/Skeleton";
import SellerContact from "@/components/SellerContact";
import { SearchFilters, SearchFacets } from "@/lib/searchTypes";
import { addHistory } from "@/lib/history";

interface MatchExplanation {
  label: string;
  value: string;
  impact: "positive" | "negative" | "neutral";
  reason: string;
}

interface CarListing {
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
  score: number;
  source: string;
  url: string;
  inventoryType?: "new" | "used";
  isDemoData?: boolean;
  matchPercent?: number;
  bodyType?: string;
  explanations?: MatchExplanation[];
  meetsBudget?: boolean;
  meetsBody?: boolean;
  meetsFuel?: boolean;
  safety?: { stars: number; ratingYear?: number; source?: string } | null;
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

interface SearchCriteria {
  carrosserie: string | null;
  motorisation: string | null;
  transmission: string | null;
  marque: string | null;
  modele: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetTolerance: number;
  ville: string | null;
  anneeMin: number | null;
  anneeMax: number | null;
  kmMax: number | null;
  intent: string[];
}

export default function ResultsPage() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [invType, setInvType] = useState<"new" | "used" | "">("");
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<SearchCriteria | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [demoData, setDemoData] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const seededRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("thiqti_favorites");
    if (saved) setFavorites(JSON.parse(saved));
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    localStorage.setItem("thiqti_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const doSearch = useCallback(
    async (q: string, type: "new" | "used" | "" = invType, flt: SearchFilters = filters) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (type) params.set("type", type);
        Object.entries(flt).forEach(([key, value]) => {
          if (value !== undefined && value !== "") params.set(key, String(value));
        });
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error("Erreur réseau");
        const data = await res.json();
        setCars(data.results);
        setCriteria(data.criteria);
        setFacets(data.facets || null);
        setDemoData(Boolean(data.demoData));
      } catch {
        setCars([]);
        setCriteria(null);
        setFacets(null);
        setDemoData(false);
      }
      setLoading(false);
    },
    [invType, filters]
  );

  const handleFiltersChange = useCallback(
    (flt: SearchFilters) => {
      setFilters(flt);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(query, invType, flt), 250);
    },
    [doSearch, query, invType]
  );

  const removeFilter = useCallback(
    (key: keyof SearchFilters) => {
      const next: SearchFilters = { ...filters };
      delete next[key];
      setFilters(next);
      doSearch(query, invType, next);
    },
    [doSearch, filters, query, invType]
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    doSearch(query, invType, {});
  }, [doSearch, query, invType]);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    const t = params.get("type");
    const type = t === "new" || t === "used" ? t : "";
    const toNum = (v: string | null): number | undefined => {
      if (v === null || v === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    const flt: SearchFilters = {
      minPrice: toNum(params.get("minPrice")),
      maxPrice: toNum(params.get("maxPrice")),
      minYear: toNum(params.get("minYear")),
      maxKm: toNum(params.get("maxKm")),
    };
    setQuery(q);
    setInvType(type);
    setFilters(flt);
    if (q) addHistory(q);
    doSearch(q, type, flt);
  }, [doSearch]);

  const changeInvType = (type: "new" | "used" | "") => {
    setInvType(type);
    const params = new URLSearchParams(window.location.search);
    if (type) params.set("type", type);
    else params.delete("type");
    window.history.replaceState(null, "", `?${params.toString()}`);
    doSearch(query, type);
  };

  const toggleFav = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const formatCriteriaLabel = (key: string): string => {
    const labels: Record<string, string> = {
      carrosserie: "Carrosserie", motorisation: "Motorisation", transmission: "Transmission",
      marque: "Marque", modele: "Modèle", budgetMax: "Budget max", budgetMin: "Budget min",
      ville: "Ville", anneeMin: "Année min", anneeMax: "Année max", kmMax: "Km max",
    };
    return labels[key] || key;
  };

  const filterLabel = (key: string, value: string | number): string => {
    switch (key) {
      case "minPrice": return `Prix ≥ ${Number(value).toLocaleString()} DH`;
      case "maxPrice": return `Prix ≤ ${Number(value).toLocaleString()} DH`;
      case "minYear": return `Année ≥ ${value}`;
      case "maxKm": return `Km ≤ ${Number(value).toLocaleString()}`;
      case "minSafety": return `Sécurité ≥ ${value}★`;
      default: return String(value);
    }
  };

  const activeFilterEntries = Object.entries(filters) as [keyof SearchFilters, string | number][];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-bold text-primary">Recherche</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <h1 className="font-display mt-4 text-4xl font-bold text-ink">Résultats de recherche</h1>
          <p className="mt-2 text-muted">{loading ? "Analyse en cours..." : `${cars.length} véhicules trouvés`}</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 space-y-6 lg:w-72">
            <div className="glass-card p-5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
                    placeholder="Ex: SUV hybride autour de 350 000 DH"
                    className="input-field pl-9 text-sm"
                  />
                </div>
                <VoiceInput onTranscript={(text) => { setQuery(text); doSearch(text); }} />
              </div>
              <SearchSuggestions query={query} onSelect={(s) => { setQuery(s); doSearch(s); }} />
            </div>

            {criteria && (
              <div className="glass-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Brain className="h-4 w-4 text-primary" />
                  Critères détectés
                </div>
                <div className="space-y-2">
                  {Object.entries(criteria)
                    .filter(([key, value]) => {
                      if (key === "intent" || key === "budgetTolerance") return false;
                      return value !== null && value !== undefined && value !== "";
                    })
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg bg-line/60 px-3 py-2">
                        <span className="text-xs text-muted">{formatCriteriaLabel(key)}</span>
                        <span className="text-xs font-medium text-primary">{String(value)}</span>
                      </div>
                    ))}
                </div>
                {criteria.intent.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {criteria.intent.map((i) => (
                      <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                        {i === "familial" ? "Famille" : i === "sportif" ? "Sport" : i === "economique" ? "Économique" : i === "confort" ? "Confort" : i === "ville" ? "Ville" : i}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Filtres modernes */}
            {facets ? (
              <FilterPanel
                facets={facets}
                filters={filters}
                total={cars.length}
                onChange={handleFiltersChange}
                onReset={resetFilters}
              />
            ) : (
              <div className="glass-card animate-pulse p-5">
                <div className="h-4 w-24 rounded bg-line/60" />
                <div className="mt-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 rounded-lg bg-line/60" />)}
                </div>
              </div>
            )}
          </aside>

          <div className="flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Source: <span className="text-ink font-medium">Multi-sources</span></p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="segmented">
                  <button className={`segmented-item ${invType === "" ? "active" : ""}`} onClick={() => changeInvType("")}>Tous</button>
                  <button className={`segmented-item ${invType === "new" ? "active" : ""}`} onClick={() => changeInvType("new")}>Neuf</button>
                  <button className={`segmented-item ${invType === "used" ? "active" : ""}`} onClick={() => changeInvType("used")}>Occasion</button>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/compare" className="flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs text-muted hover:text-primary"><GitCompareArrows className="h-3 w-3" />Comparer</Link>
                  <button onClick={() => setView("grid")} className={`rounded-lg p-2 ${view === "grid" ? "bg-primary/20 text-primary" : "text-muted hover:text-ink"}`}><Grid3X3 className="h-4 w-4" /></button>
                  <button onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-primary/20 text-primary" : "text-muted hover:text-ink"}`}><List className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            {demoData && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-semibold text-ink">Catalogue de référence</p>
                  <p className="mt-1 text-sm text-muted">
                    Les annonces live (Moteur.ma, Autera.ma, ElectroDrive.ma) sont momentanément
                    indisponibles. Les véhicules affichés proviennent d&apos;un catalogue de démonstration
                    non garanti — vérifiez la disponibilité réelle auprès du concessionnaire.
                  </p>
                </div>
              </div>
            )}

            {activeFilterEntries.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {activeFilterEntries.map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => removeFilter(key)}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary transition hover:bg-primary/20"
                  >
                    {filterLabel(key, value)}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                <button onClick={resetFilters} className="text-xs text-muted underline transition hover:text-ink">
                  Tout effacer
                </button>
              </div>
            )}

            {loading ? (
              <Skeleton count={6} />
            ) : cars.length === 0 ? (
              <EmptyState query={query} onReset={() => { setQuery(""); doSearch(""); }} />
            ) : (
              <div className={view === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
                {cars.map((v) => (
                  <div key={v.id} className="glass-card group flex flex-col overflow-hidden">
                    <Link href={`/vehicle/${v.id}`} className="flex-1">
                    <div className="relative h-44 overflow-hidden">
                      <CarImage src={v.image} sources={v.photos} alt={v.title} make={v.make} model={v.model} bodyType={v.bodyType} className="h-full w-full object-cover transition group-hover:scale-105" />
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute left-2 top-2"><span className="rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">{v.source}</span></div>
                      {v.isDemoData && (
                        <div className="absolute left-2 top-9">
                          <span className="rounded-lg bg-amber-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-black backdrop-blur">Démo</span>
                        </div>
                      )}
                      <div className="absolute right-2 top-2">
                        {v.meetsBudget === false ? (
                          <span className="rounded-lg bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-600 backdrop-blur">Hors budget</span>
                        ) : v.matchPercent !== undefined && v.matchPercent >= 80 ? (
                          <span className="rounded-lg bg-green-500/20 px-2 py-1 text-xs font-medium text-green-600 backdrop-blur">{v.matchPercent}% match</span>
                        ) : null}
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(v.id); }} className="absolute right-2 top-10 rounded-lg bg-black/40 p-2 text-muted backdrop-blur hover:text-red-600">
                        <FavHeart className={`h-4 w-4 ${favorites.includes(v.id) ? "fill-red-600 text-red-600" : ""}`} />
                      </button>
                      {v.reputation?.verified && (
                        <div className="absolute bottom-2 left-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur">
                            <ThiqtiShield className="h-3 w-3" />
                            Vérifiée
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{v.title}</h3>
                      <p className="text-sm text-muted">{v.year} &middot; {v.km.toLocaleString()} km</p>
                      <p className="mt-1 truncate text-xs text-muted">{[v.bodyType, v.fuel, v.year, v.city].filter(Boolean).join(" · ")}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                        {v.inventoryType && (
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${v.inventoryType === "new" ? "badge-new" : "badge-used"}`}>
                            {v.inventoryType === "new" ? "Neuf" : "Occasion"}
                          </span>
                        )}
                        <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{v.fuel}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.city}</span>
                      </div>
                      <div className="mt-2">
                        <SafetyBadge safety={v.safety} />
                      </div>
                      {(v.reputation && (v.reputation.verified || v.reputation.trustBadge || v.reputation.label || (v.reputation.views ?? 0) > 0)) || (v.contact && (v.contact.phoneHref || v.contact.whatsappHref || v.contact.url)) ? (
                        <div className="mt-2">
                          <SellerContact contact={v.contact} reputation={v.reputation} compact showButtons={false} />
                        </div>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">{v.priceFormatted}</span>
                        <span className={`flex items-center gap-1 text-sm font-bold ${v.score >= 85 ? "text-green-600" : v.score >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                          <ZelligeStar className="h-3.5 w-3.5" />{v.score}
                        </span>
                      </div>

                      {v.explanations && v.explanations.length > 0 && (
                        <div className="mt-3 border-t border-line pt-3">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpandedExplanations(expandedExplanations === v.id ? null : v.id); }}
                            className="flex items-center gap-1 text-xs text-muted hover:text-ink"
                          >
                            <Brain className="h-3 w-3" />
                            {expandedExplanations === v.id ? "Masquer" : "Pourquoi ce résultat ?"}
                          </button>
                          {expandedExplanations === v.id && (
                            <div className="mt-2 space-y-1">
                              {v.explanations.map((exp, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px]">
                                  {exp.impact === "positive" ? <CheckCircle2 className="h-3 w-3 shrink-0 text-green-600" /> :
                                   exp.impact === "negative" ? <AlertTriangle className="h-3 w-3 shrink-0 text-red-600" /> :
                                   <MessageSquare className="h-3 w-3 shrink-0 text-yellow-600" />}
                                  <span className="text-muted">{exp.label}:</span>
                                  <span className={exp.impact === "positive" ? "text-green-600" : exp.impact === "negative" ? "text-red-600" : "text-yellow-600"}>{exp.reason}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    </Link>
                    {v.url && (
                      <div className="border-t border-line px-4 py-2.5">
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-dark"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir sur {v.source || "la source"}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
