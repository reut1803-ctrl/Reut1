/** @type {import('tailwindcss').Config} */
// ערכת נושא ייעודית למערכת הזו: גווני כחול, טורקיז ותכלת.
// נבחרה לבידול ויזואלי מוחלט מכל מערכת אחרת.
// הזהב נשמר מהלוגו, ומשמש כמבטא חם יחיד על הרקע הקריר.
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F2F8FB",      // רקע הדפים – תכלת בהיר מאוד
        blush: "#DCEEF5",      // משטחים רכים
        petal: "#A8D8E8",      // תכלת להדגשות
        rose: "#2E8BA8",       // הצבע הראשי – כחול-טורקיז
        roseDark: "#1F6E88",   // ראשי כהה, למעבר עכבר ולחיצה
        peach: "#9EDAE6",      // טורקיז בהיר – תגיות וסימונים
        sage: "#5FB3C6",       // טורקיז – הצבע המשני
        sageDeep: "#2FA39B",   // טורקיז עמוק
        sand: "#CFE3EC",       // קווי מתאר והפרדות
        ink: "#23414E",        // צבע הטקסט – כחול לילה
        gold: "#C9A063",       // זהב הלוגו
        forest: "#1B4F5E",     // כחול עמוק
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "Heebo", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(31, 110, 136, 0.12)",
      },
    },
  },
  plugins: [],
};
