import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0066FF",
        "primary-dark": "#0052CC",
        success: "#16A34A",
        warning: "#F59E0B",
        error: "#DC2626",
        dark: {
          900: "#0A0F1C",
          800: "#111827",
          700: "#1E293B",
          600: "#334155",
          500: "#475569",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
