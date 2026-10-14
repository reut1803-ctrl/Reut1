---
name: session-harvest
description: "קציר זיכרון — מחלץ מהשיחה משימות, החלטות והסיבות, תובנות מניסוי-וטעייה, את סגנון הדיבור של המשתמשת וכלים חדשים שנבנו, ומוסיף אותם ל-MEMORY.md. הפעל כשהמשתמשת מבקשת 'לחלץ זיכרון' / 'לקצור את השיחה' / 'תשמור מה שלמדנו', וגם רגע לפני צמצום שיחה (/compact)."
---

# session-harvest — קציר זיכרון ל-MEMORY.md

הפעל את הסקיל כשהמשתמשת מבקשת לחלץ/לקצור זיכרון, או לפני `/compact`.

## שלבים
1. הרץ את הסקריפט (ידנית מעבירים את נתיב ה-transcript; ב-Hook הנתיב מגיע אוטומטית ב-stdin):
   ```bash
   python3 .claude/skills/session-harvest/session_harvest.py "<transcript.jsonl>"
   ```
2. הסקריפט קורא את תמלול השיחה, מפיק סיכום מובנה (משימות · החלטות+סיבות · תובנות מניסוי-וטעייה · סגנון הדיבור של המשתמשת · כלים/סקילים שנבנו), ו**מוסיף אותו לקובץ `MEMORY.md`** בשורש הפרויקט תחת כותרת עם תאריך.
3. אם צריך, סכם למשתמשת בשורה אחת מה נשמר.

## דרישות / משתני סביבה
- `pip install anthropic`
- `ANTHROPIC_API_KEY` — חובה (אם חסר, בקש מהמשתמשת).
- אופציונלי: `MEMORY_FILE` (ברירת מחדל `MEMORY.md`), `HARVEST_MODEL`.

## הפעלה אוטומטית לפני צמצום (Hook) — ב-~/.claude/settings.json במחשב שלך
```json
{ "hooks": { "PreCompact": [ { "matcher": "",
  "hooks": [ { "type": "command",
    "command": "python3 .claude/skills/session-harvest/session_harvest.py" } ] } ] } }
```
