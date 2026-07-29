/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#E8DCCB",
        blush: "#F0E2DE",
        rose: "#844442",
        roseDark: "#5E2F2D",
        sand: "#CCBDAB",
        ink: "#3A2E26",
      },
      fontFamily: {
        sans: ["Heebo", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(167, 79, 79, 0.08)",
      },
    },
  },
  plugins: [],
};
