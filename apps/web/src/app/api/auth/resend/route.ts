import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, generateVerificationCode } from "@/lib/auth";
import { storeVerificationCode } from "@/lib/verifyCode";
import { sendVerificationCode } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (session.emailVerified) {
      return NextResponse.json(
        { message: "Email déjà confirmé" },
        { status: 200 }
      );
    }

    const code = generateVerificationCode();
    await storeVerificationCode(session.id, code);
    const mail = await sendVerificationCode(session.email, code, "email_verification");

    return NextResponse.json({
      message: "Un nouveau code a été envoyé.",
      devCode: mail.ok && mail.devCode ? mail.devCode : undefined,
    });
  } catch (e) {
    console.error("auth/resend", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
