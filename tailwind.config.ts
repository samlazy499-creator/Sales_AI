import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // Base — near-black canvas, not pure black (keeps depth in dark glass panels)
        ink: {
          950: "#08090C",
          900: "#0D0F14",
          800: "#14171F",
          700: "#1C202B",
          600: "#272C3A",
        },
        // Signal — electric indigo, the "AI is working" color
        signal: {
          400: "#8B93FF",
          500: "#6D6BFF",
          600: "#5449E8",
        },
        // Conversion — warm amber, reserved for CTAs / revenue numbers only
        amber: {
          400: "#FFB454",
          500: "#F79A2E",
        },
        mist: {
          50: "#F5F6FA",
          200: "#C7CBDA",
          400: "#8A8FA3",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(60% 50% at 50% 0%, rgba(109,107,255,0.18) 0%, rgba(8,9,12,0) 70%)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35)",
        "glow-signal": "0 0 40px rgba(109,107,255,0.25)",
      },
      keyframes: {
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        ticker: "ticker-scroll 28s linear infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
