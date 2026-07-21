"use client";

import { useState, useEffect } from "react";
import { Star, MapPin, Fuel, Gauge, Calendar, Shield, ChevronLeft, Heart, Share2, CheckCircle2, MessageSquare, AlertTriangle } from "lucide-react";

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

const REVIEWS = [
  { author: "Youssef M.", date: "12 Jan 2026", score: 9, text: "Excellent état, moteur robuste. Très bonne affaire pour ce prix.", sentiment: "positive" as const },
  { author: "Fatima Z.", date: "5 Jan 2026", score: 7, text: "Bon véhicule, intérieur un peu bas de gamme mais fiable.", sentiment: "neutral" as const },
  { author: "Ahmed B.", date: "28 Déc 2025", score: 8, text: "Très fiable, aucun problème après 6 mois d'utilisation.", sentiment: "positive" as const },
];

export default function VehiclePage({ params }: { params: Promise<{ slug: string }> }) {
  const [car, setCar] = useState<CarListing | null>(null);
  const [activeTab, setActiveTab] = useState<"specs" | "reputation" | "offers">("specs");
  const [fav, setFav] = useState(false);

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/search`).then(r => r.json()).then(data => {
        const found = data.results.find((c: CarListing) => c.id === slug);
        setCar(found || null);
      });
    });
  }, [params]);

  if (!car) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Chargement...</div></div>;

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <a href="/results" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Retour aux résultats
        </a>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <div className="glass-card overflow-hidden">
              <div className="relative h-72">
                <img src={car.image} alt={car.title} className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3"><span className="rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">{car.source}</span></div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{car.title}</h1>
                    <p className="text-gray-400">{car.year} &middot; {car.km.toLocaleString()} km &middot; {car.fuel}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setFav(!fav)} className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-red-400"><Heart className={`h-5 w-5 ${fav ? "fill-red-400 text-red-400" : ""}`} /></button>
                    <button className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-primary"><Share2 className="h-5 w-5" /></button>
                  </div>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-primary">{car.priceFormatted}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-1 glass-card p-1">
              {(["specs", "reputation", "offers"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${activeTab === tab ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}>
                  {tab === "specs" ? "Caractéristiques" : tab === "reputation" ? "Réputation" : "Offres"}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {activeTab === "specs" && (
                <div className="glass-card p-6">
                  <h2 className="mb-4 text-lg font-bold">Caractéristiques</h2>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                      { label: "Kilométrage", value: `${car.km.toLocaleString()} km`, icon: Gauge },
                      { label: "Année", value: String(car.year), icon: Calendar },
                      { label: "Carburant", value: car.fuel, icon: Fuel },
                      { label: "Ville", value: car.city, icon: MapPin },
                    ].map((s) => (
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
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/10 text-3xl font-bold text-green-500">{car.score}</div>
                      <div>
                        <h3 className="text-lg font-bold">Reputation Score</h3>
                        <p className="text-sm text-gray-400">Basé sur l&apos;historique, l&apos;état et les avis</p>
                      </div>
                    </div>
                  </div>
                  {REVIEWS.map((r, i) => (
                    <div key={i} className="glass-card p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{r.author[0]}</div>
                          <div><p className="font-medium">{r.author}</p><p className="text-xs text-gray-500">{r.date}</p></div>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-bold ${r.sentiment === "positive" ? "text-green-500" : "text-yellow-500"}`}>
                          {r.sentiment === "positive" ? <CheckCircle2 className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
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
                  <p className="text-gray-400">Aucune offre spécifique pour le moment. Contactez le vendeur directement.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="w-full shrink-0 space-y-6 lg:w-80">
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10"><Shield className="h-6 w-6 text-green-500" /></div>
                <div><p className="font-bold">{car.score}/100</p><p className="text-xs text-gray-400">Reputation Score</p></div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400"><MapPin className="h-4 w-4" />{car.city}</div>
              <a href={car.url} target="_blank" rel="noopener noreferrer" className="btn-primary block w-full text-center">Contacter le vendeur</a>
              <button className="w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-gray-400 hover:text-white">Demander plus de photos</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
