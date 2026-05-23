# Assets

## og-image

- `og-image.svg` — source vector file for the Open Graph / Twitter card image (1200×630).
- `og-image.png` — exported PNG (1200×630) referenced by every page's `<meta property="og:image">`.

The site currently references `og-image.png`. The SVG is provided as the source — export it to PNG with any tool (Inkscape, ImageMagick, or an online converter) and place the result here as `og-image.png`.

**Quick export commands:**

```powershell
# With Inkscape (recommended)
inkscape og-image.svg --export-type=png --export-filename=og-image.png --export-width=1200 --export-height=630

# Or with ImageMagick
magick convert -density 200 -background "#0a0a0f" og-image.svg -resize 1200x630 og-image.png
```

## Icons

The site's `manifest.webmanifest` references `icon-192.png` and `icon-512.png`. Generate them from `og-image.svg` (crop the centre square) or supply your own logo at those exact sizes.

## favicon

Place a `favicon.ico` (16/32/48 px multi-resolution) at the **site root** (`/favicon.ico`).
