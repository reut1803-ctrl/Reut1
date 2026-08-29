# -*- coding: utf-8 -*-
"""Shared drawing primitives for the 'Yesh Lecha Bayit' graphic-novel page."""

INK   = '#1B3A42'
TEAL  = '#1F7A7F'
TEAL_D= '#14565C'
PURP  = '#5E3A6E'
CREAM = '#FBF4E4'
PAPER = '#F7EDD6'
MOSS  = '#4E6B4A'
OLIVE = '#6E7A45'
TERRA = '#C4744F'
INDIGO= '#2E4374'
GOLD  = '#C9A227'
SKIN  = '#EFCFAE'
SKIN_D= '#DCB08A'
LINEN = '#DED6C4'

W, H = 600, 660


def wash(d, color, op=0.55, f='roughBig'):
    return f'<path d="{d}" fill="{color}" opacity="{op}" filter="url(#{f})"/>'


def rect(x, y, w, h, color, op=0.6, f='roughBig', rx=0):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" '
            f'fill="{color}" opacity="{op}" filter="url(#{f})"/>')


def ink(d, sw=2.4, op=1.0, cap='round'):
    return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{sw}" '
            f'stroke-linecap="{cap}" stroke-linejoin="round" opacity="{op}" filter="url(#rough)"/>')


def ell(cx, cy, rx, ry, color, op=1.0, f='rough'):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{color}" opacity="{op}" filter="url(#{f})"/>'


def head(cx, cy, r=34, skin=SKIN, tilt=0):
    """Simple oval head with ink contour."""
    g = f'<g transform="rotate({tilt} {cx} {cy})">'
    g += ell(cx, cy, r * 0.86, r, skin, 1)
    g += ink(f'M {cx-r*0.86} {cy} a {r*0.86} {r} 0 1 1 {r*1.72} 0 a {r*0.86} {r} 0 1 1 {-r*1.72} 0', 2.2)
    g += '</g>'
    return g


def face(cx, cy, s=1.0, mood='smile'):
    """Deliberately non-realistic: two ink dots and a single mouth stroke."""
    o = (f'<circle cx="{cx-10*s}" cy="{cy}" r="{2.7*s}" fill="{INK}"/>'
         f'<circle cx="{cx+10*s}" cy="{cy}" r="{2.7*s}" fill="{INK}"/>')
    if mood == 'smile':
        o += ink(f'M {cx-9*s} {cy+11*s} Q {cx} {cy+19*s} {cx+9*s} {cy+11*s}', 2.2*s)
    elif mood == 'wide':
        o += ink(f'M {cx-11*s} {cy+10*s} Q {cx} {cy+23*s} {cx+11*s} {cy+10*s}', 2.4*s)
        o += f'<path d="M {cx-10*s} {cy+11*s} Q {cx} {cy+21*s} {cx+10*s} {cy+11*s} Z" fill="{CREAM}" opacity=".85"/>'
    elif mood == 'soft':
        o += ink(f'M {cx-7*s} {cy+13*s} Q {cx} {cy+17*s} {cx+7*s} {cy+13*s}', 2.0*s)
    elif mood == 'quiet':
        o += ink(f'M {cx-6*s} {cy+14*s} L {cx+6*s} {cy+14*s}', 2.0*s)
    elif mood == 'down':
        o += ink(f'M {cx-7*s} {cy+17*s} Q {cx} {cy+11*s} {cx+7*s} {cy+17*s}', 2.0*s)
    return o


def scarf(cx, cy, r=34, color=MOSS, tails='both', tail_len=70):
    """Married-woman head wrap: covers the hair, fabric tails to the sides."""
    o = wash(f'M {cx-r*0.98} {cy-r*0.1} Q {cx-r*1.05} {cy-r*1.15} {cx} {cy-r*1.22} '
             f'Q {cx+r*1.05} {cy-r*1.15} {cx+r*0.98} {cy-r*0.1} '
             f'Q {cx+r*0.6} {cy-r*0.5} {cx} {cy-r*0.46} Q {cx-r*0.6} {cy-r*0.5} {cx-r*0.98} {cy-r*0.1} Z',
             color, 0.92)
    o += ink(f'M {cx-r*0.98} {cy-r*0.06} Q {cx-r*1.06} {cy-r*1.18} {cx} {cy-r*1.24} '
             f'Q {cx+r*1.06} {cy-r*1.18} {cx+r*0.98} {cy-r*0.06}', 2.3)
    o += ink(f'M {cx-r*0.9} {cy-r*0.34} Q {cx} {cy-r*0.62} {cx+r*0.9} {cy-r*0.34}', 1.7, .8)
    if tails in ('both', 'right'):
        o += wash(f'M {cx+r*0.9} {cy-r*0.3} Q {cx+r*1.25} {cy+tail_len*0.4} {cx+r*0.85} {cy+tail_len} '
                  f'Q {cx+r*0.5} {cy+tail_len*0.5} {cx+r*0.6} {cy-r*0.2} Z', color, 0.85)
    if tails in ('both', 'left'):
        o += wash(f'M {cx-r*0.9} {cy-r*0.3} Q {cx-r*1.25} {cy+tail_len*0.4} {cx-r*0.85} {cy+tail_len} '
                  f'Q {cx-r*0.5} {cy+tail_len*0.5} {cx-r*0.6} {cy-r*0.2} Z', color, 0.85)
    return o


def kippah(cx, cy, r=34, color='#4A5A46'):
    o = wash(f'M {cx-r*0.66} {cy-r*0.72} Q {cx} {cy-r*1.34} {cx+r*0.66} {cy-r*0.72} Z', color, 0.95)
    o += ink(f'M {cx-r*0.68} {cy-r*0.7} Q {cx} {cy-r*1.36} {cx+r*0.68} {cy-r*0.7}', 2.2)
    return o


def beard(cx, cy, r=34, color='#3B2A22'):
    o = wash(f'M {cx-r*0.82} {cy+r*0.02} Q {cx-r*0.86} {cy+r*1.25} {cx} {cy+r*1.34} '
             f'Q {cx+r*0.86} {cy+r*1.25} {cx+r*0.82} {cy+r*0.02} '
             f'Q {cx+r*0.5} {cy+r*0.5} {cx} {cy+r*0.46} Q {cx-r*0.5} {cy+r*0.5} {cx-r*0.82} {cy+r*0.02} Z',
             color, 0.9)
    return o


def hair_long(cx, cy, r=34, color='#4A3526', side='both', length=90):
    o = ''
    if side in ('both', 'right'):
        o += wash(f'M {cx+r*0.8} {cy-r*0.5} Q {cx+r*1.3} {cy+length*0.4} {cx+r*0.95} {cy+length} '
                  f'Q {cx+r*0.45} {cy+length*0.55} {cx+r*0.55} {cy-r*0.4} Z', color, 0.85)
    if side in ('both', 'left'):
        o += wash(f'M {cx-r*0.8} {cy-r*0.5} Q {cx-r*1.3} {cy+length*0.4} {cx-r*0.95} {cy+length} '
                  f'Q {cx-r*0.45} {cy+length*0.55} {cx-r*0.55} {cy-r*0.4} Z', color, 0.85)
    o += wash(f'M {cx-r*0.95} {cy-r*0.15} Q {cx} {cy-r*1.3} {cx+r*0.95} {cy-r*0.15} '
              f'Q {cx+r*0.5} {cy-r*0.55} {cx} {cy-r*0.5} Q {cx-r*0.5} {cy-r*0.55} {cx-r*0.95} {cy-r*0.15} Z',
              color, 0.9)
    return o


def peyot(cx, cy, r=34, color='#8A5A32'):
    o = ''
    for sx in (-1, 1):
        o += wash(f'M {cx+sx*r*0.86} {cy-r*0.35} q {sx*10} {28} {sx*2} {52} q {-sx*8} {14} {sx*3} {20}',
                  color, 0.0)
        o += ink(f'M {cx+sx*r*0.86} {cy-r*0.3} q {sx*11} {26} {sx*3} {50} q {-sx*9} {12} {sx*4} {18}', 5.0, .75)
    return o


def dress(cx, top, w, h, color, op=0.8):
    """Long modest dress / skirt: narrow at shoulders, wide at hem."""
    return wash(f'M {cx-w*0.5} {top} Q {cx} {top-6} {cx+w*0.5} {top} '
                f'L {cx+w*1.15} {top+h} Q {cx} {top+h+10} {cx-w*1.15} {top+h} Z', color, op)


def shirt(cx, top, w, h, color, op=0.85):
    return wash(f'M {cx-w*0.5} {top} Q {cx} {top-7} {cx+w*0.5} {top} '
                f'L {cx+w*0.62} {top+h} L {cx-w*0.62} {top+h} Z', color, op)


def mini_person(x, base, h=110, kind='woman', c=INDIGO, hc='#4A3526', mood='soft', head_r=None):
    """Simplified crowd figure. Women: long skirt, uncovered or wrapped hair, never a kippah.
       Men: kippah and a hint of tzitzit."""
    r = head_r or h * 0.16
    cy = base - h + r
    o = ''
    if kind == 'woman':
        o += dress(x, cy + r * 1.25, h * 0.30, h - r * 2.2, c, 0.8)
        o += head(x, cy, r)
        o += hair_long(x, cy, r, hc, 'both', h * 0.30)
    elif kind == 'woman_scarf':
        o += dress(x, cy + r * 1.25, h * 0.30, h - r * 2.2, c, 0.8)
        o += head(x, cy, r)
        o += scarf(x, cy, r, hc, 'both', h * 0.26)
    else:
        o += shirt(x, cy + r * 1.25, h * 0.32, h * 0.42, c, 0.85)
        o += wash(f'M {x-h*0.19} {cy+r*1.25+h*0.42} L {x+h*0.19} {cy+r*1.25+h*0.42} '
                  f'L {x+h*0.16} {base} L {x+h*0.02} {base} L {x} {cy+r*1.25+h*0.66} '
                  f'L {x-h*0.02} {base} L {x-h*0.16} {base} Z', '#3A4A66', 0.8)
        for sx in (-1, 1):
            o += ink(f'M {x+sx*h*0.185} {cy+r*1.25+h*0.30} l {sx*3} 16', 1.6, .6)
        o += head(x, cy, r)
        o += hair_long(x, cy, r, hc, 'both', h * 0.16)
        o += kippah(x, cy, r, '#5A6B4E')
        o += beard(x, cy, r, '#4A3526')
    o += face(x, cy + r * 0.06, r / 34.0, mood)
    return o


def defs():
    return f'''<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="rough" x="-12%" y="-12%" width="124%" height="124%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="11" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="roughBig" x="-14%" y="-14%" width="128%" height="128%">
    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed="5" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="6.5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
  <filter id="soft2" x="-25%" y="-25%" width="150%" height="150%">
    <feGaussianBlur stdDeviation="20"/>
  </filter>
  <radialGradient id="glow"><stop offset="0%" stop-color="#FFF0C4" stop-opacity=".95"/>
    <stop offset="100%" stop-color="#FFF0C4" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowT"><stop offset="0%" stop-color="#8FD6D0" stop-opacity=".55"/>
    <stop offset="100%" stop-color="#8FD6D0" stop-opacity="0"/></radialGradient>
  <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2A3B57"/><stop offset="100%" stop-color="#7A5A56"/></linearGradient>
  <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#CFE3E0"/><stop offset="100%" stop-color="#FBE6C0"/></linearGradient>
</defs></svg>'''
