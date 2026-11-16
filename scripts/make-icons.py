"""Membuat ikon PWA/aplikasi dari satu sumber, supaya logo sama di semua ukuran.

Sumber: public/brand/gerabara-mark-1024.png (kendi Gerabara, latar transparan).
Jalankan dari folder proyek setelah mengganti berkas sumber:

    python scripts/make-icons.py
"""

from PIL import Image, ImageDraw

SOURCE = "public/brand/gerabara-mark-1024.png"
CREAM = (253, 245, 234, 255)  # sama dengan --color-brand-cream
SS = 4  # faktor supersample agar tepi halus


def load_mark() -> Image.Image:
    mark = Image.open(SOURCE).convert("RGBA")
    return mark.crop(mark.getbbox())  # buang tepi kosong


def fit(mark: Image.Image, box: int) -> Image.Image:
    scale = min(box / mark.width, box / mark.height)
    return mark.resize((round(mark.width * scale), round(mark.height * scale)), Image.LANCZOS)


def centered(mark: Image.Image, size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return canvas


def tile(mark: Image.Image, size: int, frac: float, rounded: bool) -> Image.Image:
    """frac = bagian kanvas yang diisi logo (ikon maskable butuh ruang aman lebih lebar)."""
    s = size * SS
    bg = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bg)
    if rounded:
        draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.225), fill=CREAM)
    else:
        draw.rectangle([0, 0, s, s], fill=CREAM)
    scaled = fit(mark, int(s * frac))
    bg.alpha_composite(scaled, ((s - scaled.width) // 2, (s - scaled.height) // 2))
    return bg.resize((size, size), Image.LANCZOS)


def main():
    mark = load_mark()
    tile(mark, 512, 0.72, True).save("public/icon-512.png")
    tile(mark, 192, 0.72, True).save("public/icon-192.png")
    # iOS membulatkan sudut sendiri dan tidak menerima transparansi.
    tile(mark, 180, 0.70, False).convert("RGB").save("src/app/apple-icon.png")
    # Android memotong ikon maskable jadi lingkaran — logo harus berada di tengah.
    tile(mark, 512, 0.56, False).convert("RGB").save("public/icon-maskable-512.png")
    # Tab browser: kendi saja tanpa kotak, supaya tetap terbaca di ukuran 16 px.
    centered(fit(mark, 256), 256).save("src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("ikon selesai dibuat")


if __name__ == "__main__":
    main()
