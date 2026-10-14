---
name: avatar-pipeline
description: "הפקת סרטון דמות מדברת — משכפל את הקול ב-ElevenLabs, ממיר את התסריט לקול, ומייצר ב-HeyGen סרטון אווטאר מונע-אודיו. הפעל כשהמשתמשת מבקשת 'לייצר סרטון דמות מדברת' / 'סרטון אווטאר' / 'להפיק את סרטון השגרירה עם דמות'."
---

# avatar-pipeline — סרטון דמות מדברת (ElevenLabs + HeyGen)

הפעל כשהמשתמשת מבקשת להפיק סרטון עם דמות מדברת.

## שלבים
1. ודא שקיימים משתני הסביבה (אם חסר — **בקש מהמשתמשת** את המפתח):
   - `ELEVENLABS_API_KEY` — מפתח ElevenLabs.
   - `HEYGEN_API_KEY` — מפתח HeyGen.
   - `HEYGEN_AVATAR_ID` — מזהה הדמות ב-HeyGen.
   - `VOICE_SAMPLES` (אופציונלי) — קובצי דגימת קול, מופרדים בפסיק (ברירת מחדל `sample1.mp3,sample2.mp3`).
2. **הזרקת התסריט:** כתוב את התסריט לקובץ `script.txt` באותה תיקייה, **או** העבר אותו במשתנה סביבה:
   ```bash
   SCRIPT_TEXT="<התסריט המלא כאן>" node .claude/skills/avatar-pipeline/avatar-pipeline.js
   ```
3. הרץ:
   ```bash
   npm i node-fetch@2 form-data
   node .claude/skills/avatar-pipeline/avatar-pipeline.js
   ```
4. הסקריפט ידפיס בסוף **כתובת להורדת הסרטון** (video_url).

## הערות
- התסריט נלקח מ-`SCRIPT_TEXT`, ואם אין — מקובץ `script.txt`.
- שמות ה-endpoints/שדות של ElevenLabs/HeyGen עשויים להשתנות; במקרה של שגיאה, הצלב מול התיעוד העדכני שלהם והתאם.
