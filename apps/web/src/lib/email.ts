import { Resend } from "resend";

export interface SendCodeResult {
  ok: boolean;
  /** En mode dev (pas de clé) on renvoie le code pour permettre les tests. */
  devCode?: string;
  previewUrl?: string;
  error?: string;
}

const FROM =
  process.env.RESEND_FROM || "Thiqti <onboarding@resend.dev>";
const API_KEY = process.env.RESEND_API_KEY || "";

/**
 * Envoie le code de confirmation par email via Resend.
 * Si RESEND_API_KEY n'est pas configurée (dev), renvoie le code à afficher.
 */
export async function sendVerificationCode(
  to: string,
  code: string,
  purpose: string
): Promise<SendCodeResult> {
  const subject =
    purpose === "password_reset"
      ? "Votre code de réinitialisation Thiqti"
      : "Confirmez votre email Thiqti";

  const text = `
Bonjour,

Votre code de confirmation Thiqti est :

  ${code}

Il expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande,
ignorez cet email.

Merci,
L'équipe Thiqti
`;

  if (!API_KEY) {
    return { ok: true, devCode: code };
  }

  try {
    const resend = new Resend(API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      text,
    });
    if (error) {
      console.error("[Email] Resend error:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("[Email] Send failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
