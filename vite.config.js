import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vitejs.dev/config/
// כשמגדירים SINGLEFILE=1 — בונים קובץ HTML אחד עצמאי (להפעלה מקומית
// בלחיצה כפולה, ללא שרת). אחרת — בנייה רגילה.
export default defineConfig({
  plugins: [react(), ...(process.env.SINGLEFILE ? [viteSingleFile()] : [])],
  server: {
    port: 5173,
    open: true,
  },
});
