"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, Users, Eye, Heart, Star, MapPin, Fuel, Calendar, ChevronLeft, Bell, Settings, FileText, Download, RefreshCw, Package, DollarSign, Clock, Activity, ArrowRight, Shield } from "lucide-react";
import { useToast } from "@/components/Toast";

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

const LEADS = [
  { name: "Mohammed A.", phone: "+212 6XX-XXX", car: "Toyota Corolla 2023", intent: "Achat", date: "Il y a 2h", status: "hot" as const },
  { name: "Sarah B.", phone: "+212 6XX-XXX", car: "Dacia Duster 2022", intent: "Financement", date: "Il y a 5h", status: "warm" as const },
  { name: "Youssef M.", phone: "+212 6XX-XXX", car: "Hyundai Tucson 2023", intent: "Échange", date: "Hier", status: "cold" as const },
  { name: "Fatima Z.", phone: "+212 6XX-XXX", car: "Kia Sportage 2024", intent: "Achat", date: "Hier", status: "hot" as const },
  { name: "Ahmed B.", phone: "+212 6XX-XXX", car: "Renault Clio 2021", intent: "Essai", date: "Il y a 2j", status: "warm" as const },
];

const STATUS_COLORS = {
  hot: "bg-red-500/10 text-red-400",
  warm: "bg-yellow-500/10 text-yellow-400",
  cold: "bg-blue-500/10 text-blue-400",
};

const STATUS_LABELS = {
  hot: "Chaud",
  warm: "Tiède",
  cold: "Froid",
};

const ACTIVITY_LOG = [
  { time: "14:32", action: "Nouveau lead", detail: "Mohammed A. → Toyota Corolla 2023", type: "lead" as const },
  { time: "13:15", action: "Vue annonce", detail: "Dacia Duster TCe — 12 vues aujourd'hui", type: "view" as const },
  { time: "11:48", action: "Prix ajusté", detail: "Renault Clio V — 155 000 → 148 000 DH", type: "price" as const },
  { time: "10:20", action: "Favori ajouté", detail: "Volkswagen Golf 8 — ajouté en favori par 3 users", type: "fav" as const },
  { time: "09:05", action: "Alerte IA", detail: "Prix moyen Toyota Corolla a baissé de 4%", type: "alert" as const },
];

export default function DashboardPage() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "leads" | "analytics">("overview");
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/search")
      .then((r) => r.json())
      .then((data) => { setCars(data.results); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalViews = 1247;
  const totalLeads = 23;
  const conversionRate = 4.2;
  const avgPrice = cars.length > 0 ? Math.round(cars.reduce((a, c) => a + c.price, 0) / cars.length) : 0;

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/entreprises" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white">
              <ChevronLeft className="h-4 w-4" /> Retour
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">AA</div>
              <div>
                <p className="text-sm font-semibold">Auto Alliance Maroc</p>
                <p className="text-xs text-gray-500">Concessionnaire &middot; Casablanca</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-gray-400 hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <button className="rounded-lg p-2 text-gray-400 hover:text-white"><Settings className="h-5 w-5" /></button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 glass-card p-1 w-fit">
          {(["overview", "listings", "leads", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab ? "bg-primary text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "overview" ? "Vue d'ensemble" : tab === "listings" ? "Annonces" : tab === "leads" ? "Leads" : "Analytique"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Vues totales", value: totalViews.toLocaleString(), icon: Eye, change: "+12%", up: true },
                { label: "Leads", value: String(totalLeads), icon: Users, change: "+8%", up: true },
                { label: "Taux conversion", value: `${conversionRate}%`, icon: Activity, change: "+0.3%", up: true },
                { label: "Prix moyen", value: `${Math.round(avgPrice / 1000)}k DH`, icon: DollarSign, change: "-2%", up: false },
              ].map((s) => (
                <div key={s.label} className="glass-card p-5">
                  <div className="flex items-center justify-between">
                    <s.icon className="h-5 w-5 text-gray-400" />
                    <span className={`text-xs font-bold ${s.up ? "text-green-400" : "text-red-400"}`}>{s.change}</span>
                  </div>
                  <p className="mt-3 text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Activity Feed */}
              <div className="glass-card p-6 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">Activité récente</h3>
                  <RefreshCw className="h-4 w-4 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {ACTIVITY_LOG.map((log, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-xl bg-dark-800/50 p-3">
                      <div className="text-xs text-gray-500 w-12 shrink-0">{log.time}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-gray-400">{log.detail}</p>
                      </div>
                      <span className={`rounded-lg px-2 py-1 text-xs ${
                        log.type === "lead" ? "bg-green-500/10 text-green-400" :
                        log.type === "alert" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {log.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card p-6">
                <h3 className="mb-4 font-bold">Actions rapides</h3>
                <div className="space-y-3">
                  {[
                    { icon: Package, label: "Ajouter une annonce", action: () => showToast("Fonctionnalité à venir", "info") },
                    { icon: FileText, label: "Exporter les leads (CSV)", action: () => showToast("Export en cours...", "info") },
                    { icon: Download, label: "Télécharger le rapport", action: () => showToast("Rapport généré", "success") },
                    { icon: Bell, label: "Configurer les alertes", action: () => showToast("Alertes configurées", "success") },
                  ].map((q) => (
                    <button
                      key={q.label}
                      onClick={q.action}
                      className="flex w-full items-center gap-3 rounded-xl bg-dark-800/50 p-3 text-left text-sm text-gray-300 hover:bg-dark-800 hover:text-white transition"
                    >
                      <q.icon className="h-4 w-4 shrink-0 text-primary" />
                      {q.label}
                      <ArrowRight className="ml-auto h-3 w-3 text-gray-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Listings */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">Top annonces par vues</h3>
                <button onClick={() => setActiveTab("listings")} className="text-xs text-primary hover:underline">Voir tout</button>
              </div>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-dark-800/50" />)}</div>
              ) : (
                <div className="space-y-3">
                  {cars.slice(0, 5).map((car, i) => (
                    <div key={car.id} className="flex items-center gap-4 rounded-xl bg-dark-800/50 p-3">
                      <span className="w-6 text-center text-sm font-bold text-gray-500">#{i + 1}</span>
                      <img src={car.image} alt={car.title} className="h-10 w-14 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{car.title}</p>
                        <p className="text-xs text-gray-400">{car.year} &middot; {car.km.toLocaleString()} km</p>
                      </div>
                      <span className={`rounded-lg px-2 py-1 text-xs font-bold ${
                        car.score >= 85 ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                      }`}>
                        <Star className="mr-1 inline h-3 w-3" />{car.score}
                      </span>
                      <span className="text-sm font-bold text-primary">{car.priceFormatted}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="glass-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold">Vos annonces ({cars.length})</h3>
              <div className="flex gap-2">
                <button className="btn-secondary text-xs flex items-center gap-1"><Download className="h-3 w-3" /> Exporter</button>
                <button className="btn-primary text-xs flex items-center gap-1"><Package className="h-3 w-3" /> Ajouter</button>
              </div>
            </div>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-dark-800/50" />)}</div>
            ) : (
              <div className="space-y-3">
                {cars.map((car) => (
                  <div key={car.id} className="flex items-center gap-4 rounded-xl bg-dark-800/50 p-4 hover:bg-dark-800 transition">
                    <img src={car.image} alt={car.title} className="h-16 w-24 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold">{car.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{car.year}</span>
                        <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{car.fuel}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{car.city}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{Math.floor(Math.random() * 200 + 50)} vues</span>
                      </div>
                    </div>
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${
                      car.score >= 85 ? "bg-green-500/10 text-green-400" : car.score >= 70 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      <Star className="mr-1 inline h-3 w-3" />{car.score}
                    </span>
                    <p className="w-28 text-right font-bold text-primary">{car.priceFormatted}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Leads chauds", value: "8", color: "text-red-400" },
                { label: "Leads tièdes", value: "11", color: "text-yellow-400" },
                { label: "Leads froids", value: "4", color: "text-blue-400" },
              ].map((s) => (
                <div key={s.label} className="glass-card p-5 text-center">
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">Derniers leads</h3>
                <button className="text-xs text-primary hover:underline">Exporter CSV</button>
              </div>
              <div className="space-y-3">
                {LEADS.map((lead, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl bg-dark-800/50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {lead.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-xs text-gray-400">{lead.car} &middot; {lead.intent}</p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-lg px-2 py-1 text-xs font-bold ${STATUS_COLORS[lead.status]}`}>
                        {STATUS_LABELS[lead.status]}
                      </span>
                      <p className="mt-1 text-xs text-gray-500">{lead.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="mb-4 font-bold">Prix moyen par marque (Marché Maroc)</h3>
              <div className="space-y-3">
                {[
                  { brand: "Toyota", avg: 285000, change: "+3%", count: 12 },
                  { brand: "Hyundai", avg: 235000, change: "-1%", count: 8 },
                  { brand: "Dacia", avg: 155000, change: "+5%", count: 15 },
                  { brand: "Renault", avg: 175000, change: "+2%", count: 10 },
                  { brand: "Kia", avg: 295000, change: "-2%", count: 6 },
                  { brand: "Volkswagen", avg: 310000, change: "+1%", count: 7 },
                ].map((b) => (
                  <div key={b.brand} className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium">{b.brand}</span>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-dark-800">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-primary to-cyan-400"
                          style={{ width: `${Math.min(100, (b.avg / 350000) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-24 text-right text-sm font-bold">{Math.round(b.avg / 1000)}k DH</span>
                    <span className={`w-12 text-right text-xs font-bold ${b.change.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                      {b.change}
                    </span>
                    <span className="w-16 text-right text-xs text-gray-500">{b.count} annonces</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="glass-card p-6">
                <h3 className="mb-4 font-bold">Répartition par carburant</h3>
                <div className="space-y-3">
                  {[
                    { fuel: "Diesel", pct: 45, color: "bg-blue-500" },
                    { fuel: "Essence", pct: 35, color: "bg-green-500" },
                    { fuel: "Hybride", pct: 15, color: "bg-yellow-500" },
                    { fuel: "Électrique", pct: 5, color: "bg-purple-500" },
                  ].map((f) => (
                    <div key={f.fuel} className="flex items-center gap-3">
                      <span className="w-20 text-sm">{f.fuel}</span>
                      <div className="flex-1 h-2 rounded-full bg-dark-800">
                        <div className={`h-2 rounded-full ${f.color}`} style={{ width: `${f.pct}%` }} />
                      </div>
                      <span className="w-10 text-right text-sm font-bold">{f.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="mb-4 font-bold">Villes les plus actives</h3>
                <div className="space-y-3">
                  {[
                    { city: "Casablanca", count: 35, icon: "🏙️" },
                    { city: "Rabat", count: 18, icon: "🏛️" },
                    { city: "Marrakech", count: 12, icon: "🕌" },
                    { city: "Fès", count: 8, icon: "📿" },
                    { city: "Tanger", count: 6, icon: "⚓" },
                  ].map((c) => (
                    <div key={c.city} className="flex items-center gap-3">
                      <span className="text-lg">{c.icon}</span>
                      <span className="flex-1 text-sm">{c.city}</span>
                      <span className="text-sm font-bold">{c.count} annonces</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Score de marché — Recommandations IA</h3>
              </div>
              <div className="space-y-3">
                {[
                  { tip: "Le prix moyen des Toyota Corolla a baissé de 4% cette semaine. Bon moment pour acheter.", type: "opportunity" },
                  { tip: "Les SUV diesel restent les plus demandés à Casablanca. Maintenez vos prix sur ce segment.", type: "info" },
                  { tip: "Les Dacia Duster 2022-2023 se vendent en moyenne 15% plus vite que les autres modèles.", type: "trend" },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-dark-800/50 p-4">
                    {r.type === "opportunity" ? (
                      <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    ) : r.type === "trend" ? (
                      <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                    )}
                    <p className="text-sm text-gray-300">{r.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
