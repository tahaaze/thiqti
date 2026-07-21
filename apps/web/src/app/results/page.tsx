"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Star, MapPin, Fuel, Heart, Grid3X3, List } from "lucide-react";

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
}

export default function ResultsPage() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  const doSearch = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCars(data.results);
    } catch { setCars([]); }
    setLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || params.get("brand") || params.get("category") || "";
    setQuery(q);
    doSearch(q);
  }, []);

  const toggleFav = (id: string) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Résultats de recherche</h1>
          <p className="mt-2 text-gray-400">{loading ? "Chargement..." : `${cars.length} véhicules trouvés`}</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 space-y-6 lg:w-72">
            <div className="glass-card p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
                  placeholder="Rechercher..."
                  className="input-field pl-9 text-sm"
                />
              </div>
            </div>

            <div className="glass-card p-5 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Filtres IA
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">Marque</label>
                <select onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }} className="input-field text-sm">
                  <option value="">Toutes les marques</option>
                  {["Dacia", "Renault", "Toyota", "Hyundai", "Kia", "Peugeot", "Volkswagen", "BMW", "Mercedes", "Nissan"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">Carburant</label>
                <div className="flex flex-wrap gap-2">
                  {["Essence", "Diesel", "Hybride"].map((f) => (
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
              <p className="text-sm text-gray-400">Source: <span className="text-white font-medium">AI Multi-Sources</span></p>
              <div className="flex items-center gap-2">
                <button onClick={() => setView("grid")} className={`rounded-lg p-2 ${view === "grid" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-white"}`}><Grid3X3 className="h-4 w-4" /></button>
                <button onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-white"}`}><List className="h-4 w-4" /></button>
              </div>
            </div>

            {loading ? (
              <div className={view === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
                {[1,2,3,4,5,6].map(i => <div key={i} className="glass-card animate-pulse h-72" />)}
              </div>
            ) : (
              <div className={view === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
                {cars.map((v) => (
                  <a key={v.id} href={`/vehicle/${v.id}`} className="glass-card group block overflow-hidden">
                    <div className="relative h-44 overflow-hidden">
                      <img src={v.image} alt={v.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                      <div className="absolute left-2 top-2"><span className="rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">{v.source}</span></div>
                      <button onClick={(e) => { e.preventDefault(); toggleFav(v.id); }} className="absolute right-2 top-2 rounded-lg bg-black/40 p-2 text-gray-400 backdrop-blur hover:text-red-400">
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
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
