/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F2",
        sand: "#F3EADF",
        rose: { DEFAULT: "#C76A6A", dark: "#A84F4F" },
        bordeaux: "#7A2E3B",
        gold: { light: "#E9D3A6", DEFAULT: "#C9A45C", dark: "#9C7A35" },
        ink: { DEFAULT: "#4A3B39", soft: "#6E5B58" },
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "sans-serif"],
        display: ["var(--font-frank)", "serif"],
      },
      boxShadow: {
        luxe: "0 30px 80px -20px rgba(122,46,59,0.25), 0 10px 30px -10px rgba(122,46,59,0.15)",
        glow: "0 0 0 1px rgba(201,164,92,0.35), 0 20px 50px -15px rgba(201,164,92,0.45)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        float: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(30px,-40px) scale(1.08)" } },
      },
      animation: {
        shimmer: "shimmer 4s linear infinite",
        float: "float 14s ease-in-out infinite",
        "float-slow": "float 22s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
