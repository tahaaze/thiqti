"use client";

import { Star, MapPin, Fuel, Gauge, Calendar, Shield, TrendingUp, ChevronLeft, Heart, Share2, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";
import { useState } from "react";

const VEHICLE = {
  name: "Dacia Duster",
  year: 2022,
  price: 185000,
  km: 35000,
  fuel: "Diesel",
  transmission: "Manuelle",
  city: "Casablanca",
  score: 87,
  hp: 110,
  color: "Gris Artique",
  doors: 5,
  seats: 5,
  engine: "1.5 dCi",
};

const SPECS = [
  { label: "Kilométrage", value: "35 000 km", icon: Gauge },
  { label: "Année", value: "2022", icon: Calendar },
  { label: "Carburant", value: "Diesel", icon: Fuel },
  { label: "Puissance", value: "110 ch", icon: TrendingUp },
  { label: "Transmission", value: "Manuelle", icon: null },
  { label: "Portes", value: "5", icon: null },
  { label: "Places", value: "5", icon: null },
  { label: "Couleur", value: "Gris Artique", icon: null },
];

const REVIEWS = [
  { author: "Youssef M.", date: "12 Jan 2026", score: 9, text: "Excellent état, moteur robuste. Consommation très raisonnable pour un SUV.", sentiment: "positive" },
  { author: "Fatima Z.", date: "5 Jan 2026", score: 7, text: "Bon véhicule mais intérieur un peu bas de gamme pour le prix.", sentiment: "neutral" },
  { author: "Ahmed B.", date: "28 Déc 2025", score: 8, text: "Très fiable, aucun problème après 6 mois d'utilisation.", sentiment: "positive" },
];

export default function VehiclePage() {
  const [activeTab, setActiveTab] = useState<"specs" | "reputation" | "offers">("specs");

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Back */}
        <a href="/results" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Retour aux résultats
        </a>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main */}
          <div className="flex-1">
            <div className="glass-card overflow-hidden">
              <div className="flex h-64 items-center justify-center bg-gradient-to-br from-primary/5 to-blue-500/5 text-8xl">
                🚙
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{VEHICLE.name}</h1>
                    <p className="text-gray-400">{VEHICLE.year} &middot; {VEHICLE.km.toLocaleString()} km &middot; {VEHICLE.fuel}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-red-400"><Heart className="h-5 w-5" /></button>
                    <button className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-primary"><Share2 className="h-5 w-5" /></button>
                  </div>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-primary">{VEHICLE.price.toLocaleString()} DH</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-1 glass-card p-1">
              {(["specs", "reputation", "offers"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                    activeTab === tab ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab === "specs" ? "Caractéristiques" : tab === "reputation" ? "Réputation" : "Offres"}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {activeTab === "specs" && (
                <div className="glass-card p-6">
                  <h2 className="mb-4 text-lg font-bold">Caractéristiques</h2>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {SPECS.map((s) => (
                      <div key={s.label} className="rounded-xl bg-dark-800/50 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</p>
                        <p className="mt-1 font-semibold">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "reputation" && (
                <div className="space-y-4">
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success/10 text-3xl font-bold text-success">
                        {VEHICLE.score}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Reputation Score</h3>
                        <p className="text-sm text-gray-400">Basé sur l&apos;historique, l&apos;état et les avis</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div className="rounded-xl bg-dark-800/50 p-3">
                        <p className="text-xs text-gray-500">Historique</p>
                        <p className="font-bold text-success">Propre</p>
                      </div>
                      <div className="rounded-xl bg-dark-800/50 p-3">
                        <p className="text-xs text-gray-500">État mécanique</p>
                        <p className="font-bold text-success">Bon</p>
                      </div>
                      <div className="rounded-xl bg-dark-800/50 p-3">
                        <p className="text-xs text-gray-500">Avis vérifiés</p>
                        <p className="font-bold text-primary">3</p>
                      </div>
                    </div>
                  </div>

                  {REVIEWS.map((r, i) => (
                    <div key={i} className="glass-card p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {r.author[0]}
                          </div>
                          <div>
                            <p className="font-medium">{r.author}</p>
                            <p className="text-xs text-gray-500">{r.date}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-bold ${r.sentiment === "positive" ? "text-success" : r.sentiment === "negative" ? "text-error" : "text-warning"}`}>
                          {r.sentiment === "positive" ? <CheckCircle2 className="h-4 w-4" /> : r.sentiment === "negative" ? <AlertTriangle className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                          {r.score}/10
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-gray-300">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "offers" && (
                <div className="glass-card p-6">
                  <p className="text-gray-400">Aucune offre pour le moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full shrink-0 space-y-6 lg:w-80">
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-bold">{VEHICLE.score}/100</p>
                  <p className="text-xs text-gray-400">Reputation Score</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4" />
                {VEHICLE.city}
              </div>
              <button className="btn-primary w-full">Contacter le vendeur</button>
              <button className="btn-secondary w-full">Demander plus de photos</button>
            </div>

            <div className="glass-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Signaler cette annonce</h3>
              <p className="text-xs text-gray-500">Signaler un prix erroné, des informations trompeuses ou du spam.</p>
              <button className="mt-3 text-xs font-medium text-error hover:underline">Signaler</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
