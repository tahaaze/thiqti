import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser,
  signSessionToken,
  attachSessionCookie,
  getUserById,
} from "@/lib/auth";
import { verifyStoredCode, markEmailVerified } from "@/lib/verifyCode";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const code = String(body.code || "").trim();

    if (!code) {
      return NextResponse.json({ error: "Code manquant" }, { status: 400 });
    }

    const ok = await verifyStoredCode(session.id, code, "email_verification");
    if (!ok) {
      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 400 }
      );
    }

    await markEmailVerified(session.id);
    const user = await getUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const freshSession = { ...user, emailVerified: true };
    const token = await signSessionToken(freshSession);
    const response = NextResponse.json({
      message: "Email confirmé. Votre compte est validé.",
      user: {
        id: freshSession.id,
        email: freshSession.email,
        fullName: freshSession.fullName,
        emailVerified: true,
      },
    });
    attachSessionCookie(response, token);
    return response;
  } catch (e) {
    console.error("auth/verify", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
