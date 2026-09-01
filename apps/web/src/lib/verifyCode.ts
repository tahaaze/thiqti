import { getAuthPool } from "./auth";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type CodePurpose = "email_verification" | "password_reset";

/**
 * Enregistre un nouveau code pour un utilisateur.
 * Rend invalides les codes précédents du même usage (un seul code actif).
 */
export async function storeVerificationCode(
  userId: string,
  code: string,
  purpose: CodePurpose = "email_verification"
): Promise<void> {
  const p = getAuthPool();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  // invalider les codes non utilisés du même usage
  await p.query(
    'UPDATE auth.verification_codes SET used_at = NOW() WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > NOW()',
    [userId, purpose]
  );
  await p.query(
    "INSERT INTO auth.verification_codes (user_id, code, purpose, expires_at) VALUES ($1, $2, $3, $4)",
    [userId, code, purpose, expiresAt]
  );
}

/**
 * Vérifie un code. Si valide, le marque comme utilisé et renvoie true.
 * Sinon renvoie false.
 */
export async function verifyStoredCode(
  userId: string,
  code: string,
  purpose: CodePurpose = "email_verification"
): Promise<boolean> {
  const p = getAuthPool();
  const res = await p.query(
    `SELECT id, expires_at FROM auth.verification_codes
     WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL
       AND expires_at > NOW() AND code = $3
     ORDER BY created_at DESC LIMIT 1`,
    [userId, purpose, code]
  );
  if (res.rows.length === 0) return false;
  await p.query("UPDATE auth.verification_codes SET used_at = NOW() WHERE id = $1", [res.rows[0].id]);
  return true;
}

export async function markEmailVerified(userId: string): Promise<void> {
  const p = getAuthPool();
  await p.query(
    "UPDATE auth.users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1",
    [userId]
  );
}
