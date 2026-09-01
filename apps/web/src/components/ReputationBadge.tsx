"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Shield, ThumbsUp, ThumbsDown } from "lucide-react";
import type { LLMReputationResult } from "@/lib/reputation/types";

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const color =
    score >= 75 ? "#22c55e" :
    score >= 50 ? "#eab308" :
    "#ef4444";
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        className="text-xs font-bold" fill={color}>
        {score}
      </text>
    </svg>
  );
}

function CategoryBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 75 ? "bg-green-500" :
    score >= 50 ? "bg-yellow-500" :
    "bg-red-500";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-7 text-right font-semibold text-ink">{score}</span>
    </div>
  );
}

export default function ReputationBadge({
  reputation,
  compact = false,
}: {
  reputation: LLMReputationResult;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <ScoreRing score={reputation.score} size={28} />
        <span className="text-[10px] font-bold text-muted">
          {reputation.reviewCount} avis
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScoreRing score={reputation.score} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-ink">Réputation</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              reputation.reliability === "elevee" ? "bg-green-100 text-green-700" :
              reputation.reliability === "moyenne" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              <Shield className="h-2.5 w-2.5" />
              {reputation.reliability === "elevee" ? "Fiable" :
               reputation.reliability === "moyenne" ? "Moyen" : "À vérifier"}
            </span>
          </div>
          <p className="text-[11px] text-muted">{reputation.reviewCount} avis analysés</p>
        </div>
      </div>

      {/* Sentiment — only when reviews exist */}
      {reputation.reviewCount > 0 && (
        <div className="mt-3 flex gap-1">
          {[
            { label: "Positif", pct: reputation.sentiment.positive, color: "bg-green-500" },
            { label: "Négatif", pct: reputation.sentiment.negative, color: "bg-red-500" },
            { label: "Neutre", pct: reputation.sentiment.neutral, color: "bg-gray-400" },
          ].map((s) => (
            <div key={s.label} className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div className={`h-full ${s.color}`} style={{ width: `${s.pct}%` }} />
              </div>
              <p className="mt-0.5 text-[9px] text-muted">{s.pct}% {s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Categories — toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex w-full items-center justify-between text-xs font-semibold text-muted hover:text-ink"
      >
        Détails par catégorie
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          <CategoryBar label="Fiabilité" score={reputation.categories.fiabilite.score} />
          <CategoryBar label="Confort" score={reputation.categories.confort.score} />
          <CategoryBar label="Coût" score={reputation.categories.cout.score} />
          <CategoryBar label="Sécurité" score={reputation.categories.securite.score} />
          <CategoryBar label="Performance" score={reputation.categories.performance.score} />

          {/* Pros / Cons */}
          {reputation.topPros.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-bold text-green-600">
                <ThumbsUp className="h-3 w-3" /> Points forts
              </p>
              <div className="flex flex-wrap gap-1">
                {reputation.topPros.map((p: string) => (
                  <span key={p} className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">{p}</span>
                ))}
              </div>
            </div>
          )}
          {reputation.topCons.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-bold text-red-600">
                <ThumbsDown className="h-3 w-3" /> Points faibles
              </p>
              <div className="flex flex-wrap gap-1">
                {reputation.topCons.map((c: string) => (
                  <span key={c} className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-semibold text-red-700">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {reputation.summary && (
            <p className="mt-2 rounded-xl bg-primary/5 p-2 text-[11px] text-muted">{reputation.summary}</p>
          )}
        </div>
      )}
    </div>
  );
}
