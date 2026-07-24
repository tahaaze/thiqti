"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Code, Key, Database, Shield, Clock, Zap, Copy, CheckCircle2, Globe, Lock, Eye, ArrowRight, FileText, Download } from "lucide-react";
import { useToast } from "@/components/Toast";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/vehicles",
    description: "Rechercher des véhicules avec filtres avancés",
    params: [
      { name: "q", type: "string", required: false, description: "Recherche texte (marque, modèle, ville)" },
      { name: "brand", type: "string", required: false, description: "Filtrer par marque" },
      { name: "fuel", type: "string", required: false, description: "Type de carburant (diesel, petrol, hybrid, ev)" },
      { name: "city", type: "string", required: false, description: "Ville" },
      { name: "min_price", type: "number", required: false, description: "Prix minimum (DH)" },
      { name: "max_price", type: "number", required: false, description: "Prix maximum (DH)" },
      { name: "min_km", type: "number", required: false, description: "Kilométrage minimum" },
      { name: "max_km", type: "number", required: false, description: "Kilométrage maximum" },
      { name: "min_year", type: "number", required: false, description: "Année minimum" },
      { name: "max_year", type: "number", required: false, description: "Année maximum" },
      { name: "min_score", type: "number", required: false, description: "Score réputation minimum" },
      { name: "limit", type: "number", required: false, description: "Nombre de résultats (défaut: 20, max: 100)" },
      { name: "offset", type: "number", required: false, description: "Offset pour la pagination" },
    ],
    response: `{
  "results": [
    {
      "id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "title": "Toyota Corolla Hybrid 2023",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2023,
      "price": 275000,
      "priceFormatted": "275 000 DH",
      "km": 8000,
      "fuel": "Hybride",
      "city": "Casablanca",
      "image": "https://api.auto24.ma/uploads/...",
      "score": 95,
      "source": "Auto24.ma",
      "url": "https://auto24.ma/cars/toyota-corolla-hybrid"
    }
  ],
  "total": 142
}`,
  },
  {
    method: "GET",
    path: "/api/v1/vehicles/:id",
    description: "Obtenir les détails d'un véhicule spécifique",
    params: [
      { name: "id", type: "string", required: true, description: "ID du véhicule (MongoDB ObjectId)" },
    ],
    response: `{
  "id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "title": "Toyota Corolla Hybrid 2023",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2023,
  "price": 275000,
  "km": 8000,
  "fuel": "Hybride",
  "transmission": "Automatique",
  "hp": 140,
  "color": "Blanc",
  "city": "Casablanca",
  "engine": "1.8L Hybrid",
  "doors": 4,
  "seats": 5,
  "score": 95,
  "source": "Auto24.ma",
  "url": "https://auto24.ma/cars/toyota-corolla-hybrid"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/reputation/vehicle/:vehicleId",
    description: "Obtenir le score de réputation détaillé d'un véhicule",
    params: [
      { name: "vehicleId", type: "string", required: true, description: "ID du véhicule" },
    ],
    response: `{
  "overall": 95,
  "history": 92,
  "mechanical": 96,
  "reviews": 94,
  "price_value": 98,
  "analysis": "Véhicule en excellent état, faible kilométrage, historique vérifié"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/market/trends",
    description: "Données de tendances du marché (réservé aux plans Pro+)",
    params: [
      { name: "brand", type: "string", required: false, description: "Filtrer par marque" },
      { name: "period", type: "string", required: false, description: "Période (1m, 3m, 6m, 1y)" },
    ],
    response: `{
  "trends": [
    {
      "brand": "Toyota",
      "model": "Corolla",
      "avg_price": 275000,
      "change_pct": -1.5,
      "listings_count": 28,
      "demand": "high"
    }
  ],
  "generated_at": "2026-07-22T14:30:00Z"
}`,
  },
  {
    method: "POST",
    path: "/api/v1/webhooks",
    description: "Créer un webhook pour les alertes en temps réel",
    params: [
      { name: "url", type: "string", required: true, description: "URL du callback" },
      { name: "events", type: "string[]", required: true, description: "Événements à écouter (new_listing, price_change, score_update)" },
      { name: "filters", type: "object", required: false, description: "Filtres optionnels (brand, city, min_price, etc.)" },
    ],
    response: `{
  "webhook_id": "wh_abc123",
  "url": "https://your-app.com/webhook",
  "events": ["new_listing", "price_change"],
  "secret": "whsec_...",
  "created_at": "2026-07-22T14:30:00Z"
}`,
  },
];

const CODE_EXAMPLES = {
  curl: `curl -X GET "https://api.thiqti.ma/api/v1/vehicles?q=toyota&fuel=hybrid&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  javascript: `const response = await fetch(
  "https://api.thiqti.ma/api/v1/vehicles?q=toyota&fuel=hybrid&limit=10",
  {
    headers: {
      "Authorization": "Bearer YOUR_API_KEY",
      "Content-Type": "application/json"
    }
  }
);
const data = await response.json();
console.log(data.results); // Array of vehicles`,
  python: `import requests

response = requests.get(
    "https://api.thiqti.ma/api/v1/vehicles",
    params={"q": "toyota", "fuel": "hybrid", "limit": 10},
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)
data = response.json()
print(data["results"])`,
};

const RATE_LIMITS = [
  { plan: "Starter", requests: "50 /jour", burst: "10 /min" },
  { plan: "Professional", requests: "500 /jour", burst: "50 /min" },
  { plan: "Enterprise", requests: "Illimité", burst: "200 /min" },
];

export default function ApiDocPage() {
  const [activeEndpoint, setActiveEndpoint] = useState(0);
  const [codeLang, setCodeLang] = useState<"curl" | "javascript" | "python">("curl");
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[codeLang]);
    setCopied(true);
    showToast("Code copié !", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const METHOD_COLORS: Record<string, string> = {
    GET: "bg-green-500/10 text-green-400",
    POST: "bg-blue-500/10 text-blue-400",
    PUT: "bg-yellow-500/10 text-yellow-400",
    DELETE: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/entreprises" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
            <ChevronLeft className="h-4 w-4" /> Retour B2B
          </Link>
          <h1 className="text-3xl font-bold">Documentation API</h1>
          <p className="mt-1 text-gray-400">Intégrez les données automobiles du Maroc dans vos applications</p>
        </div>

        {/* Quick Start */}
        <div className="mb-8 glass-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-bold">Démarrage rapide</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { step: 1, icon: Key, title: "Obtenir une clé API", desc: "Créez un compte et générez votre clé API dans le dashboard." },
              { step: 2, icon: Code, title: "Faire votre première requête", desc: "Utilisez la clé pour interroger l'endpoint /vehicles." },
              { step: 3, icon: Globe, title: "Intégrer à votre应用", desc: "Ajoutez les données à votre site, CRM ou application mobile." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-gray-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Example */}
        <div className="mb-8 glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 p-4">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Exemple de requête</span>
            </div>
            <div className="flex items-center gap-2">
              {(["curl", "javascript", "python"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeLang(lang)}
                  className={`chip text-xs ${codeLang === lang ? "bg-primary/20 border-primary/40" : ""}`}
                >
                  {lang === "curl" ? "cURL" : lang === "javascript" ? "JavaScript" : "Python"}
                </button>
              ))}
              <button onClick={copyCode} className="ml-2 rounded-lg p-2 text-gray-400 hover:text-white">
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <pre className="overflow-x-auto p-6 text-sm text-gray-300" style={{ background: "rgba(0,0,0,0.3)" }}>
            <code>{CODE_EXAMPLES[codeLang]}</code>
          </pre>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Endpoint Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">Endpoints</h3>
            {ENDPOINTS.map((ep, i) => (
              <button
                key={i}
                onClick={() => setActiveEndpoint(i)}
                className={`w-full rounded-xl p-3 text-left transition ${
                  activeEndpoint === i ? "bg-primary/10 border border-primary/30" : "glass-card"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <span className="truncate text-xs font-mono">{ep.path}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Endpoint Detail */}
          <div className="lg:col-span-3">
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className={`rounded-lg px-3 py-1 text-sm font-bold ${METHOD_COLORS[ENDPOINTS[activeEndpoint].method]}`}>
                  {ENDPOINTS[activeEndpoint].method}
                </span>
                <code className="text-lg font-mono font-semibold">{ENDPOINTS[activeEndpoint].path}</code>
              </div>
              <p className="mb-6 text-gray-400">{ENDPOINTS[activeEndpoint].description}</p>

              {/* Parameters */}
              <div className="mb-6">
                <h4 className="mb-3 font-semibold">Paramètres</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="p-2 text-left text-xs text-gray-500">Nom</th>
                        <th className="p-2 text-left text-xs text-gray-500">Type</th>
                        <th className="p-2 text-left text-xs text-gray-500">Requis</th>
                        <th className="p-2 text-left text-xs text-gray-500">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ENDPOINTS[activeEndpoint].params.map((p) => (
                        <tr key={p.name} className="border-b border-white/5">
                          <td className="p-2 font-mono text-primary">{p.name}</td>
                          <td className="p-2 text-gray-400">{p.type}</td>
                          <td className="p-2">
                            {p.required ? (
                              <span className="text-xs text-red-400">Requis</span>
                            ) : (
                              <span className="text-xs text-gray-500">Optionnel</span>
                            )}
                          </td>
                          <td className="p-2 text-gray-300">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response */}
              <div>
                <h4 className="mb-3 font-semibold">Réponse</h4>
                <pre className="overflow-x-auto rounded-xl p-4 text-xs text-gray-300" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <code>{ENDPOINTS[activeEndpoint].response}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="mt-8 glass-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <h3 className="font-bold">Limites de débit</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {RATE_LIMITS.map((rl) => (
              <div key={rl.plan} className="rounded-xl bg-dark-800/50 p-4 text-center">
                <p className="font-semibold">{rl.plan}</p>
                <p className="mt-2 text-2xl font-bold text-primary">{rl.requests}</p>
                <p className="text-xs text-gray-400">Burst: {rl.burst}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Auth & Security */}
        <div className="mt-8 glass-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-400" />
            <h3 className="font-bold">Authentification & Sécurité</h3>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold text-sm">Authentification</h4>
              <p className="text-sm text-gray-400 mb-3">
                Toutes les requêtes API nécessitent un token Bearer dans le header Authorization.
              </p>
              <pre className="rounded-xl p-3 text-xs text-gray-300" style={{ background: "rgba(0,0,0,0.3)" }}>
                Authorization: Bearer thiqti_sk_live_abc123...
              </pre>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-sm">Sécurité</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-400" /> HTTPS obligatoire</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-400" /> Rate limiting par clé API</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-400" /> Webhooks signés (HMAC-SHA256)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-400" /> Logs d&apos;audit pour chaque requête</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 glass-card p-8 text-center">
          <h3 className="mb-2 text-xl font-bold">Prêt à intégrer l&apos;API ?</h3>
          <p className="mb-6 text-gray-400">Commencez avec 50 requêtes gratuites par jour. Pas de carte bancaire requise.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/entreprises/dashboard" className="btn-primary flex items-center gap-2">
              <Key className="h-4 w-4" /> Obtenir ma clé API
            </Link>
            <Link href="/entreprises/marche" className="btn-secondary flex items-center gap-2">
              <Eye className="h-4 w-4" /> Voir les données marché
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
