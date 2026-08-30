"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CarFront,
  Mail,
  Lock,
  User,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Loader2,
} from "lucide-react";

type Mode = "login" | "register";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function goAfterAuth() {
    router.push(next);
    router.refresh();
  }

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body =
        mode === "register"
          ? { fullName: name, email, password }
          : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      if (data.requiresVerification) {
        setVerifyEmail(data.email || email);
        setDevCode(data.devCode || null);
        setInfo(
          data.devCode
            ? "Mode dev : aucun email configuré. Votre code est affiché ci-dessous."
            : `Un code de confirmation a été envoyé à ${data.email}.`
        );
        setError(null);
        setLoading(false);
        return;
      }
      // Connecté directement (compte déjà vérifié).
      goAfterAuth();
    } catch {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  async function submitVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Code invalide.");
        setLoading(false);
        return;
      }
      goAfterAuth();
    } catch {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  async function resendCode() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || "Impossible de renvoyer le code.");
        return;
      }
      if (data.devCode) setDevCode(data.devCode);
      setInfo(
        data.devCode
          ? "Mode dev : votre nouveau code est affiché ci-dessous."
          : "Un nouveau code a été envoyé."
      );
    } catch {
      setLoading(false);
      setError("Erreur réseau. Réessayez.");
    }
  }

  const showVerify = verifyEmail !== "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#22a9f0] text-white shadow-[0_4px_16px_rgba(109,93,252,0.45)]">
          <CarFront className="h-6 w-6" />
        </div>
        <span className="font-display text-3xl font-bold text-ink">
          Thiqti<span className="gradient-text">.</span>
        </span>
      </Link>

      <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
        {!showVerify ? (
          <>
            {/* Tabs */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-black/5 p-1">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setInfo(null);
                  }}
                  className={`rounded-full py-2 text-sm font-semibold transition ${
                    mode === m ? "bg-white text-ink shadow" : "text-muted hover:text-ink"
                  }`}
                >
                  {m === "login" ? "Connexion" : "Créer un compte"}
                </button>
              ))}
            </div>

            <form onSubmit={submitAuth} className="flex flex-col gap-4">
              {mode === "register" && (
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                    <User className="h-4 w-4 text-muted" /> Nom
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full rounded-xl border border-line bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </label>
              )}
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <Mail className="h-4 w-4 text-muted" /> Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  required
                  className="w-full rounded-xl border border-line bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <Lock className="h-4 w-4 text-muted" /> Mot de passe
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-line bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(109,93,252,0.4)] transition hover:brightness-110 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Se connecter" : "Créer mon compte"}
              </button>
            </form>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Vos résultats sécurisés. Confirmation par code email.
            </p>
          </>
        ) : (
          <>
            <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-ink">Vérification</h1>
                <p className="text-sm text-muted">
                  Entrez le code envoyé à <span className="font-semibold text-ink">{verifyEmail}</span>
                </p>
              </div>
            </div>

            {info && <p className="mb-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700">{info}</p>}
            {devCode && (
              <p className="mb-3 rounded-xl border border-dashed border-primary/40 bg-brand-tint px-3 py-2 text-center text-sm font-bold text-primary">
                Code (dev) : {devCode}
              </p>
            )}

            <form onSubmit={submitVerify} className="flex flex-col gap-4">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-ink outline-none focus:border-primary"
              />
              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(109,93,252,0.4)] transition hover:brightness-110 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmer
              </button>
            </form>

            <button
              type="button"
              onClick={resendCode}
              disabled={loading}
              className="mt-3 w-full text-center text-sm font-medium text-primary hover:underline disabled:opacity-60"
            >
              Renvoyer le code
            </button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        En continuant, vous acceptez que vos données servent à personnaliser la recherche de véhicules.
      </p>
    </div>
  );
}
