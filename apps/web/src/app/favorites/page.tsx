"use client";

import { Heart, Star, MapPin, Fuel, Gauge, Trash2, ExternalLink } from "lucide-react";

const FAVORITES = [
  { id: 1, name: "Dacia Duster", year: 2022, price: 185000, km: 35000, fuel: "Diesel", city: "Casablanca", score: 87, image: "🚙" },
  { id: 3, name: "Toyota Corolla", year: 2023, price: 210000, km: 18000, fuel: "Hybride", city: "Marrakech", score: 94, image: "🚗" },
  { id: 5, name: "Kia Sportage", year: 2023, price: 265000, km: 12000, fuel: "Essence", city: "Tanger", score: 89, image: "🚙" },
];

function getScoreColor(score: number) {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-warning";
  return "text-error";
}

export default function FavoritesPage() {
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-400 fill-red-400" />
            Mes favoris
          </h1>
          <p className="mt-2 text-gray-400">{FAVORITES.length} véhicules sauvegardés</p>
        </div>

        {FAVORITES.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-gray-600" />
            <p className="text-gray-400">Aucun favori pour le moment</p>
            <a href="/results" className="btn-primary mt-4 inline-flex items-center gap-2">
              Explorer les annonces
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FAVORITES.map((v) => (
              <div key={v.id} className="glass-card group p-5">
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-4xl">{v.image}</span>
                  <div className="flex gap-1">
                    <button className="rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <a href={`/vehicle/${v.id}`} className="rounded-lg p-2 text-gray-500 transition hover:bg-primary/10 hover:text-primary">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                <h3 className="font-semibold">{v.name}</h3>
                <p className="text-sm text-gray-500">{v.year} &middot; {v.km.toLocaleString()} km</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{v.fuel}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.city}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">{v.price.toLocaleString()} DH</span>
                  <span className={`flex items-center gap-1 text-sm font-bold ${getScoreColor(v.score)}`}>
                    <Star className="h-3.5 w-3.5" />{v.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
