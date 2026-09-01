"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, CarFront, ShieldCheck, ArrowRight, MapPin, LogIn } from "lucide-react";
import { ZelligeStar, ThiqtiShield } from "@/components/icons";
import ChatAssistant from "@/components/ChatAssistant";
import CarImage from "@/components/CarImage";
import AppShell from "@/components/AppShell";
import MarketingNavbar from "@/components/MarketingNavbar";
import { setVehicleBackUrl } from "@/lib/navigation";
import { useAuth } from "@/lib/useAuth";

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

function CarCard({ car }: { car: HomeCar }) {
  return (
    <div className="glass-card group flex flex-col overflow-hidden">
      <Link href={`/vehicle/${car.id}`} onClick={() => setVehicleBackUrl()} className="flex-1">
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
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-primary">{car.priceFormatted}</span>
            <span className="flex items-center gap-1 text-xs text-muted"><MapPin className="h-3 w-3" />{car.city}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function HomePage() {
  const [cars, setCars] = useState<HomeCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"marketing" | "app">("marketing");
  const { user } = useAuth();

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
      {/* ===== Mode marketing : navbar top uniquement ===== */}
      <div className={mode === "app" ? "hidden" : "block"}>
        <MarketingNavbar />
      </div>

      {/* ===== Assistant : toujours monté pour préserver la conversation ===== */}
      <div
        id="assistant"
        className={
          mode === "app"
            ? "mx-auto flex h-[100dvh] w-full max-w-5xl flex-col px-2 pt-1 sm:px-6 sm:pt-6"
            : "mx-auto w-full max-w-7xl scroll-mt-24 px-4 pt-8 pb-6 sm:px-6 sm:pt-12"
        }
      >
        <div className={mode === "app" ? "flex min-h-0 flex-1 flex-col" : "grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center"}>
          <div className={mode === "app" ? "hidden" : ""}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              IA auto
            </span>
            <h1 className="font-display mt-5 text-4xl font-bold leading-[0.98] text-ink sm:text-5xl md:text-6xl">
              Trouvez <span className="gradient-text">votre</span> voiture.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted">
              Neuf, occasion, prix réels — en quelques mots.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["SUV", "Électrique", "300k DH", "Rabat", "Dacia"].map((s) => (
                <Link key={s} href={`/results?q=${encodeURIComponent(s)}`} className="chip">
                  {s}
                </Link>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              {[
                { icon: CarFront, value: "440+" },
                { icon: Sparkles, value: "Score IA" },
                { icon: ShieldCheck, value: "Vérifiée" },
              ].map((s) => (
                <div key={s.value} className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br from-[#6d5dfc]/15 to-[#22a9f0]/15 text-primary">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span className="font-display text-lg font-bold text-ink">{s.value}</span>
                </div>
              ))}
              {!user && (
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(109,93,252,0.4)] transition hover:brightness-110"
                >
                  <LogIn className="h-4 w-4" /> Se connecter
                </Link>
              )}
            </div>
          </div>
          <div className={mode === "app" ? "flex min-h-0 flex-1 flex-col" : ""}>
            <ChatAssistant
              onStart={() => setMode("app")}
            />
          </div>
        </div>
      </div>

      {/* ===== À la une : mode marketing uniquement ===== */}
      <section className={mode === "app" ? "hidden" : "mx-auto max-w-7xl px-6 pb-20"}>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">À la une</h2>
            <p className="mt-2 text-sm text-muted">Les meilleurs scores de l&apos;IA.</p>
          </div>
          <Link href="/results" className="flex items-center gap-1 text-sm font-bold text-primary hover:text-ink">
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
