"use client";

import { uid } from "@/lib/svgId";

// ============================================================================
// CAR ILLUSTRATION — visuel "product shot" deterministe genere en SVG.
// Remplace les photos de vehicules (indisponibles hors API) par une
// illustration studio premium : scene avec spot lumineux, sol reflechissant,
// silhouette de la voiture selon la carrosserie et couleur de la marque.
// Aucune dependance externe, aucun appel reseau, design coherent avec le theme.
// ============================================================================

const BRAND_COLORS: Record<string, string> = {
  Dacia: "#00A98F",
  Renault: "#FFC400",
  Peugeot: "#7B9FE0",
  Toyota: "#E01A22",
  Hyundai: "#2E5EA8",
  Kia: "#1B3C57",
  Volkswagen: "#2A6FB8",
  BMW: "#5B8DD9",
  Mercedes: "#B8B8B8",
  Audi: "#8A8A8A",
  BYD: "#D81E2B",
  MG: "#C8102E",
  Ford: "#2A5B9E",
  Nissan: "#C3002F",
  Fiat: "#D1385B",
  Citroën: "#8A94A8",
  Citroen: "#8A94A8",
  Opel: "#FFD200",
  Jeep: "#6B7B5A",
  Škoda: "#4BA82E",
  Skoda: "#4BA82E",
  Seat: "#E81F2B",
  Suzuki: "#2C6FB0",
  Volvo: "#2A4A6B",
  DFSK: "#C41230",
  Mazda: "#910A2E",
  Honda: "#B61A2E",
  GAC: "#D8A826",
  Geely: "#2E7DD1",
  Haval: "#D8A826",
  Changan: "#1E5FAB",
  Chery: "#1E5FAB",
  Omoda: "#0F766E",
  Jaecoo: "#334155",
};

const BODY_TYPES = [
  "SUV",
  "Berline",
  "Citadine",
  "Compacte",
  "Crossover",
  "Monospace",
  "Utilitaire",
  "Break",
  "Coupé",
  "Cabriolet",
] as const;

interface CarIllustrationProps {
  make: string;
  model: string;
  bodyType?: string;
  className?: string;
}

interface Profile {
  body: string;
  glass: string;
  wheelR: number;
}

// Profils cote (vue de profil, voiture orientee vers la droite). Coordonnees
// dans le viewBox 0 0 300 180 : sol y=150, roues avant/arriere fixes.
const PROFILES: Record<string, Profile> = {
  Berline: {
    wheelR: 18,
    body:
      "M64 148 L64 140 C63 136 64 133 67 130 L73 122 C75 116 79 111 84 107 " +
      "C96 92 112 86 130 82 L198 80 C210 82 217 89 221 97 C224 104 226 110 228 116 " +
      "L232 122 C235 126 237 130 236 134 L236 148 Z",
    glass:
      "M104 102 C116 93 132 89 148 88 L194 87 C201 89 206 94 210 100 " +
      "C204 103 190 109 170 111 C140 115 118 111 104 102 Z",
  },
  SUV: {
    wheelR: 20,
    body:
      "M60 148 L60 141 C59 135 62 129 68 125 L80 103 C86 95 100 89 114 85 " +
      "L196 83 C208 85 214 91 218 99 L232 109 C236 115 238 123 237 131 L237 148 Z",
    glass:
      "M118 96 C130 91 146 89 160 89 L190 89 C198 91 203 96 206 101 " +
      "C196 106 160 111 138 110 C126 109 120 103 118 96 Z",
  },
  Citadine: {
    wheelR: 18,
    body:
      "M70 148 L70 138 C69 133 71 129 75 126 L82 114 C86 106 94 100 106 96 " +
      "L182 94 C192 96 198 102 201 110 L206 118 C209 123 211 128 210 134 L210 148 Z",
    glass:
      "M110 105 C120 99 134 97 146 97 L176 97 C182 99 187 103 189 108 " +
      "C166 114 128 115 110 105 Z",
  },
  Compacte: {
    wheelR: 18,
    body:
      "M66 148 L66 139 C65 134 67 130 70 127 L78 112 C82 103 92 96 106 92 " +
      "L188 90 C198 92 204 98 207 106 L212 115 C215 120 217 126 216 132 L216 148 Z",
    glass:
      "M112 102 C124 96 138 94 150 94 L184 94 C190 96 195 100 197 105 " +
      "C170 111 132 111 112 102 Z",
  },
  Crossover: {
    wheelR: 19,
    body:
      "M64 146 L64 138 C63 132 66 127 71 123 L82 106 C88 97 100 90 114 86 " +
      "L184 84 C196 86 203 92 207 101 L212 110 C215 116 217 122 216 129 L216 146 Z",
    glass:
      "M118 97 C130 92 146 90 158 90 L184 90 C192 92 197 97 200 102 " +
      "C176 108 140 108 118 97 Z",
  },
  Monospace: {
    wheelR: 19,
    body:
      "M58 148 L58 141 C57 135 60 129 66 125 L78 91 C84 83 98 77 114 73 " +
      "L192 71 C204 73 211 80 215 90 L222 105 C225 112 227 120 226 129 L226 148 Z",
    glass:
      "M92 91 C108 83 130 79 152 78 L182 77 C190 79 195 85 197 92 " +
      "C150 101 106 101 92 91 Z",
  },
  Utilitaire: {
    wheelR: 20,
    body:
      "M58 148 L58 141 C57 136 60 132 64 128 L72 121 L128 119 L132 87 " +
      "C136 81 142 78 150 77 L196 77 C204 79 209 85 212 93 L220 105 " +
      "C223 111 224 119 223 127 L223 148 Z",
    glass:
      "M142 91 C148 87 158 85 166 85 L186 85 C191 87 194 90 196 94 " +
      "C176 100 156 99 142 91 Z",
  },
  Break: {
    wheelR: 18,
    body:
      "M60 148 L60 140 C59 135 61 131 65 127 L72 114 C75 106 80 100 88 96 " +
      "L106 88 L202 82 C210 84 216 90 220 98 L230 110 C233 117 234 125 233 133 L233 148 Z",
    glass:
      "M98 100 C112 94 128 91 144 90 L198 88 C204 90 209 95 212 101 " +
      "C190 106 140 109 110 106 C102 105 99 103 98 100 Z",
  },
  Coupé: {
    wheelR: 18,
    body:
      "M66 148 L66 140 C65 135 67 131 71 127 L82 116 C86 108 92 100 102 94 " +
      "C116 84 132 80 148 80 C160 80 170 84 178 92 C186 102 196 108 210 112 " +
      "C216 115 220 120 221 127 L221 148 Z",
    glass:
      "M116 96 C126 90 138 88 148 88 C158 88 166 92 172 99 C162 105 148 108 138 108 " +
      "C126 108 119 103 116 96 Z",
  },
  Cabriolet: {
    wheelR: 18,
    body:
      "M62 148 L62 139 C61 134 63 130 67 126 L80 118 C92 112 104 110 118 110 " +
      "L198 110 C207 112 213 118 216 126 L216 148 Z",
    glass:
      "M150 110 L157 94 C160 88 165 85 171 84 L180 84 L180 110 Z",
  },
};

const DEFAULT_PROFILE = PROFILES.Berline;

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function normalizeBody(bodyType: string | undefined): Profile {
  if (!bodyType) return DEFAULT_PROFILE;
  const key = BODY_TYPES.find((b) => bodyType.toLowerCase().includes(b.toLowerCase()));
  return (key && PROFILES[key]) || DEFAULT_PROFILE;
}

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const spokes = [0, 72, 144, 216, 288];
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0b0b0e" />
      <circle cx={cx} cy={cy} r={r * 0.78} fill="#1b1b20" />
      <circle cx={cx} cy={cy} r={r * 0.45} fill="#3a3a42" />
      <circle cx={cx} cy={cy} r={r * 0.42} fill="none" stroke="#5a5a66" strokeWidth={1.4} />
      {spokes.map((deg) => (
        <line
          key={deg}
          x1={cx + Math.cos((deg * Math.PI) / 180) * r * 0.42}
          y1={cy + Math.sin((deg * Math.PI) / 180) * r * 0.42}
          x2={cx + Math.cos((deg * Math.PI) / 180) * r * 0.15}
          y2={cy + Math.sin((deg * Math.PI) / 180) * r * 0.15}
          stroke="#c9c9d4"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.14} fill="#e8e8ee" />
    </g>
  );
}

export default function CarIllustration({ make, model, bodyType, className = "" }: CarIllustrationProps) {
  const profile = normalizeBody(bodyType);
  const brand = BRAND_COLORS[make] || "#94a3b8";
  const seed = hash(`${make}-${model}`);
  const tint = `hsl(${210 + (seed % 40)}, ${20 + (seed % 25)}%, 55%)`;
  const bodyColor = brand;
  const accent = seed % 3 === 0 ? "#f97316" : brand;
  const id = uid(make, model);

  return (
    <svg
      viewBox="0 0 300 180"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`${make} ${model}`}
    >
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15152a" />
          <stop offset="55%" stopColor={`#20203c`} />
          <stop offset="100%" stopColor={tint} stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={`spot-${id}`} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`paint-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bodyColor} stopOpacity="0.95" />
          <stop offset="60%" stopColor={bodyColor} />
          <stop offset="100%" stopColor={bodyColor} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`glass-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8d4f5" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#4a6d95" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`floor-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {/* Fond studio */}
      <rect width="300" height="180" fill={`url(#sky-${id})`} />
      <rect width="300" height="180" fill={`url(#spot-${id})`} />

      {/* Sol */}
      <rect y="144" width="300" height="36" fill={`url(#floor-${id})`} />
      <line x1="0" y1="150" x2="300" y2="150" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />
      <line x1="0" y1="158" x2="300" y2="158" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1" />

      {/* Ombre portee */}
      <ellipse cx="150" cy="150" rx="108" ry="9" fill="#000" opacity="0.45" />

      {/* Carrosserie */}
      <g strokeLinejoin="round">
        <path d={profile.body} fill={`url(#paint-${id})`} stroke="#000" strokeOpacity="0.35" strokeWidth="1.4" />
        {/* Liseret de gloss sur le toit */}
        <path d={profile.body} fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.6" />
        <path d={profile.glass} fill={`url(#glass-${id})`} stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" />
        {/* Ligne de porte */}
        <path d="M138 84 L138 146" stroke="#000" strokeOpacity="0.25" strokeWidth="1" fill="none" />
        {/* Poignee */}
        <rect x="128" y="120" width="16" height="3.5" rx="1.75" fill="#fff" fillOpacity="0.35" />
        {/* Phare avant */}
        <ellipse cx="230" cy="126" rx="6.5" ry="3.4" fill="#fff" fillOpacity="0.9" stroke={accent} strokeWidth="1.2" />
        {/* Feu arriere */}
        <rect x="58" y="126" width="8" height="4" rx="2" fill={accent} fillOpacity="0.95" />
        {/* Retroviseur */}
        <circle cx="203" cy="103" r="3" fill={bodyColor} stroke="#000" strokeOpacity="0.3" strokeWidth="0.8" />
      </g>

      {/* Roues */}
      <Wheel cx={95} cy={132} r={profile.wheelR} />
      <Wheel cx={205} cy={132} r={profile.wheelR} />
    </svg>
  );
}
