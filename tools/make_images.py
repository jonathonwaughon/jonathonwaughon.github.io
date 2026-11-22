"""Regenerate the PNG icons and the social share image (assets/og-image.png).

Usage (from the repo root):  python tools/make_images.py
Needs Pillow (pip install pillow). Uses Windows fonts (Segoe UI, Consolas);
edit FONTS / the font() calls if you're on another OS.
Edit the text near the bottom ("Hi, I'm", the tagline, etc.) and re-run.
"""
import math, os, random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

REPO = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "assets")
os.makedirs(OUT, exist_ok=True)
random.seed(7)

BG = (11, 17, 32)
BLUE = (56, 189, 248)
GREEN = (52, 211, 153)
PINK = (244, 114, 182)
VIOLET = (167, 139, 250)
FONTS = "C:/Windows/Fonts/"


def font(name, size):
    try:
        return ImageFont.truetype(FONTS + name, size)
    except OSError:
        return ImageFont.load_default()


def lighten(c, k=80):
    return tuple(min(255, v + k) for v in c)


def vertical_gradient(size, top, bottom):
    w, h = size
    g = Image.new("RGBA", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        g.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,))
    return g.resize((w, h))


def draw_jelly(img, cx, cy, s, color, alpha=255, tentacles=True, glow=True):
    """Cute jellyfish centered on the bell's bottom edge at (cx, cy); s = bell radius. Draws at 4x and downsamples."""
    k = 4
    W = int(s * 6 * k)
    layer = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    ox, oy = W / 2, W * 0.38          # bell-bottom anchor inside the layer
    S = s * k
    if glow:
        g = Image.new("RGBA", (W, W), (0, 0, 0, 0))
        ImageDraw.Draw(g).ellipse([ox - S * 2.2, oy - S * 1.6, ox + S * 2.2, oy + S * 2.4], fill=color + (70,))
        layer = Image.alpha_composite(layer, g.filter(ImageFilter.GaussianBlur(S * 0.8)))
        d = ImageDraw.Draw(layer)
    if tentacles:
        for i in range(5):
            bx = ox + (i / 4 - 0.5) * S * 1.5
            length = S * (2.1 + (i % 2) * 0.6)
            pts = [(bx + math.sin(i * 1.3 + p * 4) * S * 0.22 * p, oy + p * length) for p in [j / 16 for j in range(17)]]
            d.line(pts, fill=color + (170,), width=max(2, int(S * 0.09)), joint="curve")
        for side in (-1, 1):
            pts = [(ox + side * S * 0.15 + math.sin(side + p * 5) * S * 0.18, oy + p * S * 1.4) for p in [j / 16 for j in range(17)]]
            d.line(pts, fill=color + (210,), width=max(3, int(S * 0.2)), joint="curve")
    # bell: dome + scalloped bottom
    pts = []
    for j in range(61):
        a = math.pi + math.pi * j / 60
        pts.append((ox + math.cos(a) * S, oy + math.sin(a) * S * 0.85))
    scallops = 4
    for i in range(scallops):
        x0 = ox + S - i * (2 * S / scallops)
        for j in range(1, 11):
            t = j / 10
            pts.append((x0 - t * (2 * S / scallops), oy + math.sin(t * math.pi) * S * 0.14))
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    grad = vertical_gradient((W, W), lighten(color, 90), color)
    bell = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    bell.paste(grad, (0, 0), mask)
    layer = Image.alpha_composite(layer, bell)
    d = ImageDraw.Draw(layer)
    # shine
    ov = Image.new("RGBA", (W, W), (0, 0, 0, 0))   # translucent bits go on an overlay so they blend
    ImageDraw.Draw(ov).ellipse([ox - S * 0.62, oy - S * 0.62, ox - S * 0.2, oy - S * 0.4], fill=(255, 255, 255, 110))
    layer = Image.alpha_composite(layer, ov)
    d = ImageDraw.Draw(layer)
    # face
    ey, ex, er = oy - S * 0.85 * 0.25, S * 0.32, max(2, S * 0.1)
    for sx in (-ex, ex):
        d.ellipse([ox + sx - er, ey - er, ox + sx + er, ey + er], fill=BG + (255,))
        d.ellipse([ox + sx + er * 0.1, ey - er * 0.75, ox + sx + er * 0.7, ey - er * 0.15], fill=(255, 255, 255, 255))
    ov = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    for sx in (-1, 1):
        bx = ox + sx * ex * 1.45
        ImageDraw.Draw(ov).ellipse([bx - er * 1.1, ey + er * 1.2, bx + er * 1.1, ey + er * 2.4], fill=PINK + (150,))
    layer = Image.alpha_composite(layer, ov)
    d = ImageDraw.Draw(layer)
    d.arc([ox - er * 0.9, ey + er * 0.3, ox + er * 0.9, ey + er * 2.1], 25, 155, fill=BG + (255,), width=max(2, int(S * 0.06)))
    layer = layer.resize((W // k, W // k), Image.LANCZOS)
    if alpha < 255:
        a = layer.getchannel("A").point(lambda v: v * alpha // 255)
        layer.putalpha(a)
    img.alpha_composite(layer, (int(cx - W / k / 2), int(cy - W / k * 0.38)))


# ---------- app icons ----------
def icon(size, pad_ratio=0.0):
    img = Image.new("RGBA", (size, size), BG + (255,))
    s = size * 0.33
    draw_jelly(img, size / 2, size * 0.53, s, BLUE, glow=False)
    return img


icon(180).convert("RGB").save(os.path.join(OUT, "apple-touch-icon.png"))
icon(32).save(os.path.join(OUT, "favicon-32.png"))
icon(512).convert("RGB").save(os.path.join(OUT, "icon-512.png"))
icon(256).save(os.path.join(REPO, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

# ---------- social share image (1200x630) ----------
W, H = 1200, 630
og = vertical_gradient((W, H), (22, 62, 102), BG).convert("RGBA")
fx = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(fx)
for x, w in [(180, 120), (520, 90), (860, 150), (1080, 80)]:   # light rays
    d.polygon([(x - w * 0.3, 0), (x + w * 0.3, 0), (x + w * 1.4 + 90, H), (x - w * 1.4 + 90, H)], fill=(125, 211, 252, 16))
for i in range(5):                                             # flowing current bands
    y0 = H * (0.18 + i * 0.18)
    pts = [(x, y0 + math.sin(x * 0.006 + i) * (14 + i * 4)) for x in range(-20, W + 21, 10)]
    d.line(pts, fill=(56, 189, 248, 14), width=44 + i * 6)
    d.line(pts, fill=(125, 211, 252, 30), width=2)
for _ in range(120):                                           # specks
    x, y, r = random.uniform(0, W), random.uniform(0, H), random.uniform(0.6, 2.2)
    d.ellipse([x - r, y - r, x + r, y + r], fill=(186, 230, 253, random.randint(40, 120)))
og = Image.alpha_composite(og, fx.filter(ImageFilter.GaussianBlur(1)))

draw_jelly(og, 1010, 250, 62, BLUE)
draw_jelly(og, 860, 420, 38, VIOLET, alpha=220)
draw_jelly(og, 1110, 470, 30, PINK, alpha=210)
draw_jelly(og, 760, 170, 24, GREEN, alpha=190)

d = ImageDraw.Draw(og)
# status pill
pill_font = font("segoeui.ttf", 22)
d.rounded_rectangle([80, 120, 382, 162], radius=21, fill=(11, 17, 32, 170), outline=(30, 42, 68, 255), width=2)
d.ellipse([100, 135, 112, 147], fill=GREEN + (255,))
d.text((124, 127), "Open to opportunities", font=pill_font, fill=(148, 163, 184, 255))
# name with gradient
name_font = font("segoeuib.ttf", 96)
d.text((76, 190), "Hi, I'm", font=name_font, fill=(226, 232, 240, 255))
mask = Image.new("L", (W, H), 0)
ImageDraw.Draw(mask).text((76, 300), "JR Waughon", font=name_font, fill=255)
grad = Image.new("RGBA", (W, H))
for x in range(W):
    t = min(1, max(0, (x - 76) / 560))
    col = tuple(int(BLUE[i] + (GREEN[i] - BLUE[i]) * t) for i in range(3)) + (255,)
    ImageDraw.Draw(grad).line([(x, 0), (x, H)], fill=col)
og.paste(grad, (0, 0), mask)
d = ImageDraw.Draw(og)
sub_font = font("segoeuib.ttf", 34)
d.text((80, 430), "I build", font=sub_font, fill=(125, 211, 252, 255))
w_ib = d.textlength("I build ", font=sub_font)
d.text((80 + w_ib, 430), "software, models & ai tools", font=sub_font, fill=GREEN + (255,))
d.text((80, 486), "Analyst & Developer  ·  finance, coding, ai", font=font("segoeui.ttf", 26), fill=(148, 163, 184, 255))
d.text((80, 548), "jonathonwaughon.github.io", font=font("consola.ttf", 24), fill=(100, 116, 139, 255))
og.convert("RGB").save(os.path.join(OUT, "og-image.png"), optimize=True)

for f in ["assets/apple-touch-icon.png", "assets/favicon-32.png", "assets/icon-512.png", "favicon.ico", "assets/og-image.png"]:
    p = os.path.join(REPO, f)
    print(f, os.path.getsize(p), "bytes")
