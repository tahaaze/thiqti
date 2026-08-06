"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, CarFront, ArrowRight, Zap, MapPin, BadgeCheck, ExternalLink } from "lucide-react";
import { ZelligeStar, ThiqtiShield } from "@/components/icons";
import ChatAssistant from "@/components/ChatAssistant";
import CarImage from "@/components/CarImage";
import SellerContact from "@/components/SellerContact";
import AppShell from "@/components/AppShell";
import MarketingNavbar from "@/components/MarketingNavbar";

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
  fuel?: string;
  source?: string;
  url?: string;
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
    <div className="glass-card group flex flex-col overflow-hidden">
      <Link href={`/vehicle/${car.id}`} className="flex-1">
        <div className="relative h-40 overflow-hidden">
          <CarImage src={car.image} sources={car.photos} alt={car.title} make={car.make} model={car.model} bodyType={car.bodyType} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-primary backdrop-blur">
            <ZelligeStar className="h-3 w-3 fill-primary" />{car.score}/100
          </div>
          {car.reputation?.verified && (
            <div className="absolute bottom-2 left-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur">
                <ThiqtiShield className="h-3 w-3" />
                Vérifiée
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="truncate font-semibold">{car.title}</h3>
          <p className="mt-0.5 text-xs text-muted">{car.year} &middot; {car.km.toLocaleString("fr-FR")} km</p>
          <p className="mt-1 truncate text-xs text-muted">{[car.bodyType, car.fuel, car.year, car.city].filter(Boolean).join(" · ")}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-primary">{car.priceFormatted}</span>
            <span className="flex items-center gap-1 text-xs text-muted"><MapPin className="h-3 w-3" />{car.city}</span>
          </div>
          <div className="mt-2">
            <SellerContact contact={car.contact} reputation={car.reputation} compact showButtons={false} />
          </div>
        </div>
      </Link>
      {car.url && (
        <div className="border-t border-line px-4 py-2.5">
          <a
            href={car.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-dark"
          >
            <ExternalLink className="h-3 w-3" />
            Voir sur {car.source || "la source"}
          </a>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [cars, setCars] = useState<HomeCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"marketing" | "app">("marketing");

  useEffect(() => {
    fetch("/api/search")
      .then((r) => r.json())
      .then((data) => setCars((data.results || []) as HomeCar[]))
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  }, []);

  const selection = cars.slice(1, 4);

  return (
    <AppShell sidebar={mode === "app"}>
      {/* ===== Mode marketing : navbar top + hero compact ===== */}
      <div className={mode === "app" ? "hidden" : "block"}>
        <MarketingNavbar />
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 left-1/2 h-[440px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />
            <div className="absolute right-0 top-1/3 h-[360px] w-[360px] rounded-full bg-amber-400/10 blur-[130px]" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary">
              <Zap className="h-3.5 w-3.5" />
              Le marché auto marocain, compris par l&apos;IA
            </span>
            <h1 className="font-display mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-ink md:text-4xl">
              Trouvez la voiture idéale <span className="gradient-text">au Maroc</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
              Décrivez votre envie en quelques mots : l&apos;assistant Thiqti vous guide,
              compare neuf et occasion, et vous propose les meilleurs choix, prix réels en DH.
            </p>
            <a href="#assistant" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-dark">
              Voir le guide d&apos;achat
              <ArrowRight className="h-3.5 w-3.5" />
            </a>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: CarFront, value: "440+", label: "véhicules" },
                { icon: BadgeCheck, value: "Neuf &", label: "occasion" },
                { icon: Sparkles, value: "Score IA", label: "sur 100" },
                { icon: ThiqtiShield, value: "Réputation", label: "vérifiée" },
              ].map((s) => (
                <div key={s.label} className="glass-card p-2.5 text-center">
                  <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="font-display text-sm font-bold leading-tight text-primary">{s.value}</p>
                  <p className="text-[11px] text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">Marques populaires</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_BRANDS.map((brand) => (
                  <Link key={brand} href={`/results?q=${encodeURIComponent(brand)}`} className="chip">
                    {brand}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Assistant : toujours monté pour préserver la conversation ===== */}
      <div id="assistant" className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 py-6 sm:px-6 lg:py-8">
        <ChatAssistant
          onStart={() => setMode("app")}
          heightClassName={
            mode === "marketing"
              ? "h-[560px] lg:h-[min(680px,calc(100vh-26rem))]"
              : "h-[640px]"
          }
        />
      </div>

      {/* ===== Sélection du moment : mode marketing uniquement ===== */}
      <section className={mode === "app" ? "hidden" : "mx-auto max-w-7xl px-6 pb-20"}>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Sélection du moment
            </span>
            <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-ink">Les meilleures offres</h2>
            <p className="mt-2 text-muted">Les véhicules les mieux notés par notre IA ce mois-ci.</p>
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
    </AppShell>
  );
}
