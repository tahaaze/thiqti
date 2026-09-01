import { NextRequest, NextResponse } from "next/server";
import { getAuthPool, getAuth, hashPassword, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { session } = await getAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit faire au moins 8 caractères." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit être différent de l'actuel." },
        { status: 400 }
      );
    }

    const p = getAuthPool();

    const pwRes = await p.query(
      "SELECT password_hash FROM auth.users WHERE id = $1 LIMIT 1",
      [session.id]
    );
    const hash = pwRes.rows[0]?.password_hash;

    if (!hash || !(await verifyPassword(currentPassword, hash))) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect." },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await p.query("UPDATE auth.users SET password_hash = $1 WHERE id = $2", [newHash, session.id]);

    return NextResponse.json({ message: "Mot de passe modifié avec succès." });
  } catch (e) {
    console.error("auth/change-password", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
