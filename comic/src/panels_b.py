# -*- coding: utf-8 -*-
from lib import *
from panels_a import frame
import math


# ---------------------------------------------------------------- PANEL 7
def p7():
    o = rect(0, 0, W, H, '#ECE1C6', .92)
    o += f'<ellipse cx="300" cy="300" rx="280" ry="220" fill="url(#glow)"/>'
    o += ink('M 300 0 v 40', 2.0, .7)
    o += wash('M 254 40 q 46 -30 92 0 Z', '#4E6B4A', .95) + ink('M 254 40 q 46 -30 92 0 Z', 2.0, .8)
    # people around the far side of the table
    for i, x in enumerate([78, 176, 274, 372, 470]):
        kind = ['man', 'woman', 'man', 'woman', 'man'][i]
        col = ['#2E4374', '#7A5570', '#4E6B4A', '#8C5A3C', '#3A5A6B'][i]
        o += mini_person(x, 356, 178, kind, col, '#4A3526', 'soft')
    # the big table
    o += wash('M 24 356 L 576 356 L 528 512 L 72 512 Z', '#A8703F', .95)
    o += ink('M 24 356 L 576 356 L 528 512 L 72 512 Z', 2.6, .9)
    o += wash('M 24 356 L 576 356 L 572 372 L 28 372 Z', '#C08A52', .9)
    # plans and papers on the table
    papers = [(112, 392, 118, 62, -4), (250, 386, 130, 70, 3), (398, 394, 112, 60, -3),
              (176, 452, 116, 46, 5), (330, 456, 122, 44, -5)]
    for (x, y, w, h, rot) in papers:
        o += (f'<g transform="rotate({rot} {x+w/2} {y+h/2})">' + rect(x, y, w, h, '#FCF6E6', .98, rx=3)
              + ink(f'M {x} {y} h {w} v {h} h {-w} Z', 1.8, .7)
              + ink(f'M {x+10} {y+16} h {w-24} M {x+10} {y+28} h {w-40} M {x+10} {y+40} h {w-30}', 1.4, .35)
              + '</g>')
    o += ink('M 300 400 v -20 l 26 -18 l 26 18 v 20 Z', 2.0, .8)
    # near side: two figures seen from behind, shoulders only
    for x, c in [(180, '#5E3A6E'), (420, '#3A5A6B')]:
        o += wash(f'M {x-86} 660 Q {x} 520 {x+86} 660 Z', c, .9)
        o += ink(f'M {x-86} 660 Q {x} 520 {x+86} 660', 2.4, .8)
        o += ell(x, 540, 34, 38, SKIN, 1)
        o += ink(f'M {x-34} 540 a 34 38 0 1 1 68 0 a 34 38 0 1 1 -68 0', 2.2)
        o += hair_long(x, 540, 34, '#4A3526', 'both', 34)
    # hands meeting over the table
    o += ink('M 262 486 q 22 -16 44 -2 q 20 12 40 -4', 2.6, .55)
    return frame(o)


# ---------------------------------------------------------------- PANEL 8
def p8():
    o = f'<rect width="{W}" height="{H}" fill="url(#dawn)"/>'
    o += f'<circle cx="472" cy="176" r="70" fill="#FFE9AE" opacity=".85" filter="url(#soft)"/>'
    o += f'<circle cx="472" cy="176" r="170" fill="url(#glow)"/>'
    o += wash('M 0 372 Q 150 330 300 358 Q 450 386 600 344 L 600 660 L 0 660 Z', '#C9BE99', .8)
    o += wash('M 0 430 Q 160 404 320 428 Q 470 450 600 420 L 600 660 L 0 660 Z', '#B2A87F', .7)
    # the house under construction
    o += wash('M 176 470 L 176 320 L 300 236 L 424 320 L 424 470 Z', '#E4D6B4', .95)
    o += ink('M 176 470 L 176 320 L 300 236 L 424 320 L 424 470', 3.0)
    for r_ in range(4):
        o += ink(f'M 176 {350+r_*30} h 248', 1.5, .45)
    for r_ in range(4):
        for c_ in range(4):
            off = 31 if r_ % 2 else 0
            o += ink(f'M {176+off+c_*62} {350+r_*30} v 30', 1.5, .35)
    o += rect(268, 388, 64, 82, '#8B5A34', .92, rx=3)
    o += ink('M 268 470 v -82 h 64 v 82', 2.4, .9)
    o += f'<ellipse cx="300" cy="430" rx="86" ry="86" fill="url(#glow)"/>'
    # scaffolding + a raised beam
    o += ink('M 132 470 v -150 M 468 470 v -150 M 132 380 h 44 M 424 380 h 44', 2.4, .7)
    o += ink('M 150 260 L 300 214 L 450 260', 3.2, .85)
    o += wash('M 150 254 L 300 208 L 450 254 L 450 266 L 300 220 L 150 266 Z', '#9A7550', .95)
    # tiny builders raising it
    for x in [176, 246, 356, 424]:
        o += mini_person(x, 470, 96, 'man', '#6E7A45', '#4A3526', 'soft')
        o += ink(f'M {x-16} 424 L {x-8} 396 M {x+16} 424 L {x+8} 396', 2.2, .7)
    # a seedling in the foreground
    o += ink('M 528 620 v -54', 3.0, .9)
    o += wash('M 528 574 q -40 -10 -46 -40 q 38 2 46 40 Z', MOSS, .9)
    o += wash('M 528 590 q 40 -10 46 -40 q -38 2 -46 40 Z', MOSS, .9)
    o += f'<ellipse cx="528" cy="620" rx="46" ry="12" fill="#8B6A46" opacity=".55"/>'
    return frame(o)


# ---------------------------------------------------------------- PANEL 9
def p9():
    o = rect(0, 0, W, H, '#EFE4CB', .92)
    o += f'<ellipse cx="300" cy="340" rx="270" ry="250" fill="url(#glow)"/>'
    # the community behind her, softened
    for i, x in enumerate([46, 122, 198, 402, 478, 554]):
        kind = ['woman', 'man', 'woman', 'man', 'woman', 'man'][i]
        col = ['#9AA6A0', '#93A08E', '#A3A296', '#8FA09A', '#A6A093', '#96A292'][i]
        o += (f'<g opacity=".55">' +
              mini_person(x, 486, 170, kind, col, '#8C9484', 'soft') + '</g>')
    o += wash('M 0 486 Q 300 470 600 486 L 600 660 L 0 660 Z', '#DDD0AE', .6)
    # Yael, front and centre
    cx, cy = 292, 300
    o += dress(cx, 352, 148, 120, LINEN, .92)
    o += wash(f'M {cx-82} 366 Q {cx} 348 {cx+82} 366 L {cx+108} 586 Q {cx} 604 {cx-108} 586 Z', INDIGO, .9)
    o += ink(f'M {cx-82} 368 Q {cx} 350 {cx+82} 368', 2.4, .8)
    o += ink(f'M {cx-34} 360 L {cx-28} 578 M {cx+34} 360 L {cx+28} 578', 1.8, .45)
    # the arm reaching out, palm open
    o += wash(f'M {cx+64} 364 Q {cx+152} 392 {cx+186} 456 L {cx+140} 500 '
              f'Q {cx+114} 436 {cx+40} 414 Z', LINEN, .96)
    o += ink(f'M {cx+64} 364 Q {cx+152} 392 {cx+186} 456', 2.4, .8)
    o += ink(f'M {cx+40} 414 Q {cx+114} 436 {cx+140} 500', 2.2, .6)
    o += ell(cx + 168, 502, 36, 31, SKIN, 1)
    o += ink(f'M {cx+132} 502 a 36 31 0 1 1 72 0 a 36 31 0 1 1 -72 0', 2.3)
    for k in range(4):
        o += ink(f'M {cx+142+k*17} {486-k*2} q 6 -15 15 -4', 1.9, .55)
    o += ink(f'M {cx+150} 512 q 18 10 36 -2', 1.7, .40)
    o += head(cx, cy, 45)
    o += scarf(cx, cy, 45, '#3F6B58', 'both', 94)
    o += face(cx, cy + 4, 1.32, 'smile')
    for sx in (-1, 1):
        o += f'<circle cx="{cx+sx*53}" cy="{cy+16}" r="7" fill="none" stroke="#9AA6A0" stroke-width="2.6"/>'
    return frame(o)


# ---------------------------------------------------------------- PANEL 10
def p10():
    o = f'<rect width="{W}" height="{H}" fill="url(#dusk)"/>'
    for (sx, sy, sr) in [(60, 60, 2.6), (140, 110, 2.0), (220, 52, 3.0), (330, 96, 2.2),
                         (430, 58, 2.8), (520, 118, 2.2), (560, 48, 2.4), (96, 168, 1.8),
                         (268, 150, 1.8), (476, 168, 2.0)]:
        o += f'<circle cx="{sx}" cy="{sy}" r="{sr}" fill="#FFF3D0" opacity=".9"/>'
    o += f'<ellipse cx="300" cy="360" rx="300" ry="260" fill="url(#glow)"/>'
    o += wash('M 0 560 Q 300 540 600 560 L 600 660 L 0 660 Z', '#6B5A4A', .8)
    # chuppah poles and canopy
    for px in (96, 504):
        o += rect(px - 6, 240, 12, 322, '#D8BE8A', .95, rx=3)
        o += (f'<path d="M {px} 560 v -320" fill="none" stroke="#8B6A46" stroke-width="2" '
              f'opacity=".7" filter="url(#rough)"/>')
    o += wash('M 76 238 Q 300 300 524 238 L 524 214 Q 300 268 76 214 Z', '#F6F2E6', .97)
    o += wash('M 76 214 L 76 300 Q 96 260 116 300 L 116 220 Z', '#EFE9D8', .95)
    o += wash('M 524 214 L 524 300 Q 504 260 484 300 L 484 220 Z', '#EFE9D8', .95)
    o += ink('M 76 214 Q 300 268 524 214', 2.6, .85)
    o += ink('M 76 238 Q 300 300 524 238', 3.0, .95)
    o += ink('M 76 214 v 86 M 524 214 v 86 M 116 220 v 80 M 484 220 v 80', 2.0, .55)
    for i in range(9):
        x = 108 + i * 48
        dy = 34 * (1 - abs((x - 300) / 224.0) ** 2)
        o += ink(f'M {x} {230+dy:.0f} q 8 13 0 24 q -8 -11 0 -24', 1.8, .5)
    # bride (right) and groom (left), standing side by side, no contact
    o += mini_person(372, 560, 250, 'woman', '#FBF7EC', '#4A3526', 'smile')
    o += wash('M 372 328 q -56 -14 -62 40 q -6 56 62 58 q 68 -2 62 -58 q -6 -54 -62 -40 Z', '#FFFFFF', .35)
    x = 228
    r = 38
    cy = 560 - 250 + r
    o += shirt(x, cy + r * 1.3, 84, 128, '#FBF7EC', .95)
    o += wash(f'M {x-52} {cy+r*1.3+128} L {x+52} {cy+r*1.3+128} L {x+46} 560 L {x-46} 560 Z', '#EFE7D6', .9)
    o += head(x, cy, r)
    o += hair_long(x, cy, r, '#3B2A22', 'both', 24)
    o += kippah(x, cy, r, '#F3EEDF')
    o += beard(x, cy, r, '#3B2A22')
    o += face(x, cy + 2, 1.12, 'smile')
    for sx in (-1, 1):
        o += ink(f'M {x+sx*46} {cy+r*1.3+66} l {sx*4} 24', 1.8, .5)
    # guests, in two separated clusters
    for gx in [30, 74]:
        o += f'<g opacity=".55">' + mini_person(gx, 574, 132, 'man', '#4A5A66', '#4A5A66', 'soft') + '</g>'
    for gx in [528, 572]:
        o += f'<g opacity=".55">' + mini_person(gx, 574, 132, 'woman', '#6B5A72', '#6B5A72', 'soft') + '</g>'
    return frame(o)


# ---------------------------------------------------------------- PANEL 11
def p11():
    o = f'<rect width="{W}" height="{H}" fill="#3E3A44"/>'
    o += wash('M 0 0 L 600 0 L 600 300 L 0 300 Z', '#5A4A50', .6)
    # caravan buildings, warm ochre
    o += rect(20, 96, 250, 210, '#C8823E', .92, rx=4) + ink('M 20 96 h 250 v 210 h -250 Z', 2.4, .8)
    o += rect(300, 124, 280, 182, '#B9762F', .9, rx=4) + ink('M 300 124 h 280 v 182 h -280 Z', 2.4, .8)
    o += rect(66, 132, 52, 46, '#F3D9A0', .95, rx=3) + ink('M 66 132 h 52 v 46 h -52 Z', 1.8, .7)
    o += rect(348, 158, 58, 44, '#F3D9A0', .95, rx=3) + ink('M 348 158 h 58 v 44 h -58 Z', 1.8, .7)
    # string lights
    o += ink('M 0 78 Q 150 128 300 84 Q 450 40 600 92', 2.2, .8)
    for i in range(13):
        t = i / 12.0
        x = 600 * t
        y = 78 + 50 * math.sin(math.pi * t) * (1 if t < .5 else -1) + (44 * t if t > .5 else 0)
        y = 78 + (50 * (1 - abs(2 * t - 1))) * (1 if t < 0.5 else 1) - (34 * t)
        o += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="6" fill="#FFDE9C"/>'
        o += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="20" fill="url(#glow)" opacity=".8"/>'
    o += wash('M 0 300 L 600 300 L 600 660 L 0 660 Z', '#7A5238', .85)
    o += f'<ellipse cx="300" cy="470" rx="300" ry="180" fill="url(#glow)" opacity=".55"/>'
    # RIGHT cluster: young men.  LEFT cluster: young women.  A clear gap between them.
    o += rect(316, 470, 268, 18, '#8B6A46', .95, rx=3) + ink('M 316 470 h 268', 2.2, .8)
    o += rect(340, 488, 16, 60, '#7A5C3C', .9) + rect(544, 488, 16, 60, '#7A5C3C', .9)
    for x in [360, 434, 508]:
        o += mini_person(x, 470, 152, 'man', ['#4A5A66', '#6E7A45', '#3A4A5A'][[360, 434, 508].index(x)], '#4A3526', 'smile')
    o += rect(16, 470, 250, 18, '#8B6A46', .95, rx=3) + ink('M 16 470 h 250', 2.2, .8)
    o += rect(40, 488, 16, 60, '#7A5C3C', .9) + rect(228, 488, 16, 60, '#7A5C3C', .9)
    for x in [76, 146, 216]:
        o += mini_person(x, 470, 152, 'woman', ['#6B5A72', '#8C5A3C', '#4A5A66'][[76, 146, 216].index(x)], '#4A3526', 'smile')
    # plates and a guitar, foreground
    for (px, py) in [(120, 560), (196, 574), (396, 566), (476, 578)]:
        o += f'<ellipse cx="{px}" cy="{py}" rx="30" ry="11" fill="#F3EEDF" opacity=".95"/>'
        o += ink(f'M {px-30} {py} a 30 11 0 1 0 60 0 a 30 11 0 1 0 -60 0', 1.6, .6)
    for (mx, my) in [(268, 600), (312, 610), (352, 596)]:
        o += rect(mx - 13, my - 26, 26, 28, '#F3EEDF', .96, rx=4)
        o += ink(f'M {mx-13} {my-26} h 26 v 28 h -26 Z', 1.7, .7)
        o += ink(f'M {mx+13} {my-19} q 11 7 0 14', 1.7, .7)
        o += ink(f'M {mx-5} {my-34} q 5 -9 0 -16 M {mx+5} {my-34} q 5 -9 0 -16', 1.5, .35)
    return frame(o)
