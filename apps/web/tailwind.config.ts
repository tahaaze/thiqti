import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--brand)",
        "primary-dark": "var(--brand-strong)",
        accent: "var(--brand)",
        "accent-dark": "var(--brand-strong)",
        "primary-tint": "var(--brand-tint)",
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        success: "var(--success)",
        warning: "#F59E0B",
        error: "#DC2626",
        // Échelle héritée de l'ancien thème sombre, remappée sur des surfaces
        // claires pour la transition. Migrée progressivement vers canvas/surface.
        dark: {
          900: "#f6f7f9",
          800: "#ffffff",
          700: "#fbfcfd",
          600: "#eef0f3",
          500: "#e5e7eb",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        display: ["var(--font-kufam)", "Kufam", "Inter", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
