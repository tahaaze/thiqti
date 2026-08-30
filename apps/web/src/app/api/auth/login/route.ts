import { NextRequest, NextResponse } from "next/server";
import {
  getAuthPool,
  verifyPassword,
  generateVerificationCode,
  findUserByEmail,
  signSessionToken,
  attachSessionCookie,
  getUserById,
} from "@/lib/auth";
import { storeVerificationCode } from "@/lib/verifyCode";
import { sendVerificationCode } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const account = await findUserByEmail(email);
    if (!account) {
      return NextResponse.json(
        { error: "Adresse email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const p = getAuthPool();
    const pwRes = await p.query(
      "SELECT password_hash FROM auth.users WHERE id = $1 LIMIT 1",
      [account.id]
    );
    const hash = pwRes.rows[0]?.password_hash;
    if (!hash || !(await verifyPassword(password, hash))) {
      return NextResponse.json(
        { error: "Adresse email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Email pas encore confirmé -> envoyer/redonner un nouveau code.
    if (!account.emailVerified) {
      const code = generateVerificationCode();
      await storeVerificationCode(account.id, code);
      const mail = await sendVerificationCode(account.email, code, "email_verification");
      const session = { ...account, emailVerified: false };
      const token = await signSessionToken(session);
      const response = NextResponse.json(
        {
          message: "Veuillez confirmer votre email.",
          requiresVerification: true,
          devCode: mail.ok && mail.devCode ? mail.devCode : undefined,
          email: account.email,
        },
        { status: 200 }
      );
      attachSessionCookie(response, token);
      return response;
    }

    const user = await getUserById(account.id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    const token = await signSessionToken(user);
    const response = NextResponse.json({
      message: "Connexion réussie",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: true,
      },
    });
    attachSessionCookie(response, token);
    return response;
  } catch (e) {
    console.error("auth/login", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
