#!/usr/bin/env python3
"""Build native launch artwork from the game's source visuals.

Run this from the repository root after changing the brand art. Pillow is the
only dependency; the script keeps every platform rendition visually aligned.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BACKGROUND = ROOT / "public/assets/menu-space-v2.png"
CREST = ROOT / "public/assets/spacetitle.png"
FONT = ROOT / "public/assets/fonts/caramel_3/Caramel.ttf"

ANDROID_SPLASHES = {
    "android/app/src/main/res/drawable/splash.png": (480, 320),
    "android/app/src/main/res/drawable-land-mdpi/splash.png": (480, 320),
    "android/app/src/main/res/drawable-land-hdpi/splash.png": (800, 480),
    "android/app/src/main/res/drawable-land-xhdpi/splash.png": (1280, 720),
    "android/app/src/main/res/drawable-land-xxhdpi/splash.png": (1600, 960),
    "android/app/src/main/res/drawable-land-xxxhdpi/splash.png": (1920, 1280),
    "android/app/src/main/res/drawable-port-mdpi/splash.png": (320, 480),
    "android/app/src/main/res/drawable-port-hdpi/splash.png": (480, 800),
    "android/app/src/main/res/drawable-port-xhdpi/splash.png": (720, 1280),
    "android/app/src/main/res/drawable-port-xxhdpi/splash.png": (960, 1600),
    "android/app/src/main/res/drawable-port-xxxhdpi/splash.png": (1280, 1920),
}

IOS_SPLASHES = (
    "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png",
    "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png",
    "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png",
)


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    scale = max(width / image.width, height / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height)).convert("RGBA")


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, start: int) -> ImageFont.FreeTypeFont:
    size = start
    while size > 12:
        font = ImageFont.truetype(FONT, size)
        if draw.textbbox((0, 0), text, font=font, stroke_width=max(1, size // 22))[2] <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(FONT, 12)


def render_splash(size: tuple[int, int]) -> Image.Image:
    width, height = size
    short_side = min(size)
    background = cover(Image.open(BACKGROUND), size)
    background.alpha_composite(Image.new("RGBA", size, (5, 8, 27, 50)))

    glow = Image.new("RGBA", size)
    glow_draw = ImageDraw.Draw(glow)
    glow_width = round(short_side * 0.52)
    glow_height = round(short_side * 0.34)
    center_y = round(height * (0.42 if height > width else 0.38))
    glow_draw.ellipse(
        (
            width // 2 - glow_width // 2,
            center_y - glow_height // 2,
            width // 2 + glow_width // 2,
            center_y + glow_height // 2,
        ),
        fill=(92, 225, 230, 42),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(max(4, short_side // 18)))
    background.alpha_composite(glow)

    crest = Image.open(CREST).convert("RGBA")
    crest_max_width = round(short_side * (0.46 if height > width else 0.42))
    crest_max_height = round(height * (0.30 if height > width else 0.42))
    crest_scale = min(crest_max_width / crest.width, crest_max_height / crest.height)
    crest = crest.resize(
        (round(crest.width * crest_scale), round(crest.height * crest_scale)),
        Image.Resampling.NEAREST,
    )
    crest_x = (width - crest.width) // 2
    crest_y = center_y - crest.height // 2
    background.alpha_composite(crest, (crest_x, crest_y))

    draw = ImageDraw.Draw(background)
    line_one = "QUARREL THROUGH"
    line_two = "THE COSMOS"
    max_text_width = round(width * (0.76 if height > width else 0.58))
    font = fit_font(draw, line_one, max_text_width, round(short_side * 0.115))
    spacing = max(1, font.size // 11)
    stroke = max(2, font.size // 18)
    first_box = draw.textbbox((0, 0), line_one, font=font, stroke_width=stroke)
    second_box = draw.textbbox((0, 0), line_two, font=font, stroke_width=stroke)
    title_height = (first_box[3] - first_box[1]) + (second_box[3] - second_box[1]) + spacing
    title_y = min(height - title_height - round(short_side * 0.10), crest_y + crest.height + round(short_side * 0.035))
    for index, (line, box) in enumerate(((line_one, first_box), (line_two, second_box))):
        line_width = box[2] - box[0]
        draw.text(
            ((width - line_width) // 2, title_y),
            line,
            font=font,
            fill=(255, 255, 255, 255) if index == 0 else (255, 209, 102, 255),
            stroke_width=stroke,
            stroke_fill=(9, 12, 26, 255),
        )
        title_y += box[3] - box[1] + spacing

    return background.convert("RGB")


def save_optimized_png(image: Image.Image, output: Path) -> None:
    # Indexed color keeps the pixel-art launch screens sharp while avoiding a
    # large native-bundle penalty from three full-resolution iOS copies.
    optimized = image.quantize(
        colors=256,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.FLOYDSTEINBERG,
    )
    optimized.save(output, optimize=True)


def main() -> None:
    for relative_path, size in ANDROID_SPLASHES.items():
        output = ROOT / relative_path
        save_optimized_png(render_splash(size), output)
        print(f"wrote {output.relative_to(ROOT)} ({size[0]}x{size[1]})")

    ios_splash = render_splash((2732, 2732))
    for relative_path in IOS_SPLASHES:
        output = ROOT / relative_path
        save_optimized_png(ios_splash, output)
        print(f"wrote {output.relative_to(ROOT)} (2732x2732)")


if __name__ == "__main__":
    main()
