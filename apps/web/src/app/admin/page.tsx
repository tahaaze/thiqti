"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, X } from "lucide-react";

interface AdminCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  priceFormatted: string;
  fuel: string;
  source: string;
  score: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((session) => {
        if (!session) return;
        setChecking(false);
        fetch("/api/search")
          .then((r) => r.json())
          .then((data) => {
            setCars(data.results || []);
          })
          .catch(() => setCars([]))
          .finally(() => setLoadingCars(false));
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Vérification de la session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Administration</h1>
              <p className="text-sm text-gray-400">Tableau de bord Thiqti</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
              <Shield className="h-3.5 w-3.5" /> Session admin active
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
            >
              <X className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="glass-card p-5">
            <p className="text-3xl font-bold text-primary">{loadingCars ? "..." : cars.length}</p>
            <p className="text-xs text-gray-500">Véhicules au catalogue</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-3xl font-bold text-primary">196</p>
            <p className="text-xs text-gray-500">Catalogue cible (Phase 1)</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-3xl font-bold text-primary">6</p>
            <p className="text-xs text-gray-500">Véhicules avec données de réputation réelles</p>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="border-b border-white/5 px-6 py-4">
            <h2 className="font-semibold">Liste des véhicules</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Véhicule</th>
                  <th className="px-6 py-3">Année</th>
                  <th className="px-6 py-3">Carburant</th>
                  <th className="px-6 py-3">Prix</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {loadingCars ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Chargement...</td>
                  </tr>
                ) : cars.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Aucun véhicule</td>
                  </tr>
                ) : (
                  cars.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                      <td className="px-6 py-3">
                        <Link href={`/vehicle/${c.id}`} className="font-medium text-white hover:text-primary">
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-gray-400">{c.year}</td>
                      <td className="px-6 py-3 text-gray-400">{c.fuel}</td>
                      <td className="px-6 py-3 font-semibold">{c.priceFormatted}</td>
                      <td className="px-6 py-3 text-gray-400">{c.source}</td>
                      <td className="px-6 py-3 font-bold text-primary">{c.score}/100</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
