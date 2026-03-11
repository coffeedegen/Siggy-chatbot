import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--color-bg-primary)",
        cosmic: "var(--color-bg-secondary)",
        elevated: "var(--color-bg-elevated)",
        accent: "var(--color-accent)",
        "accent-dim": "var(--color-accent-hover)",
        border: "var(--color-border)",
      },
    },
  },
  plugins: [],
};

export default config;