import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#8BFF3D",
          50: "#F3FFE8",
          100: "#E4FFC9",
          200: "#CBFF98",
          300: "#B0FF66",
          400: "#9DFF4F",
          500: "#8BFF3D",
          600: "#6BDB1E",
          700: "#52AB18",
          800: "#3B7A12",
          900: "#264F0C",
        },
        ink: {
          DEFAULT: "#0A0A0B",
          900: "#0A0A0B",
          800: "#161618",
          700: "#212124",
          600: "#2E2E32",
          500: "#48484E",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          light: "#FFFFFF",
          "light-muted": "#F5F5F7",
          dark: "#0A0A0B",
          "dark-muted": "#161618",
          "dark-elevated": "#1D1D20",
        },
        neutral: {
          50: "#FAFAFA",
          100: "#F2F2F3",
          200: "#E4E4E7",
          300: "#D1D1D6",
          400: "#A5A5AD",
          500: "#7A7A83",
          600: "#5C5C64",
          700: "#434349",
          800: "#2A2A2E",
          900: "#18181B",
        },
        success: "#2FD463",
        warning: "#FFB020",
        danger: "#FF4D4F",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        "card-dark": "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.4)",
        glow: "0 0 0 1px rgba(139,255,61,0.4), 0 0 24px rgba(139,255,61,0.25)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
