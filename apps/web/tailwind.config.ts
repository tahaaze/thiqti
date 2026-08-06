import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#D4A94A",
        "primary-dark": "#B98D3F",
        accent: "#D4A94A",
        "accent-dark": "#B98D3F",
        success: "#16A34A",
        warning: "#F59E0B",
        error: "#DC2626",
        dark: {
          900: "#0B0C15",
          800: "#151720",
          700: "#1E2231",
          600: "#2B3045",
          500: "#3E445C",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Marcellus", "Inter", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
