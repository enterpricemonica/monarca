#!/usr/bin/env python3
"""Derive publishable logo assets from the source artwork.

Run once. The outputs are committed; this script exists so the process is
repeatable if the source artwork changes.
"""
from PIL import Image, ImageFilter

SOURCE_WREATH = "/mnt/c/Users/santa/Downloads/monarca-logo.png.png"
SOURCE_MARK = "/mnt/c/Users/santa/Downloads/11.png"


def remove_light_background(image, threshold=238, denoise=0):
    """Make near-white pixels transparent, feathering by how light they are.

    `denoise` runs a median filter over a throwaway copy of the image and uses
    that copy only to decide each pixel's alpha (the visible RGB is untouched).
    The wreath source has a flat, solid-colour background, so denoise=0 (the
    default) is a no-op there. The contact-page source that the wordmark is
    cropped from has a textured paper background: individual grain specks dip
    as low as ~125 in lightness, well past any threshold that still keeps thin
    ink strokes, so plain thresholding leaves the crop peppered with opaque
    speckles. A median filter erases isolated few-pixel specks while leaving
    the much thicker text/butterfly strokes intact, so it cleans up the alpha
    mask without softening the artwork itself.
    """
    image = image.convert("RGBA")
    reference = image.filter(ImageFilter.MedianFilter(size=denoise)) if denoise else image
    pixels = image.load()
    ref_pixels = reference.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            rr, rg, rb, _ = ref_pixels[x, y]
            lightest = max(rr, rg, rb)
            if min(rr, rg, rb) >= threshold:
                pixels[x, y] = (r, g, b, 0)
            elif lightest >= threshold:
                # partial transparency at the edges keeps the artwork from looking cut out
                pixels[x, y] = (r, g, b, int(a * (255 - lightest) / (255 - threshold)))
    return image


def butterfly_favicon(mark, size=256, padding=0.24):
    """Crop the butterfly out of the wordmark and return it as a square icon.

    The wordmark is roughly 2.4:1, so using it as a favicon squashes it into an
    illegible smear at 16 px. The butterfly is the one element of this identity
    that survives that size: a compact, high-contrast, strongly coloured shape.

    Its bounding box is found by hue rather than by fixed coordinates, so the
    crop still lands correctly if the wordmark artwork is ever re-cut.
    """
    pixels = mark.convert("RGBA").load()
    width, height = mark.size
    left, top, right, bottom = width, height, 0, 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # The butterfly is the only orange in the mark; the script is black.
            if a > 40 and r > 120 and r - b > 45 and g < r:
                left, top = min(left, x), min(top, y)
                right, bottom = max(right, x), max(bottom, y)
    if right <= left or bottom <= top:
        raise SystemExit("No orange butterfly found in the wordmark — check the crop.")

    # Square it around the butterfly's centre so nothing is distorted.
    #
    # `padding` has to be generous: the bounding box above is measured from
    # ORANGE pixels only, and the butterfly's black outline and white wing
    # spots sit outside that. Measured at 0.10 the wing tips were still being
    # clipped by the top edge. Lifting the centre instead was tried and
    # rejected — it traded the clip for a worse one.
    side = int(max(right - left, bottom - top) * (1 + 2 * padding))
    cx, cy = (left + right) // 2, (top + bottom) // 2
    box = (cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)

    icon = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    icon.paste(mark.crop(box), (0, 0))
    return keep_near_orange(icon).resize((size, size), Image.LANCZOS)


def keep_near_orange(icon, reach=14):
    """Erase everything that isn't the butterfly.

    The wordmark's baseline sweeps diagonally through the square crop, so the
    icon would otherwise carry two stray fragments of script stroke entering at
    the edges. A connected-component fill can't separate them — the final "a"
    runs into the butterfly's wing — but proximity to colour can: every black
    pixel belonging to the butterfly is an outline lying within a few pixels of
    its orange, while the script's stroke is orange-free for its whole length.

    So: dilate the orange mask by `reach` pixels and keep only what falls
    inside it.
    """
    pixels = icon.load()
    width, height = icon.size

    orange = Image.new("L", icon.size, 0)
    orange_pixels = orange.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 40 and r > 120 and r - b > 45 and g < r:
                orange_pixels[x, y] = 255

    # MaxFilter grows the mask; an odd window of 2*reach+1 grows it by `reach`.
    grown = orange.filter(ImageFilter.MaxFilter(size=2 * reach + 1)).load()
    for y in range(height):
        for x in range(width):
            if not grown[x, y]:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)
    return icon


def clear_centre(wreath, radius=0.315):
    """Empty the middle of the wreath so it becomes a frame, not a poster.

    The source artwork has "BIENVENIDA", the "Monarca" script, the tagline and
    "PRODUCTOS ARTESANALES" baked into the ring's centre. Left in, the hero
    would show all of that twice — once as pixels, once as the real HTML
    heading laid over it — and baked-in text cannot reflow, so on a 360 px
    phone the tagline would be unreadable.

    Erasing a disc clears every one of those elements while staying well inside
    the thin lavender circle (which sits at roughly 0.41 of the width) and
    nowhere near the flowers.
    """
    wreath = wreath.convert("RGBA")
    pixels = wreath.load()
    width, height = wreath.size
    cx, cy = width / 2, height / 2
    limit = (radius * width) ** 2
    for y in range(height):
        dy2 = (y - cy) ** 2
        for x in range(width):
            if (x - cx) ** 2 + dy2 <= limit:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)
    return wreath


def compress(image, colors=200):
    """Shrink the palette. These are watercolour and line art, not photographs,
    so 200 colours is visually indistinguishable while cutting roughly 77% of
    the bytes — which matters for customers browsing on mobile data."""
    return image.quantize(colors=colors, method=Image.FASTOCTREE)


def main():
    wreath = clear_centre(remove_light_background(Image.open(SOURCE_WREATH)))
    wreath.thumbnail((960, 960), Image.LANCZOS)
    compress(wreath).save("assets/wreath-monarca.png", optimize=True)
    print("wrote assets/wreath-monarca.png", wreath.size)

    # The wordmark occupies roughly the middle band of the contact page.
    page = Image.open(SOURCE_MARK)
    width, height = page.size
    box = (int(width * 0.24), int(height * 0.23), int(width * 0.87), int(height * 0.49))
    # threshold=232 matches the measured ~238 mean lightness of this page's
    # textured paper background; denoise=9 mops up the grain (see docstring).
    mark = remove_light_background(page.crop(box), threshold=232, denoise=9)
    mark.thumbnail((600, 600), Image.LANCZOS)
    icon = butterfly_favicon(mark)          # derived before the palette is cut
    compress(mark).save("assets/logo-monarca.png", optimize=True)
    print("wrote assets/logo-monarca.png", mark.size)

    compress(icon).save("assets/favicon-monarca.png", optimize=True)
    print("wrote assets/favicon-monarca.png", icon.size)


if __name__ == "__main__":
    main()
