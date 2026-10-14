// avatar-pipeline.js — ElevenLabs (שכפול קול + TTS) + HeyGen (דמות מדברת מונעת-אודיו)
// התקנה:  npm i node-fetch@2 form-data
// הרצה:   node avatar-pipeline.js
// משתני סביבה נדרשים: ELEVENLABS_API_KEY , HEYGEN_API_KEY , HEYGEN_AVATAR_ID
import fs from "node:fs";
import fetch from "node-fetch";
import FormData from "form-data";

const ELEVEN = process.env.ELEVENLABS_API_KEY;
const HEYGEN = process.env.HEYGEN_API_KEY;

// ---- התסריט שיוזרק לסרטון (אפשר גם לקרוא מקובץ script.txt) ----
const SCRIPT = process.env.SCRIPT_TEXT
  || (fs.existsSync("script.txt") ? fs.readFileSync("script.txt", "utf-8")
      : "כאן מדביקים את תסריט 'תפקיד השגרירה'.");

// 1) שכפול קול מיידי מדגימות אודיו
async function cloneVoice(name, sampleFiles) {
  const form = new FormData();
  form.append("name", name);
  sampleFiles.forEach((f) => form.append("files", fs.createReadStream(f)));
  const r = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST", headers: { "xi-api-key": ELEVEN, ...form.getHeaders() }, body: form });
  const d = await r.json();
  if (!r.ok) throw new Error("clone: " + JSON.stringify(d));
  return d.voice_id;
}

// 2) טקסט -> קול (עברית), שומר mp3
async function tts(voiceId, text, out) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": ELEVEN, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.8 } }) });
  if (!r.ok) throw new Error("tts: " + (await r.text()));
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  return out;
}

// 3) העלאת האודיו ל-HeyGen
async function uploadAudio(mp3) {
  const r = await fetch("https://upload.heygen.com/v1/asset", {
    method: "POST", headers: { "x-api-key": HEYGEN, "content-type": "audio/mpeg" },
    body: fs.readFileSync(mp3) });
  const d = await r.json();
  if (!r.ok) throw new Error("upload: " + JSON.stringify(d));
  return d.data.id;
}

// 4) יצירת סרטון דמות מדברת (אנכי לרילס)
async function createVideo(avatarId, audioAssetId, title) {
  const r = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST", headers: { "x-api-key": HEYGEN, "content-type": "application/json" },
    body: JSON.stringify({ title, dimension: { width: 720, height: 1280 },
      video_inputs: [{
        character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
        voice: { type: "audio", audio_asset_id: audioAssetId } }] }) });
  const d = await r.json();
  if (!r.ok) throw new Error("generate: " + JSON.stringify(d));
  return d.data.video_id;
}

// 5) המתנה עד שהסרטון מוכן
async function waitFor(videoId) {
  for (;;) {
    const r = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      { headers: { "x-api-key": HEYGEN } });
    const d = (await r.json()).data;
    if (d.status === "completed") return d.video_url;
    if (d.status === "failed") throw new Error("failed: " + JSON.stringify(d));
    await new Promise((s) => setTimeout(s, 5000));
  }
}

(async () => {
  if (!ELEVEN || !HEYGEN || !process.env.HEYGEN_AVATAR_ID)
    throw new Error("חסרים משתני סביבה: ELEVENLABS_API_KEY / HEYGEN_API_KEY / HEYGEN_AVATAR_ID");
  const samples = (process.env.VOICE_SAMPLES || "sample1.mp3,sample2.mp3").split(",");
  const voiceId = await cloneVoice("Reut", samples);          // דגימות הקול שלך
  const mp3 = await tts(voiceId, SCRIPT, "voice.mp3");
  const asset = await uploadAudio(mp3);
  const vid = await createVideo(process.env.HEYGEN_AVATAR_ID, asset, "תפקיד השגרירה");
  console.log("✅ הסרטון מוכן:", await waitFor(vid));
})().catch((e) => { console.error(e); process.exit(1); });
