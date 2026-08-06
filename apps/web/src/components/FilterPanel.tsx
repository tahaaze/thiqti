"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal, RotateCcw, ShieldCheck, Calendar, Gauge, Tag, Fuel } from "lucide-react";
import { SearchFilters, SearchFacets, countActiveFilters } from "@/lib/searchTypes";

const PRICE_PRESETS = [
  { label: "≤ 100k", value: 100000 },
  { label: "≤ 150k", value: 150000 },
  { label: "≤ 250k", value: 250000 },
  { label: "≤ 400k", value: 400000 },
  { label: "≤ 600k", value: 600000 },
];

const SAFETY_OPTIONS = [
  { label: "3★ minimum", value: 3 },
  { label: "4★ minimum", value: 4 },
  { label: "5★", value: 5 },
];

interface FilterPanelProps {
  facets: SearchFacets;
  filters: SearchFilters;
  total: number;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
}

function Slider({
  label,
  icon: Icon,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  label: string;
  icon: typeof Calendar;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Icon className="h-3.5 w-3.5 text-primary" />
          {label}
        </span>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-white/10 text-gray-400 hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/5 pt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
      {children}
    </div>
  );
}

export default function FilterPanel({ facets, filters, total, onChange, onReset }: FilterPanelProps) {
  const [priceQuery, setPriceQuery] = useState("");

  const activeCount = countActiveFilters(filters);
  const maxPrice = facets.priceMax || 600000;
  const maxYear = facets.yearMax || 2026;
  const minYear = facets.yearMin || 2018;
  const year = filters.minYear ?? minYear;
  const km = filters.maxKm ?? 250000;

  const set = (patch: Partial<SearchFilters>) => onChange({ ...filters, ...patch });
  const toggle = (key: keyof SearchFilters, value: string | number) => {
    const next: SearchFilters = { ...filters };
    if (next[key] === (value as never)) delete next[key];
    else (next[key] as unknown) = value;
    onChange(next);
  };

  const pricePresetActive = PRICE_PRESETS.some((p) => p.value === filters.maxPrice && !filters.minPrice);
  const safetyActive = (v: number) => filters.minSafety === v;

  const filteredBrands = facets.brands.filter((b) =>
    b.toLowerCase().includes(priceQuery.toLowerCase())
  );

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtres
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-gray-500 transition hover:text-white"
        >
          <RotateCcw className="h-3 w-3" />
          Réinitialiser
        </button>
      </div>

      <div className="mb-4 flex items-baseline justify-between rounded-xl bg-dark-800/50 px-3 py-2">
        <p className="text-xs text-gray-500">Résultats</p>
        <p className="text-sm font-bold text-primary">{total} véhicules</p>
      </div>

      <div className="space-y-4">
        <Section title="Budget">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((p) => (
              <Chip key={p.value} active={pricePresetActive && filters.maxPrice === p.value} onClick={() => set({ maxPrice: p.value, minPrice: undefined })}>
                {p.label}
              </Chip>
            ))}
            <Chip active={!filters.maxPrice && !filters.minPrice} onClick={() => set({ maxPrice: undefined, minPrice: undefined })}>
              Tous
            </Chip>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min (DH)"
              value={filters.minPrice ?? ""}
              onChange={(e) => set({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="input-field text-sm"
            />
            <span className="text-gray-600">—</span>
            <input
              type="number"
              placeholder="Max (DH)"
              value={filters.maxPrice ?? ""}
              onChange={(e) => set({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="input-field text-sm"
            />
          </div>
        </Section>

        <Section title="Année minimum">
          <Slider
            label=""
            icon={Calendar}
            min={minYear}
            max={maxYear}
            step={1}
            value={year}
            display={String(year)}
            onChange={(v) => set({ minYear: v })}
          />
        </Section>

        <Section title="Kilométrage max">
          <Slider
            label=""
            icon={Gauge}
            min={0}
            max={250000}
            step={5000}
            value={km}
            display={km >= 250000 ? "Indifférent" : `${km.toLocaleString("fr-FR")} km`}
            onChange={(v) => set({ maxKm: v === 250000 ? undefined : v })}
          />
        </Section>

        <Section title="Sécurité (crash test)">
          <div className="flex flex-wrap gap-1.5">
            <Chip active={!filters.minSafety} onClick={() => set({ minSafety: undefined })}>
              Toutes
            </Chip>
            {SAFETY_OPTIONS.map((o) => (
              <Chip key={o.value} active={safetyActive(o.value)} onClick={() => toggle("minSafety", o.value)}>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {o.label}
                </span>
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-gray-600">
            Basé sur Euro NCAP / NHTSA · {facets.safety.evaluated} modèles notés, {facets.safety.fiveStars} au maximum
          </p>
        </Section>

        <Section title="Carrosserie">
          <div className="flex flex-wrap gap-1.5">
            <Chip active={!filters.bodyType} onClick={() => set({ bodyType: undefined })}>
              Toutes
            </Chip>
            {facets.bodyTypes.map((b) => (
              <Chip key={b} active={filters.bodyType === b} onClick={() => toggle("bodyType", b)}>
                {b}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Motorisation">
          <div className="flex flex-wrap gap-1.5">
            <Chip active={!filters.fuel} onClick={() => set({ fuel: undefined })}>
              Toutes
            </Chip>
            {facets.fuels.map((f) => (
              <Chip key={f} active={filters.fuel === f} onClick={() => toggle("fuel", f)}>
                <span className="inline-flex items-center gap-1">
                  <Fuel className="h-3 w-3" />
                  {f}
                </span>
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Marque">
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={priceQuery}
              onChange={(e) => setPriceQuery(e.target.value)}
              placeholder="Rechercher une marque…"
              className="input-field pl-9 text-sm"
            />
          </div>
          <select
            value={filters.brand ?? ""}
            onChange={(e) => set({ brand: e.target.value || undefined })}
            className="mt-2 w-full input-field text-sm"
          >
            <option value="">Toutes les marques</option>
            {filteredBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Section>

        <Section title="Ville">
          <select
            value={filters.city ?? ""}
            onChange={(e) => set({ city: e.target.value || undefined })}
            className="w-full input-field text-sm"
          >
            <option value="">Toutes les villes</option>
            {facets.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Section>
      </div>

      {activeCount > 0 && (
        <button
          onClick={onReset}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 transition hover:border-primary/40 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Effacer {activeCount} filtre{activeCount > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
