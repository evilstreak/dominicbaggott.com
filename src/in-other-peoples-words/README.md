# In other people’s words — Poster

`in-other-peoples-words.md` is the source. `page.mjs` renders it into the page. The site build (`npm run build`, at the top level) calls it. All the styling lives in `poster.css`, which targets plain elements and ARIA roles, with no classes. The page is set like a West End poster: the reviews up top, the billing, then the full quotes in context.

| Markdown | Becomes |
| --- | --- |
| `# Title` | The billing: Anton capitals between two rules, with “Dominic Baggott in” above |
| The paragraph after the title | The introduction, in Newsreader |
| `## Heading` | A section per person quoted, headed in Anton |
| Paragraphs before the quote | My context, in Newsreader, in the narrow column on wide screens |
| `> Blockquote` | Their quote, in Young Serif, in the wide column. Every paragraph but the last is the quote |
| The blockquote’s last paragraph | The credit, “Name, Role at Organisation”: the name in Anton capitals, the role in Newsreader Italic |
| `**Bold**` inside a quote | An excerpt: pink in the quote, and billed on the poster |
| Paragraphs after the quote | More of my words, in the narrow column under the opening ones |
| `[^label]` / `[^label]: text` | Footnotes, numbered in order of first reference |

## The poster

The poster is every bold excerpt, credited to the person’s name and organisation (from the credit: the name, and whatever follows the last “ at ”, less any leading “the”). It repeats words that are on the page in full, so it’s `aria-hidden`.

`BILLING` at the top of `page.mjs` sets the order, and `poster.css` sizes each slot by its position (`li:nth-child(n)`): how big, and how many of the six columns it spans. Third is the headliner, in pink across the full width. The build fails if an excerpt isn’t in `BILLING`, or `BILLING` names one that isn’t in bold, so adding, removing or rewording an excerpt means updating `BILLING`, and probably the slot sizes.

The poster and the title are sized in `cqi`, as a share of the page’s width, so the whole poster scales down to a phone without rearranging.

## The quotes

Each section comes out as an `<h2>`, a `<div>` of my paragraphs, a `<figure>` holding the `<blockquote>` and its credit as the `<figcaption>`, and, if there are any, a second `<div>` of my paragraphs after the quote.

- **Wide screens** (50rem, about 800px, and up) put the sections on a two-column grid: my words in a 15rem column on the left, theirs on the right. The quote spans two rows, so my closing paragraphs start straight after my opening ones, however long the quote.
- **Narrow screens** take it all in reading order: context, quote, credit, then my closing words.
- **Size.** `page.mjs` passes each quote’s word count as `--words`. Long quotes are set at a base size; the shorter a quote is below about 30 words, the larger it gets, up to 3.25rem. Tom’s one line is the only one that does at the moment.
- **Young Serif** comes in one weight and no italic, so the quotes are upright, and bold in a quote shows as pink rather than heavier (`font-synthesis: none` stops the browser faking a bold).

## Footnotes

- **Markers** are `<a role="doc-noteref" aria-label="Note n">` in a `<sup>`, set in Newsreader SemiBold, the body text, even inside a quote.
- **Notes** are `<aside role="doc-footnote">`, numbered in Newsreader SemiBold. A note comes straight after the paragraph that references it, so it sits in the same column, close enough that it needs no link back. A note referenced from a quote goes inside its `<figure>`, after the credit. Notes can’t reference other notes.

## Specimen labels

The label line at the top (the specimen code and the kind, laid out like the homepage card), “Dominic Baggott in” above the title and the “!” sample at the foot are CSS-generated content (`article::before`, `h1::before` and `footer::before`) with empty alt text (`content: "…" / ""`), so screen readers skip them. Delete the “Specimen labels” section of the CSS to remove the label and sample; “Dominic Baggott in” is part of the billing.

The footer’s credit, opposite the sample, is real text: it names the three faces, their designers and the licence, as the other specimens’ footers do.

## Fonts

All self-hosted. The files here are Latin subsets from Fontsource; the build cuts them down to the glyphs the site uses. The CSS gives them their own family names, “Poster Anton”, “Poster Young Serif” and “Poster Newsreader”, so a copy installed on a reader’s computer can never be used in their place.

- `anton.woff2`: Anton, one weight (18 KB).
- `young-serif.woff2`: Young Serif, one weight (26 KB).
- `newsreader.woff2` and `newsreader-italic.woff2`: Newsreader, variable weight 200–800 and optical size 6–72, roman and italic (about 130 and 145 KB).

All three are under the SIL Open Font License; their licences are in `fonts/`. None of their metadata had a licence description (name ID 13), so it was added from `martian-mono.woff2`, along with the licence URL (name ID 14). The homepage card borrows `anton.woff2` and `newsreader-italic.woff2`.
