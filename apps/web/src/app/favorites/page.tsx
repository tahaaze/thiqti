"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MapPin, Fuel, Trash2 } from "lucide-react";
import { ZelligeStar, FavHeart, ThiqtiShield } from "@/components/icons";
import CarImage from "@/components/CarImage";
import SellerContact from "@/components/SellerContact";

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
    fetch("/api/search")
      .then((r) => r.json())
      .then((data) => {
        setCars(data.results.filter((c: CarListing) => favorites.includes(c.id)));
      })
      .catch(() => {});
  }, [favorites]);

  const removeFav = (id: string) => {
    const updated = favorites.filter((f) => f !== id);
    setFavorites(updated);
    setCars((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10">
              <FavHeart className="h-5 w-5 text-red-600 fill-red-600" />
            </span>
            Mes favoris
          </h1>
          <p className="mt-2 text-muted">{loadedRef.current ? `${favorites.length} véhicule(s) sauvegardé(s)` : "Chargement..."}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (<div key={i} className="glass-card animate-pulse h-72" />))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FavHeart className="mx-auto mb-4 h-12 w-12 text-muted" />
            <p className="text-muted">Aucun favori pour le moment</p>
            <p className="mt-2 text-sm text-muted">Cliquez sur le coeur dans les résultats pour sauvegarder</p>
            <Link href="/results" className="btn-primary mt-6 inline-flex items-center gap-2">Explorer les annonces</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cars.map((v) => (
              <Link key={v.id} href={`/vehicle/${v.id}`} className="glass-card group block overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <CarImage src={v.image} sources={v.photos} alt={v.title} make={v.make} model={v.model} bodyType={v.bodyType} className="h-full w-full object-cover transition group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute left-2 top-2 flex gap-2"><span className="rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">{v.source}</span>{v.inventoryType && <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${v.inventoryType === "new" ? "badge-new" : "badge-used"}`}>{v.inventoryType === "new" ? "Neuf" : "Occasion"}</span>}</div>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFav(v.id); }} className="absolute right-2 top-2 rounded-lg bg-black/40 p-2 text-muted backdrop-blur hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
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
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{v.fuel}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.city}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{v.priceFormatted}</span>
                    <span className={`flex items-center gap-1 text-sm font-bold ${v.score >= 85 ? "text-green-600" : v.score >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                      <ZelligeStar className="h-3.5 w-3.5" />{v.score}
                    </span>
                  </div>
                  {(v.reputation && (v.reputation.verified || v.reputation.trustBadge || v.reputation.label || (v.reputation.views ?? 0) > 0)) || (v.contact && (v.contact.phoneHref || v.contact.whatsappHref || v.contact.url)) ? (
                    <div className="mt-2">
                      <SellerContact contact={v.contact} reputation={v.reputation} compact showButtons={false} />
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
