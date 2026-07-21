"use client";

import { useState, useEffect } from "react";
import { X, Star, Fuel, MapPin } from "lucide-react";

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

export default function ComparePage() {
  const [all, setAll] = useState<CarListing[]>([]);
  const [selected, setSelected] = useState<CarListing[]>([]);

  useEffect(() => {
    fetch("/api/search").then(r => r.json()).then(data => {
      setAll(data.results);
      setSelected(data.results.slice(0, 2));
    });
  }, []);

  const addCar = (id: string) => {
    const car = all.find((c) => c.id === id);
    if (car && selected.length < 3 && !selected.find((s) => s.id === id)) {
      setSelected([...selected, car]);
    }
  };

  const removeCar = (id: string) => setSelected(selected.filter((v) => v.id !== id));
  const available = all.filter((v) => !selected.find((s) => s.id === v.id));

  const specs = [
    { label: "Prix", format: (v: CarListing) => v.priceFormatted },
    { label: "Année", format: (v: CarListing) => String(v.year) },
    { label: "Kilométrage", format: (v: CarListing) => `${v.km.toLocaleString()} km` },
    { label: "Carburant", format: (v: CarListing) => v.fuel },
    { label: "Ville", format: (v: CarListing) => v.city },
    { label: "Score", format: (v: CarListing) => `${v.score}/100` },
    { label: "Source", format: (v: CarListing) => v.source },
  ];

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
                <th className="p-4 text-left text-sm text-gray-500">Caractéristique</th>
                {selected.map((v) => (
                  <th key={v.id} className="relative p-4 text-center">
                    <button onClick={() => removeCar(v.id)} className="absolute right-2 top-2 rounded-lg p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400"><X className="h-4 w-4" /></button>
                    <img src={v.image} alt={v.title} className="mx-auto h-20 w-32 rounded-lg object-cover" />
                    <p className="mt-2 font-semibold text-sm">{v.title}</p>
                  </th>
                ))}
                {selected.length < 3 && (
                  <th className="p-4 text-center">
                    <select onChange={(e) => { addCar(e.target.value); e.currentTarget.value = ""; }} className="input-field w-48 text-sm" defaultValue="">
                      <option value="" disabled>+ Ajouter</option>
                      {available.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
                    </select>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => (
                <tr key={spec.label} className="border-b border-white/5">
                  <td className="p-4 text-sm text-gray-400">{spec.label}</td>
                  {selected.map((v) => (
                    <td key={v.id} className="p-4 text-center text-sm">{spec.format(v)}</td>
                  ))}
                  {selected.length < 3 && <td />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
