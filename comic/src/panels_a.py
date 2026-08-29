# -*- coding: utf-8 -*-
from lib import *
import math


def frame(inner):
    return (f'<svg class="art" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">'
            f'<rect width="{W}" height="{H}" fill="{PAPER}"/>{inner}</svg>')


# ---------------------------------------------------------------- PANEL 1
def p1():
    o = rect(0, 0, W, 470, '#F0E2C4', .85)
    o += rect(0, 455, W, 205, '#E3D2AF', .8)
    # window, left
    o += rect(48, 92, 150, 172, '#CFE0DC', .95, rx=6)
    o += ink('M 48 92 h 150 v 172 h -150 Z', 2.6)
    o += ink('M 123 92 v 172 M 48 178 h 150', 1.8, .8)
    o += wash('M 198 100 L 330 470 L 150 470 L 190 264 Z', '#FFF3CF', .38)
    # board of matches
    o += rect(238, 96, 210, 150, '#E0C79C', .9, rx=4)
    o += ink('M 238 96 h 210 v 150 h -210 Z', 2.4)
    notes = [(258, 112, 40, 30, CREAM, -5), (306, 118, 44, 28, '#EBD7E6', 4),
             (360, 110, 40, 32, CREAM, -3), (404, 122, 36, 26, '#CFE3E0', 6),
             (252, 158, 44, 30, '#CFE3E0', 3), (306, 164, 40, 28, CREAM, -6),
             (356, 156, 46, 30, '#EBD7E6', 2), (408, 168, 34, 26, CREAM, -4),
             (272, 202, 42, 28, CREAM, 5), (330, 206, 44, 26, '#CFE3E0', -3),
             (388, 200, 40, 30, CREAM, 4)]
    for (x, y, w, h, c, rot) in notes:
        o += (f'<g transform="rotate({rot} {x+w/2} {y+h/2})">' + rect(x, y, w, h, c, .95, rx=2)
              + ink(f'M {x} {y} h {w} v {h} h {-w} Z', 1.4, .55)
              + ink(f'M {x+6} {y+10} h {w-14} M {x+6} {y+18} h {w-22}', 1.2, .35) + '</g>')
    # two paired dots on some notes: a match
    for (x, y) in [(272, 128), (376, 126), (322, 180), (348, 218)]:
        o += f'<circle cx="{x}" cy="{y}" r="3.4" fill="{TEAL}"/><circle cx="{x+11}" cy="{y}" r="3.4" fill="{PURP}"/>'
    # desk
    o += rect(0, 452, W, 26, '#B0764B', .92)
    o += rect(0, 478, W, 60, '#96603C', .85)
    o += ink('M 0 452 h 600 M 0 478 h 600', 2.2, .85)
    # Yael
    cx, cy = 300, 352
    o += dress(cx, 402, 132, 66, LINEN, .9)
    o += wash(f'M {cx-70} 410 Q {cx} 396 {cx+70} 410 L {cx+84} 470 L {cx-84} 470 Z', INDIGO, .85)
    o += ink(f'M {cx-70} 412 Q {cx} 398 {cx+70} 412', 2.2, .8)
    o += ink(f'M {cx-30} 404 L {cx-24} 462 M {cx+30} 404 L {cx+24} 462', 1.8, .5)
    o += head(cx, cy, 40)
    o += scarf(cx, cy, 40, '#3F6B58', 'both', 82)
    o += face(cx, cy + 4, 1.18, 'wide')
    for sx in (-1, 1):
        o += f'<circle cx="{cx+sx*47}" cy="{cy+14}" r="6" fill="none" stroke="#9AA6A0" stroke-width="2.4"/>'
    # papers on desk + pen
    o += rect(408, 420, 96, 40, CREAM, .95, rx=2) + ink('M 408 420 h 96 v 40 h -96 Z', 1.6, .6)
    o += ink('M 418 432 h 74 M 418 442 h 58', 1.4, .4)
    o += rect(96, 424, 84, 34, CREAM, .95, rx=2) + ink('M 96 424 h 84 v 34 h -84 Z', 1.6, .6)
    o += ink('M 106 436 h 62 M 106 446 h 44', 1.4, .4)
    o += ink('M 200 448 l 34 -16', 4.0, .8)
    for hx in (238, 362):
        o += ell(hx, 450, 23, 15, SKIN)
        o += ink(f'M {hx-12} 444 q 12 -7 24 0', 1.4, .7)
    return frame(o)


# ---------------------------------------------------------------- PANEL 2
def p2():
    o = rect(0, 0, W, H, '#EDE4D2', .9)
    # right: a young man on a bench, turned slightly away
    o += rect(352, 56, 200, 142, '#D8E4E0', .55, rx=6)
    o += ink('M 352 56 h 200 v 142 h -200 Z', 2.0, .55)
    o += ink('M 452 56 v 142 M 352 127 h 200', 1.5, .45)
    o += mini_person(452, 556, 168, 'man', '#6B7A8C', '#5A4636', 'quiet')
    o += rect(376, 556, 162, 15, '#9A7550', .92, rx=3)
    o += ink('M 376 556 h 162 M 396 571 v 40 M 518 571 v 40', 2.2, .8)
    # left: a young woman by a window
    o += rect(56, 66, 150, 152, '#D8E4E0', .55, rx=6)
    o += ink('M 56 66 h 150 v 152 h -150 Z', 2.0, .55)
    o += ink('M 131 66 v 152 M 56 142 h 150', 1.5, .45)
    o += mini_person(150, 590, 186, 'woman', '#7A5570', '#4A3526', 'down')
    # the distance between them
    o += ink('M 300 402 v 24 M 300 442 v 24 M 300 482 v 24', 2.0, .28)
    o += rect(0, 604, W, 56, '#DACBAE', .8)
    o += ink('M 0 604 h 600', 2.0, .6)
    return frame(o)


# ---------------------------------------------------------------- PANEL 3  (four quadrants)
def q_reserve(ox, oy, w, h):
    """Avraham leaving for reserve duty — in civilian clothes, kit bag in hand."""
    o = rect(ox, oy, w, h, '#E7DCC2')
    o += flat(f'M {ox} {oy+h*0.66} L {ox+w} {oy+h*0.66} L {ox+w} {oy+h} L {ox} {oy+h} Z', '#C9BE9A')
    o += ink(f'M {ox} {oy+h*0.66} L {ox+w} {oy+h*0.66}', 1.6, .8)
    # the doorway of the house, with Yael seeing him off
    o += orect(ox + w * 0.66, oy + h * 0.16, w * 0.32, h * 0.56, '#E0CDA6')
    o += orect(ox + w * 0.72, oy + h * 0.26, w * 0.20, h * 0.46, '#9A6B3E')
    o += mini_person(ox + w * 0.82, oy + h * 0.70, h * 0.42, 'woman_scarf', LINEN, '#3F8F5E', 'soft')
    # Avraham: civilian shirt and trousers, kit bag carried low in one hand
    x = ox + w * 0.32
    base = oy + h * 0.76
    o += mini_person(x, base, h * 0.52, 'man', '#3B5BA5', '#2C2119', 'quiet')
    bx, by = x - h * 0.20, base - h * 0.20
    o += ink(f'M {x-h*0.11} {base-h*0.30} L {bx+h*0.03} {by-h*0.02}', 2.0, .9)
    o += orect(bx - h * 0.11, by, h * 0.22, h * 0.13, '#8A5C2C', rx=3)
    o += ink(f'M {bx-h*0.06} {by} q {h*0.06} {-h*0.05} {h*0.12} 0', 1.6, .8)
    return o


def q_shoval(ox, oy, w, h):
    o = rect(ox, oy, w, h, '#4E5D68', .9)
    o += wash(f'M {ox} {oy+h*0.58} Q {ox+w*0.35} {oy+h*0.40} {ox+w*0.62} {oy+h*0.55} '
              f'Q {ox+w*0.85} {oy+h*0.46} {ox+w} {oy+h*0.58} L {ox+w} {oy+h} L {ox} {oy+h} Z', '#3C4A52', .9)
    o += f'<circle cx="{ox+w*0.5}" cy="{oy+h*0.44}" r="{h*0.42}" fill="url(#glow)"/>'
    x, base = ox + w * 0.5, oy + h * 0.86
    r = h * 0.115
    cy = base - h * 0.62 + r
    o += shirt(x, cy + r * 1.25, h * 0.24, h * 0.34, '#7E8A52', .9)
    o += head(x, cy, r)
    o += hair_long(x, cy, r, '#B98A4E', 'both', h * 0.22)
    o += beard(x, cy, r, '#5A3E28')
    o += face(x, cy + r * 0.05, r / 34.0, 'wide')
    o += f'<ellipse cx="{x}" cy="{cy}" rx="{h*0.30}" ry="{h*0.34}" fill="#FFF3D0" opacity=".22" filter="url(#soft)"/>'
    # memorial candle, lower right
    cxx, cyy = ox + w * 0.86, oy + h * 0.90
    o += rect(cxx - 9, cyy - 22, 18, 26, '#E8DCC0', .95, rx=3)
    o += f'<ellipse cx="{cxx}" cy="{cyy-30}" rx="7" ry="12" fill="#FFD98A"/>'
    o += f'<ellipse cx="{cxx}" cy="{cyy-30}" rx="16" ry="24" fill="url(#glow)"/>'
    return o


def q_father(ox, oy, w, h):
    o = rect(ox, oy, w, h, '#E9DFC8', .92)
    o += rect(ox + w * 0.60, oy + h * 0.12, w * 0.30, h * 0.34, '#D5E2DE', .8, rx=4)
    o += ink(f'M {ox+w*0.60} {oy+h*0.12} h {w*0.30} v {h*0.34} h {-w*0.30} Z', 1.8, .6)
    # empty chair
    x, base = ox + w * 0.34, oy + h * 0.86
    sw, sh = w * 0.26, h * 0.10
    o += rect(x - sw / 2, base - sh * 2.0, sw, sh * 0.5, '#9A7550', .95, rx=2)
    o += ink(f'M {x-sw/2} {base-sh*2.0} h {sw}', 2.2, .9)
    o += ink(f'M {x-sw/2+4} {base-sh*2.0} v {sh*1.9} M {x+sw/2-4} {base-sh*2.0} v {sh*1.9}', 2.2, .85)
    o += ink(f'M {x-sw/2+4} {base-sh*3.4} v {sh*1.4} M {x+sw/2-4} {base-sh*3.4} v {sh*1.4}'
             f' M {x-sw/2+4} {base-sh*3.4} h {sw-8} M {x-sw/2+4} {base-sh*2.9} h {sw-8}', 2.2, .85)
    # a tallit folded over the chair back
    o += wash(f'M {x-sw*0.30} {base-sh*3.5} q {sw*0.30} {-6} {sw*0.60} 0 l 0 {sh*1.9} '
              f'q {-sw*0.30} 8 {-sw*0.60} 0 Z', '#F8F5EC')
    for i in range(2):
        o += ink(f'M {x-sw*0.28} {base-sh*2.7+i*8} h {sw*0.56}', 1.5, .7)
    # siddur on a small table + candle
    tx, ty = ox + w * 0.76, oy + h * 0.72
    o += rect(tx - 34, ty, 68, 8, '#9A7550', .95, rx=2)
    o += ink(f'M {tx-34} {ty} h 68 M {tx-26} {ty+8} v 34 M {tx+26} {ty+8} v 34', 2.0, .8)
    o += rect(tx - 22, ty - 16, 40, 16, '#6E4A6B', .95, rx=2)
    o += ink(f'M {tx-22} {ty-16} h 40 v 16 h -40 Z M {tx-2} {ty-16} v 16', 1.6, .75)
    o += rect(tx + 22, ty - 24, 12, 24, '#E8DCC0', .95, rx=2)
    o += f'<ellipse cx="{tx+28}" cy="{ty-31}" rx="6" ry="10" fill="#FFD98A"/>'
    o += f'<ellipse cx="{tx+28}" cy="{ty-31}" rx="16" ry="24" fill="url(#glow)"/>'
    return o


def q_birth(ox, oy, w, h):
    o = rect(ox, oy, w, h, '#F3E6CC', .95)
    o += f'<ellipse cx="{ox+w*0.5}" cy="{oy+h*0.52}" rx="{w*0.42}" ry="{h*0.40}" fill="url(#glow)"/>'
    cx, cy = ox + w * 0.5, oy + h * 0.56
    # two cradling arms
    o += wash(f'M {ox+w*0.10} {oy+h*0.82} Q {cx} {oy+h*0.40} {ox+w*0.90} {oy+h*0.82} '
              f'Q {cx} {oy+h*0.66} {ox+w*0.10} {oy+h*0.82} Z', '#E7C6A4', .95)
    o += ink(f'M {ox+w*0.10} {oy+h*0.82} Q {cx} {oy+h*0.40} {ox+w*0.90} {oy+h*0.82}', 2.4, .85)
    # swaddled baby
    o += wash(f'M {cx-w*0.20} {oy+h*0.62} q {w*0.20} {-h*0.26} {w*0.40} 0 q {-w*0.20} {h*0.12} {-w*0.40} 0 Z',
              '#FFFBF0', .98)
    o += ink(f'M {cx-w*0.20} {oy+h*0.62} q {w*0.20} {-h*0.26} {w*0.40} 0', 2.2, .8)
    o += f'<circle cx="{cx+w*0.10}" cy="{oy+h*0.47}" r="{h*0.075}" fill="{SKIN}"/>'
    o += ink(f'M {cx+w*0.10-h*0.075} {oy+h*0.47} a {h*0.075} {h*0.075} 0 1 1 {h*0.15} 0 '
             f'a {h*0.075} {h*0.075} 0 1 1 {-h*0.15} 0', 1.8, .8)
    o += (f'<circle cx="{cx+w*0.075}" cy="{oy+h*0.462}" r="1.8" fill="{INK}"/>'
          f'<circle cx="{cx+w*0.125}" cy="{oy+h*0.462}" r="1.8" fill="{INK}"/>')
    o += ink(f'M {cx+w*0.085} {oy+h*0.487} q {w*0.015} {h*0.014} {w*0.03} 0', 1.5, .8)
    return o


def p3():
    hw, hh = W / 2, H / 2
    o = q_reserve(hw, 0, hw, hh)          # top-right  (RTL: read first)
    o += q_shoval(0, 0, hw, hh)           # top-left
    o += q_father(hw, hh, hw, hh)         # bottom-right
    o += q_birth(0, hh, hw, hh)           # bottom-left
    o += ink(f'M {hw} 0 v {H}', 3.4)
    o += ink(f'M 0 {hh} h {W}', 3.4)
    return frame(o)


# ---------------------------------------------------------------- PANEL 4
def p4():
    o = rect(0, 0, W, H, '#EFE3C8', .92)
    o += ink('M 300 0 v 52', 2.2, .8)
    o += wash('M 252 52 q 48 -32 96 0 Z', '#4E6B4A', .95)
    o += ink('M 252 52 q 48 -32 96 0 Z', 2.2, .85)
    # the two of them, seated behind the table
    o += mini_person(430, 500, 214, 'woman_scarf', INDIGO, '#3F6B58', 'smile')
    x, r = 168, 35
    cy = 500 - 214 + r
    o += shirt(x, cy + r * 1.3, 74, 118, '#2E4374', .9)
    o += head(x, cy, r)
    o += hair_long(x, cy, r, '#2C2119', 'both', 22)
    o += kippah(x, cy, r, '#3A4A3A')
    o += beard(x, cy, r, '#2C2119')
    o += face(x, cy + 2, 1.04, 'soft')
    # table in front of them
    o += wash('M 18 470 L 582 470 L 546 556 L 54 556 Z', '#A8703F', .96)
    o += ink('M 18 470 L 582 470 L 546 556 L 54 556 Z', 2.6, .9)
    o += wash('M 18 470 L 582 470 L 578 486 L 22 486 Z', '#C08A52', .9)
    o += rect(70, 556, 24, 104, '#8B5A34', .9)
    o += rect(506, 556, 24, 104, '#8B5A34', .9)
    # the first sketch of a house, on paper
    o += (f'<g transform="rotate(-2 300 520)">' + rect(214, 492, 172, 60, '#FCF6E6', .98, rx=3)
          + ink('M 214 492 h 172 v 60 h -172 Z', 2.0, .8)
          + ink('M 272 540 v -22 l 28 -19 l 28 19 v 22 Z M 294 540 v -15 h 14 v 15', 2.2, .95) + '</g>')
    o += (f'<g transform="rotate(4 152 518)">' + rect(100, 494, 104, 48, '#FCF6E6', .95, rx=3)
          + ink('M 100 494 h 104 v 48 h -104 Z', 1.7, .6)
          + ink('M 112 510 h 78 M 112 522 h 62 M 112 534 h 70', 1.4, .38) + '</g>')
    o += (f'<g transform="rotate(-4 452 516)">' + rect(400, 492, 104, 48, '#FCF6E6', .95, rx=3)
          + ink('M 400 492 h 104 v 48 h -104 Z', 1.7, .6)
          + ink('M 412 508 h 80 M 412 520 h 64 M 412 532 h 72', 1.4, .38) + '</g>')
    return frame(o)


# ---------------------------------------------------------------- PANEL 5
def p5():
    o = rect(0, 0, W, H, '#EAE0C6', .92)
    # village skyline
    o += wash('M 0 210 L 60 150 L 120 210 L 176 158 L 232 210 L 296 146 L 360 210 L 420 156 '
              'L 480 210 L 540 152 L 600 210 L 600 260 L 0 260 Z', '#CBBE99', .75)
    for hx in (60, 176, 296, 420, 540):
        o += rect(hx - 30, 210, 60, 50, '#D6C7A2', .8)
        o += ink(f'M {hx-32} 212 L {hx} 172 L {hx+32} 212', 1.8, .55)
    o += rect(0, 258, W, 8, '#B5A582', .8)
    # the circle
    ccx, ccy, R = 300, 430, 152
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * (2 * math.pi / 10)
        pts.append((ccx + R * math.cos(a), ccy + R * math.sin(a) * 0.72))
    for i in range(10):
        for j in (3, 4, 6, 7):
            x1, y1 = pts[i]
            x2, y2 = pts[(i + j) % 10]
            o += (f'<path d="M {x1:.0f} {y1:.0f} Q {ccx} {ccy} {x2:.0f} {y2:.0f}" fill="none" '
                  f'stroke="{TEAL_D}" stroke-width="2.2" opacity=".40"/>')
    for i, (x, y) in enumerate(pts):
        kinds = ['man', 'woman', 'man', 'woman', 'man', 'woman', 'man', 'woman', 'man', 'woman']
        cols = ['#2E4374', '#7A5570', '#4E6B4A', '#8C5A3C', '#3A5A6B', '#5E3A6E',
                '#8A5C2C', '#A0576B', '#2E4374', '#4E6B4A']
        o += mini_person(x, y + 40, 88, kinds[i], cols[i], '#4A3526', 'soft')
    # the matchmaker in the middle
    o += mini_person(ccx, ccy + 46, 118, 'woman_scarf', '#5E3A6E', '#6E4A7E', 'smile')
    o += rect(ccx - 26, ccy + 4, 52, 34, '#FCF6E6', .98, rx=3)
    o += ink(f'M {ccx-26} {ccy+4} h 52 v 34 h -52 Z M {ccx} {ccy+4} v 34', 1.8, .8)
    return frame(o)


# ---------------------------------------------------------------- PANEL 6
def p6():
    o = rect(0, 0, W, 470, '#E8CDB6', .9)
    o += rect(0, 455, W, 205, '#D3B191', .85)
    o += ink('M 0 455 h 600', 2.2, .6)
    # window with afternoon light
    o += rect(226, 62, 148, 150, '#D8E4E0', .8, rx=5)
    o += ink('M 226 62 h 148 v 150 h -148 Z M 300 62 v 150 M 226 137 h 148', 2.0, .65)
    # Michal, right (speaks first in RTL) -- clear distance, no contact
    o += mini_person(452, 486, 226, 'woman_scarf', '#3A3A42', '#C4744F', 'smile')
    o += rect(500, 396, 20, 92, '#8B5A34', .9, rx=3)
    o += ink('M 500 486 v 60 M 420 486 v 60', 2.2, .8)
    # the young woman, left
    o += mini_person(148, 486, 216, 'woman', '#7A5570', '#4A3526', 'soft')
    o += rect(96, 400, 20, 88, '#8B5A34', .9, rx=3)
    o += ink('M 100 486 v 60 M 180 486 v 60', 2.2, .8)
    # small table between them, two mugs -- the gap is deliberate
    o += rect(252, 500, 96, 14, '#9A7550', .95, rx=3)
    o += ink('M 252 500 h 96 M 268 514 v 44 M 332 514 v 44', 2.2, .85)
    for mx in (278, 322):
        o += rect(mx - 11, 476, 22, 24, '#FCF6E6', .98, rx=3)
        o += ink(f'M {mx-11} 476 h 22 v 24 h -22 Z', 1.6, .7)
        o += ink(f'M {mx+11} 482 q 9 6 0 12', 1.6, .7)
        o += ink(f'M {mx-4} 468 q 4 -8 0 -14 M {mx+4} 468 q 4 -8 0 -14', 1.4, .35)
    return frame(o)
