"""Generates the flat poster-style SVG illustrations used by the site and its content,
and optimises the original EkoCheras atrium photo used on the About page.
Run:  python3 gen_images.py   (needs Pillow for the photo step)"""
from pathlib import Path

OUT = Path(__file__).parent / "images"
OUT.mkdir(exist_ok=True)

# Brand: EkoCheras orange + navy, plus a few warm accents for variety
O, O2, N, N2 = "#F58220", "#E8531F", "#0A172E", "#1D3461"
CR, PE, Y, PK, TL, SK, W = "#FFF4E6", "#FFD7AE", "#FFC93C", "#F37A8E", "#2BB3A3", "#BFE6F7", "#FFFFFF"
FONT = "Futura, 'Century Gothic', 'Avenir Next', 'Trebuchet MS', Arial, sans-serif"


def svg(w, h, body, bg=None, defs=""):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<defs>{defs}</defs>{rect}{body}</svg>')


def t(x, y, s, size, fill, anchor="start", weight=700, ls=0):
    return (f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
            f'fill="{fill}" text-anchor="{anchor}" letter-spacing="{ls}">{s}</text>')


def dots(id_, color, op=0.18, gap=28, r=3):
    return (f'<pattern id="{id_}" width="{gap}" height="{gap}" patternUnits="userSpaceOnUse">'
            f'<circle cx="{gap/2}" cy="{gap/2}" r="{r}" fill="{color}" opacity="{op}"/></pattern>')


def at(icon, cx, cy, s=1.0):
    """Place a 200x200 icon centred on (cx, cy) at scale s."""
    return f'<g transform="translate({cx - 100*s},{cy - 100*s}) scale({s})">{icon}</g>'


def stripes(x, y, n=5, w=34, h=120, gap=16, fill=N, skew=-22):
    # the slanted bars echo the "EKO" lettering in the logo
    return f'<g transform="translate({x},{y}) skewX({skew})">' + "".join(
        f'<rect x="{i*(w+gap)}" y="0" width="{w}" height="{h}" fill="{fill}"/>' for i in range(n)) + "</g>"


# ---------- icons (drawn in a 200x200 box) ----------
def cup(sleeve=O):
    return (f'<path d="M84 38q-10-14 0-26M100 38q-10-14 0-26M116 38q-10-14 0-26" stroke="{W}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>'
            f'<path d="M56 72h88l-12 112q-1 8-9 8H77q-8 0-9-8z" fill="{W}"/>'
            f'<rect x="48" y="56" width="104" height="20" rx="8" fill="{CR}"/><rect x="64" y="44" width="72" height="16" rx="7" fill="{CR}"/>'
            f'<path d="M62 108h76l-4 44H66z" fill="{sleeve}"/><circle cx="100" cy="130" r="12" fill="{W}" opacity=".9"/>')


def veg_bag():
    return ('<path d="M70 70q-8-40 10-52M96 72q2-44 22-54M120 74q10-34 34-40" stroke="#3E9B4F" stroke-width="10" fill="none" stroke-linecap="round"/>'
            '<ellipse cx="80" cy="30" rx="14" ry="22" fill="#57B65F" transform="rotate(-20 80 30)"/>'
            '<ellipse cx="150" cy="38" rx="20" ry="12" fill="#57B65F" transform="rotate(-25 150 38)"/>'
            f'<path d="M118 18l12 60h-24z" fill="{O}"/>'
            '<circle cx="62" cy="76" r="22" fill="#E6453A"/><circle cx="142" cy="80" r="18" fill="#F4C542"/>'
            '<path d="M40 80h120l-10 110H50z" fill="#D9A56B"/><path d="M40 80h120l-4 20H44z" fill="#C48B4F"/>'
            f'<rect x="72" y="120" width="56" height="36" rx="6" fill="{CR}"/>')


def chili():
    return (f'<path d="M100 20c30 30 50 60 40 100-8 32-38 54-40 70-2-16-32-38-40-70-10-40 10-70 40-100z" fill="{Y}"/>'
            f'<path d="M100 60c18 20 28 40 22 64-5 20-20 34-22 46-2-12-17-26-22-46-6-24 4-44 22-64z" fill="{O2}"/>'
            '<path d="M58 150q-30-40 0-90 6 30 30 40-10 30-30 50z" fill="#D7262B"/><path d="M60 60q-4-16 8-22" stroke="#3E9B4F" stroke-width="7" fill="none" stroke-linecap="round"/>'
            '<path d="M142 160q34-36 8-92-8 30-32 38 8 32 24 54z" fill="#D7262B"/><path d="M150 68q6-16-6-24" stroke="#3E9B4F" stroke-width="7" fill="none" stroke-linecap="round"/>')


def bottles():
    return (f'<rect x="30" y="70" width="46" height="110" rx="12" fill="{W}"/><rect x="42" y="46" width="22" height="28" rx="4" fill="{PK}"/>'
            f'<rect x="38" y="110" width="30" height="40" rx="4" fill="{PK}" opacity=".5"/>'
            f'<path d="M88 60h40v14q14 8 14 26v80q0 8-8 8H82q-8 0-8-8v-80q0-18 14-26z" fill="{PE}"/><rect x="92" y="30" width="32" height="32" rx="6" fill="{N}"/>'
            f'<rect x="84" y="118" width="48" height="30" rx="4" fill="{W}"/>'
            f'<rect x="150" y="96" width="30" height="84" rx="15" fill="{TL}"/><rect x="156" y="78" width="18" height="20" rx="3" fill="{N}"/>')


def bubble_tea():
    pearls = "".join(f'<circle cx="{x}" cy="{y}" r="8" fill="#3B2418"/>' for x, y in
                     [(72, 170), (92, 176), (112, 172), (130, 166), (82, 154), (104, 158), (122, 150), (96, 140)])
    return (f'<rect x="108" y="8" width="12" height="80" rx="4" fill="{PK}" transform="rotate(12 114 48)"/>'
            f'<path d="M50 60h100l-14 124q-1 8-9 8H73q-8 0-9-8z" fill="#F6E1C0"/>'
            f'<path d="M50 60h100l-3 20H53z" fill="{W}" opacity=".7"/><ellipse cx="100" cy="58" rx="54" ry="10" fill="{W}"/>'
            f'{pearls}<circle cx="150" cy="70" r="30" fill="{Y}"/><circle cx="150" cy="70" r="22" fill="#FFF3B0"/>'
            f'<path d="M150 48v44M128 70h44M134 54l32 32M166 54l-32 32" stroke="{Y}" stroke-width="3"/>')


def teapot():
    return (f'<ellipse cx="95" cy="120" rx="62" ry="54" fill="{W}"/><path d="M150 110q34-10 40-40" stroke="{W}" stroke-width="12" fill="none" stroke-linecap="round"/>'
            f'<path d="M36 100q-26 10-6 44" stroke="{W}" stroke-width="10" fill="none"/>'
            f'<ellipse cx="95" cy="70" rx="34" ry="10" fill="{CR}"/><circle cx="95" cy="56" r="10" fill="{O}"/>'
            f'<path d="M40 128h110" stroke="{O}" stroke-width="6"/>'
            f'<g transform="translate(118 150)"><rect width="56" height="16" rx="8" fill="{PK}"/><rect y="18" width="56" height="16" rx="8" fill="#A7D8A0"/><rect y="36" width="56" height="16" rx="8" fill="{Y}"/></g>')


def cake():
    return (f'<path d="M30 110l140-40v90H30z" fill="{CR}"/><path d="M30 110l140-40v18L30 128z" fill="{W}"/>'
            f'<path d="M30 140h140v10H30z" fill="#6B3A2A"/><path d="M30 110h140v4H30z" fill="{PE}"/>'
            f'<path d="M30 160h140v20H30z" fill="#6B3A2A"/><path d="M30 110h140v50H30z" fill="{PE}" opacity=".6"/>'
            f'<path d="M30 110l140-40" stroke="{W}" stroke-width="10"/>'
            f'<path d="M96 58q10-26 26-4 6 20-14 26-16-4-12-22z" fill="#E6453A"/><path d="M106 40l6-14 6 14" fill="#3E9B4F"/>')


def paw(c=N):
    return (f'<ellipse cx="100" cy="130" rx="46" ry="38" fill="{c}"/>'
            + "".join(f'<ellipse cx="{x}" cy="{y}" rx="18" ry="24" fill="{c}" transform="rotate({r} {x} {y})"/>'
                      for x, y, r in [(50, 80, -25), (82, 52, -8), (118, 52, 8), (150, 80, 25)])
            + f'<g transform="rotate(-30 150 170)"><rect x="118" y="162" width="64" height="16" rx="8" fill="{W}"/>'
              f'<circle cx="118" cy="162" r="10" fill="{W}"/><circle cx="118" cy="178" r="10" fill="{W}"/><circle cx="182" cy="162" r="10" fill="{W}"/><circle cx="182" cy="178" r="10" fill="{W}"/></g>')


def shirt(c=O):
    return (f'<path d="M100 20a12 12 0 1 1 12 12v10" stroke="{N}" stroke-width="6" fill="none" stroke-linecap="round"/>'
            f'<path d="M100 42L30 80h140z" stroke="{N}" stroke-width="6" fill="none" stroke-linejoin="round"/>'
            f'<path d="M72 66l28 12 28-12 44 26-14 30-18-8v84H60v-84l-18 8-14-30z" fill="{c}"/>'
            f'<path d="M86 70q14 16 28 0" stroke="{W}" stroke-width="5" fill="none"/>'
            f'<path d="M60 150h80M60 166h80" stroke="{W}" stroke-width="6" opacity=".5"/>')


def cookies():
    def ck(x, y, r):
        chips = "".join(f'<circle cx="{x+dx*r}" cy="{y+dy*r}" r="{r*.12}" fill="#4A2A1A"/>' for dx, dy in
                        [(-.4, -.3), (.3, -.4), (.1, .1), (-.3, .4), (.45, .3), (-.05, -.6)])
        return f'<circle cx="{x}" cy="{y}" r="{r}" fill="#D9A45B"/><circle cx="{x}" cy="{y}" r="{r*.86}" fill="#E6B870"/>{chips}'
    return ck(70, 80, 50) + ck(135, 120, 55) + ck(70, 160, 34)


def noodle_bowl():
    swirl = "".join(f'<path d="M{60+i*9} {80+i*3}q40 30 80 0" stroke="{Y}" stroke-width="5" fill="none"/>' for i in range(6))
    return (f'<circle cx="100" cy="100" r="96" fill="{W}"/><circle cx="100" cy="100" r="96" fill="none" stroke="{O}" stroke-width="8" stroke-dasharray="14 10"/>'
            f'<circle cx="100" cy="100" r="80" fill="#E8752E"/>{swirl}'
            f'<circle cx="70" cy="130" r="20" fill="{W}"/><circle cx="70" cy="130" r="10" fill="{Y}"/>'
            f'<circle cx="126" cy="136" r="18" fill="{W}"/><circle cx="126" cy="136" r="9" fill="{Y}"/>'
            f'<ellipse cx="138" cy="70" rx="22" ry="12" fill="#57B65F" transform="rotate(-30 138 70)"/>'
            f'<ellipse cx="66" cy="66" rx="18" ry="10" fill="#F2A0A0" transform="rotate(20 66 66)"/><path d="M52 62q14-6 28 8" stroke="{W}" stroke-width="3" fill="none"/>')


def popcorn():
    puffs = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#FFF3C4"/>' for x, y, r in
                    [(60, 60, 22), (90, 44, 24), (122, 48, 22), (146, 66, 20), (74, 80, 20), (108, 72, 24), (136, 84, 18), (100, 30, 16)])
    box = "".join(f'<path d="M{50+i*20} 84h20l-2 110h-16z" fill="{"#E6453A" if i % 2 == 0 else W}"/>' for i in range(5))
    return f'{puffs}<path d="M44 84h112l-12 110H56z" fill="{W}"/>{box}<rect x="70" y="118" width="60" height="30" rx="6" fill="{Y}"/>'


def lantern(c="#E6453A"):
    return (f'<path d="M100 0v30" stroke="{Y}" stroke-width="3"/><rect x="80" y="28" width="40" height="12" rx="3" fill="{Y}"/>'
            f'<ellipse cx="100" cy="100" rx="62" ry="62" fill="{c}"/>'
            f'<path d="M100 38q-40 62 0 124M100 38q40 62 0 124M100 38q-80 62 0 124M100 38q80 62 0 124" stroke="#00000033" stroke-width="3" fill="none"/>'
            f'<rect x="80" y="158" width="40" height="12" rx="3" fill="{Y}"/><path d="M92 170v28M100 170v30M108 170v28" stroke="{Y}" stroke-width="3"/>')


def balloon(c, x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="0" cy="0" rx="48" ry="58" fill="{c}"/>'
            f'<ellipse cx="-16" cy="-22" rx="10" ry="16" fill="{W}" opacity=".35"/><path d="M-6 58h12l-6 10z" fill="{c}"/>'
            f'<path d="M0 68q-14 60 6 140" stroke="{N}" stroke-width="2" fill="none" opacity=".5"/></g>')


def kolam():
    petals = "".join(f'<ellipse cx="100" cy="46" rx="18" ry="40" fill="{c}" transform="rotate({a} 100 100)"/>'
                     for a, c in zip(range(0, 360, 45), [O, PK, Y, TL] * 2))
    ring = "".join(f'<circle cx="{100+84*__import__("math").cos(a/57.3)}" cy="{100+84*__import__("math").sin(a/57.3)}" r="6" fill="{W}"/>'
                   for a in range(0, 360, 30))
    return f'{petals}<circle cx="100" cy="100" r="30" fill="{W}"/><circle cx="100" cy="100" r="16" fill="{O2}"/>{ring}'


def pumpkin():
    return (f'<ellipse cx="60" cy="120" rx="44" ry="60" fill="{O2}"/><ellipse cx="140" cy="120" rx="44" ry="60" fill="{O2}"/>'
            f'<ellipse cx="100" cy="120" rx="50" ry="66" fill="{O}"/><path d="M96 56q0-24 20-30" stroke="#3E9B4F" stroke-width="10" fill="none" stroke-linecap="round"/>'
            f'<path d="M70 104l16-14 10 18zM130 104l-16-14-10 18z" fill="{N}"/><path d="M66 140q34 30 68 0l-12 6-10-8-12 8-12-8-10 8z" fill="{N}"/>')


def tree():
    orn = "".join(f'<circle cx="{x}" cy="{y}" r="7" fill="{c}"/>' for x, y, c in
                  [(86, 80, Y), (118, 102, PK), (78, 128, W), (124, 146, Y), (96, 160, PK), (140, 170, W), (60, 170, Y)])
    return (f'<path d="M100 20l40 60h-18l34 50h-20l40 52H24l40-52H44l34-50H60z" fill="#2E9E5B"/>'
            f'<rect x="88" y="182" width="24" height="18" fill="#6B3A2A"/>{orn}<path d="M100 4l6 14h14l-11 9 4 15-13-8-13 8 4-15-11-9h14z" fill="{Y}"/>')


def bricks():
    def b(x, y, c):
        return (f'<rect x="{x}" y="{y}" width="80" height="44" rx="4" fill="{c}"/>'
                f'<rect x="{x+10}" y="{y-10}" width="22" height="12" rx="3" fill="{c}"/><rect x="{x+48}" y="{y-10}" width="22" height="12" rx="3" fill="{c}"/>')
    return b(20, 140, "#E6453A") + b(100, 140, Y) + b(60, 86, TL) + b(40, 32, O)


def tent():
    return (f'<path d="M20 70L100 20l80 50z" fill="{O}"/>'
            + "".join(f'<path d="M{20+i*32} 70h32q-16 28-32 0z" fill="{"#E6453A" if i % 2 else W}"/>' for i in range(5))
            + f'<rect x="30" y="70" width="8" height="120" fill="{N}"/><rect x="162" y="70" width="8" height="120" fill="{N}"/>'
              f'<rect x="38" y="140" width="124" height="16" fill="#C48B4F"/><circle cx="70" cy="128" r="12" fill="{Y}"/><rect x="94" y="116" width="24" height="24" rx="4" fill="{PK}"/><circle cx="140" cy="128" r="12" fill="{TL}"/>')


def tag():
    return (f'<path d="M30 30h80l70 70-80 80-70-70z" fill="{W}"/><circle cx="62" cy="62" r="12" fill="{O}"/>'
            f'<text x="112" y="126" font-family="{FONT}" font-size="46" font-weight="700" fill="{O2}" text-anchor="middle" transform="rotate(45 112 112)">%</text>')


def coin_card():
    return (f'<rect x="20" y="50" width="130" height="86" rx="12" fill="{N}"/><rect x="20" y="70" width="130" height="16" fill="{O}"/>'
            f'<circle cx="140" cy="140" r="40" fill="{Y}"/><circle cx="140" cy="140" r="30" fill="none" stroke="{O}" stroke-width="4"/>'
            f'<text x="140" y="152" font-family="{FONT}" font-size="34" font-weight="700" fill="{O2}" text-anchor="middle">P</text>')


# ---------- composed images ----------
def write(name, content):
    (OUT / name).write_text(content, encoding="utf8")


def features():
    write("feat-experience.svg", svg(800, 600, bg=O, body=
        stripes(600, -10, n=5, w=40, h=170) +
        t(60, 110, "WELCOME TO EKOCHERAS MALL", 20, N, ls=3) +
        t(56, 260, "A REAL", 96, W) + t(56, 355, "SHOPPING", 96, W) + t(56, 450, "EXPERIENCE", 88, W) +
        f'<circle cx="680" cy="480" r="92" fill="{N}"/>' + t(680, 478, "15 MIN", 44, Y, "middle") +
        t(680, 512, "from KL city", 20, W, "middle", 400) +
        t(60, 540, "No. 693, Batu 5, Jalan Cheras", 20, N, weight=400)))

    write("feat-food-street.svg", svg(800, 600, bg=N, defs=dots("d", W), body=
        '<rect width="800" height="600" fill="url(#d)"/>' +
        at(noodle_bowl(), 600, 320, 1.55) +
        f'<path d="M470 90l230 170M490 76l230 170" stroke="{PE}" stroke-width="10" stroke-linecap="round"/>' +
        t(56, 190, "FOOD", 116, O) + t(56, 300, "STREET", 104, O) +
        t(60, 350, "Authentic flavours of Cheras", 28, W, weight=400) +
        "".join(f'<path d="M{80+i*56} 540l40-120" stroke="#C48B4F" stroke-width="6" stroke-linecap="round"/>'
                f'<rect x="{96+i*56}" y="430" width="22" height="18" rx="4" fill="#8A4B24" transform="rotate(18 {106+i*56} 440)"/>'
                f'<rect x="{106+i*56}" y="458" width="22" height="18" rx="4" fill="#A5602F" transform="rotate(18 {116+i*56} 468)"/>'
                for i in range(4))))

    win = "".join(f'<rect x="{80+i*44}" y="416" width="30" height="22" rx="4" fill="{N2}"/>' for i in range(8))
    write("feat-mrt.svg", svg(800, 600, defs=f'<linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="{SK}"/><stop offset="1" stop-color="{CR}"/></linearGradient>', body=
        '<rect width="800" height="600" fill="url(#g)"/>' + f'<circle cx="700" cy="90" r="46" fill="{Y}"/>' +
        f'<rect x="470" y="190" width="300" height="300" fill="{O}"/>' + stripes(520, 220, n=3, w=26, h=70, gap=12) +
        t(700, 280, "CHERAS", 34, W, "middle") +
        "".join(f'<rect x="{490+i*56}" y="320" width="40" height="120" fill="{W}" opacity=".35"/>' for i in range(5)) +
        f'<path d="M40 280l100-40 100 40z" fill="{N}"/><rect x="50" y="280" width="180" height="120" fill="{N2}"/>' +
        t(140, 350, "MRT", 34, W, "middle") +
        f'<rect x="230" y="296" width="240" height="44" fill="{W}" stroke="{N}" stroke-width="4"/>' +
        "".join(f'<rect x="{240+i*38}" y="304" width="28" height="28" fill="{SK}"/>' for i in range(6)) +
        f'<rect x="0" y="470" width="800" height="12" fill="{N}"/>' +
        "".join(f'<rect x="{40+i*120}" y="482" width="20" height="118" fill="{N2}"/>' for i in range(7)) +
        f'<rect x="60" y="400" width="400" height="66" rx="22" fill="{W}"/>{win}<rect x="60" y="446" width="400" height="8" fill="{O}"/>' +
        t(50, 100, "LINKED TO MRT", 58, N) + t(52, 144, "Taman Mutiara station · Level 1 bridge", 24, N, weight=400)))

    beams = (f'<path d="M0 600L260 0h120L120 600z" fill="{Y}" opacity=".08"/>'
             f'<path d="M800 600L540 0H420l260 600z" fill="{Y}" opacity=".08"/>')
    film = f'<rect x="0" y="520" width="800" height="60" fill="#000" opacity=".6"/>' + "".join(
        f'<rect x="{10+i*40}" y="530" width="22" height="12" rx="2" fill="{W}" opacity=".7"/><rect x="{10+i*40}" y="558" width="22" height="12" rx="2" fill="{W}" opacity=".7"/>' for i in range(20))
    write("feat-cinema.svg", svg(800, 600, bg="#10183A", body=beams + film +
        at(popcorn(), 590, 300, 1.8) + t(56, 210, "MOVIE", 116, Y) + t(56, 320, "NIGHTS", 116, Y) +
        t(60, 372, "Golden Screen Cinemas · Level 2", 26, W, weight=400)))

    stars = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{W}" opacity=".7"/>' for x, y, r in
                    [(80, 60, 2), (220, 120, 3), (360, 50, 2), (420, 180, 2), (740, 400, 2), (300, 260, 2), (60, 300, 3), (760, 60, 2)])
    write("feat-mid-autumn.svg", svg(800, 600, defs=f'<linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#1D2A5E"/><stop offset="1" stop-color="#4A2C6B"/></linearGradient>', body=
        '<rect width="800" height="600" fill="url(#g)"/>' + stars +
        f'<circle cx="590" cy="230" r="150" fill="#FFD66B"/><circle cx="540" cy="190" r="26" fill="#FFE59A"/><circle cx="640" cy="290" r="18" fill="#FFE59A"/><circle cx="630" cy="170" r="12" fill="#FFE59A"/>' +
        at(lantern(), 120, 150, .9) + at(lantern(O), 280, 110, .7) + at(lantern(PK), 420, 190, .6) +
        t(56, 450, "MID-AUTUMN", 80, W) + t(58, 512, "LANTERN NIGHTS", 46, Y)))

    confetti = "".join(f'<rect x="{x}" y="{y}" width="14" height="6" fill="{c}" transform="rotate({r} {x} {y})"/>' for x, y, r, c in
                       [(60, 60, 20, PK), (180, 480, -30, TL), (340, 60, 45, N), (420, 520, 10, O), (90, 520, 60, Y), (380, 440, -20, PK), (260, 40, 70, TL)])
    write("feat-family.svg", svg(800, 600, bg=PE, body=confetti +
        balloon(O, 560, 170) + balloon(TL, 660, 220, .9) + balloon(PK, 480, 250, .85) + balloon(N2, 620, 110, .7) + balloon(Y, 720, 130, .75) +
        t(56, 240, "FAMILY", 110, N) + t(56, 345, "FUN DAYS", 110, O) +
        t(60, 400, "Play zones &amp; kids' favourites on Level 2", 26, N, weight=400)))


def shop_cards():
    cards = [("shop-coffee", "#2E6B4F", cup(Y), "COFFEE BREAK"), ("shop-grocer", "#F3E6CF", veg_bag(), "FRESH PICKS"),
             ("shop-chili", "#2A1A1A", chili(), "FLAME-GRILLED"), ("shop-beauty", "#FBD3DA", bottles(), "SELF-CARE"),
             ("shop-bubble", Y, bubble_tea(), "BUBBLE TEA"), ("shop-tea", N2, teapot(), "TEA TIME"),
             ("shop-cake", "#F7C6B8", cake(), "CAKE O'CLOCK"), ("shop-pets", TL, paw(), "PET PAMPER"),
             ("shop-fashion", CR, shirt(), "NEW SEASON"), ("shop-cookies", "#6B3A2A", cookies(), "FRESH BAKED")]
    for name, bg, icon, cap in cards:
        light = bg in ("#F3E6CF", "#FBD3DA", Y, "#F7C6B8", CR)
        ink = N if light else W
        write(f"{name}.svg", svg(600, 800, bg=bg, defs=dots("d", ink, .12), body=
            '<rect width="600" height="800" fill="url(#d)"/>' + at(icon, 300, 340, 2.1) +
            f'<rect x="40" y="620" width="520" height="4" fill="{ink}" opacity=".3"/>' + t(300, 700, cap, 58, ink, "middle")))


def topics():
    items = [("topic-lantern", "#1D2A5E", lantern(), "LANTERN", "WALK", Y), ("topic-deepavali", "#5B1F5E", kolam(), "FESTIVAL", "OF LIGHTS", Y),
             ("topic-halloween", "#231A33", pumpkin(), "TRICK OR", "TREAT", O), ("topic-market", CR, tent(), "WEEKEND", "MARKET", N),
             ("topic-rewards", SK, coin_card(), "SHOP &amp;", "REWARDS", N), ("topic-sale", O2, tag(), "YEAR-END", "SALE", W),
             ("topic-christmas", "#B3262E", tree(), "CHRISTMAS", "WONDERLAND", W), ("topic-bricks", Y, bricks(), "BUILD-A-", "BRICK", N)]
    for name, bg, icon, l1, l2, ink in items:
        write(f"{name}.svg", svg(600, 600, bg=bg, defs=dots("d", ink, .12, 32), body=
            '<rect width="600" height="600" fill="url(#d)"/>' + at(icon, 300, 230, 1.6) +
            t(300, 470, l1, 56, ink, "middle") + t(300, 536, l2, 56, ink, "middle")))


def dining_tile():
    planks = "".join(f'<rect x="0" y="{i*100}" width="800" height="98" fill="{c}"/>' for i, c in enumerate(["#4A3326", "#3F2B20", "#46301F", "#3A281D", "#442F22", "#3D2A1F"]))
    nasi = (f'<circle cx="100" cy="100" r="96" fill="#7BAA4A"/><circle cx="100" cy="100" r="84" fill="#8FC05B"/>'
            f'<circle cx="92" cy="96" r="44" fill="{W}"/><path d="M130 60q30 10 30 40-20 6-34-10z" fill="#C7302B"/>'
            f'<ellipse cx="136" cy="140" rx="26" ry="18" fill="{W}"/><circle cx="136" cy="140" r="10" fill="{Y}"/>'
            f'<path d="M40 130l24 20M48 124l24 20M56 118l24 20" stroke="#E7F2C8" stroke-width="10" stroke-linecap="round"/>'
            + "".join(f'<ellipse cx="{x}" cy="{y}" rx="6" ry="4" fill="#C98A4B"/>' for x, y in [(70, 160), (82, 166), (96, 168), (108, 162), (60, 150)]))
    kopi = f'<circle cx="100" cy="100" r="90" fill="{W}"/><circle cx="100" cy="100" r="60" fill="#E9E1D6"/><circle cx="100" cy="100" r="50" fill="#6B3E1E"/><path d="M160 90h30v20h-30z" fill="#E9E1D6"/>'
    write("tile-dining.svg", svg(800, 600, body=planks + at(noodle_bowl(), 240, 300, 1.5) + at(nasi, 580, 210, 1.2) + at(kopi, 610, 470, .7) +
        f'<path d="M380 520l260-420M400 530l260-420" stroke="#D9B98A" stroke-width="9" stroke-linecap="round"/>'))


def hero_illust():
    write("hero-illust.svg", svg(520, 320, body=
        f'<rect x="0" y="270" width="520" height="50" fill="{PE}"/>'
        f'<path d="M280 70h200v200H280z" fill="{O}"/>' + stripes(300, 90, n=3, w=18, h=46, gap=8) +
        "".join(f'<rect x="{296+i*40}" y="160" width="28" height="90" fill="{W}" opacity=".35"/>' for i in range(5)) +
        f'<path d="M20 150l70-30 70 30z" fill="{N}"/><rect x="28" y="150" width="124" height="120" fill="{N2}"/>' +
        t(90, 214, "MRT", 26, W, "middle") +
        f'<rect x="152" y="160" width="128" height="30" fill="{W}" stroke="{N}" stroke-width="3"/>' +
        "".join(f'<rect x="{158+i*24}" y="166" width="18" height="18" fill="{SK}"/>' for i in range(5)) +
        f'<path d="M205 120l10-24 10 24M215 96v-20" stroke="{N}" stroke-width="3" fill="none"/>' +
        f'<circle cx="440" cy="40" r="24" fill="{Y}"/>' + t(380, 64, "L1", 22, N, "middle")))


def photos():
    """Crop/compress the original photos that still suit the new layout."""
    from PIL import Image, ImageOps
    src = OUT / "src"
    for f, name, size in [("home-slider03.jpg", "photo-atrium-wide.jpg", (1200, 750))]:
        if (src / f).exists():
            ImageOps.fit(Image.open(src / f).convert("RGB"), size, centering=(.5, .5)).save(OUT / name, quality=80, optimize=True)


if __name__ == "__main__":
    features(); shop_cards(); topics(); dining_tile(); hero_illust(); photos()
    print("wrote", len(list(OUT.glob("*.svg"))), "svgs")
