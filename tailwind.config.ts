import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: "#00fff7",
          magenta: "#ff00e5",
          purple: "#8a2be2",
          gold: "#ffd166"
        }
      },
      boxShadow: {
        glow: "0 0 20px rgba(0,255,247,0.35)",
        glowPurple: "0 0 24px rgba(138,43,226,0.35)",
        glowMagenta: "0 0 24px rgba(255,0,229,0.35)",
        glowGold: "0 0 24px rgba(255,209,102,0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;

