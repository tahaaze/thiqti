// ============================================================================
// ELECTRODRIVE.MA — CATALOGUE OFFICIEL DU CONCESSIONNAIRE (API GRATUITE)
// ============================================================================
//
// Source : https://www.electrodrive.ma — endpoint public
// https://www.electrodrive.ma/api/v1/agent-query.php?action=search&limit=50
// (gratuit, sans clé). Catalogue officiel complet (50 modèles) de véhicules
// électriques et hybrides neufs au Maroc : prix MAD (TTC), motorisation,
// autonomie, garanties, disponibilité. Les images sont relatives à
// https://www.electrodrive.ma/.
//
// Limites : catalogue (pas d'annonces d'occasion) et pas de coordonnées
// individuelles — le contact est le concessionnaire lui-même (site officiel).
// NB : le serveur est parfois instable → timeout court, liste vide si échec.
// ============================================================================

import { UnifiedCar, InventoryType, normalizeBody, formatPriceDH, computeScore } from "./types";

const API_URL = "https://www.electrodrive.ma/api/v1/agent-query.php";
const SITE_BASE = "https://www.electrodrive.ma/";
const TIMEOUT_MS = 6000;

interface ElectroVehicle {
  id?: number | string;
  marque?: string;
  modele?: string;
  version?: string;
  type_motorisation?: string;
  prix_maroc_ttc?: string | number | null;
  disponibilite?: string;
  autonomie_wltp_km?: number;
  segment?: string;
  annee_modele?: string;
  image_principale?: string;
  slug?: string;
}

function fuelFromMotorization(type: string | undefined): string {
  const t = (type || "").toUpperCase();
  if (t.includes("BEV") || t.includes("EV")) return "Électrique";
  if (t.includes("PHEV")) return "Hybride rechargeable";
  if (t.includes("HEV")) return "Hybride";
  if (t.includes("MHEV")) return "Hybride léger";
  return "Électrique";
}

function mapVehicle(v: ElectroVehicle): UnifiedCar | null {
  const make = (v.marque || "").trim();
  const model = (v.modele || "").trim();
  const price = Number(v.prix_maroc_ttc) || 0;
  if (!make || !model || price <= 0) return null;

  const year = Number(v.annee_modele) || new Date().getFullYear();
  const image = v.image_principale ? `${SITE_BASE}${v.image_principale.replace(/^\//, "")}` : "";
  const disponibilite = v.disponibilite === "stock" ? "En stock" : "Sur commande";

  return {
    id: `electrodrive_${v.id || v.slug || `${make}_${model}_${year}`}`,
    title: `${make} ${model}${v.version ? ` ${v.version}` : ""} ${year}`,
    make,
    model: v.version ? `${model} ${v.version}` : model,
    year,
    price,
    priceFormatted: formatPriceDH(price),
    km: 0,
    fuel: fuelFromMotorization(v.type_motorisation),
    transmission: "Non précisé",
    bodyType: v.segment ? normalizeBody(v.segment) : "Non précisé",
    city: "Maroc",
    image,
    source: "ElectroDrive.ma (API)",
    sourceUrl: SITE_BASE,
    url: SITE_BASE,
    score: computeScore(year, 0, price),
    scrapedAt: new Date().toISOString(),
    photos: image ? [image] : [],
    inventoryType: "new" as InventoryType,
    safety: null,
    contact: {
      name: "Concessionnaire ElectroDrive",
      url: SITE_BASE,
    },
    reputation: {
      verified: true,
      label: `Concessionnaire officiel · ${disponibilite}`,
    },
  };
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Catalogue officiel électrique / hybride au Maroc (neuf). */
export async function fetchElectroDriveCars(): Promise<UnifiedCar[]> {
  try {
    const res = await fetchWithTimeout(`${API_URL}?action=search&limit=50`, TIMEOUT_MS);
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: ElectroVehicle[] };
    const vehicles = json.data;
    if (!Array.isArray(vehicles)) return [];
    return vehicles
      .map(mapVehicle)
      .filter((c): c is UnifiedCar => c !== null);
  } catch {
    return [];
  }
}
