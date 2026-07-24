"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ToastProvider, useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";
import "./globals.css";

interface AuthModalProps {
  mode: "login" | "signup" | null;
  onClose: () => void;
}

function AuthModal({ mode, onClose }: AuthModalProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setName("");
  }, [mode]);

  const handleSubmit = () => {
    if (!email || !password) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Le mot de passe doit faire au moins 6 caractères", "error");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem("thiqti_users") || "[]");
      if (mode === "signup") {
        const exists = users.find((u: { email: string }) => u.email === email);
        if (exists) {
          showToast("Un compte avec cet email existe déjà", "error");
          setLoading(false);
          return;
        }
        users.push({ email, password, name });
        localStorage.setItem("thiqti_users", JSON.stringify(users));
        localStorage.setItem("thiqti_session", JSON.stringify({ email, name }));
        showToast("Compte créé avec succès ! Bienvenue.", "success");
        onClose();
      } else {
        const match = users.find((u: { email: string; password: string }) => u.email === email && u.password === password);
        if (!match) {
          showToast("Email ou mot de passe incorrect", "error");
          setLoading(false);
          return;
        }
        localStorage.setItem("thiqti_session", JSON.stringify({ email, name: match.name || "" }));
        showToast(`Bienvenue ${match.name || ""} !`, "success");
        onClose();
      }
      setLoading(false);
    }, 600);
  };

  if (!mode) return null;

  return (
    <Modal open={mode !== null} onClose={onClose} title={mode === "login" ? "Connexion" : "Créer un compte"}>
      <p className="mb-6 text-sm text-gray-400">
        {mode === "login"
          ? "Connectez-vous pour accéder à vos favoris et gérer vos alertes."
          : "Créez un compte pour sauvegarder vos recherches et recevoir des alertes."}
      </p>
      <div className="space-y-4">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Votre nom"
            className="input-field text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          type="email"
          placeholder="Adresse email"
          className="input-field text-sm"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          className="input-field text-sm"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full text-center disabled:opacity-50"
        >
          {loading ? "Veuillez patienter..." : mode === "login" ? "Se connecter" : "S&apos;inscrire"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-gray-500">
        Données stockées localement, aucune donnée envoyée à un serveur.
      </p>
    </Modal>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);

  useEffect(() => {
    document.title = "Sleipnir - Trouvez votre voiture idéale au Maroc";
  }, []);

  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-dark-900 text-white antialiased">
        <ToastProvider>
          <nav className="sticky top-0 z-50 glass border-b border-white/5">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-400 text-sm font-bold text-white">
                  S
                </div>
                <span className="text-xl font-bold tracking-tight">Sleipnir</span>
              </Link>
              <div className="hidden items-center gap-8 md:flex">
                <Link href="/results" className="text-sm text-gray-400 transition hover:text-white">Rechercher</Link>
                <Link href="/compare" className="text-sm text-gray-400 transition hover:text-white">Comparer</Link>
                <Link href="/favorites" className="text-sm text-gray-400 transition hover:text-white">Favoris</Link>
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <button onClick={() => setAuthModal("login")} className="btn-secondary text-sm">Connexion</button>
                <button onClick={() => setAuthModal("signup")} className="btn-primary text-sm">S&apos;inscrire</button>
              </div>
              <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-gray-400 hover:text-white md:hidden">
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
            {menuOpen && (
              <div className="border-t border-white/5 px-6 py-4 md:hidden">
                <div className="flex flex-col gap-4">
                  <Link href="/results" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white">Rechercher</Link>
                  <Link href="/compare" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white">Comparer</Link>
                  <Link href="/favorites" onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white">Favoris</Link>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setMenuOpen(false); setAuthModal("login"); }} className="btn-secondary text-sm flex-1">Connexion</button>
                    <button onClick={() => { setMenuOpen(false); setAuthModal("signup"); }} className="btn-primary text-sm flex-1">S&apos;inscrire</button>
                  </div>
                </div>
              </div>
            )}
          </nav>
          <main>{children}</main>
          <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />
        </ToastProvider>
      </body>
    </html>
  );
}
