"""Draws the app icons for the PDF merger.

The icon shows two pages stacked on top of each other (two PDFs
becoming one) on the indigo colour of the Merge button.

Run from the mergepdf folder:
    python tools/make_icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

# Same colours as the page
INDIGO = (94, 106, 210)      # the Merge button (#5e6ad2, as in Walk Studio)
BACK_PAGE = (199, 210, 254)  # light indigo
FRONT_PAGE = (255, 255, 255)
TEXT_LINE = (165, 180, 252)

OUTPUT_FOLDER = Path(__file__).resolve().parent.parent / "icons"

# File name -> size in pixels.
# 180 is what iPhones use for the home screen; 192 and 512 are for other devices.
ICON_SIZES = {
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
}


def draw_icon(size):
    """Returns a square image of the icon at the given size."""
    image = Image.new("RGB", (size, size), INDIGO)
    draw = ImageDraw.Draw(image)

    page_width = size * 0.42
    page_height = size * 0.54
    offset = size * 0.1
    radius = size * 0.03

    # Back page: up and to the left. Front page: down and to the right.
    back_left = size / 2 - page_width / 2 - offset / 2
    back_top = size / 2 - page_height / 2 - offset / 2
    front_left = back_left + offset
    front_top = back_top + offset

    draw_page(draw, back_left, back_top, page_width, page_height, radius, BACK_PAGE)
    draw_page(draw, front_left, front_top, page_width, page_height, radius, FRONT_PAGE)
    draw_text_lines(draw, front_left, front_top, page_width, size)
    return image


def draw_page(draw, left, top, width, height, radius, colour):
    """Draws one page as a rounded rectangle."""
    draw.rounded_rectangle([left, top, left + width, top + height], radius=radius, fill=colour)


def draw_text_lines(draw, left, top, width, size):
    """Draws a few short lines on the front page, like lines of text."""
    margin = width * 0.18
    line_height = max(2, size * 0.025)
    gap = size * 0.07
    for i, length in enumerate((1.0, 1.0, 0.6)):
        y = top + size * 0.12 + i * gap
        right = left + margin + (width - 2 * margin) * length
        draw.rounded_rectangle([left + margin, y, right, y + line_height],
                               radius=line_height / 2, fill=TEXT_LINE)


def main():
    OUTPUT_FOLDER.mkdir(exist_ok=True)
    for file_name, size in ICON_SIZES.items():
        draw_icon(size).save(OUTPUT_FOLDER / file_name)
        print("saved", OUTPUT_FOLDER / file_name)


if __name__ == "__main__":
    main()
