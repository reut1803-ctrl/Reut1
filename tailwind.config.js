/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF6EE",
        blush: "#F3E8D8",
        rose: "#6F4A2E",
        roseDark: "#4E3220",
        sand: "#EAE0CD",
        ink: "#3B332A",
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
