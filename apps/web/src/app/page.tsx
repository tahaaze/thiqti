"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// @ts-expect-error lucide-react 0.400 types incomplete
import { Search, Star, Shield, BarChart3, ChevronRight, Zap, TrendingUp, Users, MapPin, Fuel, GitCompareArrows } from "lucide-react";
import VoiceInput from "@/components/VoiceInput";
import SearchSuggestions from "@/components/SearchSuggestions";

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

const BRANDS = ["Dacia", "Renault", "Toyota", "Hyundai", "Kia", "Peugeot", "Volkswagen", "BMW", "Mercedes", "Nissan"];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Erreur réseau");
      const data = await res.json();
      setCars(data.results.slice(0, 6));
    } catch {
      setCars([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    doSearch("");
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <section className="relative px-6 pt-24 pb-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            Alimenté par l&apos;intelligence artificielle
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Trouvez votre <span className="gradient-text">voiture idéale</span> au Maroc
          </h1>
          <p className="mb-10 text-lg text-gray-400 md:text-xl">
            Décrivez votre besoin en une phrase. Notre moteur comprend, cherche et vous classe les meilleures offres.
          </p>

          <div className="glass mx-auto max-w-2xl p-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
                  placeholder="Ex: SUV hybride autour de 350 000 DH, confortable pour la famille"
                  className="input-field pl-10"
                />
              </div>
              <VoiceInput onTranscript={(text) => { setQuery(text); doSearch(text); }} />
              <button onClick={() => doSearch(query)} className="btn-primary flex items-center gap-2">
                <Search className="h-4 w-4" />
                Rechercher
              </button>
            </div>
          </div>
          <SearchSuggestions query={query} onSelect={(s) => { setQuery(s); doSearch(s); }} />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {BRANDS.slice(0, 6).map((b) => (
              <button key={b} onClick={() => { setQuery(b); doSearch(b); }} className="chip text-xs">{b}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { label: "Véhicules en direct", value: "85+", icon: TrendingUp },
            { label: "Source de données", value: "Auto24.ma", icon: Users },
            { label: "Marques disponibles", value: "25+", icon: MapPin },
          ].map((s) => (
            <div key={s.label} className="glass-card flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Offres détectées</h2>
              <p className="mt-2 text-gray-400">
                {loading ? "Recherche en cours..." : `${cars.length} véhicules trouvés`}
              </p>
            </div>
            <Link href="/results" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Voir tout <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card animate-pulse h-80" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cars.map((car) => (
                <Link key={car.id} href={`/vehicle/${car.id}`} className="glass-card group block overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <img src={car.image} alt={car.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                    <div className="absolute left-3 top-3">
                      <span className="rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur">{car.source}</span>
                    </div>
                    <div className="absolute right-3 top-3">
                      <span className={`rounded-lg px-2 py-1 text-xs font-bold backdrop-blur ${car.score >= 85 ? "bg-green-500/30 text-green-300" : car.score >= 70 ? "bg-yellow-500/30 text-yellow-300" : "bg-red-500/30 text-red-300"}`}>
                        <Star className="mr-1 inline h-3 w-3" />{car.score}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold">{car.title}</h3>
                    <p className="text-sm text-gray-500">{car.year} &middot; {car.km.toLocaleString()} km</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{car.fuel}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{car.city}</span>
                    </div>
                    <p className="mt-3 text-xl font-bold text-primary">{car.priceFormatted}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold">Pourquoi <span className="gradient-text">Sleipnir</span> ?</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="glass-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><BarChart3 className="h-8 w-8 text-primary" /></div>
              <h3 className="mb-2 text-xl font-bold">Score IA Réputation</h3>
              <p className="text-gray-400">Score sur 100 basé sur l&apos;historique, l&apos;état mécanique et les avis utilisateurs.</p>
            </div>
            <div className="glass-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10"><Shield className="h-8 w-8 text-green-500" /></div>
              <h3 className="mb-2 text-xl font-bold">Recherche en langage naturel</h3>
              <p className="text-gray-400">Décrivez votre besoin comme vous le diriez à un ami. L&apos;IA comprend et cherche pour vous.</p>
            </div>
            <div className="glass-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10"><Zap className="h-8 w-8 text-yellow-500" /></div>
              <h3 className="mb-2 text-xl font-bold">Matching multicritère</h3>
              <p className="text-gray-400">Classement intelligent avec explication. Vous comprenez pourquoi chaque voiture est proposée.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-400 text-sm font-bold text-white">S</div>
                <span className="font-bold">Sleipnir</span>
              </div>
              <p className="text-xs text-gray-500">Plateforme IA de recherche automobile au Maroc.</p>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Navigation</p>
              <div className="space-y-2">
                <Link href="/results" className="block text-xs text-gray-400 hover:text-white">Rechercher</Link>
                <Link href="/compare" className="block text-xs text-gray-400 hover:text-white">Comparer</Link>
                <Link href="/favorites" className="block text-xs text-gray-400 hover:text-white">Favoris</Link>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Légal</p>
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Propulsé par Volund Ventures SARL</p>
                <p className="text-xs text-gray-400">Données: Auto24.ma</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 text-center text-xs text-gray-500">
            <p>&copy; 2026 Sleipnir. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
