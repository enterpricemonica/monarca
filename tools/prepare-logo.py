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


def butterfly_favicon(mark, size=256, padding=0.10):
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
    # The square catches a short fragment of the script's stroke in its
    # lower-left corner, because the wordmark's baseline passes just under the
    # butterfly. Lifting the centre to exclude it was tried and rejected: it
    # clipped the upper wing tip, and a clipped wing reads as a mistake while a
    # stray stroke reads as an antenna. Padding is kept generous for the same
    # reason — nothing that belongs to the butterfly may touch an edge.
    side = int(max(right - left, bottom - top) * (1 + 2 * padding))
    cx, cy = (left + right) // 2, (top + bottom) // 2
    box = (cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)

    icon = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    icon.paste(mark.crop(box), (0, 0))
    return icon.resize((size, size), Image.LANCZOS)


def main():
    wreath = remove_light_background(Image.open(SOURCE_WREATH))
    wreath.save("assets/wreath-monarca.png")
    print("wrote assets/wreath-monarca.png", wreath.size)

    # The wordmark occupies roughly the middle band of the contact page.
    page = Image.open(SOURCE_MARK)
    width, height = page.size
    box = (int(width * 0.24), int(height * 0.23), int(width * 0.87), int(height * 0.49))
    # threshold=232 matches the measured ~238 mean lightness of this page's
    # textured paper background; denoise=9 mops up the grain (see docstring).
    mark = remove_light_background(page.crop(box), threshold=232, denoise=9)
    mark.thumbnail((600, 600), Image.LANCZOS)
    mark.save("assets/logo-monarca.png")
    print("wrote assets/logo-monarca.png", mark.size)

    icon = butterfly_favicon(mark)
    icon.save("assets/favicon-monarca.png")
    print("wrote assets/favicon-monarca.png", icon.size)


if __name__ == "__main__":
    main()
