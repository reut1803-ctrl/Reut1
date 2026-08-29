# -*- coding: utf-8 -*-
"""Drawing primitives — classic printed-comic style: heavy black contour,
flat colour, no soft effects."""

INK   = '#141414'
OUT   = 5.2          # main contour weight
OUT2  = 3.6          # secondary contour weight

TEAL  = '#2E8F90'
TEAL_D= '#1E6E70'
PURP  = '#6B4A86'
CREAM = '#FBF1D8'
PAPER = '#F6E7C1'
MOSS  = '#3F8F5E'
OLIVE = '#7C8A46'      # reserved for Shoval's uniform in the memorial panel only
TERRA = '#D2703A'
INDIGO= '#3B5BA5'
GOLD  = '#E0A93B'
RED   = '#C8452F'
SKY   = '#A9D6E3'
WOOD  = '#B07A3E'
WOOD_D= '#8A5C2C'
SKIN  = '#F3C89B'
SKIN_D= '#DCA875'
LINEN = '#E8DCC2'

W, H = 600, 660


def flat(d, color, op=1.0):
    """Fill with no contour — walls, floors, skies."""
    return f'<path d="{d}" fill="{color}" opacity="{op}"/>'


def wash(d, color, op=1.0, f='roughBig'):
    """Flat colour shape with a black contour."""
    return (f'<path d="{d}" fill="{color}" stroke="{INK}" stroke-width="{OUT2}" '
            f'stroke-linejoin="round" stroke-linecap="round"/>')


def rect(x, y, w, h, color, op=1.0, f='roughBig', rx=0):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" '
            f'fill="{color}" opacity="{1.0 if op >= .75 else op}"/>')


def orect(x, y, w, h, color, rx=0, sw=OUT2):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{color}" '
            f'stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>')


def ink(d, sw=2.4, op=1.0, cap='round'):
    """Contour / detail line. Everything is bolder than the pencil original."""
    w = sw * 1.75
    if w < 2.4:
        w = 2.4
    return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w:.1f}" '
            f'stroke-linecap="{cap}" stroke-linejoin="round" opacity="{1.0 if op > .5 else op*1.6:.2f}"/>')


def ell(cx, cy, rx, ry, color, op=1.0, f='rough'):
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{color}" '
            f'stroke="{INK}" stroke-width="{OUT2}"/>')


def head(cx, cy, r=34, skin=SKIN, tilt=0):
    return (f'<g transform="rotate({tilt} {cx} {cy})">'
            f'<ellipse cx="{cx}" cy="{cy}" rx="{r*0.86}" ry="{r}" fill="{skin}" '
            f'stroke="{INK}" stroke-width="{OUT}"/></g>')


def face(cx, cy, s=1.0, mood='smile'):
    """Simple, clearly drawn cartoon face — never photo-like."""
    o = (f'<ellipse cx="{cx-10*s}" cy="{cy}" rx="{3.0*s}" ry="{3.4*s}" fill="{INK}"/>'
         f'<ellipse cx="{cx+10*s}" cy="{cy}" rx="{3.0*s}" ry="{3.4*s}" fill="{INK}"/>')
    o += ink(f'M {cx-15*s} {cy-8*s} q {5*s} {-4*s} {9*s} {-1*s}', 1.3*s, .55)
    o += ink(f'M {cx+15*s} {cy-8*s} q {-5*s} {-4*s} {-9*s} {-1*s}', 1.3*s, .55)
    o += ink(f'M {cx-1*s} {cy+3*s} q {-3*s} {4*s} {1*s} {5*s}', 1.2*s, .5)
    if mood == 'smile':
        o += ink(f'M {cx-9*s} {cy+12*s} Q {cx} {cy+20*s} {cx+9*s} {cy+12*s}', 1.5*s)
    elif mood == 'wide':
        o += (f'<path d="M {cx-12*s} {cy+11*s} Q {cx} {cy+25*s} {cx+12*s} {cy+11*s} Z" '
              f'fill="{CREAM}" stroke="{INK}" stroke-width="{2.6*s}" stroke-linejoin="round"/>')
    elif mood == 'soft':
        o += ink(f'M {cx-7*s} {cy+13*s} Q {cx} {cy+18*s} {cx+7*s} {cy+13*s}', 1.4*s)
    elif mood == 'quiet':
        o += ink(f'M {cx-6*s} {cy+14*s} L {cx+6*s} {cy+14*s}', 1.4*s)
    elif mood == 'down':
        o += ink(f'M {cx-7*s} {cy+17*s} Q {cx} {cy+11*s} {cx+7*s} {cy+17*s}', 1.4*s)
    return o


def scarf(cx, cy, r=34, color=MOSS, tails='both', tail_len=70):
    o = ''
    if tails in ('both', 'right'):
        o += wash(f'M {cx+r*0.9} {cy-r*0.3} Q {cx+r*1.3} {cy+tail_len*0.4} {cx+r*0.86} {cy+tail_len} '
                  f'Q {cx+r*0.46} {cy+tail_len*0.5} {cx+r*0.58} {cy-r*0.2} Z', color)
    if tails in ('both', 'left'):
        o += wash(f'M {cx-r*0.9} {cy-r*0.3} Q {cx-r*1.3} {cy+tail_len*0.4} {cx-r*0.86} {cy+tail_len} '
                  f'Q {cx-r*0.46} {cy+tail_len*0.5} {cx-r*0.58} {cy-r*0.2} Z', color)
    o += (f'<path d="M {cx-r*0.98} {cy-r*0.06} Q {cx-r*1.06} {cy-r*1.2} {cx} {cy-r*1.24} '
          f'Q {cx+r*1.06} {cy-r*1.2} {cx+r*0.98} {cy-r*0.06} '
          f'Q {cx+r*0.6} {cy-r*0.5} {cx} {cy-r*0.46} Q {cx-r*0.6} {cy-r*0.5} {cx-r*0.98} {cy-r*0.06} Z" '
          f'fill="{color}" stroke="{INK}" stroke-width="{OUT}" stroke-linejoin="round"/>')
    o += ink(f'M {cx-r*0.86} {cy-r*0.36} Q {cx} {cy-r*0.66} {cx+r*0.86} {cy-r*0.36}', 1.5, .6)
    return o


def kippah(cx, cy, r=34, color='#4A5A46'):
    return (f'<path d="M {cx-r*0.68} {cy-r*0.72} Q {cx} {cy-r*1.4} {cx+r*0.68} {cy-r*0.72} Z" '
            f'fill="{color}" stroke="{INK}" stroke-width="{OUT}" stroke-linejoin="round"/>')


def beard(cx, cy, r=34, color='#4A3524'):
    """A trimmed beard on the jaw only, so the face stays open and readable."""
    return (f'<path d="M {cx-r*0.80} {cy+r*0.34} Q {cx-r*0.76} {cy+r*1.24} {cx} {cy+r*1.30} '
            f'Q {cx+r*0.76} {cy+r*1.24} {cx+r*0.80} {cy+r*0.34} '
            f'Q {cx+r*0.46} {cy+r*0.80} {cx} {cy+r*0.78} Q {cx-r*0.46} {cy+r*0.80} {cx-r*0.80} {cy+r*0.34} Z" '
            f'fill="{color}" stroke="{INK}" stroke-width="{OUT2}" stroke-linejoin="round"/>')


def hair_long(cx, cy, r=34, color='#4A3526', side='both', length=90):
    o = ''
    if side in ('both', 'right'):
        o += wash(f'M {cx+r*0.84} {cy-r*0.42} Q {cx+r*1.24} {cy+length*0.42} {cx+r*0.92} {cy+length} '
                  f'Q {cx+r*0.56} {cy+length*0.52} {cx+r*0.66} {cy-r*0.34} Z', color)
    if side in ('both', 'left'):
        o += wash(f'M {cx-r*0.84} {cy-r*0.42} Q {cx-r*1.24} {cy+length*0.42} {cx-r*0.92} {cy+length} '
                  f'Q {cx-r*0.56} {cy+length*0.52} {cx-r*0.66} {cy-r*0.34} Z', color)
    o += (f'<path d="M {cx-r*0.93} {cy-r*0.34} Q {cx} {cy-r*1.36} {cx+r*0.93} {cy-r*0.34} '
          f'Q {cx+r*0.52} {cy-r*0.74} {cx} {cy-r*0.70} Q {cx-r*0.52} {cy-r*0.74} {cx-r*0.93} {cy-r*0.34} Z" '
          f'fill="{color}" stroke="{INK}" stroke-width="{OUT2}" stroke-linejoin="round"/>')
    return o


def peyot(cx, cy, r=34, color='#8A5A32'):
    o = ''
    for sx in (-1, 1):
        o += ink(f'M {cx+sx*r*0.86} {cy-r*0.3} q {sx*11} {26} {sx*3} {50} q {-sx*9} {12} {sx*4} {18}', 3.0, .9)
    return o


def dress(cx, top, w, h, color, op=0.8):
    return wash(f'M {cx-w*0.5} {top} Q {cx} {top-6} {cx+w*0.5} {top} '
                f'L {cx+w*1.15} {top+h} Q {cx} {top+h+10} {cx-w*1.15} {top+h} Z', color)


def shirt(cx, top, w, h, color, op=0.85):
    return wash(f'M {cx-w*0.5} {top} Q {cx} {top-7} {cx+w*0.5} {top} '
                f'L {cx+w*0.62} {top+h} L {cx-w*0.62} {top+h} Z', color)


def mini_person(x, base, h=110, kind='woman', c=INDIGO, hc='#4A3526', mood='soft', head_r=None):
    """Crowd figure. Women: long modest skirt, hair or a wrap — never a kippah.
       Men: kippah, beard, a hint of tzitziyot."""
    r = head_r or h * 0.16
    cy = base - h + r
    o = ''
    if kind == 'woman':
        o += dress(x, cy + r * 1.25, h * 0.30, h - r * 2.2, c)
        o += head(x, cy, r)
        o += hair_long(x, cy, r, hc, 'both', h * 0.30)
    elif kind == 'woman_scarf':
        o += dress(x, cy + r * 1.25, h * 0.30, h - r * 2.2, c)
        o += head(x, cy, r)
        o += scarf(x, cy, r, hc, 'both', h * 0.26)
    else:
        small = h < 130
        o += wash(f'M {x-h*0.19} {cy+r*1.25+h*0.40} L {x+h*0.19} {cy+r*1.25+h*0.40} '
                  f'L {x+h*0.17} {base} L {x+h*0.03} {base} L {x} {cy+r*1.25+h*0.66} '
                  f'L {x-h*0.03} {base} L {x-h*0.17} {base} Z', '#7A5A38')
        o += shirt(x, cy + r * 1.25, h * 0.32, h * 0.44, c)
        for sx in (-1, 1):
            o += ink(f'M {x+sx*h*0.185} {cy+r*1.25+h*0.32} l {sx*3} 15', 1.3, .55)
        o += head(x, cy, r)
        if not small:
            o += hair_long(x, cy, r, hc, 'both', h * 0.13)
        else:
            o += (f'<path d="M {x-r*0.93} {cy-r*0.34} Q {x} {cy-r*1.36} {x+r*0.93} {cy-r*0.34} '
                  f'Q {x+r*0.52} {cy-r*0.74} {x} {cy-r*0.70} Q {x-r*0.52} {cy-r*0.74} '
                  f'{x-r*0.93} {cy-r*0.34} Z" fill="{hc}" stroke="{INK}" '
                  f'stroke-width="{OUT2}" stroke-linejoin="round"/>')
        o += kippah(x, cy, r, '#3E4A5E')
        if not small:
            o += beard(x, cy, r, hc)
    o += face(x, cy + r * 0.06, r / 34.0, mood)
    return o


def defs():
    """Filters kept as no-ops so the geometry stays crisp; 'glows' are flat tints."""
    return f'''<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="rough"><feOffset dx="0" dy="0"/></filter>
  <filter id="roughBig"><feOffset dx="0" dy="0"/></filter>
  <filter id="soft"><feOffset dx="0" dy="0"/></filter>
  <filter id="soft2"><feOffset dx="0" dy="0"/></filter>
  <radialGradient id="glow"><stop offset="0%" stop-color="#FFE6A2" stop-opacity=".85"/>
    <stop offset="100%" stop-color="#FFE6A2" stop-opacity=".85"/></radialGradient>
  <radialGradient id="glowT"><stop offset="0%" stop-color="#BCE2E0" stop-opacity=".9"/>
    <stop offset="100%" stop-color="#BCE2E0" stop-opacity=".9"/></radialGradient>
  <linearGradient id="dusk"><stop offset="0%" stop-color="#2F3F63"/>
    <stop offset="100%" stop-color="#2F3F63"/></linearGradient>
  <linearGradient id="dawn"><stop offset="0%" stop-color="#A9D6E3"/>
    <stop offset="100%" stop-color="#A9D6E3"/></linearGradient>
</defs></svg>'''
