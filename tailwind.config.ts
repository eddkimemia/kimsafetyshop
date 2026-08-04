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
        navy: {
          DEFAULT: "#0F2847",
          50: "#EEF3FA",
          100: "#D8E3F2",
          200: "#B3C8E5",
          300: "#86A6D3",
          400: "#5580BC",
          500: "#3A6299",
          600: "#2B4E7C",
          700: "#1F3C61",
          800: "#163051",
          900: "#0F2847",
        },
        safety: {
          DEFAULT: "#F57C00",
          50: "#FFF4E5",
          100: "#FFE3BD",
          200: "#FFCC85",
          300: "#FFB04D",
          400: "#FF9A1F",
          500: "#F57C00",
          600: "#E06A00",
          700: "#B85500",
          800: "#8F4300",
          900: "#6B3200",
        },
        emerald: {
          DEFAULT: "#2E7D32",
        },
        surface: "#F8F9FA",
        line: "#E5E7EB",
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
        ink: "#0B1B2F",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,40,71,0.04), 0 4px 16px rgba(15,40,71,0.06)",
        cardHover:
          "0 2px 4px rgba(15,40,71,0.05), 0 12px 32px rgba(15,40,71,0.12)",
        soft: "0 8px 40px rgba(15,40,71,0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        fadeUp: "fadeUp 0.6s ease-out both",
      },
      maxWidth: {
        shell: "88rem",
      },
    },
  },
  plugins: [],
};
export default config;
