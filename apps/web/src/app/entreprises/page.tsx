"use client";

import Link from "next/link";
import { Star, Shield, BarChart3, Zap, TrendingUp, Users, MapPin, Globe, Code, Key, Database, Building2, Briefcase, Target, ArrowRight, Lock, Activity, DollarSign, Clock, Package, Truck, Wrench, Settings, Bell, Eye, FileText, CheckCircle2, ChevronRight, Cpu, Headphones, Award } from "lucide-react";

const B2B_FEATURES = [
  {
    icon: BarChart3,
    title: "Intelligence Marché",
    description: "Prix moyens, tendances par marque, analyse de l'offre et de la demande au Maroc. Données en temps réel.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Target,
    title: "Génération de Leads",
    description: "Capturez l'intérêt des acheteurs, matchez avec votre inventaire, suivez les conversions.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Code,
    title: "API & Intégration",
    description: "API RESTful documentée, webhooks, intégration avec votre site, CRM ou ERP en quelques lignes.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Globe,
    title: "White-Label",
    description: "Intégrez la recherche Thiqti sur votre propre site avec votre branding. Widget embed prêt à l'emploi.",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
  {
    icon: Truck,
    title: "Gestion de Flotte",
    description: "Suivez vos véhicules, coûts d'entretien, planning de remplacement et dépréciation.",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
  },
  {
    icon: Shield,
    title: "Score de Réputation",
    description: "Score IA sur 100 pour chaque véhicule. Histoire, état mécanique, avis vérifiés.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
  },
];

const PRICING_PLANS = [
  {
    name: "Starter",
    price: "490",
    period: "/mois",
    description: "Pour les petits concessionnaires et revendeurs",
    features: [
      "Accès aux données marché (lecture)",
      "50 recherches API / jour",
      "Dashboard de base",
      "Support email",
      "1 utilisateur",
    ],
    cta: "Commencer",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "1 490",
    period: "/mois",
    description: "Pour les concessionnaires et flottes en croissance",
    features: [
      "Intelligence marché complète",
      "500 recherches API / jour",
      "Génération de leads avancée",
      "White-label widget",
      "Gestion de flotte",
      "Intégration CRM",
      "5 utilisateurs",
      "Support prioritaire",
    ],
    cta: "Demander une démo",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sur mesure",
    period: "",
    description: "Pour les grands groupes et banques",
    features: [
      "API illimitée",
      "Données temps réel dédiées",
      "Intégration ERP/Banque complète",
      "White-label multi-tenant",
      "Score de risque crédit IA",
      "Analyses prédictives",
      "Utilisateurs illimités",
      "Support dédié 24/7",
      "SLA 99.9%",
    ],
    cta: "Contacter les ventes",
    highlighted: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Auto Alliance Maroc",
    city: "Casablanca",
    role: "Concessionnaire multi-marques",
    text: "Grâce à Thiqti, nous avons augmenté nos ventes de 35% en 3 mois. L'intelligence marché nous permet de fixer les bons prix.",
    metric: "+35% ventes",
  },
  {
    name: "Prestige Automobile",
    city: "Rabat",
    role: "Concessionnaire premium",
    text: "Le score de réputation nous aide à vendre plus vite. Les acheteurs font confiance aux données IA.",
    metric: "-40% temps de vente",
  },
  {
    name: "Sahal Auto",
    city: "Marrakech",
    role: "Revendeur indépendant",
    text: "L'API nous permet d'alimenter notre site automatiquement. Plus besoin de mettre à jour les annonces manuellement.",
    metric: "100% automatisé",
  },
];

const USE_CASES = [
  { icon: Building2, label: "Concessionnaires", description: "Gérez votre inventaire, attirez des acheteurs qualifiés" },
  { icon: Truck, label: "Flottes d'entreprise", description: "Optimisez vos coûts, planifiez les remplacements" },
  { icon: Briefcase, label: "Banques & Finance", description: "Évaluez les véhicules pour les prêts auto" },
  { icon: Shield, label: "Assureurs", description: "Données de marché pour les cotisations" },
];

const INTEGRATION_LOGOS = ["Auto24.ma", "Avito.ma", "Moteur.ma", "Google"];

export default function EntreprisesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Hero B2B */}
      <section className="relative px-6 pt-24 pb-16">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-400">
            <Building2 className="h-4 w-4" />
            Plateforme B2B pour l&apos;automobile au Maroc
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Vendez plus. <span className="gradient-text">Décidez mieux.</span>
          </h1>
          <p className="mb-10 text-lg text-gray-400 md:text-xl">
            Thiqti offre aux concessionnaires, flottes et banques une intelligence marché en temps réel,
            des leads qualifiés et une API puissante pour transformer votre activité automobile.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/entreprises/dashboard" className="btn-primary flex items-center gap-2">
              <Eye className="h-4 w-4" /> Voir le dashboard démo
            </Link>
            <Link href="/entreprises/api" className="btn-secondary flex items-center gap-2">
              <Code className="h-4 w-4" /> Documentation API
            </Link>
          </div>
        </div>
      </section>

      {/* Stats B2B */}
      <section className="relative px-6 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { value: "2 500+", label: "Véhicules analysés/jour", icon: Activity },
            { value: "150+", label: "Entreprises clientes", icon: Building2 },
            { value: "99.9%", label: "Uptime API", icon: Shield },
            { value: "< 200ms", label: "Temps de réponse", icon: Clock },
          ].map((s) => (
            <div key={s.label} className="glass-card p-5 text-center">
              <s.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Conçu pour <span className="gradient-text">votre métier</span></h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-gray-400">
            Que vous soyez concessionnaire, gestionnaire de flotte, banquier ou assureur, Thiqti s&apos;adapte à vos besoins.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((uc) => (
              <div key={uc.label} className="glass-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <uc.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 font-bold">{uc.label}</h3>
                <p className="text-sm text-gray-400">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Tout ce dont vous avez besoin</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-gray-400">
            Une plateforme complète pour dominer le marché automobile marocain.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {B2B_FEATURES.map((f) => (
              <div key={f.title} className="glass-card p-8">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${f.bgColor}`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="mb-2 text-xl font-bold">{f.title}</h3>
                <p className="text-gray-400">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Sources de données</h2>
          <p className="mb-10 text-gray-400">Notre IA agrège les meilleures sources du marché marocain.</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {INTEGRATION_LOGOS.map((name) => (
              <div key={name} className="glass-card flex items-center gap-3 px-6 py-4">
                <Globe className="h-5 w-5 text-primary" />
                <span className="font-semibold">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold">Ils nous font confiance</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm text-gray-300">&quot;{t.text}&quot;</p>
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role} &middot; {t.city}</p>
                  </div>
                  <span className="rounded-lg bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">{t.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Tarification</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-gray-400">
            Choisissez le plan adapté à votre activité. Essai gratuit de 14 jours.
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`glass-card p-8 ${
                  plan.highlighted ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    <Award className="h-3 w-3" /> Le plus populaire
                  </div>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-400">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className="text-gray-400">DH{plan.period}</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`mt-8 w-full ${plan.highlighted ? "btn-primary" : "btn-secondary"}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="glass-card p-12 text-center" style={{ background: "linear-gradient(135deg, rgba(0,102,255,0.15) 0%, rgba(0,212,255,0.05) 100%)" }}>
            <Cpu className="mx-auto mb-6 h-12 w-12 text-primary" />
            <h2 className="mb-4 text-3xl font-bold">Prêt à transformer votre activité ?</h2>
            <p className="mx-auto mb-8 max-w-xl text-gray-400">
              Rejoignez 150+ entreprises marocaines qui utilisent Thiqti pour vendre plus vite et mieux.
              Essai gratuit de 14 jours, sans engagement.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/entreprises/dashboard" className="btn-primary flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5" /> Voir le dashboard démo
              </Link>
              <a href="mailto:contact@thiqti.ma" className="btn-secondary flex items-center gap-2 text-lg">
                <Headphones className="h-5 w-5" /> Parler à un expert
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">
          <p>&copy; 2026 Thiqti. Tous droits réservés. Plateforme B2B pour l&apos;automobile au Maroc.</p>
        </div>
      </footer>
    </div>
  );
}
