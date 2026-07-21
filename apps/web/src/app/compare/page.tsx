"use client";

import { useState } from "react";
import { X, Plus, Star, Fuel, Gauge, Calendar, MapPin } from "lucide-react";

interface Vehicle {
  id: number;
  name: string;
  year: number;
  price: number;
  km: number;
  fuel: string;
  city: string;
  score: number;
  hp: number;
  transmission: string;
  color: string;
}

const ALL_VEHICLES: Vehicle[] = [
  { id: 1, name: "Dacia Duster", year: 2022, price: 185000, km: 35000, fuel: "Diesel", city: "Casablanca", score: 87, hp: 110, transmission: "Manuelle", color: "Gris" },
  { id: 2, name: "Renault Clio V", year: 2021, price: 145000, km: 42000, fuel: "Essence", city: "Rabat", score: 82, hp: 90, transmission: "Automatique", color: "Blanc" },
  { id: 3, name: "Toyota Corolla", year: 2023, price: 210000, km: 18000, fuel: "Hybride", city: "Marrakech", score: 94, hp: 122, transmission: "CVT", color: "Noir" },
  { id: 4, name: "Hyundai Tucson", year: 2022, price: 245000, km: 28000, fuel: "Diesel", city: "Fès", score: 91, hp: 136, transmission: "Automatique", color: "Bleu" },
  { id: 5, name: "Kia Sportage", year: 2023, price: 265000, km: 12000, fuel: "Essence", city: "Tanger", score: 89, hp: 150, transmission: "Automatique", color: "Gris" },
];

function getScoreColor(score: number) {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-warning";
  return "text-error";
}

export default function ComparePage() {
  const [selected, setSelected] = useState<Vehicle[]>(ALL_VEHICLES.slice(0, 2));

  const addVehicle = (vehicle: Vehicle) => {
    if (selected.length < 3 && !selected.find((v) => v.id === vehicle.id)) {
      setSelected([...selected, vehicle]);
    }
  };

  const removeVehicle = (id: number) => {
    setSelected(selected.filter((v) => v.id !== id));
  };

  const available = ALL_VEHICLES.filter((v) => !selected.find((s) => s.id === v.id));

  const specs = [
    { label: "Prix", key: "price" as const, format: (v: Vehicle) => `${v.price.toLocaleString()} DH` },
    { label: "Année", key: "year" as const, format: (v: Vehicle) => String(v.year) },
    { label: "Kilométrage", key: "km" as const, format: (v: Vehicle) => `${v.km.toLocaleString()} km` },
    { label: "Carburant", key: "fuel" as const, format: (v: Vehicle) => v.fuel },
    { label: "Puissance", key: "hp" as const, format: (v: Vehicle) => `${v.hp} ch` },
    { label: "Transmission", key: "transmission" as const, format: (v: Vehicle) => v.transmission },
    { label: "Couleur", key: "color" as const, format: (v: Vehicle) => v.color },
    { label: "Ville", key: "city" as const, format: (v: Vehicle) => v.city },
  ];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Comparaison</h1>
          <p className="mt-2 text-gray-400">Comparez jusqu&apos;à 3 véhicules côte à côte</p>
        </div>

        {/* Table */}
        <div className="glass-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-left text-sm text-gray-500">Caractéristique</th>
                {selected.map((v) => (
                  <th key={v.id} className="relative p-4 text-center">
                    <button
                      onClick={() => removeVehicle(v.id)}
                      className="absolute right-2 top-2 rounded-lg p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="text-2xl">🚙</span>
                    <p className="mt-1 font-semibold">{v.name}</p>
                    <p className="text-xs text-gray-500">{v.year}</p>
                  </th>
                ))}
                {selected.length < 3 && (
                  <th className="p-4 text-center">
                    <div className="flex h-full min-h-[100px] flex-col items-center justify-center">
                      <p className="text-xs text-gray-500 mb-2">Ajouter</p>
                      <select
                        onChange={(e) => {
                          const v = ALL_VEHICLES.find((vh) => vh.id === Number(e.target.value));
                          if (v) addVehicle(v);
                          e.currentTarget.value = "";
                        }}
                        className="input-field w-48 text-sm"
                        defaultValue=""
                      >
                        <option value="" disabled>Choisir un véhicule</option>
                        {available.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {/* Score row */}
              <tr className="border-b border-white/5">
                <td className="p-4 text-sm font-medium">Reputation Score</td>
                {selected.map((v) => (
                  <td key={v.id} className="p-4 text-center">
                    <span className={`text-2xl font-bold ${getScoreColor(v.score)}`}>
                      {v.score}
                    </span>
                  </td>
                ))}
                {selected.length < 3 && <td />}
              </tr>
              {/* Specs */}
              {specs.map((spec) => (
                <tr key={spec.label} className="border-b border-white/5">
                  <td className="p-4 text-sm text-gray-400">{spec.label}</td>
                  {selected.map((v) => (
                    <td key={v.id} className="p-4 text-center text-sm">
                      {spec.format(v)}
                    </td>
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
