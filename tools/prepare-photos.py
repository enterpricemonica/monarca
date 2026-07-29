#!/usr/bin/env python3
"""Turn the client's raw photographs into web-sized product images.

Phone and camera originals run 1-3 MB each. Unprocessed they would dwarf the
entire rest of the site, on a shop whose customers browse on mobile data.
Run again whenever a new photograph arrives.
"""
import os
from PIL import Image

SOURCE_DIR = "/mnt/c/Users/santa/Downloads"
OUT_DIR = "assets/products"

# source file -> (output name, crop box as fractions of w/h, or None for whole)
PHOTOS = {
    "Varios productos.png": ("la-coleccion.jpg", None),
    "Jabones.png": ("jabon-artesanal.jpg", (0.50, 0.06, 1.00, 0.94)),
    "Exfoliante de Cafe.png": ("exfoliante-de-cafe.jpg", (0.02, 0.03, 0.98, 1.00)),
}

MAX_EDGE = 1400
QUALITY = 80


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for source, (name, box) in PHOTOS.items():
        path = os.path.join(SOURCE_DIR, source)
        if not os.path.exists(path):
            print(f"skipped (not found): {source}")
            continue
        image = Image.open(path).convert("RGB")
        before = os.path.getsize(path)
        if box:
            w, h = image.size
            image = image.crop((int(w * box[0]), int(h * box[1]),
                                int(w * box[2]), int(h * box[3])))
        image.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
        out = os.path.join(OUT_DIR, name)
        image.save(out, quality=QUALITY, optimize=True, progressive=True)
        after = os.path.getsize(out)
        print(f"{name:24} {image.size[0]}x{image.size[1]}  "
              f"{before/1024:7.0f} KB -> {after/1024:6.0f} KB")


if __name__ == "__main__":
    main()
