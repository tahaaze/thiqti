"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle2, Lock, Loader2, ShieldCheck, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/login?next=/profile");
    return null;
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("Le nouveau mot de passe doit être différent de l'actuel.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 font-display text-2xl font-bold text-ink">Mon profil</h1>

      {/* User info */}
      <div className="glass-card mb-6 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6d5dfc]/15 to-[#22a9f0]/15">
            <UserCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-ink">{user.fullName || user.email.split("@")[0]}</p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-600 font-semibold">Email vérifié</span>
        </div>
      </div>

      {/* Change password */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
          <Lock className="h-5 w-5 text-primary" />
          Changer le mot de passe
        </h2>

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Mot de passe modifié avec succès.
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Mot de passe actuel</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-line bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Nouveau mot de passe</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-line bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Confirmer le mot de passe</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-line bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6d5dfc] to-[#22a9f0] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(109,93,252,0.4)] transition hover:brightness-110 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}
