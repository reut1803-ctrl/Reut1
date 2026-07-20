/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F6F5F3",
        surface: "#FFFFFF",
        ink: "#3B2E33",
        muted: "#8B7B80",
        pink: {
          50: "#FDF1F5",
          100: "#FBE4EC",
          200: "#F6C9D8",
          400: "#EE8FAE",
          500: "#E5628F",
          600: "#D3466F",
        },
        bordeaux: {
          50: "#F6E9EC",
          100: "#EBD3D9",
          400: "#9C4257",
          500: "#7C2D42",
          600: "#5C1F30",
        },
        mint: {
          50: "#E7FBEF",
          100: "#CFF6DE",
          400: "#3ED27F",
          500: "#22B96A",
          600: "#189253",
        },
      },
      fontFamily: {
        sans: ["Rubik", "Heebo", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(124, 45, 66, 0.08)",
        card: "0 4px 20px rgba(59, 46, 51, 0.07)",
        float: "0 8px 24px rgba(0, 0, 0, 0.18)",
      },
      borderRadius: {
        "2.5xl": "1.375rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(16px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      animation: {
        "slide-up": "slide-up .28s ease-out",
        "fade-in": "fade-in .2s ease-out",
      },
    },
  },
  plugins: [],
};
