import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Theme colors
        glassmorphism: {
          bg: "#0A0F1E",
          sidebar: "rgba(255,255,255,0.04)",
          sidebarBorder: "rgba(255,255,255,0.08)",
          botBubble: "rgba(255,255,255,0.04)",
          botBubbleBorder: "rgba(255,255,255,0.08)",
          userBubbleFrom: "#6366F1",
          userBubbleTo: "#8B5CF6",
          accent: "#6366F1",
          textPrimary: "#ffffff",
          textSecondary: "rgba(255,255,255,0.6)",
          card: "rgba(255,255,255,0.04)",
          cardBorder: "rgba(255,255,255,0.08)",
          cardHover: "rgba(255,255,255,0.06)",
        },
        brutalism: {
          bg: "#FFFBF0",
          sidebar: "#ffffff",
          botBubble: "#FEF08A",
          userBubble: "#000000",
          accent: "#FF5733",
          textPrimary: "#000000",
          textSecondary: "rgba(0,0,0,0.6)",
          card: "#ffffff",
        },
        aurora: {
          bgFrom: "#F0F4FF",
          bgVia: "#FDF0FF",
          bgTo: "#F0FFF4",
          sidebar: "rgba(255,255,255,0.8)",
          botBubble: "#ffffff",
          botBubbleBorder: "rgba(167,139,250,0.2)",
          userBubbleFrom: "#667EEA",
          userBubbleTo: "#764BA2",
          accent: "#A78BFA",
          textPrimary: "#111827",
          textSecondary: "#6B7280",
          card: "rgba(255,255,255,0.8)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;