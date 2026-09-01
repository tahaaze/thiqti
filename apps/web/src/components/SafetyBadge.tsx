import { ZelligeStar, ThiqtiShield } from "@/components/icons";

export interface SafetyInfo {
  stars: number;
  ratingYear?: number;
  source?: "euroncap" | "nhtsa" | string;
  className?: string;
}

export function safetyLabelOf(safety: SafetyInfo | null | undefined): string {
  if (!safety) return "Non évalué";
  const program = safety.source === "nhtsa" ? "NHTSA" : "Euro NCAP";
  const year = safety.ratingYear ? ` ${safety.ratingYear}` : "";
  return `${safety.stars} étoile${safety.stars > 1 ? "s" : ""} — ${program}${year}`;
}

function starColor(stars: number): string {
  if (stars >= 4) return "text-green-600";
  if (stars === 3) return "text-yellow-600";
  if (stars === 2) return "text-orange-600";
  return "text-red-600";
}

interface SafetyBadgeProps {
  safety?: SafetyInfo | null;
  /** Taille d'une etoile en px. */
  size?: number;
  /** true = etoiles + libelle complet ; false = etoiles seules. */
  full?: boolean;
}

export default function SafetyBadge({ safety, size = 13, full = false }: SafetyBadgeProps) {
  if (!safety) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted/10 px-2 py-0.5 text-[11px] text-muted">
        <ThiqtiShield style={{ width: size, height: size }} />
        {full ? "Non évalué" : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-0.5 ${starColor(safety.stars)}`}>
        <ThiqtiShield style={{ width: size, height: size }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <ZelligeStar key={i} style={{ width: size, height: size }} className={i < safety.stars ? "fill-current" : "opacity-25"} />
        ))}
      </span>
      {full && <span className="text-xs text-muted">{safetyLabelOf(safety)}</span>}
    </span>
  );
}
