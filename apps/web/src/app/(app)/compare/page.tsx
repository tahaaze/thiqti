"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { X, Loader, BadgeCheck, AlertTriangle, ThumbsUp, Wallet, Gauge, Calendar, Brain, ChevronLeft, Fuel, MapPin, CarFront, SlidersHorizontal, Hash } from "lucide-react";
import { ZelligeStar, ThiqtiShield, FavHeart } from "@/components/icons";
import CarImage from "@/components/CarImage";
import SellerContact from "@/components/SellerContact";
import { loadFavoriteIds, loadFavoriteCars } from "@/lib/favorites";
import { setVehicleBackUrl } from "@/lib/navigation";

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
  transmission?: string;
  bodyType?: string;
  city: string;
  image: string;
  photos?: string[];
  score: number;
  source: string;
  url: string;
  matchPercent?: number;
  inventoryType?: "new" | "used";
  safety?: { stars: number; ratingYear?: number; source?: string } | null;
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

const MAX_COMPARE = 3;

const SPECS: { label: string; format: (v: CarListing) => string; icon: React.ComponentType<{ className?: string }>; compare: "lower" | "higher" }[] = [
  { label: "Prix", format: (v) => v.priceFormatted, icon: Wallet, compare: "lower" },
  { label: "Année", format: (v) => String(v.year), icon: Calendar, compare: "higher" },
  { label: "Kilométrage", format: (v) => `${v.km.toLocaleString("fr-FR")} km`, icon: Gauge, compare: "lower" },
  { label: "Carburant", format: (v) => v.fuel, icon: Fuel, compare: "higher" },
  { label: "Transmission", format: (v) => v.transmission || "—", icon: SlidersHorizontal, compare: "higher" },
  { label: "Carrosserie", format: (v) => v.bodyType || "—", icon: CarFront, compare: "higher" },
  { label: "Ville", format: (v) => v.city, icon: MapPin, compare: "higher" },
  { label: "Score IA", format: (v) => `${v.score}/100`, icon: ZelligeStar, compare: "higher" },
  { label: "Sécurité", format: (v) => v.safety ? `${v.safety.stars}★` : "Non évalué", icon: ThiqtiShield, compare: "higher" },
  { label: "Match %", format: (v) => v.matchPercent !== undefined ? `${v.matchPercent}%` : "—", icon: Hash, compare: "higher" },
];

function getBestId(sel: CarListing[], specLabel: string): string | null {
  if (sel.length < 2) return null;
  const spec = SPECS.find((s) => s.label === specLabel);
  if (!spec) return null;
  if (spec.compare === "lower") return sel.reduce((a, b) => (Number(spec.format(a).replace(/\D/g, "")) < Number(spec.format(b).replace(/\D/g, "")) ? a : b)).id;
  return sel.reduce((a, b) => (Number(spec.format(a).replace(/\D/g, "")) > Number(spec.format(b).replace(/\D/g, "")) ? a : b)).id;
}

function generateAdvice(cars: CarListing[]): string[] {
  if (cars.length < 2) return [];
  const advice: string[] = [];
  const sorted = [...cars].sort((a, b) => b.score - a.score);
  const cheapest = [...cars].sort((a, b) => a.price - b.price)[0];
  const lowestKm = [...cars].sort((a, b) => a.km - b.km)[0];
  const bestScore = sorted[0];

  if (bestScore.score >= 85) {
    advice.push(`${bestScore.make} ${bestScore.model} a le meilleur score (${bestScore.score}/100) - c'est le choix le plus sûr.`);
  }
  if (cheapest.id !== bestScore.id) {
    const diff = bestScore.price - cheapest.price;
    advice.push(`${cheapest.make} ${cheapest.model} est le moins cher (${cheapest.priceFormatted}), soit ${diff.toLocaleString("fr-FR")} DH de moins que le mieux noté.`);
  }
  if (lowestKm.km < 20000) {
    advice.push(`${lowestKm.make} ${lowestKm.model} n'a que ${lowestKm.km.toLocaleString("fr-FR")} km - encore très peu utilisé.`);
  }
  const youngest = [...cars].sort((a, b) => b.year - a.year)[0];
  if (2026 - youngest.year <= 1) {
    advice.push(`${youngest.make} ${youngest.model} est le plus récent (${youngest.year}) - garanti constructeur possiblement encore active.`);
  }
  const kmDiff = Math.abs(lowestKm.km - [...cars].sort((a, b) => b.km - a.km)[0].km);
  if (kmDiff > 40000) {
    advice.push(`Écart de kilométrage important (${kmDiff.toLocaleString("fr-FR")} km) - privilégiez le véhicule le moins roulé.`);
  }
  const priceDiff = [...cars].sort((a, b) => b.price - a.price)[0].price - [...cars].sort((a, b) => a.price - b.price)[0].price;
  if (priceDiff > 100000) {
    advice.push(`L'écart de prix est de ${priceDiff.toLocaleString("fr-FR")} DH - le moins cher offre un meilleur rapport qualité-prix si le score est comparable.`);
  }
  const sameFuel = cars.every((c) => c.fuel === cars[0].fuel);
  if (!sameFuel) {
    advice.push(`Les carburants diffèrent (${cars.map((c) => c.fuel).join(" vs ")}) - le diesel consomme moins sur autoroute, l'essence est plus économique en ville.`);
  }

  return advice;
}

export default function ComparePage() {
  const [all, setAll] = useState<CarListing[]>([]);
  const [favoritesCars, setFavoritesCars] = useState<CarListing[]>([]);
  const [selected, setSelected] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"search" | "favorites">("search");

  useEffect(() => {
    Promise.all([
      fetch("/api/search")
        .then((r) => { if (!r.ok) throw new Error("Erreur réseau"); return r.json(); })
        .then((data) => data.results as CarListing[])
        .catch(() => [] as CarListing[]),
      Promise.resolve().then(() => {
        return loadFavoriteIds();
      }),
    ]).then(([searchResults, favIds]) => {
      setAll(searchResults);
      const snap = loadFavoriteCars();
      const favCars = [
        ...Object.values(snap),
        ...searchResults.filter((c) => favIds.includes(c.id) && !snap[c.id]),
      ];
      setFavoritesCars(favCars);
      if (searchResults.length > 0) {
        setSelected(searchResults.slice(0, Math.min(MAX_COMPARE, 2)));
      }
      setLoading(false);
    });
  }, []);

  const addCar = (id: string) => {
    const pool = source === "favorites" ? favoritesCars : all;
    const car = pool.find((c) => c.id === id);
    if (car && selected.length < MAX_COMPARE && !selected.find((s) => s.id === id)) {
      setSelected([...selected, car]);
    }
  };

  const removeCar = (id: string) => setSelected(selected.filter((v) => v.id !== id));

  const pool = source === "favorites" ? favoritesCars : all;
  const available = pool.filter((v) => !selected.find((s) => s.id === v.id));

  const advice = useMemo(() => generateAdvice(selected), [selected]);
  const bestCar = useMemo(() => selected.length > 0 ? [...selected].sort((a, b) => b.score - a.score)[0] : null, [selected]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8"><div className="flex items-center gap-3"><span className="font-display text-sm font-bold text-primary">Comparatif</span><span className="h-px flex-1 bg-line" /></div><h1 className="font-display mt-4 text-4xl font-bold text-ink">Comparaison</h1><p className="mt-2 text-muted">Comparez jusqu&apos;à {MAX_COMPARE} véhicules côte à côte</p></div>
          <div className="glass-card p-12 text-center"><Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" /><p className="text-muted">Chargement des véhicules...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/results" className="border border-line p-2 text-muted hover:border-ink hover:text-ink"><ChevronLeft className="h-5 w-5" /></Link>
              <span className="font-display text-sm font-bold text-primary">Comparatif</span>
            </div>
            <h1 className="font-display mt-3 text-4xl font-bold text-ink">Comparaison</h1>
            <p className="mt-2 text-muted">Comparez jusqu&apos;à {MAX_COMPARE} véhicules côte à côte</p>
          </div>
        </div>

        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">Source des véhicules :</span>
            <button onClick={() => setSource("search")} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${source === "search" ? "bg-primary/20 text-primary" : "text-muted hover:text-ink"}`}>Recherche</button>
            <button onClick={() => setSource("favorites")} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${source === "favorites" ? "bg-red-500/20 text-red-600" : "text-muted hover:text-ink"}`}><FavHeart className={`h-3.5 w-3.5 ${source === "favorites" ? "fill-red-600" : ""}`} />Favoris ({favoritesCars.length})</button>
          </div>
        </div>

        <div className="glass-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="p-4 text-left text-sm text-muted w-40">Caractéristique</th>
                {selected.map((v) => (
                  <th key={v.id} className="relative p-4 text-center min-w-[200px]">
                    <button onClick={() => removeCar(v.id)} className="absolute right-2 top-2 rounded-lg p-1 text-muted hover:bg-red-500/10 hover:text-red-600"><X className="h-4 w-4" /></button>
                    <CarImage src={v.image} sources={v.photos} alt={v.title} make={v.make} model={v.model} bodyType={v.bodyType} className="mx-auto h-24 w-40 rounded-lg object-cover" />
                    <p className="mt-2 font-semibold text-sm">{v.title}</p>
                    <div className="mt-1 flex items-center justify-center gap-2">{v.inventoryType && <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${v.inventoryType === "new" ? "badge-new" : "badge-used"}`}>{v.inventoryType === "new" ? "Neuf" : "Occasion"}</span>}<Link href={`/vehicle/${v.id}`} onClick={() => setVehicleBackUrl()} className="inline-block text-xs text-primary hover:underline">Voir détails</Link></div>
                    <div className="mt-1 flex justify-center">
                      <SellerContact contact={v.contact} reputation={v.reputation} compact />
                    </div>
                  </th>
                ))}
                {Array.from({ length: MAX_COMPARE - selected.length }).map((_, i) => (
                  <th key={`empty-${i}`} className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CarFront className="h-8 w-8 text-muted" />
                      <select key={`${source}-${selected.length}-${i}`} onChange={(e) => { if (e.target.value) addCar(e.target.value); }} value="" className="input-field w-48 text-sm">
                        <option value="" disabled>+ Ajouter</option>
                        {available.map((v) => (<option key={v.id} value={v.id}>{v.title}</option>))}
                      </select>
                      {available.length === 0 && <p className="text-xs text-muted">{source === "favorites" ? "Aucun favori" : "Aucun véhicule"}</p>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPECS.map((spec) => {
                const bestId = getBestId(selected, spec.label);
                const Icon = spec.icon;
                return (
                  <tr key={spec.label} className="border-b border-line">
                    <td className="p-4 text-sm font-medium text-ink"><span className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted" />{spec.label}</span></td>
                    {selected.map((v) => {
                      const isBest = bestId === v.id;
                      return (
                        <td key={v.id} className={`p-4 text-center text-sm rounded-lg ${isBest ? "text-green-600 bg-green-500/10 font-bold" : "text-ink"}`}>
                          <span className="flex items-center justify-center gap-1.5">{isBest && <BadgeCheck className="h-4 w-4 text-green-600" />}{spec.format(v)}</span>
                        </td>
                      );
                    })}
                    {Array.from({ length: MAX_COMPARE - selected.length }).map((_, i) => <td key={`empty-${i}`} />)}
                  </tr>
                );
              })}
              {/* Price/km row */}
              <tr className="border-b border-line">
                <td className="p-4 text-sm font-medium text-ink"><span className="flex items-center gap-2"><Gauge className="h-4 w-4 text-muted" />Prix/km</span></td>
                {selected.map((v) => {
                  const ratio = v.km > 0 ? Math.round(v.price / v.km) : 0;
                  const withKm = selected.filter((s) => s.km > 0);
                  const bestRatio = withKm.length >= 2 ? withKm.sort((a, b) => a.price / a.km - b.price / b.km)[0] : null;
                  const isBest = bestRatio?.id === v.id && v.km > 0;
                  return (
                    <td key={v.id} className={`p-4 text-center text-sm rounded-lg ${isBest ? "text-green-600 bg-green-500/10 font-bold" : "text-ink"}`}>
                      <span className="flex items-center justify-center gap-1.5">{isBest && <BadgeCheck className="h-4 w-4 text-green-600" />}{v.km > 0 ? `${ratio} DH/km` : "N/A"}</span>
                    </td>
                  );
                })}
                {Array.from({ length: MAX_COMPARE - selected.length }).map((_, i) => <td key={`empty-${i}`} />)}
              </tr>
            </tbody>
          </table>
        </div>

        {selected.length >= 2 && advice.length > 0 && (
          <div className="mt-6 glass-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Brain className="h-4 w-4 text-primary" /></div>
              <h2 className="text-lg font-bold">Conseil IA - Aide à la décision</h2>
            </div>
            <div className="space-y-3">
              {advice.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-line/60 p-4">
                  {tip.includes("sûr") || tip.includes("meilleur") || tip.includes("récent") || tip.includes("peu utilisé") ? <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> :
                   tip.includes("moins cher") || tip.includes("rapport") ? <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> :
                   tip.includes("écart") || tip.includes("important") ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" /> :
                   <ZelligeStar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                  <p className="text-sm text-ink">{tip}</p>
                </div>
              ))}
            </div>
            {bestCar && (
              <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-green-600" /><p className="font-semibold text-green-600">Recommandation : {bestCar.make} {bestCar.model}</p></div>
                <p className="mt-1 text-sm text-muted">Avec un score de {bestCar.score}/100 et un prix de {bestCar.priceFormatted}, c&apos;est le meilleur choix parmi vos sélectionnés.</p>
              </div>
            )}
          </div>
        )}

        {selected.length === 0 && (
          <div className="mt-6 glass-card p-12 text-center">
            <CarFront className="mx-auto mb-4 h-12 w-12 text-muted" />
            <p className="text-muted">Aucun véhicule sélectionné</p>
            <p className="mt-1 text-sm text-muted">Sélectionnez des véhicules pour les comparer</p>
            <Link href="/results" className="btn-primary mt-6 inline-flex items-center gap-2">Explorer les annonces</Link>
          </div>
        )}
      </div>
    </div>
  );
}
