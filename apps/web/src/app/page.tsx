import { Search, Star, Shield, BarChart3, ChevronRight, Zap, TrendingUp, Users } from "lucide-react";

const TOP_BRANDS = [
  { name: "Dacia", count: 1240, logo: "D" },
  { name: "Renault", count: 980, logo: "R" },
  { name: "Toyota", count: 720, logo: "T" },
  { name: "Hyundai", count: 650, logo: "H" },
  { name: "Kia", count: 580, logo: "K" },
  { name: "Peugeot", count: 540, logo: "P" },
];

const CATEGORIES = [
  { name: "SUV / Crossover", icon: "🚙", count: 3200 },
  { name: "Berline", icon: "🚗", count: 2800 },
  { name: "Citadine", icon: "🏎️", count: 2100 },
  { name: "Utilitaire", icon: "🚐", count: 900 },
];

const STATS = [
  { label: "Véhicules listés", value: "12 500+", icon: TrendingUp },
  { label: "Utilisateurs actifs", value: "45 000+", icon: Users },
  { label: "Évaluations IA", value: "8 200+", icon: BarChart3 },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="relative px-6 pt-24 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            Alimenté par l&apos;intelligence artificielle
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Trouvez votre{" "}
            <span className="gradient-text">voiture idéale</span>
            <br />
            au Maroc
          </h1>
          <p className="mb-10 text-lg text-gray-400 md:text-xl">
            Recherchez, comparez et évaluez les voitures d&apos;occasion avec
            une précision inégalée. Reputation score, analyse IA, tout est là.
          </p>

          {/* Search */}
          <div className="glass mx-auto max-w-2xl p-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Marque, modèle, ville..."
                  className="input-field pl-10"
                />
              </div>
              <button className="btn-primary flex items-center gap-2">
                <Search className="h-4 w-4" />
                Rechercher
              </button>
            </div>
          </div>

          {/* Chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="chip">Dacia Logan</span>
            <span className="chip">Renault Clio</span>
            <span className="chip">Toyota Corolla</span>
            <span className="chip">Hyundai Tucson</span>
            <span className="chip">Kia Sportage</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative px-6 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="glass-card flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Brands */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Marques populaires</h2>
              <p className="mt-2 text-gray-400">Les plus recherchées au Maroc</p>
            </div>
            <a href="/results" className="btn-secondary flex items-center gap-1 text-sm">
              Voir tout <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {TOP_BRANDS.map((brand) => (
              <a
                key={brand.name}
                href={`/results?brand=${brand.name}`}
                className="glass-card group flex flex-col items-center p-6 text-center"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 text-lg font-bold text-primary transition group-hover:scale-110">
                  {brand.logo}
                </div>
                <p className="font-semibold">{brand.name}</p>
                <p className="text-xs text-gray-500">{brand.count} annonces</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-3xl font-bold">Catégories</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.name}
                href={`/results?category=${cat.name}`}
                className="glass-card flex items-center gap-4 p-6"
              >
                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-sm text-gray-500">{cat.count} annonces</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold">
            Pourquoi <span className="gradient-text">Thiqti</span> ?
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="glass-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Reputation Score</h3>
              <p className="text-gray-400">
                Score IA sur 100 basé sur l&apos;historique, l&apos;état
                mécanique et les avis. Achetez en confiance.
              </p>
            </div>
            <div className="glass-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Vérification IA</h3>
              <p className="text-gray-400">
                Notre IA analyse chaque annonce pour détecter les incohérences
                et les signaux d&apos;alerte.
              </p>
            </div>
            <div className="glass-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
                <Star className="h-8 w-8 text-warning" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Comparaison Smart</h3>
              <p className="text-gray-400">
                Comparez côte à côte les véhicules avec des métriques
                normalisées et des recommandations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-20">
        <div className="glass mx-auto max-w-4xl rounded-3xl p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Prêt à trouver votre voiture ?</h2>
          <p className="mb-8 text-gray-400">
            Rejoignez des milliers d&apos;acheteurs intelligents au Maroc.
          </p>
          <a href="/results" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-lg">
            Commencer la recherche
            <ChevronRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">
          <p>&copy; 2026 Thiqti. Tous droits réservés.</p>
          <p className="mt-1">Propulsé par l&apos;intelligence artificielle</p>
        </div>
      </footer>
    </div>
  );
}
