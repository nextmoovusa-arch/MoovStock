import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens (dark theme)
        bg:          "rgb(var(--bg) / <alpha-value>)",
        surface:     "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        subtle:      "rgb(var(--subtle) / <alpha-value>)",
        input:       "rgb(var(--input) / <alpha-value>)",
        foreground:  "rgb(var(--foreground) / <alpha-value>)",
        muted:       "rgb(var(--muted-foreground) / <alpha-value>)",
        "muted-strong": "rgb(var(--muted) / <alpha-value>)",
        accent:      "rgb(var(--accent) / <alpha-value>)",
        "accent-strong": "rgb(var(--accent-strong) / <alpha-value>)",
        "accent-soft":   "rgb(var(--accent-soft) / <alpha-value>)",
        "on-accent":     "rgb(var(--on-accent) / <alpha-value>)",
        danger:      "rgb(var(--danger) / <alpha-value>)",
        warning:     "rgb(var(--warning) / <alpha-value>)",
        success:     "rgb(var(--success) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          accent: "rgb(var(--accent) / <alpha-value>)",
        },
      },
      backgroundImage: {
        "brand-glow":
          "radial-gradient(60% 60% at 50% 0%, rgba(63,212,179,0.18), transparent 70%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(63,212,179,0.25), 0 8px 32px -8px rgba(63,212,179,0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
