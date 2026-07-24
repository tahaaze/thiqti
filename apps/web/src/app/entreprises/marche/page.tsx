"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, TrendingUp, TrendingDown, BarChart3, Activity, MapPin, Calendar, Star, Filter, Download, RefreshCw, ArrowRight, Globe, Eye } from "lucide-react";

const MARKET_DATA = [
  { brand: "Dacia", model: "Duster", avgPrice: 195000, minPrice: 140000, maxPrice: 280000, listings: 42, trend: +5.2, demand: "high" as const },
  { brand: "Renault", model: "Clio", avgPrice: 155000, minPrice: 98000, maxPrice: 220000, listings: 38, trend: +2.1, demand: "medium" as const },
  { brand: "Toyota", model: "Corolla", avgPrice: 275000, minPrice: 190000, maxPrice: 380000, listings: 28, trend: -1.5, demand: "high" as const },
  { brand: "Toyota", model: "RAV4", avgPrice: 345000, minPrice: 260000, maxPrice: 450000, listings: 18, trend: +3.8, demand: "high" as const },
  { brand: "Hyundai", model: "Tucson", avgPrice: 285000, minPrice: 200000, maxPrice: 380000, listings: 22, trend: +1.2, demand: "medium" as const },
  { brand: "Kia", model: "Sportage", avgPrice: 310000, minPrice: 220000, maxPrice: 420000, listings: 15, trend: -0.8, demand: "medium" as const },
  { brand: "Volkswagen", model: "Golf", avgPrice: 295000, minPrice: 180000, maxPrice: 400000, listings: 20, trend: +0.5, demand: "medium" as const },
  { brand: "Peugeot", model: "208", avgPrice: 135000, minPrice: 85000, maxPrice: 195000, listings: 30, trend: +4.1, demand: "high" as const },
  { brand: "Nissan", model: "Qashqai", avgPrice: 265000, minPrice: 180000, maxPrice: 360000, listings: 12, trend: -2.3, demand: "low" as const },
  { brand: "Ford", model: "Kuga", avgPrice: 245000, minPrice: 170000, maxPrice: 330000, listings: 10, trend: +1.7, demand: "low" as const },
];

const DEMAND_LABELS = { high: "Forte", medium: "Moyenne", low: "Faible" };
const DEMAND_COLORS = { high: "text-green-400 bg-green-500/10", medium: "text-yellow-400 bg-yellow-500/10", low: "text-red-400 bg-red-500/10" };

const TRENDS = [
  { period: "Jan 2026", duster: 185000, corolla: 280000, tucson: 275000 },
  { period: "Fév 2026", duster: 188000, corolla: 278000, tucson: 280000 },
  { period: "Mar 2026", duster: 190000, corolla: 276000, tucson: 282000 },
  { period: "Avr 2026", duster: 192000, corolla: 274000, tucson: 284000 },
  { period: "Mai 2026", duster: 193000, corolla: 273000, tucson: 285000 },
  { period: "Jun 2026", duster: 195000, corolla: 275000, tucson: 285000 },
];

const REGIONAL_DATA = [
  { city: "Casablanca", listings: 145, avgPrice: 265000, topBrand: "Dacia", growth: +8 },
  { city: "Rabat", listings: 82, avgPrice: 245000, topBrand: "Renault", growth: +5 },
  { city: "Marrakech", listings: 58, avgPrice: 225000, topBrand: "Toyota", growth: +12 },
  { city: "Fès", listings: 45, avgPrice: 210000, topBrand: "Dacia", growth: +3 },
  { city: "Tanger", listings: 35, avgPrice: 230000, topBrand: "Hyundai", growth: +15 },
  { city: "Agadir", listings: 28, avgPrice: 195000, topBrand: "Peugeot", growth: +7 },
];

const DEPRECIATION = [
  { age: "0-1 an", retention: 92 },
  { age: "1-2 ans", retention: 84 },
  { age: "2-3 ans", retention: 76 },
  { age: "3-4 ans", retention: 68 },
  { age: "4-5 ans", retention: 60 },
  { age: "5+ ans", retention: 48 },
];

export default function MarchePage() {
  const [sortBy, setSortBy] = useState<"trend" | "listings" | "price">("listings");
  const [filterFuel, setFilterFuel] = useState<string>("all");

  const sorted = [...MARKET_DATA].sort((a, b) => {
    if (sortBy === "trend") return b.trend - a.trend;
    if (sortBy === "listings") return b.listings - a.listings;
    return b.avgPrice - a.avgPrice;
  });

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/entreprises" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
              <ChevronLeft className="h-4 w-4" /> Retour B2B
            </Link>
            <h1 className="text-3xl font-bold">Intelligence Marché</h1>
            <p className="mt-1 text-gray-400">Données en temps réel du marché automobile marocain</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs flex items-center gap-1"><Download className="h-3 w-3" /> Exporter PDF</button>
            <button className="btn-secondary text-xs flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Actualiser</button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Annonces analysées", value: "485+", icon: Eye },
            { label: "Prix moyen", value: "248k DH", icon: BarChart3 },
            { label: "Marques suivies", value: "25+", icon: Globe },
            { label: "Villes couvertes", value: "12", icon: MapPin },
            { label: "Dernière MAJ", value: "Maintenant", icon: RefreshCw },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="glass-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Trier par :</span>
                {(["listings", "trend", "price"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`chip text-xs ${sortBy === s ? "bg-primary/20 border-primary/40" : ""}`}
                  >
                    {s === "listings" ? "Nombre d'annonces" : s === "trend" ? "Tendance" : "Prix moyen"}
                  </button>
                ))}
              </div>
            </div>

            {/* Market Table */}
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-4 text-left text-xs text-gray-500">Véhicule</th>
                    <th className="p-4 text-center text-xs text-gray-500">Prix moyen</th>
                    <th className="p-4 text-center text-xs text-gray-500">Fourchette</th>
                    <th className="p-4 text-center text-xs text-gray-500">Annonces</th>
                    <th className="p-4 text-center text-xs text-gray-500">Tendance</th>
                    <th className="p-4 text-center text-xs text-gray-500">Demande</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((car, i) => (
                    <tr key={`${car.brand}-${car.model}`} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-bold text-gray-500">#{i + 1}</span>
                          <div>
                            <p className="font-semibold text-sm">{car.brand} {car.model}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-bold">{Math.round(car.avgPrice / 1000)}k DH</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs text-gray-400">{Math.round(car.minPrice / 1000)}k — {Math.round(car.maxPrice / 1000)}k</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm">{car.listings}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-sm font-bold ${car.trend > 0 ? "text-green-400" : "text-red-400"}`}>
                          {car.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {car.trend > 0 ? "+" : ""}{car.trend}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`rounded-lg px-2 py-1 text-xs font-bold ${DEMAND_COLORS[car.demand]}`}>
                          {DEMAND_LABELS[car.demand]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Trends */}
            <div className="glass-card p-6">
              <h3 className="mb-4 font-bold">Évolution des prix (6 mois)</h3>
              <div className="space-y-4">
                {[
                  { name: "Dacia Duster", color: "bg-blue-500", data: TRENDS.map(t => t.duster) },
                  { name: "Toyota Corolla", color: "bg-green-500", data: TRENDS.map(t => t.corolla) },
                  { name: "Hyundai Tucson", color: "bg-yellow-500", data: TRENDS.map(t => t.tucson) },
                ].map((series) => (
                  <div key={series.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{series.name}</span>
                      <span className="text-xs text-gray-500">{Math.round(series.data[series.data.length - 1] / 1000)}k DH</span>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {series.data.map((val, i) => {
                        const min = Math.min(...series.data);
                        const max = Math.max(...series.data);
                        const pct = max > min ? ((val - min) / (max - min)) * 80 + 20 : 50;
                        return (
                          <div key={i} className={`flex-1 rounded-sm ${series.color} opacity-70`} style={{ height: `${pct}%` }} />
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Jun</span>
                </div>
              </div>
            </div>

            {/* Regional */}
            <div className="glass-card p-6">
              <h3 className="mb-4 font-bold">Par ville</h3>
              <div className="space-y-3">
                {REGIONAL_DATA.map((r) => (
                  <div key={r.city} className="rounded-xl bg-dark-800/50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{r.city}</p>
                        <p className="text-xs text-gray-400">{r.listings} annonces &middot; Top: {r.topBrand}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{Math.round(r.avgPrice / 1000)}k DH</p>
                        <p className="text-xs text-green-400">+{r.growth}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Depreciation */}
            <div className="glass-card p-6">
              <h3 className="mb-4 font-bold">Dépréciation moyenne</h3>
              <div className="space-y-2">
                {DEPRECIATION.map((d) => (
                  <div key={d.age} className="flex items-center gap-3">
                    <span className="w-16 text-xs text-gray-400">{d.age}</span>
                    <div className="flex-1 h-2 rounded-full bg-dark-800">
                      <div className="h-2 rounded-full bg-gradient-to-r from-green-500 to-red-500" style={{ width: `${d.retention}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs font-bold">{d.retention}%</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">% de la valeur initiale conservée</p>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 glass-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Insights IA du marché</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { title: "Opportunité", text: "Les Dacia Duster 2022 sous 170k DH sont sous-évalués de 12% par rapport au marché. Bon moment pour acheter.", icon: TrendingUp, color: "green" },
              { title: "Tendance", text: "Les hybrides gagnent 3% de parts de marché par mois. Anticipez la demande sur Toyota et Hyundai.", icon: Activity, color: "blue" },
              { title: "Alerte", text: "Le prix moyen des SUV a augmenté de 5% à Tanger. Ajustez vos prix en conséquence.", icon: BarChart3, color: "yellow" },
            ].map((insight) => (
              <div key={insight.title} className="rounded-xl bg-dark-800/50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <insight.icon className={`h-4 w-4 ${
                    insight.color === "green" ? "text-green-400" : insight.color === "blue" ? "text-primary" : "text-yellow-400"
                  }`} />
                  <span className={`text-xs font-bold ${
                    insight.color === "green" ? "text-green-400" : insight.color === "blue" ? "text-primary" : "text-yellow-400"
                  }`}>{insight.title}</span>
                </div>
                <p className="text-sm text-gray-300">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
