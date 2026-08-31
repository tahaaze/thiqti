"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Fuel, Gauge, Calendar, ChevronLeft, Share2, CheckCircle2, MessageSquare, AlertTriangle, Clock, TrendingUp, TrendingDown, BadgeCheck, Info, Globe, ExternalLink, Facebook, Instagram, Newspaper, Store, Eye, Loader2 } from "lucide-react";
import { ZelligeStar, ThiqtiShield, FavHeart } from "@/components/icons";
import CarImage from "@/components/CarImage";
import SafetyBadge, { safetyLabelOf } from "@/components/SafetyBadge";
import SellerContact from "@/components/SellerContact";
import { useToast } from "@/components/Toast";
import { saveFavorite, removeFavorite } from "@/lib/favorites";
import { getVehicleBackUrl, clearVehicleBackUrl } from "@/lib/navigation";
import type { LLMReputationResult } from "@/lib/reputation/types";

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
  transmission?: string;
  image: string;
  score: number;
  source: string;
  url: string;
  inventoryType?: "new" | "used";
  bodyType?: string;
  photos?: string[];
  safety?: { stars: number; ratingYear?: number; source?: string; className?: string } | null;
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
    reviews?: number;
    rating5?: number;
    sellerSince?: string;
    label?: string;
  };
}

interface ReputationData {
  modelKey: string;
  dataAvailable: boolean;
  totalReviews: number;
  avgScore: number | null;
  windowMonths: number;
  lastUpdated: string;
  positiveTags: string[];
  negativeTags: string[];
  categories: { name: string; score: number | null }[];
  excerpts: { text: string; sentiment: "positive" | "negative" | "neutral"; score: number }[];
  volume: { total: number; positive: number; negative: number; neutral: number };
  reliability: "elevee" | "moyenne" | "faible";
  reliabilityLabel: string;
  maroc: MarocReputationData | null;
}

interface MarocSourceData {
  label: string;
  url: string;
  note?: string;
  verifiedAt?: string;
}

interface MarocSocialData {
  network: string;
  label: string;
  url: string;
  followers?: number;
  verifiedAt?: string;
}

interface MarocTestData {
  model: string;
  title: string;
  url: string;
  verdict?: string;
  verifiedAt?: string;
}

interface MarocBrandData {
  make: string;
  distributor?: string;
  officialSite?: MarocSourceData | null;
  resellers?: MarocSourceData | null;
  socials: MarocSocialData[];
  tests: MarocTestData[];
  verifiedAt: string;
}

interface MarocReputationData {
  brand: MarocBrandData | null;
  tests: MarocTestData[];
}

const MIN_REVIEWS = 30;

const RELIABILITY_COLORS = {
  elevee: { border: "border-green-500/30", bg: "bg-green-500/10", text: "text-green-600" },
  moyenne: { border: "border-yellow-500/30", bg: "bg-yellow-500/10", text: "text-yellow-600" },
  faible: { border: "border-red-500/30", bg: "bg-red-500/10", text: "text-red-600" },
};

export default function VehiclePage({ params }: { params: Promise<{ slug: string }> }) {
  const [car, setCar] = useState<CarListing | null>(null);
  const [activeTab, setActiveTab] = useState<"specs" | "reputation" | "offers">("specs");
  const [fav, setFav] = useState(false);
  const [error, setError] = useState(false);
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [scrapedRep, setScrapedRep] = useState<LLMReputationResult | null>(null);
  const [_loadingRep, setLoadingRep] = useState(false);
  const [loadingScrape, setLoadingScrape] = useState(false);
  const [mainImg, setMainImg] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewScore, _setReviewScore] = useState(8);
  const [_reviewSubmitting, setReviewSubmitting] = useState(false);
  const [_reviewError, setReviewError] = useState<string | null>(null);
  const { showToast } = useToast();
  const favLoadedRef = useRef(false);
  const router = useRouter();

  const goBack = () => {
    const target = getVehicleBackUrl();
    if (target) {
      clearVehicleBackUrl();
      router.push(target);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/results");
    }
  };

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/vehicles/${encodeURIComponent(slug)}`)
        .then((r) => {
          if (!r.ok) throw new Error("Erreur réseau");
          return r.json();
        })
        .then((data) => {
          if (data.error) {
            setError(true);
          } else {
            setCar(data);
            setMainImg(data.image);
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
    // Fetch la réputation scrapée (web + réseaux sociaux)
    setLoadingScrape(true);
    fetch(`/api/reputation/scrape?make=${encodeURIComponent(car.make)}&model=${encodeURIComponent(car.model)}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setScrapedRep(data); })
      .catch(() => {})
      .finally(() => setLoadingScrape(false));
  }, [car]);

  useEffect(() => {
    if (!car || !favLoadedRef.current) return;
    if (fav) saveFavorite(car.id, car);
    else removeFavorite(car.id);
  }, [fav, car]);

  async function _submitReview(e: FormEvent) {
    e.preventDefault();
    if (!car || reviewText.trim().length < 5) {
      setReviewError("Merci d'écrire un avis d'au moins 5 caractères.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/reputation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: car.make,
          model: car.model,
          year: car.year,
          fuel: car.fuel,
          bodyType: car.bodyType,
          transmission: car.transmission,
          text: reviewText.trim(),
          score: reviewScore,
          sentiment: reviewScore >= 7 ? "positive" : reviewScore <= 4 ? "negative" : "neutral",
        }),
      });
      if (!res.ok) throw new Error("Envoi impossible");
      const data = await res.json();
      setReputation(data);
      setReviewText("");
      showToast("Merci, votre avis a été enregistré !", "success");
    } catch {
      setReviewError("Impossible d'enregistrer l'avis. Réessayez plus tard.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <p className="text-muted">Véhicule introuvable</p>
        <Link href="/results" className="btn-primary">Voir tous les résultats</Link>
      </div>
    );

  if (!car)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Chargement...</div>
      </div>
    );

  const _hasEnoughReviews = reputation && reputation.dataAvailable === true;
  const hasScrapedRep = scrapedRep && scrapedRep.score > 0;

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <button onClick={goBack} className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> Retour aux résultats
        </button>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <div className="glass-card overflow-hidden">
              <div className="relative h-72">
                <CarImage src={mainImg || car.image} sources={car.photos} alt={car.title} make={car.make} model={car.model} bodyType={car.bodyType} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">{car.source}</span>
                  {car.inventoryType && (
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold backdrop-blur ${car.inventoryType === "new" ? "badge-new" : "badge-used"}`}>
                      {car.inventoryType === "new" ? "Neuf" : "Occasion"}
                    </span>
                  )}
                </div>
                {car.reputation?.verified && (
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-black/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary backdrop-blur">
                      <ThiqtiShield className="h-3.5 w-3.5" />
                      Annonce vérifiée
                    </span>
                  </div>
                )}
              </div>
              {car.photos && car.photos.length > 1 && (
                <div className="flex gap-2 border-t border-line p-3">
                  {car.photos.slice(0, 5).map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImg(photo)}
                      className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition ${photo === mainImg ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"}`}
                    >
                      <CarImage src={photo} sources={car.photos} alt={`${car.title} ${i + 1}`} make={car.make} model={car.model} bodyType={car.bodyType} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">{car.title}</h1>
                    <p className="text-muted">{car.year} &middot; {car.km.toLocaleString()} km &middot; {car.fuel}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setFav(!fav)} className="border border-line p-2 text-muted hover:border-red-500 hover:text-red-600"><FavHeart className={`h-5 w-5 ${fav ? "fill-red-400 text-red-600" : ""}`} /></button>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("Lien copié !", "success"); }} className="border border-line p-2 text-muted hover:border-primary hover:text-primary"><Share2 className="h-5 w-5" /></button>
                  </div>
                </div>
                <p className="font-display mt-4 text-3xl font-bold text-primary">{car.priceFormatted}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-1 border border-line bg-canvas p-1">
              {(["specs", "reputation", "offers"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition ${activeTab === tab ? "bg-ink text-canvas" : "text-muted hover:text-ink"}`}>
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
                      <div key={s.label} className="rounded-xl bg-line/60 p-4">
                        <s.icon className="mb-2 h-5 w-5 text-primary" />
                        <p className="text-xs text-muted">{s.label}</p>
                        <p className="font-semibold">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl bg-line/60 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-muted">Sécurité au crash test</p>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{car.safety?.className || ""}</span>
                    </div>
                    <SafetyBadge safety={car.safety} full size={16} />
                    <p className="mt-2 text-xs text-muted">{safetyLabelOf(car.safety)}</p>
                  </div>
                </div>
              )}

              {activeTab === "reputation" && (
                <div className="glass-card p-6">
                  {/* Réputation réelle de l'annonce (données lues sur la source) */}
                  <div className="border border-line bg-line/60 p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
                      <ThiqtiShield className="h-5 w-5 text-primary" />
                      Réputation réelle de l&apos;annonce
                    </h2>
                    <p className="mb-3 text-xs text-muted">
                      Informations vérifiées directement sur {car.source} pour cette annonce précise.
                    </p>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {car.reputation?.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600">
                          <ThiqtiShield className="h-3.5 w-3.5" />
                          {car.reputation.label || "Annonce vérifiée"}
                        </span>
                      )}
                      {car.reputation?.trustBadge && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Badge de confiance
                        </span>
                      )}
                      {typeof car.reputation?.rating5 === "number" &&
                        car.reputation.rating5 > 0 &&
                        (car.reputation.reviews ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
                            <ZelligeStar className="h-3.5 w-3.5" />
                            {car.reputation.rating5}/5 · {car.reputation.reviews} avis
                          </span>
                        )}
                      {typeof car.reputation?.views === "number" && car.reputation.views > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/10 px-2.5 py-1 text-xs text-muted">
                          <Eye className="h-3.5 w-3.5" />
                          {car.reputation.views.toLocaleString("fr-FR")} vues
                        </span>
                      )}
                    </div>
                    <SellerContact contact={car.contact} reputation={car.reputation} />
                  </div>

                  <div className="mt-6 border-t border-line pt-6">
                    <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
                      <ThiqtiShield className="h-5 w-5 text-primary" />
                      Réputation réelle du modèle
                    </h2>

                  {loadingScrape && !scrapedRep ? (
                    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-ink">Analyse en cours...</p>
                        <p className="text-xs text-muted">Collecte d&apos;avis depuis le web et les réseaux sociaux.</p>
                      </div>
                    </div>
                  ) : !hasScrapedRep ? (
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                      <p className="mb-2 text-sm text-yellow-700">Pas encore de données pour ce modèle.</p>
                      <button
                        onClick={() => {
                          if (!car) return;
                          setLoadingScrape(true);
                          fetch("/api/reputation/scrape", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ make: car.make, model: car.model }),
                          })
                            .then((r) => r.json())
                            .then((data) => { if (!data.error) setScrapedRep(data); })
                            .catch((e) => console.error("Scrape error:", e))
                            .finally(() => setLoadingScrape(false));
                        }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Lancer l&apos;analyse
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Score global + fiabilité */}
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6d5dfc]/15 to-[#22a9f0]/15">
                          <span className="text-2xl font-bold text-primary">{scrapedRep!.score}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ink">Score / 100</p>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              scrapedRep!.reliability === "elevee" ? "bg-green-100 text-green-700" :
                              scrapedRep!.reliability === "moyenne" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {scrapedRep!.reliability === "elevee" ? "Fiable" :
                               scrapedRep!.reliability === "moyenne" ? "Moyen" : "À vérifier"}
                            </span>
                            {scrapedRep!.reviewCount > 0 && (
                              <span className="text-[10px] text-muted">{scrapedRep!.reviewCount} avis analysés</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sentiment */}
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-sm font-bold text-green-600">{scrapedRep!.sentiment.positive}%</span>
                          <span className="text-[10px] text-muted">Positif</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                          <span className="text-sm font-bold text-red-600">{scrapedRep!.sentiment.negative}%</span>
                          <span className="text-[10px] text-muted">Négatif</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-500">{scrapedRep!.sentiment.neutral}%</span>
                          <span className="text-[10px] text-muted">Neutre</span>
                        </div>
                      </div>

                      {/* Catégories */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {[
                          { key: "fiabilite", label: "Fiabilité" },
                          { key: "confort", label: "Confort" },
                          { key: "cout", label: "Coût" },
                          { key: "securite", label: "Sécurité" },
                          { key: "performance", label: "Performance" },
                        ].map(({ key, label }) => {
                          const cat = (scrapedRep!.categories as Record<string, { score: number; label: string }>)[key];
                          return (
                            <div key={key} className="flex flex-col items-center rounded-xl bg-line/40 p-2">
                              <span className="text-sm font-bold text-ink">{cat.score}</span>
                              <span className="text-[9px] text-muted">{label}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pros / Cons */}
                      {(scrapedRep!.topPros.length > 0 || scrapedRep!.topCons.length > 0) && (
                        <div className="flex flex-wrap gap-4">
                          {scrapedRep!.topPros.length > 0 && (
                            <div>
                              <p className="mb-1 text-[10px] font-bold text-green-600">Points forts</p>
                              <div className="flex flex-wrap gap-1">
                                {scrapedRep!.topPros.map((p: string) => (
                                  <span key={p} className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">{p}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {scrapedRep!.topCons.length > 0 && (
                            <div>
                              <p className="mb-1 text-[10px] font-bold text-red-600">Points faibles</p>
                              <div className="flex flex-wrap gap-1">
                                {scrapedRep!.topCons.map((c: string) => (
                                  <span key={c} className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-semibold text-red-700">{c}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Résumé */}
                      {scrapedRep!.summary && (
                        <p className="rounded-xl bg-primary/5 p-3 text-xs text-muted">{scrapedRep!.summary}</p>
                      )}
                    </div>
                  )}
                  </div>

                  <div className="mt-6 border-t border-line pt-6">
                    <MarocReputationBlock maroc={reputation?.maroc ?? null} make={car.make} />
                  </div>
                </div>
              )}

              {activeTab === "offers" && (
                <div className="glass-card p-6">
                  <h2 className="mb-6 text-lg font-bold">Offres & Financement</h2>
                  <p className="text-sm text-muted">Contactez le concessionnaire pour les offres en cours.</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 lg:w-80">
            <div className="sticky top-24 space-y-4">
              <div className="glass-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">Score IA</h3>
                  <span className={`rounded-lg px-2 py-1 text-xs font-bold ${car.score >= 85 ? "bg-green-500/20 text-green-600" : car.score >= 70 ? "bg-yellow-500/20 text-yellow-600" : "bg-red-500/20 text-red-600"}`}>
                    {car.score}/100
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Année</span><span>{car.year}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Kilométrage</span><span>{car.km.toLocaleString()} km</span></div>
                  <div className="flex justify-between"><span className="text-muted">Carburant</span><span>{car.fuel}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Ville</span><span>{car.city}</span></div>
                </div>

                {reputation && (car.reputation?.verified || car.reputation?.trustBadge || typeof car.reputation?.rating5 === "number" || typeof car.reputation?.views === "number" || (reputation.maroc?.tests?.length ?? 0) > 0) && (
                  <div className="mt-4 border-t border-line pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Réputation</span>
                      {typeof car.reputation?.rating5 === "number" && car.reputation.rating5 > 0 && (car.reputation.reviews ?? 0) > 0 ? (
                        <span className="text-sm font-bold text-primary">{car.reputation.rating5}/5</span>
                      ) : car.reputation?.verified ? (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-green-600">
                          {car.reputation.label || "Annonce vérifiée"}
                        </span>
                      ) : car.reputation?.trustBadge ? (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Badge de confiance</span>
                      ) : (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          Essais réels {reputation.maroc?.tests.length ?? 0}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted">
                      {typeof car.reputation?.rating5 === "number" && car.reputation.rating5 > 0 && (car.reputation.reviews ?? 0) > 0 ? (
                        <>
                          <ZelligeStar className="h-3 w-3 text-amber-600" />
                          <span>{car.reputation.reviews} avis réels sur {car.source}</span>
                        </>
                      ) : car.reputation?.verified && typeof car.reputation.views === "number" && car.reputation.views > 0 ? (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>{car.reputation.views.toLocaleString("fr-FR")} vues réelles sur {car.source}</span>
                        </>
                      ) : (reputation.maroc?.tests?.length ?? 0) > 0 ? (
                        <>
                          <Newspaper className="h-3 w-3" />
                          <span>{reputation.maroc?.tests.length ?? 0} essai(s) Moteur.ma pour ce modèle</span>
                        </>
                      ) : (
                        <>
                          <Info className="h-3 w-3" />
                          <span>Annonce vérifiée sur {car.source}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => setFav(!fav)} className="w-full rounded-xl border border-line py-3 text-sm font-medium text-ink hover:bg-ink/5 flex items-center justify-center gap-2">
                <FavHeart className={`h-4 w-4 ${fav ? "fill-red-400 text-red-600" : ""}`} />
                {fav ? "Retirer des favoris" : "Ajouter aux favoris"}
              </button>

              {(car.contact && (car.contact.phoneHref || car.contact.whatsappHref || car.contact.url)) || (car.reputation && (car.reputation.verified || car.reputation.trustBadge || car.reputation.label)) ? (
                <div className="glass-card p-5 border-primary/30">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/30">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-display text-base font-bold text-ink">Contacter le vendeur</h3>
                  </div>
                  {car.reputation?.verified && (
                    <p className="mb-2 inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-green-600">
                      <ThiqtiShield className="h-3 w-3" />
                      {car.reputation.label || "Annonce vérifiée"}
                    </p>
                  )}
                  {car.contact?.name && (
                    <p className="mb-3 text-xs text-muted">Vendeur : <span className="text-ink">{car.contact.name}</span></p>
                  )}
                  {car.contact?.phone && (
                    <p className="mb-3 text-sm text-ink">Tél : <a href={car.contact.phoneHref} className="font-semibold text-primary hover:underline">{car.contact.phone}</a></p>
                  )}
                  <SellerContact contact={car.contact} reputation={car.reputation} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarocReputationBlock({ maroc, make }: { maroc: MarocReputationData | null; make: string }) {
  const brand = maroc?.brand ?? null;
  const tests = maroc?.tests ?? [];
  const socialIcon = (network: string) =>
    network === "instagram" ? <Instagram className="h-3.5 w-3.5" /> : <Facebook className="h-3.5 w-3.5" />;

  if (!brand) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4 text-primary" />
          Présence &amp; sources au Maroc
        </div>
        <div className="rounded-xl border border-line bg-line/60 p-4">
          <p className="text-xs text-muted">
            Aucune source officielle marocaine vérifiée pour <strong className="text-ink">{make}</strong>.
            Les liens officiels seront ajoutés dès qu&apos;ils seront confirmés.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4 text-primary" />
          Présence &amp; sources au Maroc
        </div>
        <span className="text-[10px] text-muted">Vérifié le {brand.verifiedAt || "—"}</span>
      </div>

      {brand.distributor && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2">
          <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-ink">
            Importateur officiel : <strong>{brand.distributor}</strong>
          </p>
        </div>
      )}

      <div className="space-y-2">
        {brand.officialSite && (
          <a href={brand.officialSite.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-line/60 px-3 py-2 text-xs text-ink transition hover:bg-line hover:text-ink">
            <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
            Site officiel · {brand.officialSite.label}
            <ExternalLink className="ml-auto h-3 w-3 text-muted" />
          </a>
        )}
        {brand.resellers && (
          <a href={brand.resellers.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-line/60 px-3 py-2 text-xs text-ink transition hover:bg-line hover:text-ink">
            <Store className="h-3.5 w-3.5 shrink-0 text-primary" />
            {brand.resellers.label}
            <ExternalLink className="ml-auto h-3 w-3 text-muted" />
          </a>
        )}
        {brand.socials.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-line/60 px-3 py-2 text-xs text-ink transition hover:bg-line hover:text-ink">
            {socialIcon(s.network)}
            {s.label}
            {typeof s.followers === "number" && (
              <span className="ml-1 text-muted">· {s.followers.toLocaleString("fr-FR")} abonnés</span>
            )}
            <ExternalLink className="ml-auto h-3 w-3 text-muted" />
          </a>
        ))}
      </div>

      {tests.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <Newspaper className="h-3.5 w-3.5" />
            Essais Moteur.ma pour ce modèle
          </div>
          <div className="space-y-2">
            {tests.map((t, i) => (
              <a key={i} href={t.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg bg-line/60 px-3 py-2 text-xs text-ink transition hover:bg-line hover:text-ink">
                <span className="flex items-center gap-2">
                  <Newspaper className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {t.title}
                  <ExternalLink className="ml-auto h-3 w-3 text-muted" />
                </span>
                {t.verdict && <span className="mt-1 block text-[11px] text-muted">{t.verdict}</span>}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
