"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, Star, MapPin, Fuel, Trash2 } from "lucide-react";

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

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("thiqti_favorites");
    if (saved) setFavorites(JSON.parse(saved));
    loadedRef.current = true;
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    localStorage.setItem("thiqti_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (favorites.length === 0) return;
    fetch("/api/search").then(r => {
      if (!r.ok) throw new Error("Erreur réseau");
      return r.json();
    }).then(data => {
      setCars(data.results.filter((c: CarListing) => favorites.includes(c.id)));
    }).catch(() => {});
  }, [favorites]);

  const removeFav = (id: string) => {
    const updated = favorites.filter(f => f !== id);
    setFavorites(updated);
    setCars(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-400 fill-red-400" />
            Mes favoris
          </h1>
          <p className="mt-2 text-gray-400">{loadedRef.current ? `${favorites.length} véhicule(s) sauvegardé(s)` : "Chargement..."}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="glass-card animate-pulse h-72" />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-gray-600" />
            <p className="text-gray-400">Aucun favori pour le moment</p>
            <p className="mt-2 text-sm text-gray-500">Cliquez sur le cœur dans les résultats pour sauvegarder</p>
            <Link href="/results" className="btn-primary mt-6 inline-flex items-center gap-2">
              Explorer les annonces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cars.map((v) => (
              <Link key={v.id} href={`/vehicle/${v.id}`} className="glass-card group block overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <img src={v.image} alt={v.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                  <div className="absolute left-2 top-2"><span className="rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">{v.source}</span></div>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFav(v.id); }} className="absolute right-2 top-2 rounded-lg bg-black/40 p-2 text-gray-400 backdrop-blur hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
