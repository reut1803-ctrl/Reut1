/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F2E8D5",
        blush: "#E8DAC0",
        rose: "#5B3418",
        roseDark: "#331D07",
        sand: "#D9C6A5",
        ink: "#2E2116",
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
