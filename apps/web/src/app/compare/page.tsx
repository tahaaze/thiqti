"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { X, Star, Loader, BadgeCheck, AlertTriangle, ThumbsUp, Wallet, Gauge, Calendar } from "lucide-react";

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

function generateAdvice(cars: CarListing[]): string[] {
  if (cars.length < 2) return [];
  const advice: string[] = [];
  const sorted = [...cars].sort((a, b) => b.score - a.score);
  const cheapest = [...cars].sort((a, b) => a.price - b.price)[0];
  const newest = [...cars].sort((a, b) => b.year - a.year)[0];
  const lowestKm = [...cars].sort((a, b) => a.km - b.km)[0];
  const bestScore = sorted[0];

  if (bestScore.score >= 85) {
    advice.push(`${bestScore.make} ${bestScore.model} a le meilleur score (${bestScore.score}/100) — c'est le choix le plus sûr.`);
  }

  if (cheapest.id !== bestScore.id) {
    const diff = bestScore.price - cheapest.price;
    advice.push(`${cheapest.make} ${cheapest.model} est le moins cher (${cheapest.priceFormatted}), soit ${diff.toLocaleString("fr-FR")} DH de moins que le mieux noté.`);
  }

  if (lowestKm.km < 20000) {
    advice.push(`${lowestKm.make} ${lowestKm.model} n'a que ${lowestKm.km.toLocaleString("fr-FR")} km — encore très peu utilisé.`);
  }

  const ageMap = cars.map(c => ({ ...c, age: 2026 - c.year }));
  const youngest = ageMap.sort((a, b) => a.age - b.age)[0];
  if (youngest.age <= 1) {
    advice.push(`${youngest.make} ${youngest.model} est le plus récent (${youngest.year}) — garanti constructeur possiblement encore active.`);
  }

  const kmDiff = Math.abs(lowestKm.km - cars.sort((a, b) => b.km - a.km)[0].km);
  if (kmDiff > 40000) {
    advice.push(`Écart de kilométrage important (${kmDiff.toLocaleString("fr-FR")} km) — privilégiez le véhicule le moins roulé pour une meilleure longévité.`);
  }

  const priceDiff = cars.sort((a, b) => b.price - a.price)[0].price - cars.sort((a, b) => a.price - b.price)[0].price;
  if (priceDiff > 100000) {
    advice.push(`L'écart de prix est de ${priceDiff.toLocaleString("fr-FR")} DH — le moins cher offre un meilleur rapport qualité-prix si le score est comparable.`);
  }

  const sameFuel = cars.every(c => c.fuel === cars[0].fuel);
  if (!sameFuel) {
    advice.push(`Les carburants diffèrent (${cars.map(c => c.fuel).join(" vs ")}) — le diesel consomme moins sur autoroute, l'essence est plus économique en ville.`);
  }

  return advice;
}

export default function ComparePage() {
  const [all, setAll] = useState<CarListing[]>([]);
  const [selected, setSelected] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/search").then(r => {
      if (!r.ok) throw new Error("Erreur réseau");
      return r.json();
    }).then(data => {
      setAll(data.results);
      setSelected(data.results.slice(0, 2));
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, []);

  const addCar = (id: string) => {
    const car = all.find((c) => c.id === id);
    if (car && selected.length < 3 && !selected.find((s) => s.id === id)) {
      setSelected([...selected, car]);
    }
  };

  const removeCar = (id: string) => setSelected(selected.filter((v) => v.id !== id));
  const available = all.filter((v) => !selected.find((s) => s.id === v.id));

  const advice = useMemo(() => generateAdvice(selected), [selected]);
  const bestCar = useMemo(() => selected.length > 0 ? [...selected].sort((a, b) => b.score - a.score)[0] : null, [selected]);

  const specs = [
    { label: "Prix", format: (v: CarListing) => v.priceFormatted, icon: Wallet },
    { label: "Année", format: (v: CarListing) => String(v.year), icon: Calendar },
    { label: "Kilométrage", format: (v: CarListing) => `${v.km.toLocaleString("fr-FR")} km`, icon: Gauge },
    { label: "Carburant", format: (v: CarListing) => v.fuel, icon: null },
    { label: "Score IA", format: (v: CarListing) => `${v.score}/100`, icon: Star },
  ];

  function getBestRow(selected: CarListing[], specKey: string) {
    if (selected.length < 2) return null;
    if (specKey === "Prix") return selected.reduce((a, b) => a.price < b.price ? a : b).id;
    if (specKey === "Kilométrage") return selected.reduce((a, b) => a.km < b.km ? a : b).id;
    if (specKey === "Score IA") return selected.reduce((a, b) => a.score > b.score ? a : b).id;
    if (specKey === "Année") return selected.reduce((a, b) => a.year > b.year ? a : b).id;
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Comparaison</h1>
            <p className="mt-2 text-gray-400">Comparez jusqu&apos;à 3 véhicules côte à côte</p>
          </div>
          <div className="glass-card p-12 text-center">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-400">Chargement des véhicules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Comparaison</h1>
          <p className="mt-2 text-gray-400">Comparez jusqu&apos;à 3 véhicules côte à côte</p>
        </div>

        <div className="glass-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-left text-sm text-gray-500 w-40">Caractéristique</th>
                {selected.map((v) => (
                  <th key={v.id} className="relative p-4 text-center min-w-[200px]">
                    <button onClick={() => removeCar(v.id)} className="absolute right-2 top-2 rounded-lg p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400"><X className="h-4 w-4" /></button>
                    <img src={v.image} alt={v.title} className="mx-auto h-24 w-40 rounded-lg object-cover" />
                    <p className="mt-2 font-semibold text-sm">{v.title}</p>
                    <Link href={`/vehicle/${v.id}`} className="mt-1 inline-block text-xs text-primary hover:underline">Voir détails</Link>
                  </th>
                ))}
                {selected.length < 3 && (
                  <th className="p-4 text-center">
                    <select
                      key={selected.length}
                      onChange={(e) => { if (e.target.value) addCar(e.target.value); }}
                      value=""
                      className="input-field w-48 text-sm"
                    >
                      <option value="" disabled>+ Ajouter</option>
                      {available.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
                    </select>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => {
                const bestId = getBestRow(selected, spec.label);
                return (
                  <tr key={spec.label} className="border-b border-white/5">
                    <td className="p-4 text-sm font-medium text-gray-300">{spec.label}</td>
                    {selected.map((v) => (
                      <td key={v.id} className={`p-4 text-center text-sm ${bestId === v.id ? "font-bold text-green-400" : ""}`}>
                        <span className="flex items-center justify-center gap-1">
                          {bestId === v.id && <BadgeCheck className="h-4 w-4 text-green-400" />}
                          {spec.format(v)}
                        </span>
                      </td>
                    ))}
                    {selected.length < 3 && <td />}
                  </tr>
                );
              })}
              <tr className="border-b border-white/5">
                <td className="p-4 text-sm font-medium text-gray-300">Prix/km</td>
                {selected.map((v) => {
                  const ratio = v.km > 0 ? Math.round(v.price / v.km) : 0;
                  const bestRatio = selected.filter(s => s.km > 0).sort((a, b) => (a.price / a.km) - (b.price / b.km))[0];
                  const isBest = bestRatio?.id === v.id && v.km > 0;
                  return (
                    <td key={v.id} className={`p-4 text-center text-sm ${isBest ? "font-bold text-green-400" : ""}`}>
                      <span className="flex items-center justify-center gap-1">
                        {isBest && <BadgeCheck className="h-4 w-4 text-green-400" />}
                        {v.km > 0 ? `${ratio} DH/km` : "N/A"}
                      </span>
                    </td>
                  );
                })}
                {selected.length < 3 && <td />}
              </tr>
            </tbody>
          </table>
        </div>

        {selected.length >= 2 && advice.length > 0 && (
          <div className="mt-6 glass-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold">Conseil IA — Aide à la décision</h2>
            </div>
            <div className="space-y-3">
              {advice.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-dark-800/50 p-4">
                  {tip.includes("sûr") || tip.includes("meilleur") || tip.includes("récent") || tip.includes("peu utilisé") ? (
                    <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  ) : tip.includes("moins cher") || tip.includes("rapport") ? (
                    <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  ) : tip.includes("écart") || tip.includes("important") ? (
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
                  Recommandation : {bestCar?.make} {bestCar?.model}
                </p>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Avec un score de {bestCar?.score}/100 et un prix de {bestCar?.priceFormatted}, c&apos;est le meilleur choix parmi vos sélectionnés.
              </p>
            </div>
          </div>
        )}

        {selected.length === 0 && (
          <div className="mt-6 glass-card p-12 text-center">
            <p className="text-gray-400">Aucun véhicule sélectionné</p>
            <Link href="/results" className="btn-primary mt-4 inline-flex items-center gap-2">
              Explorer les annonces
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
