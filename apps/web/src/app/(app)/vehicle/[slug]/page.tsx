"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Fuel, Gauge, Calendar, ChevronLeft, Share2, CheckCircle2, MessageSquare, AlertTriangle, Clock, TrendingUp, TrendingDown, BadgeCheck, Info, Globe, ExternalLink, Facebook, Instagram, Newspaper, Store, Eye } from "lucide-react";
import { ZelligeStar, ThiqtiShield, FavHeart } from "@/components/icons";
import CarImage from "@/components/CarImage";
import SafetyBadge, { safetyLabelOf } from "@/components/SafetyBadge";
import SellerContact from "@/components/SellerContact";
import { useToast } from "@/components/Toast";
import { saveFavorite, removeFavorite } from "@/lib/favorites";
import { getVehicleBackUrl, setVehicleBackUrl, clearVehicleBackUrl } from "@/lib/navigation";

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
  const [loadingRep, setLoadingRep] = useState(false);
  const [mainImg, setMainImg] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewScore, setReviewScore] = useState(8);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
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
      fetch("/api/search")
        .then((r) => {
          if (!r.ok) throw new Error("Erreur réseau");
          return r.json();
        })
        .then((data) => {
          const found = data.results.find((c: CarListing) => c.id === slug);
          if (found) {
            setCar(found);
            setMainImg(found.image);
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
    if (fav) saveFavorite(car.id, car);
    else removeFavorite(car.id);
  }, [fav, car]);

  async function submitReview(e: FormEvent) {
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

  const hasEnoughReviews = reputation && reputation.dataAvailable === true;

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
                      Avis des utilisateurs du site
                    </h2>
                    <p className="mb-4 text-xs text-muted">
                      Avis réellement déposés sur Thiqti par les acheteurs. Aucune note n&apos;est inventée :
                      le score n&apos;est publié qu&apos;à partir de {MIN_REVIEWS} avis réels.
                    </p>

                  {loadingRep ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-line/60" />)}
                    </div>
                  ) : !reputation ? (
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                      <p className="text-sm text-yellow-700">Données indisponibles pour ce modèle.</p>
                    </div>
                  ) : !hasEnoughReviews ? (
                    <ReputationInsufficient reputation={reputation} />
                  ) : (
                    <ReputationSummary reputation={reputation} />
                  )}

                  <div className="mt-6 border-t border-line pt-6">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Donner votre avis
                    </h3>
                    <form onSubmit={submitReview} className="space-y-3">
                      <div>
                        <p className="mb-2 text-xs text-muted">Votre note sur 10</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setReviewScore(n)}
                              className={`h-9 w-9 rounded-lg text-xs font-bold transition ${reviewScore === n ? "btn-gold" : "bg-line/60 text-muted hover:text-ink"}`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Votre expérience avec ce modèle (fiabilité, consommation, confort, points forts/faibles...)"
                        className="w-full rounded-xl bg-line/60 px-3 py-2.5 text-sm outline-none ring-1 ring-line focus:ring-primary/50"
                      />
                      {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={reviewSubmitting}
                          className="btn-gold rounded-xl px-4 py-2.5 text-sm"
                        >
                          {reviewSubmitting ? "Envoi en cours..." : "Publier mon avis"}
                        </button>
                        {reputation && (
                          <span className="text-[11px] text-muted">
                            Aujourd&apos;hui : {reputation.volume.total} avis collectés sur {MIN_REVIEWS}
                          </span>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="mt-6 border-t border-line pt-6">
                    <MarocReputationBlock maroc={reputation?.maroc ?? null} make={car.make} />
                  </div>
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

function ReputationInsufficient({ reputation }: { reputation: ReputationData }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-700">Données insuffisantes</p>
            <p className="text-xs text-yellow-600/70 mt-1">
              {reputation.totalReviews} avis collectés sur {MIN_REVIEWS} minimum requis. Le score sera publié dès {MIN_REVIEWS} avis exploitables. Ajoutez le vôtre ci-dessous !
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-line/60 p-4 text-center">
          <p className="text-2xl font-bold text-primary">{reputation.volume.total}</p>
          <p className="text-xs text-muted">Avis collectés</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted/10">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (reputation.volume.total / MIN_REVIEWS) * 100)}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted">{reputation.volume.total}/{MIN_REVIEWS}</p>
        </div>
        <div className="rounded-xl bg-line/60 p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-lg font-bold text-green-600">{reputation.volume.positive}</span>
          </div>
          <p className="text-xs text-muted">Positifs</p>
        </div>
        <div className="rounded-xl bg-line/60 p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-600" />
            <span className="text-lg font-bold text-red-600">{reputation.volume.negative}</span>
          </div>
          <p className="text-xs text-muted">Négatifs</p>
        </div>
      </div>

      <div className="rounded-xl bg-line/60 p-3 flex items-center gap-3">
        <Clock className="h-4 w-4 text-muted" />
        <p className="text-xs text-muted">
          Fenêtre d&apos;observation : {reputation.windowMonths} mois &middot; Dernière MAJ : {reputation.lastUpdated}
        </p>
      </div>
    </div>
  );
}

function ReputationSummary({ reputation }: { reputation: ReputationData }) {
  const relColors = RELIABILITY_COLORS[reputation.reliability];

  return (
    <div className="space-y-6">
      {/* Header: score + volume + window */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-extrabold text-primary">{reputation.avgScore}</p>
          <p className="text-xs text-muted">sur 10</p>
        </div>
        <div className="h-12 w-px bg-line" />
        <div>
          <p className="text-sm text-ink">Sur <strong>{reputation.totalReviews}</strong> avis</p>
          <p className="text-xs text-muted">des {reputation.windowMonths} derniers mois</p>
        </div>
        <div className="h-12 w-px bg-line" />
        <div className={`rounded-lg border ${relColors.border} ${relColors.bg} px-3 py-1.5`}>
          <div className="flex items-center gap-1.5">
            <BadgeCheck className={`h-4 w-4 ${relColors.text}`} />
            <span className={`text-xs font-medium ${relColors.text}`}>Fiabilité {reputation.reliabilityLabel}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600">Points forts</p>
          <div className="flex flex-wrap gap-2">
            {reputation.positiveTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3 w-3" />{tag}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-600">Points faibles</p>
          <div className="flex flex-wrap gap-2">
            {reputation.negativeTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700">
                <AlertTriangle className="h-3 w-3" />{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Category gauges */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {reputation.categories.map((cat) => (
          <div key={cat.name} className="rounded-xl bg-line/60 p-4 text-center">
            <div className="relative mx-auto h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/10" />
                <circle
                  cx="30" cy="30" r="25" fill="none" strokeWidth="4"
                  strokeDasharray={`${(cat.score || 0) * 15.7} 157`}
                  className={`${cat.score && cat.score >= 8 ? "text-green-600" : cat.score && cat.score >= 6 ? "text-yellow-600" : "text-red-600"}`}
                  stroke="currentColor"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${cat.score && cat.score >= 8 ? "text-green-600" : cat.score && cat.score >= 6 ? "text-yellow-600" : "text-red-600"}`}>
                {cat.score !== null ? cat.score : "N/A"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">{cat.name}</p>
          </div>
        ))}
      </div>

      {/* Volume breakdown */}
      <div className="flex items-center gap-4 rounded-xl bg-line/60 p-4">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">{reputation.volume.positive}</span>
          <span className="text-muted">positifs</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingDown className="h-4 w-4 text-red-600" />
          <span className="text-red-600 font-medium">{reputation.volume.negative}</span>
          <span className="text-muted">négatifs</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4 text-muted" />
          <span className="text-muted font-medium">{reputation.volume.neutral}</span>
          <span className="text-muted">neutres</span>
        </div>
      </div>

      {/* Window */}
      <div className="rounded-xl bg-line/60 p-3 flex items-center gap-3">
        <Clock className="h-4 w-4 text-muted" />
        <p className="text-xs text-muted">
          Fenêtre d&apos;observation : {reputation.windowMonths} mois &middot; Dernière MAJ : {reputation.lastUpdated}
        </p>
      </div>

      {/* Review excerpts */}
      <div>
        <h3 className="font-semibold mb-4">Extraits d&apos;avis</h3>
        <div className="space-y-3">
          {reputation.excerpts.map((review, i) => (
            <div key={i} className="rounded-xl bg-line/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {String.fromCharCode(65 + (i % 26))}
                  </div>
                  <p className="text-xs text-muted">Avis anonyme</p>
                </div>
                <span className={`rounded-lg px-2 py-1 text-xs font-bold ${review.score >= 8 ? "bg-green-500/20 text-green-600" : review.score >= 6 ? "bg-yellow-500/20 text-yellow-600" : "bg-red-500/20 text-red-600"}`}>
                  {review.score}/10
                </span>
              </div>
              <p className="text-sm text-ink">&laquo;{review.text}&raquo;</p>
              <div className="mt-2">
                {review.sentiment === "positive" ? (
                  <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3 w-3" /> Avis positif</span>
                ) : review.sentiment === "negative" ? (
                  <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3 w-3" /> Avis négatif</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted"><MessageSquare className="h-3 w-3" /> Avis mitigé</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
