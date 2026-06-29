from PIL import Image

src = r"c:\Users\User\Downloads\Ustawi\images\best.png"
out = r"c:\Users\User\Downloads\Ustawi\frontend\public\images\logo\best.png"

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r < 45 and g < 45 and b < 45:
            pixels[x, y] = (0, 0, 0, 0)

# Tight crop using visible pixels only (ignore faint edge halos)
rows = [y for y in range(h) if any(pixels[x, y][3] > 32 for x in range(w))]
cols = [x for x in range(w) if any(pixels[x, y][3] > 32 for y in range(h))]
if rows and cols:
    pad = 8
    left = max(0, min(cols) - pad)
    right = min(w, max(cols) + pad + 1)
    top = max(0, min(rows) - pad)
    bottom = min(h, max(rows) + pad + 1)
    img = img.crop((left, top, right, bottom))

img.save(out, optimize=True)
print(f"Saved {out} size={img.size}")
