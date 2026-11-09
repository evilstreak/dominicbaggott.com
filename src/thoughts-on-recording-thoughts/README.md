# Thoughts on recording thoughts — Studio

`thoughts-on-recording-thoughts.md` is the source. `page.mjs` renders it into the page. The site build (`npm run build`, at the top level) calls it. All the styling lives in `studio.css`, which targets plain elements with no classes. The page is set like the inlay card of a home-taped cassette:

| Markdown | Becomes |
| --- | --- |
| `# Title` | The label: Archivo capitals on cream, each line a waveform. Every letter has its own weight, width and height, swelling towards the middle of its line and fading at its ends |
| (generated) | The black strip under the label: Side A, the whole piece as one waveform, and its running time in a counter |
| Paragraphs | Besley, a Clarendon, on orange. In the gutter, a play button, a tape counter and a progress bar |
| First paragraph | The lede, larger |
| Last paragraph | The closing line, in Besley Bold |
| `*emphasis*` | Things said out loud, in Besley Italic. Keep it for those |
| `[^label]` / `[^label]: text` | Footnotes, gathered at the end on a cream card headed Side B |

## The counter and the waveforms

`page.mjs` times the piece as if it were read aloud at 150 words a minute (`WPM`). Each paragraph gets the time it starts at as `--t` and how far through the piece that is as `--pos`, from 0 to 1. The CSS shows `--t` as generated text and draws `--pos` as the filled part of the progress bar. The total goes in the strip's counter.

The strip's waveform is the piece's words in order, bucketed to about 160 bars, each as tall as the longest word in its stretch. It's a stretched SVG, so it fills whatever width the strip has.

The title's three lines are set in `LINES` at the top of `page.mjs`, which has to match the Markdown title (the build fails if it doesn't). Each letter is a span with `--w` (weight), `--s` (width) and `--a` (0 to 1, which sets its height). The heights are a `scaleY` transform, so they don't move anything else on the line. The middle line is smaller, so all three lines fill the label.

## Specimen labels

The small print under the title and in the B-side card, naming the faces, is CSS-generated content with empty alt text (`content: "…" / ""`), so screen readers skip it. Delete the “Specimen labels” section of the CSS to remove it.

## Fonts

All self-hosted. The files here are Latin subsets; the build cuts them down to the glyphs the site uses. The CSS gives them their own family names, “Studio Archivo” and “Studio Besley”, so a copy installed on a reader’s computer can never be used in their place.

- `archivo.woff2`: Archivo, variable weight 100–900 and width 62–125 (78 KB), from Fontsource.
- `besley.woff2` and `besley-italic.woff2`: Besley, variable weight 400–900, roman and italic (about 35 KB each), from Fontsource.

Both are under the SIL Open Font License; their licences are in `fonts/`. Neither has ←, so the link home uses « instead. Archivo has ↑ but Besley doesn’t, so the ↑ on each note, which is set in Besley, falls back to a system font (the build warns about this).
