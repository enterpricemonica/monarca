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


if __name__ == "__main__":
    main()
