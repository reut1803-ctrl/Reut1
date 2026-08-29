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
    cap('אבל אנחנו עם של אריות ולביאות — שצומחים דווקא מתוך המשברים.', 'top:2.4%;right:3%', '70%') +
    bub('אני רוצה מציאות<br>שבה אף אחד לא נשאר לבד.', 'top:17%;right:3.5%', 'bl', '46%') +
    bub('רק... איך עושים<br>דבר כזה?', 'top:18%;left:3.5%', 'br', '38%', 'think')))

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
    bub('אם אכפת לכם מאח או אחות<br>שנושאים את הכאב הזה — תנו יד.', 'bottom:3%;left:3.5%', 'tr', '60%')))

# 10
P.append((B.p10(),
    cap('וכשזה קורה — קם בישראל בית חדש.', 'bottom:3%;right:3%', '68%')))

# 11
P.append((B.p11(),
    cap('כי כשקהילה שלמה לוקחת אחריות — אף אחד כבר לא נשאר לבד.', 'top:2.4%;right:3%', '74%')))

# 12 — the logo panel
P12 = f'''<div class="logopanel">
  <img class="logo" src="{LOGO}" alt="יש לך בית">
  <div class="thanks">תודה על השותפות שלכם</div>
  <div class="bottomrow">
    <img class="qr" src="{QR}" alt="QR">
    <div class="linkcol">
      <div class="linklab">להצטרפות ולשותפות:</div>
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
body{{font-family:'FrankRuhl',serif;color:#17323A;-webkit-font-smoothing:antialiased}}
.page{{position:relative;width:210mm;height:297mm;background:#FBF4E4;padding:6.5mm;overflow:hidden}}
.grain{{position:absolute;inset:0;pointer-events:none;opacity:.10;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/></filter><rect width='240' height='240' filter='url(%23n)' opacity='0.55'/></svg>");
  z-index:9}}
.vig{{position:absolute;inset:0;pointer-events:none;z-index:8;
  background:radial-gradient(120% 90% at 50% 45%,rgba(0,0,0,0) 55%,rgba(90,70,40,.13) 100%)}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(4,1fr);
  gap:3.2mm;width:100%;height:100%;direction:rtl}}
.panel{{position:relative;overflow:hidden;background:#F7EDD6;border:1.0mm solid #17323A;
  border-radius:1.2mm;box-shadow:0 .5mm 1.2mm rgba(23,50,58,.22)}}
.art{{position:absolute;inset:0;width:100%;height:100%;display:block}}
.num{{position:absolute;bottom:0;left:0;z-index:6;font-family:'Heebo',sans-serif;font-weight:700;
  font-size:2.4mm;color:#FBF4E4;background:#17323A;padding:.5mm 1.4mm;border-top-right-radius:1.2mm}}
.cap{{position:absolute;z-index:5;background:#FDF7E9;border:.35mm solid #17323A;border-radius:.8mm;
  padding:1.1mm 1.6mm;font-family:'FrankRuhl',serif;font-weight:700;font-size:2.75mm;line-height:1.30;
  color:#17323A;box-shadow:.4mm .4mm 0 rgba(23,50,58,.30)}}
.cap.wide{{text-align:center}}
.qcap{{position:absolute;z-index:5;background:rgba(253,247,233,.94);border:.3mm solid #17323A;
  border-radius:.7mm;padding:.8mm 1.2mm;font-family:'FrankRuhl',serif;font-weight:700;
  font-size:2.45mm;line-height:1.25;text-align:center;color:#17323A}}
.bub{{position:absolute;z-index:5;background:#FFFDF6;border:.32mm solid #17323A;
  border-radius:3mm;padding:1.5mm 2mm;font-family:'Heebo',sans-serif;font-weight:400;
  font-size:2.55mm;line-height:1.32;text-align:center;color:#17323A;
  box-shadow:.35mm .35mm 0 rgba(23,50,58,.22)}}
.bub::after{{content:'';position:absolute;width:2.6mm;height:2.6mm;background:#FFFDF6;
  border-right:.32mm solid #17323A;border-bottom:.32mm solid #17323A}}
.bub.t-br::after{{bottom:-1.5mm;right:3mm;transform:rotate(35deg) skew(10deg)}}
.bub.t-bl::after{{bottom:-1.5mm;left:3mm;transform:rotate(55deg) skew(-10deg)}}
.bub.t-tr::after{{top:-1.5mm;right:3mm;transform:rotate(215deg) skew(10deg)}}
.bub.t-tl::after{{top:-1.5mm;left:3mm;transform:rotate(235deg) skew(-10deg)}}
.bub.think{{border-radius:4mm;border-style:dashed}}
.bub.think::after{{display:none}}
.bub.think::before{{content:'';position:absolute;bottom:-2.6mm;right:4mm;width:1.9mm;height:1.9mm;
  border-radius:50%;background:#FFFDF6;border:.3mm solid #17323A;
  box-shadow:-1.6mm 1.9mm 0 -.35mm #FFFDF6, -1.6mm 1.9mm 0 0 #17323A}}
.tag{{position:absolute;z-index:5;font-family:'Suez',serif;font-size:2.6mm;color:#FBF4E4;
  background:#1F7A7F;padding:.7mm 1.4mm;border-radius:.7mm;transform:rotate(-3deg);
  box-shadow:.4mm .4mm 0 rgba(23,50,58,.35)}}
.tag.alt{{background:#5E3A6E;transform:rotate(3deg)}}
/* panel 12 */
.p12{{background:#FBF4E4;display:flex;align-items:center;justify-content:center}}
.logopanel{{width:100%;height:100%;padding:2.6mm 2.4mm;display:flex;flex-direction:column;
  align-items:center;justify-content:space-between;text-align:center}}
.logo{{width:100%;border-radius:.8mm;border:.3mm solid rgba(23,50,58,.35)}}
.thanks{{font-family:'Suez',serif;font-size:3.0mm;color:#5E3A6E;letter-spacing:.02em}}
.bottomrow{{display:flex;align-items:center;gap:2.2mm;width:100%;justify-content:space-between}}
.qr{{width:15mm;height:15mm;border:.3mm solid #17323A;border-radius:.6mm;background:#FBF4E4}}
.linkcol{{flex:1;text-align:right}}
.linklab{{font-family:'Heebo',sans-serif;font-weight:700;font-size:2.3mm;color:#1F7A7F}}
.link{{font-family:'Heebo',sans-serif;font-weight:700;font-size:2.5mm;color:#17323A;
  direction:ltr;text-align:right;word-break:break-all;line-height:1.25}}
.sign{{margin-top:.8mm;font-family:'FrankRuhl',serif;font-weight:700;font-size:2.4mm;color:#5E3A6E}}
</style></head><body>
{defs()}
<div class="page"><div class="grid">
{panels_html}
</div><div class="vig"></div><div class="grain"></div></div>
</body></html>'''

out = os.path.join(HERE, 'page.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(HTML)
print('written', out, len(HTML))
