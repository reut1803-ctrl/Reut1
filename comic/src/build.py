# -*- coding: utf-8 -*-
import base64, os
from lib import defs
import panels_a as A
import panels_b as B

HERE = os.path.dirname(os.path.abspath(__file__))

def b64(p, mime):
    with open(os.path.join(HERE, p), 'rb') as f:
        return f'data:{mime};base64,' + base64.b64encode(f.read()).decode()

LOGO = b64('logo.jpg', 'image/jpeg')
QR   = b64('qr.png', 'image/png')

def font_face(path, family, weight):
    return (f"@font-face{{font-family:'{family}';font-weight:{weight};font-style:normal;"
            f"src:url({b64(path,'font/ttf')}) format('truetype');font-display:block;}}")

FONTS = (font_face('../fonts/f1.ttf', 'FrankRuhl', 400) +
         font_face('../fonts/f2.ttf', 'FrankRuhl', 700) +
         font_face('../fonts/f3.ttf', 'FrankRuhl', 900) +
         font_face('../fonts/f4.ttf', 'Heebo', 400) +
         font_face('../fonts/f5.ttf', 'Heebo', 700) +
         font_face('../fonts/f6.ttf', 'Heebo', 300) +
         font_face('../fonts/f7.ttf', 'Suez', 400))

# ---------------------------------------------------------------- overlay text
def cap(text, pos, w='76%', cls=''):
    return f'<div class="cap {cls}" style="{pos};max-width:{w}">{text}</div>'

def bub(text, pos, tail='br', w='auto', cls=''):
    return f'<div class="bub t-{tail} {cls}" style="{pos};max-width:{w}">{text}</div>'

def qcap(text, pos):
    return f'<div class="qcap" style="{pos}">{text}</div>'

P = []

# 1
P.append((A.p1(),
    cap('קרוב לארבעים זוגות זכיתי לשדך, ברוך השם.', 'top:2.4%;right:3%', '62%') +
    bub('אבל תמיד נשארו כאלה<br>שלא הצלחתי לעזור להם...', 'top:23%;left:3.5%', 'br', '52%', 'think')))

# 2
P.append((A.p2(),
    cap('כל כך הרבה מבקשי זוגיות משוועים לעזרה — ואין להם פתרון.', 'top:2.4%;right:3%', '66%') +
    bub('זה לא רק שאין לי בת זוג.', 'top:30%;right:4%', 'bl', '40%') +
    bub('זה שאין מי שבאמת<br>נמצא שם בשבילי.', 'top:44%;left:4%', 'br', '44%')))

# 3
P.append((A.p3(),
    cap('ואז הגיעה שנה אחת, שלא הייתה פשוטה.', 'top:2%;left:50.8%;right:3%;text-align:center', '94%', 'wide') +
    qcap('אברהם יוצא שוב למילואים.', 'top:41%;right:2.5%;width:44.5%') +
    qcap('שובאל, אחייני, נפל בלבנון.', 'top:41%;left:2.5%;width:44.5%') +
    qcap('אבא חלה. ונפטר.', 'bottom:2.5%;right:2.5%;width:44.5%') +
    qcap('ולהבדיל — נולדו חיים חדשים.', 'bottom:2.5%;left:2.5%;width:44.5%')))

# 4
P.append((A.p4(),
    cap('אבל אנחנו עם של אריות ולביאות — שצומחים דווקא מתוך המשברים.', 'top:2.4%;right:3%', '84%') +
    bub('אני רוצה מציאות<br>שבה אף אחד לא נשאר לבד.', 'top:22%;right:3.5%', 'bl', '46%') +
    bub('רק... איך עושים<br>דבר כזה?', 'top:23%;left:3.5%', 'br', '38%', 'think')))

# 5
P.append((A.p5(),
    cap('לוקחים קהילה שלמה — יישוב, קהילה עירונית, בוגרי אולפנות וישיבות.', 'top:2.4%;right:3%', '72%') +
    '<div class="tag" style="top:31%;right:4%">מְשַׁדְּכִים</div>' +
    '<div class="tag alt" style="top:31%;left:4%">מִשְׁתַּדְּכִים</div>' +
    bub('כולם משדכים — ואני<br>מלווה, מנחה ונותנת כלים.', 'bottom:3%;left:3.5%', 'tr', '56%')))

# 6
P.append((A.p6(),
    cap('ובמקביל — ליווי אישי של מאמני חתונה.', 'top:2.4%;right:3%', '62%') +
    bub('בכל רגע, על כל קושי<br>שעולה — יש לך עם מי לדבר.', 'top:15%;right:3.5%', 'bl', '50%') +
    bub('תמיד יש שם<br>מישהו בשבילי.', 'top:27%;left:3.5%', 'br', '38%')))

# 7
P.append((B.p7(),
    cap('מכאן התחיל מסע ארוך, עם שיתוף פעולה של המון אנשים.', 'top:2.4%;right:3%', '68%') +
    bub('אנחנו איתך.<br>בואו נבנה את זה.', 'top:26%;left:3.5%', 'br', '42%')))

# 8
P.append((B.p8(),
    cap('והגענו לרגע שבו המיזם שלנו ממש עומד להיוולד.', 'bottom:3%;right:3%', '72%')))

# 9
P.append((B.p9(),
    cap('כדי שהמהפכה הזאת באמת תקרה — נחוצים עוד כמה מאות שותפים.', 'top:2.4%;right:3%', '72%') +
    bub('אכפת לכם מאח או אחות<br>שנושאים את הכאב? תנו יד.', 'bottom:3%;left:3.5%', 'tr', '52%')))

# 10
P.append((B.p10(),
    cap('וכשזה קורה — קם בישראל בית חדש.', 'bottom:3%;right:3%', '68%')))

# 11
P.append((B.p11(),
    cap('כי כשקהילה שלמה לוקחת אחריות — אף אחד כבר לא נשאר לבד.', 'bottom:3%;right:3%', '78%')))

# 12 — the logo panel
P12 = f'''<div class="logopanel">
  <div class="goldframe">
    <svg class="orn" viewBox="0 0 300 200" preserveAspectRatio="none">
      <rect x="5" y="5" width="290" height="190" fill="none" stroke="#C9992B" stroke-width="4"/>
      <rect x="12" y="12" width="276" height="176" fill="none" stroke="#C9992B" stroke-width="1.6"/>
      <path d="M 5 26 q 16 -16 32 -16 M 295 26 q -16 -16 -32 -16 M 5 174 q 16 16 32 16 M 295 174 q -16 16 -32 16"
            fill="none" stroke="#C9992B" stroke-width="4"/>
      <circle cx="37" cy="10" r="3.4" fill="#C9992B"/><circle cx="263" cy="10" r="3.4" fill="#C9992B"/>
      <circle cx="37" cy="190" r="3.4" fill="#C9992B"/><circle cx="263" cy="190" r="3.4" fill="#C9992B"/>
    </svg>
    <img class="logo" src="{LOGO}" alt="יש לך בית">
  </div>
  <div class="banner">רוצים לקחת חלק? הצטרפו אלינו כאן:</div>
  <div class="bottomrow">
    <img class="qr" src="{QR}" alt="QR">
    <div class="linkcol">
      <div class="link">givechak.co.il/Bayit?ref=rk</div>
      <div class="sign">יעל בנימין, מפתחת המיזם</div>
    </div>
  </div>
</div>'''

panels_html = ''
for i, (art, over) in enumerate(P, start=1):
    panels_html += f'<div class="panel"><div class="num">{i}</div>{art}{over}</div>\n'
panels_html += f'<div class="panel p12"><div class="num">12</div>{P12}</div>'

HTML = f'''<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<title>יש לך בית — כך זה התחיל</title>
<style>
{FONTS}
*{{box-sizing:border-box;margin:0;padding:0}}
@page{{size:A4;margin:0}}
html,body{{width:210mm;height:297mm;background:#fff}}
body{{font-family:'Heebo',sans-serif;color:#141414;-webkit-font-smoothing:antialiased}}
.page{{position:relative;width:210mm;height:297mm;background:#FCF3DC;padding:6mm;overflow:hidden}}
.halftone{{position:absolute;inset:0;pointer-events:none;z-index:9;opacity:.13;mix-blend-mode:multiply;
  background-image:radial-gradient(#2A2A2A 26%,transparent 27%);background-size:.62mm .62mm}}
.grain{{position:absolute;inset:0;pointer-events:none;opacity:.07;mix-blend-mode:multiply;z-index:10;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/></filter><rect width='240' height='240' filter='url(%23n)' opacity='0.5'/></svg>")}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(4,1fr);
  gap:3.4mm;width:100%;height:100%;direction:rtl}}
.panel{{position:relative;overflow:hidden;background:#F6E7C1;border:1.25mm solid #141414;
  border-radius:0;box-shadow:.6mm .6mm 0 rgba(20,20,20,.35)}}
.art{{position:absolute;inset:0;width:100%;height:100%;display:block}}
.num{{position:absolute;bottom:0;left:0;z-index:6;font-family:'Heebo',sans-serif;font-weight:700;
  font-size:2.3mm;color:#FCF3DC;background:#141414;padding:.4mm 1.3mm}}
.cap{{position:absolute;z-index:5;background:#FBEFC0;border:.45mm solid #141414;border-radius:0;
  padding:1.1mm 1.7mm;font-family:'Heebo',sans-serif;font-weight:700;font-size:2.75mm;line-height:1.32;
  color:#141414;box-shadow:.5mm .5mm 0 rgba(20,20,20,.45)}}
.cap.wide{{text-align:center}}
.qcap{{position:absolute;z-index:5;background:#FBEFC0;border:.42mm solid #141414;
  padding:.8mm 1.3mm;font-family:'Heebo',sans-serif;font-weight:700;
  font-size:2.5mm;line-height:1.26;text-align:center;color:#141414;
  box-shadow:.4mm .4mm 0 rgba(20,20,20,.4)}}
.bub{{position:absolute;z-index:5;background:#FFFFFF;border:.45mm solid #141414;
  border-radius:50%/40%;padding:1.9mm 2.6mm;font-family:'Heebo',sans-serif;font-weight:700;
  font-size:2.6mm;line-height:1.30;text-align:center;color:#141414}}
.bub::before,.bub::after{{content:'';position:absolute;width:0;height:0;border-style:solid;
  border-color:transparent}}
.bub.t-br::before{{bottom:-3.1mm;right:3.2mm;border-width:3.1mm 2.3mm 0 2.3mm;border-top-color:#141414}}
.bub.t-br::after{{bottom:-2.2mm;right:3.75mm;border-width:2.3mm 1.55mm 0 1.55mm;border-top-color:#FFFFFF}}
.bub.t-bl::before{{bottom:-3.1mm;left:3.2mm;border-width:3.1mm 2.3mm 0 2.3mm;border-top-color:#141414}}
.bub.t-bl::after{{bottom:-2.2mm;left:3.75mm;border-width:2.3mm 1.55mm 0 1.55mm;border-top-color:#FFFFFF}}
.bub.t-tr::before{{top:-3.1mm;right:3.2mm;border-width:0 2.3mm 3.1mm 2.3mm;border-bottom-color:#141414}}
.bub.t-tr::after{{top:-2.2mm;right:3.75mm;border-width:0 1.55mm 2.3mm 1.55mm;border-bottom-color:#FFFFFF}}
.bub.t-tl::before{{top:-3.1mm;left:3.2mm;border-width:0 2.3mm 3.1mm 2.3mm;border-bottom-color:#141414}}
.bub.t-tl::after{{top:-2.2mm;left:3.75mm;border-width:0 1.55mm 2.3mm 1.55mm;border-bottom-color:#FFFFFF}}
.bub.think{{border-radius:46%/38%;border-style:dashed;border-width:.4mm}}
.bub.think::before{{bottom:-2.4mm;right:4mm;width:1.8mm;height:1.8mm;border:.35mm solid #141414;
  border-radius:50%;background:#FFF;border-color:#141414}}
.bub.think::after{{bottom:-4.4mm;right:2.4mm;width:1.1mm;height:1.1mm;border:.32mm solid #141414;
  border-radius:50%;background:#FFF;border-color:#141414}}
.tag{{position:absolute;z-index:5;font-family:'Suez',serif;font-size:2.7mm;color:#FFFFFF;
  background:#2E8F90;padding:.7mm 1.5mm;border:.4mm solid #141414;transform:rotate(-3deg);
  box-shadow:.5mm .5mm 0 rgba(20,20,20,.5)}}
.tag.alt{{background:#6B4A86;transform:rotate(3deg)}}
/* panel 12 */
.p12{{background:#FBEFC0;display:flex;align-items:center;justify-content:center}}
.logopanel{{width:100%;height:100%;padding:2.4mm 2.2mm;display:flex;flex-direction:column;
  align-items:center;justify-content:space-between;text-align:center}}
.goldframe{{position:relative;width:100%;padding:1.8mm;background:#FBF4E4;
  border:.4mm solid #141414;box-shadow:.5mm .5mm 0 rgba(20,20,20,.4)}}
.orn{{position:absolute;inset:0;width:100%;height:100%}}
.logo{{position:relative;width:100%;display:block}}
.banner{{width:100%;background:#6B4A86;color:#FBEFC0;border:.4mm solid #141414;
  font-family:'Heebo',sans-serif;font-weight:700;font-size:2.6mm;line-height:1.25;
  padding:1.1mm .8mm;box-shadow:.5mm .5mm 0 rgba(20,20,20,.4)}}
.bottomrow{{display:flex;align-items:center;gap:2.2mm;width:100%;justify-content:space-between}}
.qr{{width:16mm;height:16mm;border:.45mm solid #141414;background:#FBF4E4}}
.linkcol{{flex:1;text-align:right}}
.link{{font-family:'Heebo',sans-serif;font-weight:700;font-size:2.65mm;color:#141414;
  direction:ltr;text-align:right;word-break:break-all;line-height:1.22}}
.sign{{margin-top:1mm;font-family:'Heebo',sans-serif;font-weight:700;font-size:2.4mm;color:#6B4A86}}
</style></head><body>
{defs()}
<div class="page"><div class="grid">
{panels_html}
</div><div class="halftone"></div><div class="grain"></div></div>
</body></html>'''

out = os.path.join(HERE, 'page.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(HTML)
print('written', out, len(HTML))
