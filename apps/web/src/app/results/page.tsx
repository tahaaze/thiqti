"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
// @ts-expect-error lucide-react 0.400 types incomplete
import { Search, SlidersHorizontal, Star, MapPin, Fuel, Heart, Grid3X3, List, Brain, CheckCircle2, AlertTriangle, MessageSquare, ChevronDown, ChevronUp, GitCompareArrows, Loader } from "lucide-react";
import CarImage from "@/components/CarImage";
import VoiceInput from "@/components/VoiceInput";
import SearchSuggestions from "@/components/SearchSuggestions";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import Skeleton from "@/components/Skeleton";

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
  score: number;
  source: string;
  url: string;
  matchPercent?: number;
  explanations?: MatchExplanation[];
  meetsBudget?: boolean;
  meetsBody?: boolean;
  meetsFuel?: boolean;
}

interface SearchCriteria {
  carrosserie: string | null;
  motorisation: string | null;
  transmission: string | null;
  marque: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  ville: string | null;
  anneeMin: number | null;
  kmMax: number | null;
  intent: string[];
}

export default function ResultsPage() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<SearchCriteria | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<string | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refine, setRefine] = useState({
    carrosserie: "",
    motorisation: "",
    budgetMax: "",
    anneeMin: "",
    kmMax: "",
    marque: "",
    ville: "",
  });
  const loadedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("thiqti_favorites");
    if (saved) setFavorites(JSON.parse(saved));
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    localStorage.setItem("thiqti_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Erreur réseau");
      const data = await res.json();
      setCars(data.results);
      setCriteria(data.criteria);
      if (data.criteria) {
        setRefine({
          carrosserie: data.criteria.carrosserie || "",
          motorisation: data.criteria.motorisation || "",
          budgetMax: data.criteria.budgetMax ? String(data.criteria.budgetMax) : "",
          anneeMin: data.criteria.anneeMin ? String(data.criteria.anneeMin) : "",
          kmMax: data.criteria.kmMax ? String(data.criteria.kmMax) : "",
          marque: data.criteria.marque || "",
          ville: data.criteria.ville || "",
        });
      }
    } catch {
      setCars([]);
      setCriteria(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || params.get("brand") || params.get("category") || "";
    setQuery(q);
    doSearch(q);
  }, [doSearch]);

  const toggleFav = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const buildRefineQuery = useCallback(() => {
    const parts: string[] = [];
    if (refine.carrosserie) parts.push(refine.carrosserie);
    if (refine.motorisation) parts.push(refine.motorisation);
    if (refine.marque) parts.push(refine.marque);
    if (refine.ville) parts.push(refine.ville);
    if (refine.budgetMax) parts.push(`sous ${refine.budgetMax} dh`);
    if (refine.anneeMin) parts.push(`depuis ${refine.anneeMin}`);
    if (refine.kmMax) parts.push(`moins de ${refine.kmMax} km`);
    return parts.join(" ");
  }, [refine]);

  const applyRefine = useCallback(() => {
    const q = buildRefineQuery();
    setQuery(q);
    doSearch(q);
  }, [buildRefineQuery, doSearch]);

  const formatCriteriaLabel = (key: string, _value: any): string => {
    const labels: Record<string, string> = {
      carrosserie: "Carrosserie",
      motorisation: "Motorisation",
      transmission: "Transmission",
      marque: "Marque",
      budgetMax: "Budget max",
      budgetMin: "Budget min",
      ville: "Ville",
      anneeMin: "Année min",
      kmMax: "Km max",
    };
    return labels[key] || key;
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Résultats de recherche</h1>
          <p className="mt-2 text-gray-400">{loading ? "Analyse en cours..." : `${cars.length} véhicules trouvés`}</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 space-y-6 lg:w-72">
            <div className="glass-card p-5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
                      <div key={key} className="flex items-center justify-between rounded-lg bg-dark-800/50 px-3 py-2">
                        <span className="text-xs text-gray-400">{formatCriteriaLabel(key, value)}</span>
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

            {criteria && (
              <div className="glass-card p-5">
                <button
                  onClick={() => setRefineOpen(!refineOpen)}
                  className="flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    Affiner la recherche
                  </span>
                  {refineOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </button>
                {refineOpen && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Carrosserie</label>
                      <select value={refine.carrosserie} onChange={(e) => setRefine({ ...refine, carrosserie: e.target.value })} className="input-field text-sm">
                        <option value="">Toutes</option>
                        {["SUV", "Berline", "Citadine", "Compacte", "Crossover", "Break", "Utilitaire"].map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Motorisation</label>
                      <select value={refine.motorisation} onChange={(e) => setRefine({ ...refine, motorisation: e.target.value })} className="input-field text-sm">
                        <option value="">Toutes</option>
                        {["Essence", "Diesel", "Hybride", "Électrique"].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Budget maximum (DH)</label>
                      <input
                        type="number"
                        value={refine.budgetMax}
                        onChange={(e) => setRefine({ ...refine, budgetMax: e.target.value })}
                        placeholder="Ex: 350000"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Année minimum</label>
                      <input
                        type="number"
                        value={refine.anneeMin}
                        onChange={(e) => setRefine({ ...refine, anneeMin: e.target.value })}
                        placeholder="Ex: 2020"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Kilométrage maximum</label>
                      <input
                        type="number"
                        value={refine.kmMax}
                        onChange={(e) => setRefine({ ...refine, kmMax: e.target.value })}
                        placeholder="Ex: 50000"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Marque</label>
                      <select value={refine.marque} onChange={(e) => setRefine({ ...refine, marque: e.target.value })} className="input-field text-sm">
                        <option value="">Toutes</option>
                        {["Dacia", "Renault", "Peugeot", "Toyota", "Hyundai", "Kia", "Volkswagen", "BMW", "Mercedes", "Audi", "Ford", "Nissan"].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Ville</label>
                      <select value={refine.ville} onChange={(e) => setRefine({ ...refine, ville: e.target.value })} className="input-field text-sm">
                        <option value="">Toutes</option>
                        {["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir"].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={applyRefine} className="btn-primary flex-1 text-sm">
                        Appliquer
                      </button>
                      <button onClick={() => {
                        setRefine({ carrosserie: "", motorisation: "", budgetMax: "", anneeMin: "", kmMax: "", marque: "", ville: "" });
                        doSearch("");
                      }} className="btn-secondary flex-1 text-sm">
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="glass-card p-5 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Filtres IA
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">Carburant</label>
                <div className="flex flex-wrap gap-2">
                  {["Essence", "Diesel", "Hybride", "Électrique"].map((f) => (
                    <button key={f} onClick={() => { setQuery(f); doSearch(f); }} className="chip text-xs">{f}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">Ville</label>
                <div className="flex flex-wrap gap-2">
                  {["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger"].map((c) => (
                    <button key={c} onClick={() => { setQuery(c); doSearch(c); }} className="chip text-xs">{c}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setQuery(""); doSearch(""); }} className="w-full rounded-xl border border-white/10 py-2 text-sm text-gray-400 hover:text-white">Réinitialiser</button>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-400">Source: <span className="text-white font-medium">Multi-sources</span></p>
              <div className="flex items-center gap-2">
                <Link href="/compare" className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 hover:text-primary"><GitCompareArrows className="h-3 w-3" />Comparer</Link>
                <button onClick={() => setView("grid")} className={`rounded-lg p-2 ${view === "grid" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-white"}`}><Grid3X3 className="h-4 w-4" /></button>
                <button onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-white"}`}><List className="h-4 w-4" /></button>
              </div>
            </div>

            {loading ? (
              <Skeleton count={6} />
            ) : cars.length === 0 ? (
              <EmptyState query={query} onReset={() => { setQuery(""); doSearch(""); }} />
            ) : (
              <div className={view === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
                {cars.map((v) => (
                  <Link key={v.id} href={`/vehicle/${v.id}`} className="glass-card group block overflow-hidden">
                    <div className="relative h-44 overflow-hidden">
                      <CarImage src={v.image} alt={v.title} make={v.make} model={v.model} className="h-full w-full object-cover transition group-hover:scale-105" />
                      <div className="absolute left-2 top-2"><span className="rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">{v.source}</span></div>
                      <div className="absolute right-2 top-2">
                        {v.meetsBudget === false ? (
                          <span className="rounded-lg bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-300 backdrop-blur">
                            Hors budget
                          </span>
                        ) : v.matchPercent !== undefined && v.matchPercent >= 80 ? (
                          <span className="rounded-lg bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300 backdrop-blur">
                            {v.matchPercent}% match
                          </span>
                        ) : null}
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(v.id); }} className="absolute right-2 top-2 rounded-lg bg-black/40 p-2 text-gray-400 backdrop-blur hover:text-red-400">
                        <Heart className={`h-4 w-4 ${favorites.includes(v.id) ? "fill-red-400 text-red-400" : ""}`} />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{v.title}</h3>
                      <p className="text-sm text-gray-500">{v.year} &middot; {v.km.toLocaleString()} km</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{v.fuel}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.city}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">{v.priceFormatted}</span>
                        <span className={`flex items-center gap-1 text-sm font-bold ${v.score >= 85 ? "text-green-500" : v.score >= 70 ? "text-yellow-500" : "text-red-500"}`}>
                          <Star className="h-3.5 w-3.5" />{v.score}
                        </span>
                      </div>

                      {v.explanations && v.explanations.length > 0 && (
                        <div className="mt-3 border-t border-white/5 pt-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedExplanations(expandedExplanations === v.id ? null : v.id);
                            }}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                          >
                            <Brain className="h-3 w-3" />
                            {expandedExplanations === v.id ? "Masquer" : "Pourquoi ce résultat ?"}
                          </button>
                          {expandedExplanations === v.id && (
                            <div className="mt-2 space-y-1">
                              {v.explanations.map((exp, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px]">
                                  {exp.impact === "positive" ? (
                                    <CheckCircle2 className="h-3 w-3 shrink-0 text-green-400" />
                                  ) : exp.impact === "negative" ? (
                                    <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" />
                                  ) : (
                                    <MessageSquare className="h-3 w-3 shrink-0 text-yellow-400" />
                                  )}
                                  <span className="text-gray-400">{exp.label}:</span>
                                  <span className={exp.impact === "positive" ? "text-green-300" : exp.impact === "negative" ? "text-red-300" : "text-yellow-300"}>
                                    {exp.reason}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
