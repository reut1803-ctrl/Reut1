/** @type {import('tailwindcss').Config} */
// פלטת הצבעים הופקה בדגימה ישירה מתמונת ההשראה של הלקוחה
// (design/palette-inspiration.jpg): גווני פסטל רכים של ורוד, אפרסק,
// שמנת וירוק מרווה. הזהב והירוק העמוק לקוחים מהלוגו.
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF3EA",      // רקע הדפים – שמנת חמימה
        blush: "#F7DFD8",      // משטחים רכים
        petal: "#F1B3A6",      // ורוד פסטל להדגשות
        rose: "#DE8C7C",       // הצבע הראשי – ורוד אלמוג
        roseDark: "#C06E5E",   // ראשי כהה, למעבר עכבר ולחיצה
        peach: "#EFC9A8",      // אפרסק – תגיות וסימונים
        sage: "#B0BB9C",       // ירוק מרווה רך – הצבע המשני
        sageDeep: "#8C9A78",   // ירוק מרווה עמוק
        sand: "#EADCCB",       // קווי מתאר והפרדות
        ink: "#5A4A3C",        // צבע הטקסט
        gold: "#C9A063",       // זהב הלוגו
        forest: "#3F5540",     // ירוק עמוק מהלוגו
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "Heebo", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(192, 110, 94, 0.10)",
      },
    },
  },
  plugins: [],
};
