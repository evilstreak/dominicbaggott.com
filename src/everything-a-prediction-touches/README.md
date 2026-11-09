# Everything a prediction touches — Unbounded

`everything-a-prediction-touches.md` is the source. `page.mjs` renders it into the page. The site build (`npm run build`, at the top level) calls it. All the styling lives in `unbounded.css`, which targets plain elements and ARIA roles, with no classes:

| Markdown | Becomes |
| --- | --- |
| `# Title` | Huge uppercase Unbounded Black |
| The list straight after the title | The figures row: each item's `**bold**` is the big number, set at weight 200, 500 and 900 in turn |
| Paragraphs | Unbounded Light, on a narrow measure |
| The last paragraph | The closing line, in ExtraBold, across the full width |
| `[^label]` / `[^label]: text` | Footnotes, numbered in order of first reference |

## Footnotes

Footnotes use the usual `[^label]` syntax, and a note can reference another note (as the streaming note does with Nick's). Each note appears in the page once:

- **Markers** are `<a role="doc-noteref" aria-label="Note n">` in a `<sup>`, linking to the note.
- **Notes** are `<aside role="doc-footnote">`, each with a `role="doc-backlink"` ↑ back to its marker. A paragraph's notes are grouped in a `<div>` straight after that paragraph, so they follow it in reading order for screen readers, reader modes and feeds. A note referenced from inside another note follows its parent in the same group.
- **On narrow screens** each group sits inline, after its paragraph.
- **On wide screens** (66rem, about 1,056px, and up) the article is a two-column grid, and each group sits in the margin column level with its paragraph's first line. A group can run down alongside the following paragraphs, up to the next paragraph that has notes of its own. `page.mjs` counts those and passes the count to the CSS as `--rows`. If a group is taller than the paragraphs beside it, the grid spreads the extra height between them. That's why the paragraphs beside the 2–6 stack sit slightly further apart than the rest.

## The spine

The vertical REPLICATE is `body::before` on wide screens only. It's pinned to the top-left corner, slightly cropped by the left edge, with its E running `--spine-crop` (24px) off the top, so the crop stays the same however long the text gets. The page is always at least as tall as the word (`min-height` on `body`), so the R always shows at the bottom. If the text grows past that, the extra length just runs on below the R.

Change `--spine-size` to resize it. The text column's left edge (`--spine`) and the minimum page height both follow it. They assume the word is about 7.4 times its font size long and 0.75 times wide, which holds for Unbounded Black at this letter-spacing, so measure again if you change the word, its weight or its spacing.

The layout is left-aligned on wide screens, with any spare width falling to the right.

## Specimen labels

The label line at the top (the specimen code and the kind, laid out like the homepage card), the 0123456789 footer and the line naming the face under it are CSS-generated content (`article::before`, `article::after` and `body::after`) with empty alt text (`content: "…" / ""`), so screen readers skip them. Delete the "Specimen labels" section of the CSS to remove them.

## Font

`fonts/unbounded.woff2`: Unbounded, variable weight 200–900, Latin subset (51 KB), from Fontsource. The build cuts it down to the glyphs the site uses. It's under the SIL Open Font License, included as `fonts/OFL-unbounded.txt`.
