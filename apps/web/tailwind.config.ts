/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F4C45",
          dark: "#072F2B",
          light: "#1B6B60",
        },
        gold: {
          DEFAULT: "#C6A15B",
          light: "#EADFC4",
          deep: "#A9853F",
        },
        background: "#F8F4EC",
        foreground: "#22302D",
        muted: {
          DEFAULT: "#78736B",
          bg: "#EDE4D1",
        },
        border: "#E2DBC9",
        burgundy: {
          DEFAULT: "#8B2635",
          light: "#A83244",
        },
        olive: "#5F7A48",
        ivory: "#F8F4EC",
        beige: "#EDE4D1",
        stone: "#9A938A",
        white: "#FFFFFF",
        destructive: "#DC2626",
        success: "#16A34A",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["Almarai", "sans-serif"],
        heading: ["Amiri", "serif"],
        display: ["Poppins", "sans-serif"],
        brand: ["Almarai", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
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
