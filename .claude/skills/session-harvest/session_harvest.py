#!/usr/bin/env python3
"""
session_harvest.py — קוצר תובנות מהשיחה ומוסיף אותן ל-MEMORY.md.

דרישות:  pip install anthropic   +   משתנה סביבה ANTHROPIC_API_KEY
שימוש:
  - ידני:        python3 session_harvest.py <transcript.jsonl>
  - כ-Hook (PreCompact): Claude Code שולח JSON ב-stdin עם transcript_path.
יעד ברירת מחדל: MEMORY.md בשורש הפרויקט (אפשר לשנות עם MEMORY_FILE).
"""
import os, sys, json, datetime, pathlib

MEMORY_FILE = pathlib.Path(os.environ.get("MEMORY_FILE", "MEMORY.md"))


def read_transcript(path):
    rows = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line:
            continue
        try:
            o = json.loads(line)
        except Exception:
            continue
        m = o.get("message", o)
        role, content = m.get("role"), m.get("content")
        if isinstance(content, list):
            content = " ".join(c.get("text", "") for c in content if isinstance(c, dict))
        if role and content:
            rows.append(f"{role}: {content}")
    return "\n".join(rows)[-120000:]  # זנב, לשמירה על גבול טוקנים


def harvest(convo):
    from anthropic import Anthropic
    client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    prompt = (
        "נתח את השיחה והפק סיכום Markdown תמציתי בעברית עם הכותרות הבאות בלבד:\n"
        "### משימות שבוצעו\n### החלטות והסיבות שלהן\n"
        "### תובנות מניסוי וטעייה (מה שהתברר כאפשרי/בלתי-אפשרי)\n"
        "### סגנון הדיבור והביטויים של המשתמשת\n### כלים/סקילים חדשים שנבנו\n\n"
        "השיחה:\n" + convo
    )
    r = client.messages.create(
        model=os.environ.get("HARVEST_MODEL", "claude-sonnet-4-5"),
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    return r.content[0].text.strip()


def get_transcript_path():
    if not sys.stdin.isatty():
        try:
            return json.load(sys.stdin).get("transcript_path")
        except Exception:
            pass
    return sys.argv[1] if len(sys.argv) > 1 else None


def main():
    path = get_transcript_path()
    if not path or not os.path.exists(path):
        print("לא נמצא transcript", file=sys.stderr)
        return
    summary = harvest(read_transcript(path))
    stamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    block = f"\n\n---\n## קציר שיחה — {stamp}\n\n{summary}\n"
    with open(MEMORY_FILE, "a", encoding="utf-8") as f:
        f.write(block)
    print(f"✅ נוסף ל-{MEMORY_FILE}")


if __name__ == "__main__":
    main()
