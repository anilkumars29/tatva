/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6258E8",
          light: "#7B72ED",
          dark: "#4A3FC0",
          container: "#E3DFFF",
        },
        secondary: {
          DEFAULT: "#15A894",
          light: "#1DBDA7",
          dark: "#0D7A6B",
          container: "#7AF4DD",
        },
        tertiary: {
          DEFAULT: "#F3BC63",
          dark: "#A56A00",
          container: "rgba(243,188,99,0.16)",
        },
        neutral: {
          DEFAULT: "#20212B",
          muted: "rgba(32,33,43,0.5)",
          placeholder: "rgba(32,33,43,0.45)",
        },
        surface: {
          DEFAULT: "#F7F7F3",
          dim: "#DAD9E6",
          bright: "#FBFBFF",
          "container-lowest": "#FFFFFF",
          "container-low": "#F4F2FF",
          container: "#EEECFB",
          "container-high": "#E8E7F5",
          "container-highest": "#E2E1EF",
        },
        border: {
          DEFAULT: "#E5E5DE",
          subtle: "#EDEDE7",
        },
        error: { DEFAULT: "#BA1A1A", container: "#FFDAD6" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "4rem", letterSpacing: "-0.025em" }],
        "headline-lg": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.02em" }],
        "headline-md": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.015em" }],
        "headline-sm": ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        "title-md": ["1.125rem", { lineHeight: "1.5rem", letterSpacing: "-0.005em" }],
        "body-lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "body-md": ["0.9375rem", { lineHeight: "1.5rem" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.25rem", letterSpacing: "0.005em" }],
        "label-md": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.01em" }],
        "label-sm": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.04em" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        "level-2": "0 4px 20px -2px rgba(32,33,43,0.05), 0 2px 6px -1px rgba(32,33,43,0.02)",
        "level-3": "0 16px 36px -4px rgba(32,33,43,0.08), 0 6px 12px -2px rgba(32,33,43,0.03)",
        "focus-primary": "0 0 0 3px rgba(98,88,232,0.12)",
        "focus-secondary": "0 0 0 3px rgba(21,168,148,0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "waveform": "waveform 1.2s ease-in-out infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "shimmer": "shimmer 1.8s linear infinite",
      },
      keyframes: {
        waveform: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
