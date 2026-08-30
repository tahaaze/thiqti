import { NextRequest, NextResponse } from "next/server";
import {
  getAuthPool,
  hashPassword,
  generateVerificationCode,
  findUserByEmail,
  signSessionToken,
  attachSessionCookie,
} from "@/lib/auth";
import { storeVerificationCode } from "@/lib/verifyCode";
import { sendVerificationCode } from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cette adresse email" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const p = getAuthPool();
    const res = await p.query(
      `INSERT INTO auth.users (email, password_hash, full_name)
       VALUES ($1, $2, $3) RETURNING id, email, full_name, email_verified`,
      [email, passwordHash, fullName || null]
    );
    const user = res.rows[0];

    const code = generateVerificationCode();
    await storeVerificationCode(user.id, code);
    const mail = await sendVerificationCode(email, code, "email_verification");

    const session = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      emailVerified: Boolean(user.email_verified),
    };

    const token = await signSessionToken(session);
    const response = NextResponse.json(
      {
        message: "Compte créé. Vérifiez votre email pour confirmer.",
        requiresVerification: true,
        devCode: mail.ok && mail.devCode ? mail.devCode : undefined,
        email: session.email,
      },
      { status: 201 }
    );

    // On pose déjà un cookie de session, mais le compte n'est "pleinement
    // validé" qu'après confirmation par code (emailVerified).
    attachSessionCookie(response, token);
    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("uq_auth_users_email_lower") || msg.includes("duplicate")) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cette adresse email" },
        { status: 409 }
      );
    }
    console.error("auth/register", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
