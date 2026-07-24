"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  X,
  Star,
  Loader,
  BadgeCheck,
  AlertTriangle,
  ThumbsUp,
  Wallet,
  Gauge,
  Calendar,
  Brain,
  ChevronLeft,
  ChevronDown,
  Heart,
  Fuel,
  MapPin,
  CarFront,
  SlidersHorizontal,
  // @ts-ignore - lucide-react 0.400 types incomplete
  Tag,
} from "lucide-react";
import CarImage from "@/components/CarImage";

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
  score: number;
  source: string;
  url: string;
  matchPercent?: number;
}

type DiffColor = "better" | "worse" | "same";

function diffColor(
  sel: CarListing[],
  carId: string,
  specKey: string
): DiffColor {
  if (sel.length < 2) return "same";
  switch (specKey) {
    case "Prix":
    case "Kilométrage": {
      const vals = sel.map((c) => (specKey === "Prix" ? c.price : c.km));
      const best = Math.min(...vals);
      const worst = Math.max(...vals);
      const v = specKey === "Prix" ? car("price") : car("km");
      if (v === best && best !== worst) return "better";
      if (v === worst && best !== worst) return "worse";
      return "same";
    }
    case "Score IA":
    case "Année":
    case "Match %": {
      const vals = sel.map((c) =>
        specKey === "Score IA"
          ? c.score
          : specKey === "Année"
            ? c.year
            : (c.matchPercent ?? 0)
      );
      const best = Math.max(...vals);
      const worst = Math.min(...vals);
      const v =
        specKey === "Score IA"
          ? car("score")
          : specKey === "Année"
            ? car("year")
            : (car("matchPercent") ?? 0);
      if (v === best && best !== worst) return "better";
      if (v === worst && best !== worst) return "worse";
      return "same";
    }
    default:
      return "same";
  }

  function car<K extends keyof CarListing>(key: K): any {
    return sel.find((c) => c.id === carId)?.[key];
  }
}

function getDiffClass(d: DiffColor): string {
  if (d === "better") return "text-green-400 bg-green-500/10";
  if (d === "worse") return "text-red-400 bg-red-500/10";
  return "text-gray-300";
}

function generateAdvice(cars: CarListing[]): string[] {
  if (cars.length < 2) return [];
  const advice: string[] = [];
  const sorted = [...cars].sort((a, b) => b.score - a.score);
  const cheapest = [...cars].sort((a, b) => a.price - b.price)[0];
  const lowestKm = [...cars].sort((a, b) => a.km - b.km)[0];
  const bestScore = sorted[0];

  if (bestScore.score >= 85) {
    advice.push(
      `${bestScore.make} ${bestScore.model} a le meilleur score (${bestScore.score}/100) — c'est le choix le plus sûr.`
    );
  }
  if (cheapest.id !== bestScore.id) {
    const diff = bestScore.price - cheapest.price;
    advice.push(
      `${cheapest.make} ${cheapest.model} est le moins cher (${cheapest.priceFormatted}), soit ${diff.toLocaleString("fr-FR")} DH de moins que le mieux noté.`
    );
  }
  if (lowestKm.km < 20000) {
    advice.push(
      `${lowestKm.make} ${lowestKm.model} n'a que ${lowestKm.km.toLocaleString("fr-FR")} km — encore très peu utilisé.`
    );
  }
  const youngest = [...cars].sort((a, b) => b.year - a.year)[0];
  if (2026 - youngest.year <= 1) {
    advice.push(
      `${youngest.make} ${youngest.model} est le plus récent (${youngest.year}) — garanti constructeur possiblement encore active.`
    );
  }
  const kmDiff = Math.abs(
    lowestKm.km -
      [...cars].sort((a, b) => b.km - a.km)[0].km
  );
  if (kmDiff > 40000) {
    advice.push(
      `Écart de kilométrage important (${kmDiff.toLocaleString("fr-FR")} km) — privilégiez le véhicule le moins roulé pour une meilleure longévité.`
    );
  }
  const priceDiff =
    [...cars].sort((a, b) => b.price - a.price)[0].price -
    [...cars].sort((a, b) => a.price - b.price)[0].price;
  if (priceDiff > 100000) {
    advice.push(
      `L'écart de prix est de ${priceDiff.toLocaleString("fr-FR")} DH — le moins cher offre un meilleur rapport qualité-prix si le score est comparable.`
    );
  }
  const sameFuel = cars.every((c) => c.fuel === cars[0].fuel);
  if (!sameFuel) {
    advice.push(
      `Les carburants diffèrent (${cars.map((c) => c.fuel).join(" vs ")}) — le diesel consomme moins sur autoroute, l'essence est plus économique en ville.`
    );
  }

  return advice;
}

const MAX_COMPARE = 2;

export default function ComparePage() {
  const [all, setAll] = useState<CarListing[]>([]);
  const [favoritesCars, setFavoritesCars] = useState<CarListing[]>([]);
  const [selected, setSelected] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"search" | "favorites">("search");

  useEffect(() => {
    Promise.all([
      fetch("/api/search")
        .then((r) => {
          if (!r.ok) throw new Error("Erreur réseau");
          return r.json();
        })
        .then((data) => data.results as CarListing[])
        .catch(() => [] as CarListing[]),
      Promise.resolve().then(() => {
        try {
          const saved = localStorage.getItem("thiqti_favorites");
          if (saved) {
            const ids: string[] = JSON.parse(saved);
            return ids;
          }
        } catch {}
        return [] as string[];
      }),
    ]).then(([searchResults, favIds]) => {
      setAll(searchResults);
      const favCars = searchResults.filter((c) =>
        favIds.includes(c.id)
      );
      setFavoritesCars(favCars);
      if (searchResults.length > 0) {
        setSelected(searchResults.slice(0, MAX_COMPARE));
      }
      setLoading(false);
    });
  }, []);

  const addCar = (id: string) => {
    const pool = source === "favorites" ? favoritesCars : all;
    const car = pool.find((c) => c.id === id);
    if (
      car &&
      selected.length < MAX_COMPARE &&
      !selected.find((s) => s.id === id)
    ) {
      setSelected([...selected, car]);
    }
  };

  const removeCar = (id: string) =>
    setSelected(selected.filter((v) => v.id !== id));

  const pool = source === "favorites" ? favoritesCars : all;
  const available = pool.filter(
    (v) => !selected.find((s) => s.id === v.id)
  );

  const advice = useMemo(
    () => generateAdvice(selected),
    [selected]
  );
  const bestCar = useMemo(
    () =>
      selected.length > 0
        ? [...selected].sort((a, b) => b.score - a.score)[0]
        : null,
    [selected]
  );

  const specs: {
    label: string;
    format: (v: CarListing) => string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { label: "Prix", format: (v) => v.priceFormatted, icon: Wallet },
    { label: "Année", format: (v) => String(v.year), icon: Calendar },
    {
      label: "Kilométrage",
      format: (v) => `${v.km.toLocaleString("fr-FR")} km`,
      icon: Gauge,
    },
    { label: "Carburant", format: (v) => v.fuel, icon: Fuel },
    {
      label: "Transmission",
      format: (v) => v.transmission || "—",
      icon: SlidersHorizontal,
    },
    { label: "Carrosserie", format: (v) => v.bodyType || "—", icon: CarFront },
    { label: "Ville", format: (v) => v.city, icon: MapPin },
    {
      label: "Score IA",
      format: (v) => `${v.score}/100`,
      icon: Star,
    },
    {
      label: "Match %",
      format: (v) =>
        v.matchPercent !== undefined ? `${v.matchPercent}%` : "—",
      icon: Tag,
    },
  ];

  function getBestRow(sel: CarListing[], specKey: string): string | null {
    if (sel.length < 2) return null;
    if (specKey === "Prix")
      return sel.reduce((a, b) => (a.price < b.price ? a : b)).id;
    if (specKey === "Kilométrage")
      return sel.reduce((a, b) => (a.km < b.km ? a : b)).id;
    if (specKey === "Score IA")
      return sel.reduce((a, b) => (a.score > b.score ? a : b)).id;
    if (specKey === "Année")
      return sel.reduce((a, b) => (a.year > b.year ? a : b)).id;
    if (specKey === "Match %") {
      const withMatch = sel.filter((c) => c.matchPercent !== undefined);
      if (withMatch.length < 2) return null;
      return withMatch.reduce((a, b) =>
        (a.matchPercent ?? 0) > (b.matchPercent ?? 0) ? a : b
      ).id;
    }
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Comparaison</h1>
            <p className="mt-2 text-gray-400">
              Comparez jusqu&apos;à 2 véhicules côte à côte
            </p>
          </div>
          <div className="glass-card p-12 text-center">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-400">
              Chargement des véhicules...
            </p>
          </div>
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
              <Link
                href="/results"
                className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-3xl font-bold">Comparaison</h1>
            </div>
            <p className="mt-2 text-gray-400">
              Comparez jusqu&apos;à 2 véhicules côte à côte
            </p>
          </div>
        </div>

        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              Source des véhicules :
            </span>
            <button
              onClick={() => setSource("search")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                source === "search"
                  ? "bg-primary/20 text-primary"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Recherche
            </button>
            <button
              onClick={() => setSource("favorites")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                source === "favorites"
                  ? "bg-red-500/20 text-red-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${source === "favorites" ? "fill-red-400" : ""}`}
              />
              Favoris ({favoritesCars.length})
            </button>
          </div>
        </div>

        <div className="glass-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-left text-sm text-gray-500 w-40">
                  Caractéristique
                </th>
                {selected.map((v) => (
                  <th
                    key={v.id}
                    className="relative p-4 text-center min-w-[220px]"
                  >
                    <button
                      onClick={() => removeCar(v.id)}
                      className="absolute right-2 top-2 rounded-lg p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <CarImage
                      src={v.image}
                      alt={v.title}
                      make={v.make}
                      model={v.model}
                      className="mx-auto h-28 w-44 rounded-lg object-cover"
                    />
                    <p className="mt-2 font-semibold text-sm">
                      {v.title}
                    </p>
                    <Link
                      href={`/vehicle/${v.id}`}
                      className="mt-1 inline-block text-xs text-primary hover:underline"
                    >
                      Voir détails
                    </Link>
                  </th>
                ))}
                {selected.length < MAX_COMPARE && (
                  <th className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CarFront className="h-8 w-8 text-gray-600" />
                      <select
                        key={`${source}-${selected.length}`}
                        onChange={(e) => {
                          if (e.target.value) addCar(e.target.value);
                        }}
                        value=""
                        className="input-field w-56 text-sm"
                      >
                        <option value="" disabled>
                          + Ajouter un véhicule
                        </option>
                        {available.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.title}
                          </option>
                        ))}
                      </select>
                      {available.length === 0 && (
                        <p className="text-xs text-gray-500">
                          {source === "favorites"
                            ? "Aucun favori disponible"
                            : "Aucun véhicule disponible"}
                        </p>
                      )}
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => {
                const bestId = getBestRow(selected, spec.label);
                const Icon = spec.icon;
                return (
                  <tr
                    key={spec.label}
                    className="border-b border-white/5"
                  >
                    <td className="p-4 text-sm font-medium text-gray-300">
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {spec.label}
                      </span>
                    </td>
                    {selected.map((v) => {
                      const d = diffColor(selected, v.id, spec.label);
                      const isBest = bestId === v.id;
                      return (
                        <td
                          key={v.id}
                          className={`p-4 text-center text-sm rounded-lg ${getDiffClass(d)} ${isBest ? "font-bold" : ""}`}
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            {isBest && (
                              <BadgeCheck className="h-4 w-4 text-green-400" />
                            )}
                            {spec.format(v)}
                          </span>
                        </td>
                      );
                    })}
                    {selected.length < MAX_COMPARE && <td />}
                  </tr>
                );
              })}
              <tr className="border-b border-white/5">
                <td className="p-4 text-sm font-medium text-gray-300">
                  <span className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-gray-500" />
                    Prix/km
                  </span>
                </td>
                {selected.map((v) => {
                  const ratio =
                    v.km > 0 ? Math.round(v.price / v.km) : 0;
                  const withKm = selected.filter((s) => s.km > 0);
                  const bestRatio =
                    withKm.length >= 2
                      ? withKm.sort(
                          (a, b) => a.price / a.km - b.price / b.km
                        )[0]
                      : null;
                  const isBest = bestRatio?.id === v.id && v.km > 0;
                  const isWorst =
                    withKm.length >= 2 &&
                    withKm[withKm.length - 1]?.id === v.id &&
                    v.km > 0 &&
                    bestRatio?.id !== v.id;
                  return (
                    <td
                      key={v.id}
                      className={`p-4 text-center text-sm rounded-lg ${
                        isBest
                          ? "text-green-400 bg-green-500/10 font-bold"
                          : isWorst
                            ? "text-red-400 bg-red-500/10"
                            : "text-gray-300"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        {isBest && (
                          <BadgeCheck className="h-4 w-4 text-green-400" />
                        )}
                        {v.km > 0
                          ? `${ratio} DH/km`
                          : "N/A"}
                      </span>
                    </td>
                  );
                })}
                {selected.length < MAX_COMPARE && <td />}
              </tr>
            </tbody>
          </table>
        </div>

        {selected.length >= 2 && advice.length > 0 && (
          <div className="mt-6 glass-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold">
                Conseil IA — Aide à la décision
              </h2>
            </div>
            <div className="space-y-3">
              {advice.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl bg-dark-800/50 p-4"
                >
                  {tip.includes("sûr") ||
                  tip.includes("meilleur") ||
                  tip.includes("récent") ||
                  tip.includes("peu utilisé") ? (
                    <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  ) : tip.includes("moins cher") ||
                    tip.includes("rapport") ? (
                    <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  ) : tip.includes("écart") ||
                    tip.includes("important") ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                  ) : (
                    <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  )}
                  <p className="text-sm text-gray-300">{tip}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-green-400" />
                <p className="font-semibold text-green-400">
                  Recommandation : {bestCar?.make}{" "}
                  {bestCar?.model}
                </p>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Avec un score de {bestCar?.score}/100 et un
                prix de {bestCar?.priceFormatted}, c&apos;est
                le meilleur choix parmi vos sélectionnés.
              </p>
            </div>
          </div>
        )}

        {selected.length === 0 && (
          <div className="mt-6 glass-card p-12 text-center">
            <CarFront className="mx-auto mb-4 h-12 w-12 text-gray-600" />
            <p className="text-gray-400">
              Aucun véhicule sélectionné
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Sélectionnez des véhicules pour les comparer
            </p>
            <Link
              href="/results"
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              Explorer les annonces
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
