#!/usr/bin/env python3
"""Build branded game, launcher, and splash artwork from source visuals.

Run this from the repository root after changing the brand art. Pillow is the
only dependency; the script keeps every platform rendition visually aligned.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BACKGROUND = ROOT / "public/assets/menu-space-v2.png"
SHIP = ROOT / "public/assets/space/ship-classic.png"
FONT = ROOT / "public/assets/fonts/caramel_3/Caramel.ttf"

WEB_ICONS = {
    "public/favicons/favicon-16x16.png": (16, 16),
    "public/favicons/favicon-32x32.png": (32, 32),
    "public/favicons/apple-touch-icon.png": (180, 180),
    "public/favicons/android-chrome-192x192.png": (192, 192),
    "public/favicons/android-chrome-512x512.png": (512, 512),
}

ANDROID_LAUNCHERS = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}

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

IOS_ICON = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"


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


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    scale = min(size[0] / image.width, size[1] / image.height)
    return image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.NEAREST,
    )


def add_ship_glow(canvas: Image.Image, ship: Image.Image, position: tuple[int, int], radius: int) -> None:
    glow_alpha = Image.new("L", canvas.size)
    glow_alpha.paste(ship.getchannel("A"), position)
    glow_alpha = glow_alpha.filter(ImageFilter.GaussianBlur(max(2, radius)))
    glow_alpha = glow_alpha.point(lambda value: round(value * 0.26))
    glow = Image.new("RGBA", canvas.size, (92, 225, 230, 0))
    glow.putalpha(glow_alpha)
    canvas.alpha_composite(glow)


def render_ship_mark(size: tuple[int, int] = (400, 500)) -> Image.Image:
    canvas = Image.new("RGBA", size)
    ship = contain(Image.open(SHIP).convert("RGBA"), (round(size[0] * 0.90), round(size[1] * 0.90)))
    position = ((size[0] - ship.width) // 2, (size[1] - ship.height) // 2)
    add_ship_glow(canvas, ship, position, round(min(size) * 0.035))
    canvas.alpha_composite(ship, position)
    return canvas


def render_icon(size: tuple[int, int]) -> Image.Image:
    width, height = size
    icon = cover(Image.open(BACKGROUND), size)
    icon.alpha_composite(Image.new("RGBA", size, (5, 8, 27, 46)))

    glow = Image.new("RGBA", size)
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        (round(width * 0.16), round(height * 0.18), round(width * 0.84), round(height * 0.82)),
        fill=(92, 225, 230, 54),
    )
    icon.alpha_composite(glow.filter(ImageFilter.GaussianBlur(max(2, width // 14))))

    ship = contain(Image.open(SHIP).convert("RGBA"), (round(width * 0.62), round(height * 0.70)))
    position = ((width - ship.width) // 2, (height - ship.height) // 2)
    add_ship_glow(icon, ship, position, max(2, width // 38))
    icon.alpha_composite(ship, position)
    return icon.convert("RGB")


def render_adaptive_foreground(size: int) -> Image.Image:
    foreground = Image.new("RGBA", (size, size))
    ship = contain(Image.open(SHIP).convert("RGBA"), (round(size * 0.50), round(size * 0.62)))
    position = ((size - ship.width) // 2, (size - ship.height) // 2)
    add_ship_glow(foreground, ship, position, max(2, size // 40))
    foreground.alpha_composite(ship, position)
    return foreground


def render_icon_background(size: int) -> Image.Image:
    background = cover(Image.open(BACKGROUND), (size, size))
    background.alpha_composite(Image.new("RGBA", (size, size), (5, 8, 27, 38)))
    return background.convert("RGB")


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

    crest = Image.open(SHIP).convert("RGBA")
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


def save_png(image: Image.Image, output: Path) -> None:
    image.save(output, optimize=True)


def main() -> None:
    save_png(render_ship_mark(), ROOT / "public/assets/spacetitle.png")
    save_png(Image.open(SHIP).convert("RGBA"), ROOT / "public/assets/space/Spaceship.png")

    icon_master = render_icon((1024, 1024))
    save_optimized_png(icon_master, ROOT / IOS_ICON)
    for relative_path, size in WEB_ICONS.items():
        save_optimized_png(icon_master.resize(size, Image.Resampling.LANCZOS), ROOT / relative_path)
    icon_master.save(
        ROOT / "public/favicons/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    for density, (legacy_size, adaptive_size) in ANDROID_LAUNCHERS.items():
        directory = ROOT / f"android/app/src/main/res/mipmap-{density}"
        launcher = render_icon((legacy_size, legacy_size))
        save_optimized_png(launcher, directory / "ic_launcher.png")
        save_optimized_png(launcher, directory / "ic_launcher_round.png")
        save_png(render_adaptive_foreground(adaptive_size), directory / "ic_launcher_foreground.png")
        save_optimized_png(render_icon_background(adaptive_size), directory / "ic_launcher_background.png")

    save_optimized_png(render_splash((1024, 1024)), ROOT / "public/assets/splash.png")
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
