"use client";

import { Search, SlidersHorizontal, Star, MapPin, Fuel, Gauge, Heart, Grid3X3, List } from "lucide-react";
import { useState } from "react";

const VEHICLES = [
  {
    id: 1,
    name: "Dacia Duster",
    year: 2022,
    price: 185000,
    km: 35000,
    fuel: "Diesel",
    city: "Casablanca",
    score: 87,
    image: "🚙",
    badge: "Excellent",
  },
  {
    id: 2,
    name: "Renault Clio V",
    year: 2021,
    price: 145000,
    km: 42000,
    fuel: "Essence",
    city: "Rabat",
    score: 82,
    image: "🚗",
    badge: "Bon",
  },
  {
    id: 3,
    name: "Toyota Corolla",
    year: 2023,
    price: 210000,
    km: 18000,
    fuel: "Hybride",
    city: "Marrakech",
    score: 94,
    image: "🚗",
    badge: "Excellent",
  },
  {
    id: 4,
    name: "Hyundai Tucson",
    year: 2022,
    price: 245000,
    km: 28000,
    fuel: "Diesel",
    city: "Fès",
    score: 91,
    image: "🚙",
    badge: "Excellent",
  },
  {
    id: 5,
    name: "Kia Sportage",
    year: 2023,
    price: 265000,
    km: 12000,
    fuel: "Essence",
    city: "Tanger",
    score: 89,
    image: "🚙",
    badge: "Excellent",
  },
  {
    id: 6,
    name: "Peugeot 208",
    year: 2021,
    price: 128000,
    km: 55000,
    fuel: "Essence",
    city: "Casablanca",
    score: 76,
    image: "🚗",
    badge: "Moyen",
  },
];

function getScoreColor(score: number) {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-warning";
  return "text-error";
}

function getScoreBadge(score: number) {
  if (score >= 85) return "badge-success";
  if (score >= 70) return "badge-warning";
  return "badge-error";
}

export default function ResultsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Résultats de recherche</h1>
          <p className="mt-2 text-gray-400">{VEHICLES.length} véhicules trouvés</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 space-y-6 lg:w-72">
            <div className="glass-card p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="input-field pl-9 text-sm"
                />
              </div>
            </div>

            <div className="glass-card p-5 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Filtres
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">Marque</label>
                <select className="input-field text-sm">
                  <option>Toutes les marques</option>
                  <option>Dacia</option>
                  <option>Renault</option>
                  <option>Toyota</option>
                  <option>Hyundai</option>
                  <option>Kia</option>
                  <option>Peugeot</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">Prix max</label>
                <input type="range" min={50000} max={500000} className="w-full accent-primary" />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>50 000 DH</span>
                  <span>500 000 DH</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">Carburant</label>
                <div className="flex flex-wrap gap-2">
                  {["Essence", "Diesel", "Hybride", "Électrique"].map((f) => (
                    <span key={f} className="chip text-xs">{f}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">Score minimum</label>
                <input type="range" min={0} max={100} defaultValue={50} className="w-full accent-primary" />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-400">Trier par : <span className="text-white font-medium">Pertinence</span></p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView("grid")}
                  className={`rounded-lg p-2 ${view === "grid" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-white"}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`rounded-lg p-2 ${view === "list" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-white"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className={view === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
              {VEHICLES.map((v) => (
                <a
                  key={v.id}
                  href={`/vehicle/${v.id}`}
                  className="glass-card group block p-5"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-4xl">{v.image}</span>
                    <button
                      onClick={(e) => e.preventDefault()}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
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
                      <Star className="h-3.5 w-3.5" />
                      {v.score}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
