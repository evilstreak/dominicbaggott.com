// Renders in-other-peoples-words.md as this specimen's page. Called by the
// site build (npm run build, from the top level).
//
// The Markdown is a title, an introduction, then one ## section per person
// quoted. A section is my paragraphs, then their quote as a blockquote whose
// last paragraph is the credit (“Name, Role at Organisation”), then
// optionally more of my paragraphs. Footnotes use the usual [^label] /
// [^label]: syntax, numbered in order of first reference.
//
// **Bold** inside a quote marks an excerpt for the poster at the top of the
// page, where it's billed like a review on a West End poster. BILLING sets
// the poster's order, and the stylesheet sizes each slot by its position, so
// every excerpt must be in BILLING and every entry in BILLING must be an
// excerpt: the build fails otherwise.
//
// Each section comes out as:
//
//   <section>
//     <h2>
//     <div>        my paragraphs before the quote, each followed by its notes
//     <figure>     the blockquote, its credit as the figcaption, then any
//                  notes the quote references
//     <div>        my paragraphs after the quote, if there are any
//
// so the stylesheet can put my words in a narrow column beside theirs. The
// blockquote carries its word count as --words: the shorter the quote, the
// larger it's set.

import { readFileSync } from "node:fs";
import MarkdownIt from "markdown-it";

const BILLING = [
  "a rare find",
  "instrumental",
  "generally empathetic",
  "excellent",
  "confident, analytical and effective",
  "that problem just went away",
  "true pleasure",
];

const md = new MarkdownIt();
const REF = /\[\^([\w-]+)\]/g;

const marker = (n) =>
  `<sup><a href="#fn-${n}" role="doc-noteref" aria-label="Note ${n}">${n}</a></sup>`;

export default function page() {
  let src = readFileSync(new URL("./in-other-peoples-words.md", import.meta.url), "utf8");

  const defs = {};
  src = src.replace(/^\[\^([\w-]+)\]:[ \t]*(.+)$/gm, (_, label, text) => {
    defs[label] = text.trim();
    return "";
  });

  const order = [];
  function number(label) {
    if (!(label in defs)) throw new Error(`No definition for footnote [^${label}]`);
    if (!order.includes(label)) order.push(label);
    return order.indexOf(label) + 1;
  }

  // Inline Markdown, with footnote references as markers. Returns the HTML
  // and the labels referenced, in order.
  function inline(text) {
    const labels = [];
    const html = md
      .renderInline(text.replace(REF, (_, label) => `\uE000${label}\uE001`))
      .replace(/\uE000([\w-]+)\uE001/g, (_, label) => {
        labels.push(label);
        return marker(number(label));
      });
    return { html, labels };
  }

  function note(label) {
    const n = number(label);
    if (/\[\^[\w-]+\]/.test(defs[label])) throw new Error(`Footnote [^${label}] references another note`);
    return `<aside id="fn-${n}" role="doc-footnote"><b>${n}</b> ${md.renderInline(defs[label])}</aside>`;
  }

  // A paragraph of mine, followed by the notes it references.
  function paragraph(text) {
    const { html, labels } = inline(text);
    return [`<p>${html}</p>`, ...labels.map(note)].join("\n");
  }

  const [head, ...sections] = src.trim().split(/^## /m);
  const [titleLine, ...intro] = head.trim().split(/\n{2,}/);
  const title = titleLine.replace(/^# /, "");

  const excerpts = [];
  const body = sections.map((section) => {
    const [heading, ...rest] = section.trim().split("\n");
    const blocks = rest.join("\n").trim().split(/\n{2,}/);
    const at = blocks.findIndex((b) => b.startsWith(">"));
    if (at === -1) throw new Error(`Section “${heading}” has no quote`);

    const quote = blocks[at]
      .split("\n")
      .map((line) => line.replace(/^> ?/, ""))
      .join("\n")
      .split(/\n{2,}/);
    const credit = quote.pop();
    const [name, role] = credit.split(/, (.*)/s);
    const organisation = role.split(" at ").pop().replace(/^the /, "");

    // In reading order, so the notes are numbered in it
    const before = blocks.slice(0, at).map(paragraph);

    const notes = [];
    const paragraphs = quote.map((text) => {
      for (const [, excerpt] of text.matchAll(/\*\*(.+?)\*\*/g)) {
        excerpts.push({ text: excerpt.replace(REF, ""), from: `${name}, ${organisation}` });
      }
      const { html, labels } = inline(text);
      notes.push(...labels);
      return `<p>${html}</p>`;
    });
    const words = quote.join(" ").replace(REF, "").split(/\s+/).length;

    const after = blocks.slice(at + 1).map(paragraph);

    return [
      "<section>",
      `<h2>${md.renderInline(heading)}</h2>`,
      `<div>\n${before.join("\n")}\n</div>`,
      "<figure>",
      `<blockquote style="--words: ${words}">\n${paragraphs.join("\n")}\n</blockquote>`,
      `<figcaption><b>${md.renderInline(name)}</b>, ${md.renderInline(role)}</figcaption>`,
      ...notes.map(note),
      "</figure>",
      ...(after.length ? [`<div>\n${after.join("\n")}\n</div>`] : []),
      "</section>",
    ].join("\n");
  });

  // The poster, in billing order. It repeats words that are on the page in
  // full, so it's hidden from screen readers.
  const billed = BILLING.map((text) => {
    const excerpt = excerpts.find((e) => e.text === text);
    if (!excerpt) throw new Error(`BILLING has “${text}”, but no quote has it in bold`);
    return excerpt;
  });
  for (const e of excerpts) {
    if (!BILLING.includes(e.text)) throw new Error(`“${e.text}” is in bold, but isn't in BILLING`);
  }
  const poster = [
    `<ul aria-hidden="true">`,
    ...billed.map((e) => `<li><q>${md.renderInline(e.text)}</q> <span>${md.renderInline(e.from)}</span></li>`),
    "</ul>",
  ].join("\n");

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${md.renderInline(title)}</title>
<link rel="preload" href="fonts/anton.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/young-serif.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/newsreader.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="poster.css">
</head>
<body>
<header><a href="../">Dominic Baggott</a></header>
<article>
${poster}
<h1>${md.renderInline(title)}</h1>
${intro.map((p) => `<p>${inline(p).html}</p>`).join("\n")}
${body.join("\n")}
</article>
<footer>
<p>Set in <a href="https://github.com/googlefonts/AntonFont">Anton</a> by Vernon&nbsp;Adams, with the quotes in <a href="https://github.com/noirblancrouge/YoungSerif">Young&nbsp;Serif</a> by Bastien&nbsp;Sozeau and everything else in <a href="https://github.com/productiontype/Newsreader">Newsreader</a> by Production&nbsp;Type. All three under the SIL Open Font License.</p>
</footer>
</body>
</html>
`;
}
