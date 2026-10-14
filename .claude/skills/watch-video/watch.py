#!/usr/bin/env python3
"""
watch.py — מפרק סרטון לפריימים + תמלול מסונכרן, כדי שקלוד יוכל "לצפות" בו.

דרישות:
  - ffmpeg + ffprobe מותקנים ונמצאים ב-PATH.
  - אופציונלי לתמלול:  pip install -U openai-whisper   (רץ מקומית; בהרצה הראשונה מוריד מודל פעם אחת)

שימוש:
  python3 watch.py "<path-to-video>" --interval 4
פלט:
  watch_output/<video-name>/frames/*.jpg , transcript.(txt|json) , manifest.json
"""
import os, sys, json, subprocess, argparse, pathlib, shutil


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def probe_duration(video):
    try:
        out = subprocess.check_output(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
             "-of", "json", video])
        return round(float(json.loads(out)["format"]["duration"]), 1)
    except Exception:
        return None


def extract_frames(video, outdir, interval):
    frames_dir = outdir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    # פריים אחד כל `interval` שניות, מוקטן לרוחב 640 לחיסכון.
    run(["ffmpeg", "-y", "-i", video, "-vf",
         f"fps=1/{interval},scale=640:-1", str(frames_dir / "f_%04d.jpg")])
    frames, mapping = sorted(frames_dir.glob("f_*.jpg")), []
    for i, f in enumerate(frames):
        t = round(i * interval, 1)
        new = frames_dir / f"frame_{i+1:04d}_t{t}s.jpg"
        f.rename(new)
        mapping.append({"frame": new.name, "time_sec": t})
    return mapping


def extract_audio(video, outdir):
    wav = outdir / "audio.wav"
    try:
        run(["ffmpeg", "-y", "-i", video, "-vn", "-ac", "1", "-ar", "16000", str(wav)])
        return wav if wav.exists() and wav.stat().st_size > 1000 else None
    except Exception:
        return None


def transcribe(wav, outdir):
    try:
        import whisper  # openai-whisper
    except ImportError:
        return None
    try:
        model = whisper.load_model("small")  # base / small / medium — איכות מול מהירות
        res = model.transcribe(str(wav), language="he")
    except Exception as e:
        print("תמלול נכשל:", e, file=sys.stderr)
        return None
    segs = [{"start": round(s["start"], 1), "end": round(s["end"], 1),
             "text": s["text"].strip()} for s in res.get("segments", [])]
    (outdir / "transcript.json").write_text(
        json.dumps(segs, ensure_ascii=False, indent=2), encoding="utf-8")
    (outdir / "transcript.txt").write_text(
        "\n".join(f"[{s['start']}s] {s['text']}" for s in segs), encoding="utf-8")
    return segs


def spoken_at(segs, t, interval):
    if not segs:
        return ""
    return " ".join(s["text"] for s in segs if s["start"] < t + interval and s["end"] > t)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--interval", type=float, default=4.0)
    a = ap.parse_args()

    if not os.path.exists(a.video):
        sys.exit("קובץ לא נמצא: " + a.video)
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg לא מותקן / לא ב-PATH.")

    outdir = pathlib.Path("watch_output") / pathlib.Path(a.video).stem
    if outdir.exists():
        shutil.rmtree(outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    frames = extract_frames(a.video, outdir, a.interval)
    wav = extract_audio(a.video, outdir)
    segs = transcribe(wav, outdir) if wav else None
    for fr in frames:
        fr["spoken"] = spoken_at(segs, fr["time_sec"], a.interval)

    manifest = {"video": a.video, "interval_sec": a.interval,
                "duration_sec": probe_duration(a.video),
                "has_transcript": bool(segs), "frames": frames}
    (outdir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ מוכן: {outdir}")
    print(f"   {len(frames)} פריימים | תמלול: {'כן' if segs else 'לא (אין דיבור / Whisper לא מותקן)'}")
    print("   השלב הבא: קלוד קורא את manifest.json ופותח את התמונות ב-frames/ כדי להפיק דוח צפייה.")


if __name__ == "__main__":
    main()
