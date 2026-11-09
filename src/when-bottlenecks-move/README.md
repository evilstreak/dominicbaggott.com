# When bottlenecks move — Terminal

`when-bottlenecks-move.md` is the source. `page.mjs` renders it with stock markdown-it, without plugins. The site build (`npm run build`, at the top level) calls it. All the styling lives in `terminal.css`, which targets plain elements with no classes:

| Markdown | Becomes |
| --- | --- |
| `# Title` | Huge lowercase Martian Mono, yellow cursor block via `::after` |
| First paragraph | The lede (`h1 + p`): wider, larger, heavier |
| Paragraphs | Numbered 01, 02… in the gutter with a CSS counter |
| `*emphasis*` | Fraunces Italic in pink; in the lede, Fraunces Black Italic in yellow |
| `**strong**` | Martian Mono ExtraBold, wide, yellow |
| Fenced code block | The ASCII diagram, labelled fig.1, fig.2… in the gutter |
| `- item` | List, with an asterisk hung in the gutter, set like the paragraph numbers |
| `---` | Ends the piece. What follows is set outside the `<article>` as an `<aside>`: Fraunces Italic in pink, “P.S.” in the gutter, no number or label |
| `* * *` | An asterism, drawn from three Fraunces asterisks |
| `## Heading` | `##` hung in the gutter |

`&shy;` in the title lets “bottle-necks” break on phones only; elsewhere `hyphens: none` ignores it.

The small specimen labels (which faces, sizes and settings each element uses) are CSS-generated content, chosen by element and by `:has(em)` / `:has(strong)`. Headings, section breaks and lists are labelled only the first time they appear. They use empty alt text (`content: "…" / ""`) so screen readers skip them. Delete the “Specimen labels” section of the CSS to remove them.

## Fonts

All self-hosted. The files here are trimmed to Latin plus common punctuation; the build cuts them down to the glyphs the site uses. The CSS gives them their own family names, “Terminal Martian” and “Terminal Fraunces”, so a copy of Martian Mono or Fraunces installed on a reader’s computer can never be used in their place.

- `martian-mono.woff2`: Martian Mono, width 75–112.5, weight 300–800, with ░ ▒ ▓ █ added (35 KB). Martian Mono has no block characters, so these are drawn into the font on its own cell and given the same width variation as its space, so diagrams line up at any width. The bar line of each diagram is coloured in CSS (`pre` is yellow, `pre::first-line` white).
- `fraunces-italic.woff2`: Fraunces Italic, weight 300–900, optical size auto, Soft fixed at 100 and Wonk at 1 (79 KB).

Both are modified versions of the originals under the SIL Open Font License; their licences are in `fonts/`.
