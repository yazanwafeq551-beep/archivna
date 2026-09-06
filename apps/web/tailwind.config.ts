/** @type {import('tailwindcss').Config} */

/**
 * Every palette entry resolves to a CSS variable holding raw RGB channels, so
 * the same class works in both themes and Tailwind's `/opacity` modifiers keep
 * working. The values live in src/index.css (`:root` and `.dark`).
 */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: token("--color-primary"),
          dark: token("--color-primary-dark"),
          light: token("--color-primary-light"),
        },
        gold: {
          DEFAULT: token("--color-gold"),
          light: token("--color-gold-light"),
          deep: token("--color-gold-deep"),
        },
        background: token("--color-background"),
        /** Cards, sheets, headers - "paper" in light, raised ink in dark. */
        surface: token("--color-surface"),
        foreground: token("--color-foreground"),
        muted: {
          DEFAULT: token("--color-muted"),
          bg: token("--color-muted-bg"),
        },
        border: token("--color-border"),
        burgundy: {
          DEFAULT: token("--color-burgundy"),
          light: token("--color-burgundy-light"),
        },
        olive: token("--color-olive"),
        ivory: token("--color-surface"),
        beige: token("--color-muted-bg"),
        stone: token("--color-stone"),
        white: "#FFFFFF",
        destructive: token("--color-destructive"),
        success: token("--color-success"),
        warning: token("--color-warning"),
      },
      fontFamily: {
        sans: ["Almarai", "sans-serif"],
        heading: ["Amiri", "serif"],
        display: ["Poppins", "sans-serif"],
        brand: ["Almarai", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      spacing: {
        13: "3.25rem",
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "spin-slow": "spin 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
