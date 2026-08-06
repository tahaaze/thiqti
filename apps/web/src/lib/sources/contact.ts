// ============================================================================
// CONTACT VENDEUR — NORMALISATION DES NUMEROS MAROCAINS
// ============================================================================
// Convertit les numéros locaux (ex. "0616030361") en numéro international
// +212... utilisable dans les liens tel: et wa.me/. Retourne null si le numéro
// est illisible afin que la fiche ne fabrique jamais de lien invalide.
// ============================================================================

export function normalizeIntlPhone(raw?: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) digits = "212" + digits.slice(1);
  if (digits.length >= 9 && digits.length <= 15) return digits;
  return null;
}

export function telHref(raw?: string): string | undefined {
  const intl = normalizeIntlPhone(raw);
  return intl ? `tel:+${intl}` : undefined;
}

export function whatsappHref(raw?: string): string | undefined {
  const intl = normalizeIntlPhone(raw);
  return intl ? `https://wa.me/${intl}` : undefined;
}

export function displayPhone(raw?: string): string | undefined {
  const intl = normalizeIntlPhone(raw);
  if (!intl) return undefined;
  if (intl.startsWith("212") && intl.length === 12) {
    const local = "0" + intl.slice(3);
    return `${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
  }
  return intl;
}
