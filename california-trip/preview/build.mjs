// בונה את התצוגה המקדימה לצ'אט מאותו קוד בדיוק של האתר.
// שימוש: node preview/build.mjs <קובץ-פלט> [קובץ-תמונות-json]
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const out = process.argv[2] ?? resolve(here, "california-trip-preview.html");
const facesFile = process.argv[3];

const res = await build({
  entryPoints: [resolve(here, "entry.tsx")],
  bundle: true, minify: true, format: "iife", write: false, jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  alias: { "@": resolve(root, "src"), "next/link": resolve(here, "shims/link.tsx"), "next/navigation": resolve(here, "shims/navigation.ts") },
  loader: { ".css": "empty" },
  logLevel: "error",
});
const js = res.outputFiles[0].text.replaceAll("</script", "<\\/script");
const css = ["src/app/globals.css", "src/app/home.css", "src/app/app.css", "node_modules/leaflet/dist/leaflet.css"]
  .map((f) => readFileSync(resolve(root, f), "utf8")).join("\n");
const faces = facesFile ? `window.__ctDemoFaces=${readFileSync(facesFile, "utf8")};` : "";

writeFileSync(out, `<title>קליפורניה שלנו</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&family=Noto+Sans+Hebrew:wght@400;500;600;700;800&display=swap">
<style>
${css}
</style>
<div id="root"></div>
<script>document.documentElement.lang="he";document.documentElement.dir="rtl";window.__ctForceDemo=true;${faces}</script>
<script>
${js}
</script>
`);
console.log("wrote", out);
