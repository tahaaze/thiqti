import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thiqti - Trouvez votre voiture idéale au Maroc",
  description:
    "Plateforme intelligente de recherche de voitures d'occasion au Maroc. Comparez, évaluez et achetez en toute confiance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-dark-900 text-white antialiased">
        <nav className="sticky top-0 z-50 glass border-b border-white/5">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-400 text-sm font-bold text-white">
                T
              </div>
              <span className="text-xl font-bold tracking-tight">Thiqti</span>
            </a>
            <div className="hidden items-center gap-8 md:flex">
              <a
                href="/results"
                className="text-sm text-gray-400 transition hover:text-white"
              >
                Rechercher
              </a>
              <a
                href="/compare"
                className="text-sm text-gray-400 transition hover:text-white"
              >
                Comparer
              </a>
              <a
                href="/favorites"
                className="text-sm text-gray-400 transition hover:text-white"
              >
                Favoris
              </a>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-secondary text-sm">Connexion</button>
              <button className="btn-primary text-sm">S&apos;inscrire</button>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
