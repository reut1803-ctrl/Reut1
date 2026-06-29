/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F2",
        blush: "#F7E9E6",
        rose: "#C76A6A",
        roseDark: "#A84F4F",
        sand: "#EFE7DC",
        ink: "#4A4039",
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
