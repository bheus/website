# Open Graph card

Source for `static/og-image.jpg` (1200×630, the size every major unfurler expects).

`card.html` mirrors the hero and About-section treatment from `src/styles/site.css`:
the same gradient, hill paths, sage disc, `saturate(.87)` portrait, and clay
`photo-sun`. Keep it in sync if that visual system changes.

Rendering needs a Chromium binary. Two passes: the card is captured at 2× and then
downsampled to 1200×630 through a canvas, which both sharpens the text and produces
JPEG (Chromium's `--screenshot` only writes PNG).

```bash
CHROME=/path/to/chrome ./render.sh
```

Fonts: the site asks for Iowan Old Style / SF Pro, which are macOS-only. `card.html`
falls back to Bitstream Charter and Liberation Sans so a Linux render still matches
the intended look. On a Mac the real faces are used and the output differs slightly.
