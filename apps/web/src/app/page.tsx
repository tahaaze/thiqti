"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, MessageSquareText, CarFront, ShieldCheck, ArrowRight, Star, Zap, TrendingUp, MapPin, BadgeCheck, Wallet, Clock } from "lucide-react";
import ChatAssistant from "@/components/ChatAssistant";
import CarImage from "@/components/CarImage";
import SellerContact from "@/components/SellerContact";

interface HomeCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  priceFormatted: string;
  km: number;
  city: string;
  image: string;
  photos?: string[];
  score: number;
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

const POPULAR_BRANDS = ["Dacia", "Renault", "Peugeot", "Toyota", "Hyundai", "Kia", "Volkswagen", "BMW"];

function CarCard({ car }: { car: HomeCar }) {
  return (
    <Link href={`/vehicle/${car.id}`} className="glass-card group block overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <CarImage src={car.image} sources={car.photos} alt={car.title} make={car.make} model={car.model} bodyType={car.bodyType} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-primary backdrop-blur">
          <Star className="h-3 w-3 fill-primary" />{car.score}/100
        </div>
        {car.reputation?.verified && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur">
              <ShieldCheck className="h-3 w-3" />
              Vérifiée
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate font-semibold">{car.title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{car.year} &middot; {car.km.toLocaleString("fr-FR")} km</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">{car.priceFormatted}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin className="h-3 w-3" />{car.city}</span>
        </div>
        <div className="mt-2">
          <SellerContact contact={car.contact} reputation={car.reputation} compact showButtons={false} />
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [cars, setCars] = useState<HomeCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/search")
      .then((r) => r.json())
      .then((data) => setCars((data.results || []) as HomeCar[]))
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = cars[0];
  const selection = cars.slice(1, 4);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[560px] w-[760px] -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-amber-400/10 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* ===== Hero ===== */}
        <section className="grid items-center gap-12 pb-16 pt-12 lg:grid-cols-2 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Zap className="h-3.5 w-3.5" />
              Le marché auto marocain, compris par l&apos;IA
            </span>
            <h1 className="font-display mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
              Trouvez la voiture idéale <span className="gradient-text">au Maroc</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-400 md:text-lg">
              Décrivez votre envie en quelques mots : l&apos;assistant Thiqti vous guide,
              compare neuf et occasion, et vous propose les meilleurs choix, prix réels en DH.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#assistant" className="btn-primary inline-flex items-center gap-2">
                <MessageSquareText className="h-4 w-4" />
                Démarrer l&apos;assistant
              </a>
              <Link href="/results" className="btn-secondary inline-flex items-center gap-2">
                Parcourir le catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-9 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: CarFront, value: "440+", label: "véhicules" },
                { icon: BadgeCheck, value: "Neuf &", label: "occasion" },
                { icon: Sparkles, value: "Score IA", label: "sur 100" },
                { icon: ShieldCheck, value: "Réputation", label: "vérifiée" },
              ].map((s) => (
                <div key={s.label} className="glass-card p-3 text-center">
                  <s.icon className="mx-auto mb-1.5 h-4 w-4 text-primary" />
                  <p className="font-display text-sm font-bold leading-tight text-primary">{s.value}</p>
                  <p className="text-[11px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Marques populaires</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_BRANDS.map((brand) => (
                  <Link key={brand} href={`/results?q=${encodeURIComponent(brand)}`} className="chip">
                    {brand}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Voiture vedette */}
          <div className="relative">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rotate-12 opacity-[0.07]">
              <div className="zellige-pattern h-full w-full" />
            </div>
            <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-to-br from-primary/15 via-transparent to-primary/10 blur-2xl" />
            {loading ? (
              <div className="glass-card h-[380px] animate-pulse" />
            ) : featured ? (
              <div className="glass-card overflow-hidden">
                <div className="relative h-72">
                  <CarImage src={featured.image} sources={featured.photos} alt={featured.title} make={featured.make} model={featured.model} bodyType={featured.bodyType} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full border border-primary/50 bg-black/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary backdrop-blur">
                    N°1 de la semaine
                  </div>
                  {featured.reputation?.verified && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-black/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary backdrop-blur">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Annonce vérifiée
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">{featured.title}</h3>
                    <p className="mt-0.5 text-xs text-gray-400">{featured.year} &middot; {featured.km.toLocaleString("fr-FR")} km &middot; <MapPin className="inline h-3 w-3" /> {featured.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-primary">{featured.priceFormatted}</p>
                    <p className="flex items-center justify-end gap-1 text-xs font-bold text-primary"><Star className="h-3 w-3 fill-primary" /> Score {featured.score}/100</p>
                  </div>
                </div>
                <div className="border-t border-primary/10 p-5 pt-4">
                  <SellerContact contact={featured.contact} reputation={featured.reputation} />
                </div>
              </div>
            ) : (
              <div className="glass-card flex h-[380px] items-center justify-center text-gray-500">Chargement des véhicules...</div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: TrendingUp, text: "Prix réels du marché marocain" },
                { icon: Wallet, text: "Budget converti en DH" },
                { icon: Clock, text: "Comparaison en quelques secondes" },
              ].map((b) => (
                <div key={b.text} className="glass-card flex items-center gap-2 p-3 text-[11px] text-gray-400">
                  <b.icon className="h-4 w-4 shrink-0 text-primary" />
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Assistant ===== */}
        <section id="assistant" className="scroll-mt-24 py-10">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <MessageSquareText className="h-3.5 w-3.5" />
              Votre guide d&apos;achat
            </span>
            <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Dites-lui ce que vous voulez, <span className="gradient-text">il trouve</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-400">
              Budget, type de voiture, carburant, marque, année... Répondez pas à pas ou décrivez tout d&apos;un coup.
              L&apos;assistant classe les meilleures options par score.
            </p>
          </div>
          <ChatAssistant />
        </section>

        {/* ===== Selection du moment ===== */}
        <section className="pb-20 pt-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Sélection du moment
              </span>
              <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-white">Les meilleures offres</h2>
              <p className="mt-2 text-gray-400">Les véhicules les mieux notés par notre IA ce mois-ci.</p>
            </div>
            <Link href="/results" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">
              Tout voir <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="glass-card h-72 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {selection.map((car) => <CarCard key={car.id} car={car} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
