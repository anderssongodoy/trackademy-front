import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef9ff",
          100: "#dcf2ff",
          200: "#bfe8ff",
          300: "#91d9ff",
          400: "#5dcbff",
          500: "#3db8ff",
          600: "#1b9bdb",
          700: "#0d75b8",
          800: "#0c5a94",
          900: "#0d3f7a",
          950: "#051e34",
        },
        secondary: {
          50: "#f5ebff",
          100: "#ead5ff",
          200: "#d9b0ff",
          300: "#c080ff",
          400: "#9f4eff",
          500: "#8b2dff",
          600: "#7a14d8",
          700: "#630fb5",
          800: "#500a91",
          900: "#3d0875",
          950: "#230349",
        },
        accent: {
          50: "#fff7ed",
          100: "#ffecda",
          200: "#ffd4b4",
          300: "#ffb381",
          400: "#ff9248",
          500: "#ff7a1f",
          600: "#e55a0e",
          700: "#c1440a",
          800: "#92330c",
          900: "#5a200c",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#047857",
          800: "#065f46",
          900: "#034e3b",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #3db8ff 0%, #1b9bdb 50%, #0d75b8 100%)",
        "gradient-secondary":
          "linear-gradient(135deg, #8b2dff 0%, #c080ff 50%, #9f4eff 100%)",
        "gradient-accent":
          "linear-gradient(135deg, #ff7a1f 0%, #ffb381 50%, #ff9248 100%)",
        "gradient-hero":
          "linear-gradient(to right, #3db8ff, #8b2dff)",
        "gradient-dark":
          "linear-gradient(135deg, #0d75b8 0%, #630fb5 50%, #500a91 100%)",
      },
      boxShadow: {
        "lg-primary": "0 20px 25px -5px rgba(61, 184, 255, 0.2)",
        "xl-primary": "0 25px 50px -12px rgba(61, 184, 255, 0.25)",
        "lg-secondary": "0 20px 25px -5px rgba(139, 45, 255, 0.2)",
        "xl-secondary": "0 25px 50px -12px rgba(139, 45, 255, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-up": "slideUp 0.6s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
