"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Star, MapPin, Fuel, Gauge, Calendar, Shield, ChevronLeft, Heart, Share2, CheckCircle2, MessageSquare, AlertTriangle, Send, Camera, CreditCard, BadgeCheck, BarChart3, Clock, TrendingUp, TrendingDown, Brain } from "lucide-react";
import CarImage from "@/components/CarImage";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";

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

interface ReputationData {
  modelKey: string;
  totalReviews: number;
  avgScore: number | null;
  windowMonths: number;
  lastUpdated: string;
  categories: { name: string; score: number | null }[];
  excerpts: { text: string; sentiment: "positive" | "negative" | "neutral"; score: number }[];
  volume: { total: number; positive: number; negative: number; neutral: number };
}

export default function VehiclePage({ params }: { params: Promise<{ slug: string }> }) {
  const [car, setCar] = useState<CarListing | null>(null);
  const [activeTab, setActiveTab] = useState<"specs" | "reputation" | "offers">("specs");
  const [fav, setFav] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [photoModal, setPhotoModal] = useState(false);
  const [error, setError] = useState(false);
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loadingRep, setLoadingRep] = useState(false);
  const { showToast } = useToast();
  const favLoadedRef = useRef(false);

  useEffect(() => {
    params.then(({ slug }) => {
      fetch("/api/search")
        .then((r) => {
          if (!r.ok) throw new Error("Erreur réseau");
          return r.json();
        })
        .then((data) => {
          const found = data.results.find((c: CarListing) => c.id === slug);
          if (found) {
            setCar(found);
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true));

      const saved = localStorage.getItem("thiqti_favorites");
      if (saved) {
        const favList: string[] = JSON.parse(saved);
        setFav(favList.includes(slug));
      }
      favLoadedRef.current = true;
    });
  }, [params]);

  useEffect(() => {
    if (!car) return;
    setLoadingRep(true);
    fetch(`/api/reputation?make=${encodeURIComponent(car.make)}&model=${encodeURIComponent(car.model)}`)
      .then((r) => r.json())
      .then((data) => setReputation(data))
      .catch(() => {})
      .finally(() => setLoadingRep(false));
  }, [car]);

  useEffect(() => {
    if (!car || !favLoadedRef.current) return;
    const saved = localStorage.getItem("thiqti_favorites");
    const list: string[] = saved ? JSON.parse(saved) : [];
    const updated = fav ? (list.includes(car.id) ? list : [...list, car.id]) : list.filter((id) => id !== car.id);
    localStorage.setItem("thiqti_favorites", JSON.stringify(updated));
  }, [fav, car]);

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <p className="text-gray-400">Véhicule introuvable</p>
        <Link href="/results" className="btn-primary">Voir tous les résultats</Link>
      </div>
    );

  if (!car)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );

  const hasEnoughReviews = reputation && reputation.totalReviews >= 30;

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/results" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Retour aux résultats
        </Link>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <div className="glass-card overflow-hidden">
              <div className="relative h-72">
                <CarImage src={car.image} alt={car.title} make={car.make} model={car.model} className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3"><span className="rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">{car.source}</span></div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{car.title}</h1>
                    <p className="text-gray-400">{car.year} &middot; {car.km.toLocaleString()} km &middot; {car.fuel}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setFav(!fav)} className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-red-400"><Heart className={`h-5 w-5 ${fav ? "fill-red-400 text-red-400" : ""}`} /></button>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("Lien copié !", "success"); }} className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-primary"><Share2 className="h-5 w-5" /></button>
                  </div>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-primary">{car.priceFormatted}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-1 glass-card p-1">
              {(["specs", "reputation", "offers"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${activeTab === tab ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}>
                  {tab === "specs" ? "Caractéristiques" : tab === "reputation" ? "Réputation" : "Offres & Financement"}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {activeTab === "specs" && (
                <div className="glass-card p-6">
                  <h2 className="mb-4 text-lg font-bold">Caractéristiques</h2>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                      { label: "Kilométrage", value: `${car.km.toLocaleString()} km`, icon: Gauge },
                      { label: "Année", value: String(car.year), icon: Calendar },
                      { label: "Carburant", value: car.fuel, icon: Fuel },
                      { label: "Ville", value: car.city, icon: MapPin },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-dark-800/50 p-4">
                        <s.icon className="mb-2 h-5 w-5 text-primary" />
                        <p className="text-xs text-gray-500">{s.label}</p>
                        <p className="font-semibold">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "reputation" && (
                <div className="glass-card p-6">
                  <h2 className="mb-6 text-lg font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Baromètre d&apos;e-réputation
                  </h2>

                  {loadingRep ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-dark-800/50" />)}
                    </div>
                  ) : !reputation ? (
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                      <p className="text-sm text-yellow-300">Données indisponibles pour ce modèle.</p>
                    </div>
                  ) : !hasEnoughReviews ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          <div>
                            <p className="text-sm font-medium text-yellow-300">Seuil insuffisant</p>
                            <p className="text-xs text-yellow-400/70 mt-1">
                              {reputation.totalReviews} avis collectés sur 30 minimum requis. Le score ne sera publié qu&apos;à 30 avis exploitables.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-dark-800/50 p-4 text-center">
                          <p className="text-2xl font-bold text-primary">{reputation.volume.total}</p>
                          <p className="text-xs text-gray-500">Avis collectés</p>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(100, (reputation.volume.total / 30) * 100)}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-gray-600">{reputation.volume.total}/30</p>
                        </div>
                        <div className="rounded-xl bg-dark-800/50 p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-400" />
                            <span className="text-lg font-bold text-green-400">{reputation.volume.positive}</span>
                          </div>
                          <p className="text-xs text-gray-500">Positifs</p>
                        </div>
                        <div className="rounded-xl bg-dark-800/50 p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingDown className="h-3 w-3 text-red-400" />
                            <span className="text-lg font-bold text-red-400">{reputation.volume.negative}</span>
                          </div>
                          <p className="text-xs text-gray-500">Négatifs</p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-dark-800/50 p-3 flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <p className="text-xs text-gray-500">
                          Fenêtre d&apos;observation : {reputation.windowMonths} mois &middot; Dernière MAJ : {reputation.lastUpdated}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {reputation.categories.map((cat) => (
                          <div key={cat.name} className="rounded-xl bg-dark-800/50 p-4 text-center">
                            <div className="relative mx-auto h-16 w-16">
                              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 60 60">
                                <circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                                <circle
                                  cx="30" cy="30" r="25" fill="none" strokeWidth="4"
                                  strokeDasharray={`${(cat.score || 0) * 1.57} 157`}
                                  className={`${cat.score && cat.score >= 80 ? "text-green-400" : cat.score && cat.score >= 60 ? "text-yellow-400" : "text-red-400"}`}
                                  stroke="currentColor"
                                />
                              </svg>
                              <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${cat.score && cat.score >= 80 ? "text-green-400" : cat.score && cat.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                                {cat.score !== null ? cat.score : "N/A"}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-400">{cat.name}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-6 rounded-xl bg-dark-800/50 p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{reputation.avgScore}</p>
                          <p className="text-xs text-gray-500">Score global</p>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="text-center">
                          <p className="text-2xl font-bold">{reputation.totalReviews}</p>
                          <p className="text-xs text-gray-500">Avis exploités</p>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="text-center">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-green-400" />
                            <span className="text-sm font-medium text-green-400">{reputation.volume.positive}+</span>
                            <span className="text-sm text-gray-500">/</span>
                            <span className="text-sm font-medium text-red-400">{reputation.volume.negative}-</span>
                          </div>
                          <p className="text-xs text-gray-500">Répartition</p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-dark-800/50 p-3 flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <p className="text-xs text-gray-500">
                          Fenêtre d&apos;observation : {reputation.windowMonths} mois &middot; Dernière MAJ : {reputation.lastUpdated}
                        </p>
                      </div>
                    </div>
                  )}

                  <h3 className="font-semibold mb-4 mt-6">Avis utilisateurs</h3>
                  <div className="space-y-3">
                    {reputation?.excerpts.map((review, i) => (
                      <div key={i} className="rounded-xl bg-dark-800/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {String.fromCharCode(65 + (i % 26))}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Utilisateur anonyme</p>
                              <p className="text-xs text-gray-500">Avis collecté automatiquement</p>
                            </div>
                          </div>
                          <span className={`rounded-lg px-2 py-1 text-xs font-bold ${review.score >= 8 ? "bg-green-500/20 text-green-400" : review.score >= 6 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                            {review.score}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{review.text}</p>
                        <div className="mt-2">
                          {review.sentiment === "positive" ? (
                            <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="h-3 w-3" /> Avis positif</span>
                          ) : review.sentiment === "negative" ? (
                            <span className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle className="h-3 w-3" /> Avis négatif</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400"><MessageSquare className="h-3 w-3" /> Avis mitigé</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "offers" && (
                <div className="glass-card p-6">
                  <h2 className="mb-6 text-lg font-bold">Offres & Financement</h2>

                  <div className="mb-8">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Calculateur de financement
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {[
                        { months: 24, rate: 3.5 },
                        { months: 36, rate: 4.2 },
                        { months: 48, rate: 4.9 },
                      ].map(({ months, rate }) => {
                        const monthly = Math.round((car.price * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -months)));
                        return (
                          <div key={months} className="rounded-xl bg-dark-800/50 p-4">
                            <p className="text-sm text-gray-500">{months} mois, TAEG {rate}%</p>
                            <p className="mt-1 text-xl font-bold text-primary">{monthly.toLocaleString("fr-FR")} DH/mois</p>
                            <p className="text-xs text-gray-500 mt-1">Coût total : {(monthly * months).toLocaleString("fr-FR")} DH</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                      <Shield className="h-4 w-4 text-primary" />
                      Garantie
                    </h3>
                    <div className="rounded-xl bg-dark-800/50 p-4">
                      <div className="flex items-center gap-3">
                        <BadgeCheck className="h-8 w-8 text-green-400" />
                        <div>
                          <p className="font-semibold">Garantie constructeur</p>
                          <p className="text-sm text-gray-400">
                            {2026 - car.year <= 1 ? "Garantie active, encore sous couverture constructeur" : 2026 - car.year <= 3 ? "Garantie expirée, extension possible via nos partenaires" : "Pas de garantie constructeur, garantie étendue disponible"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                      <MapPin className="h-4 w-4 text-primary" />
                      Contacter le vendeur
                    </h3>
                    <div className="flex gap-3">
                      <button onClick={() => setContactModal(true)} className="btn-primary flex items-center gap-2">
                        <Send className="h-4 w-4" /> Contacter
                      </button>
                      <button onClick={() => setPhotoModal(true)} className="btn-secondary flex items-center gap-2">
                        <Camera className="h-4 w-4" /> Demander des photos
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 lg:w-80">
            <div className="sticky top-24 space-y-4">
              <div className="glass-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">Score IA</h3>
                  <span className={`rounded-lg px-2 py-1 text-xs font-bold ${car.score >= 85 ? "bg-green-500/20 text-green-400" : car.score >= 70 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                    {car.score}/100
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Année</span><span>{car.year}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Kilométrage</span><span>{car.km.toLocaleString()} km</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Carburant</span><span>{car.fuel}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Ville</span><span>{car.city}</span></div>
                </div>

                {reputation && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Réputation</span>
                      {hasEnoughReviews ? (
                        <span className={`text-sm font-bold ${reputation.avgScore && reputation.avgScore >= 80 ? "text-green-400" : reputation.avgScore && reputation.avgScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                          {reputation.avgScore}/100
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400">En collecte ({reputation.totalReviews}/30)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => setFav(!fav)} className="w-full rounded-xl border border-white/10 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 flex items-center justify-center gap-2">
                <Heart className={`h-4 w-4 ${fav ? "fill-red-400 text-red-400" : ""}`} />
                {fav ? "Retirer des favoris" : "Ajouter aux favoris"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={contactModal} onClose={() => setContactModal(false)} title="Contacter le vendeur">
        <div className="space-y-4">
          <input type="text" placeholder="Votre nom" className="input-field text-sm" />
          <input type="email" placeholder="Votre email" className="input-field text-sm" />
          <textarea placeholder="Votre message..." className="input-field text-sm h-24 resize-none" defaultValue={`Bonjour, je suis intéressé par le ${car.title} (${car.year}) à ${car.priceFormatted}. Est-il encore disponible ?`} />
          <button onClick={() => { setContactModal(false); showToast("Message envoyé avec succès !", "success"); }} className="btn-primary w-full flex items-center justify-center gap-2">
            <Send className="h-4 w-4" /> Envoyer
          </button>
        </div>
      </Modal>

      <Modal open={photoModal} onClose={() => setPhotoModal(false)} title="Demander des photos">
        <div className="space-y-4">
          <input type="text" placeholder="Votre nom" className="input-field text-sm" />
          <input type="email" placeholder="Votre email" className="input-field text-sm" />
          <textarea placeholder="Décrivez les angles souhaités..." className="input-field text-sm h-24 resize-none" defaultValue={`Merci de m'envoyer des photos du ${car.title} : intérieur, extérieur, état des pneus, moteur.`} />
          <button onClick={() => { setPhotoModal(false); showToast("Demande envoyée !", "success"); }} className="btn-primary w-full flex items-center justify-center gap-2">
            <Camera className="h-4 w-4" /> Envoyer la demande
          </button>
        </div>
      </Modal>
    </div>
  );
}
