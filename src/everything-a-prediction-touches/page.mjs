// Renders everything-a-prediction-touches.md as this specimen's page. Called
// by the site build (npm run build, from the top level).
//
// Plain Markdown, plus footnotes in the usual [^label] / [^label]: syntax.
// Footnotes are numbered in order of first reference; a reference inside a
// note counts where that note is referenced.
//
// Each note appears once, straight after the paragraph that references it,
// grouped in a <div> with any other notes from that paragraph. A note
// referenced from inside another note follows its parent in the same group.
//
// On wide screens the CSS puts each group in the margin column, level with
// its paragraph. The group can run down alongside the paragraphs after it,
// up to the next paragraph that has notes of its own; this works that out
// and passes it to the CSS as --rows. If a group is taller than that, it
// pushes the next paragraph down.

import { readFileSync } from "node:fs";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: true });
const REF = /\[\^([\w-]+)\]/g;

const marker = (n) =>
  `<sup><a href="#fn-${n}" id="fnref-${n}" role="doc-noteref" aria-label="Note ${n}">${n}</a></sup>`;

export default function page() {
  let src = readFileSync(new URL("./everything-a-prediction-touches.md", import.meta.url), "utf8");

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

  // The note for a label, followed by any notes it references, one per line.
  function notes(label) {
    const n = number(label);
    const nested = [];
    const text = defs[label].replace(REF, (_, inner) => {
      nested.push(inner);
      return marker(number(inner));
    });
    const note =
      `<aside id="fn-${n}" role="doc-footnote"><b>${n}</b> ${md.renderInline(text)} ` +
      `<a href="#fnref-${n}" role="doc-backlink" aria-label="Back to the text">↑</a></aside>`;
    return [note, ...nested.map(notes)].join("\n");
  }

  const blocks = src.trim().split(/\n{2,}/);
  const isParagraph = (b) => !/^(#|- |\* |\d+\. |>|```)/.test(b);
  const closing = blocks.length - 1; // the closing line spans the full width

  // First pass: work out which paragraphs have notes.
  const groups = blocks.map((block, i) => {
    const labels = [...block.matchAll(REF)].map((m) => m[1]);
    return labels.length && i !== closing ? labels : null;
  });

  const out = blocks.map((block, i) => {
    const text = block.replace(REF, (_, label) => marker(number(label)));
    if (!groups[i]) return text;

    // How many text-column paragraphs this group can run alongside.
    let rows = 1;
    for (let j = i + 1; j < closing && isParagraph(blocks[j]) && !groups[j]; j++) rows++;

    const group = `<div style="--rows: ${rows}">\n${groups[i].map(notes).join("\n")}\n</div>`;
    return `${text}\n\n${group}`;
  });

  const html = md.render(out.join("\n\n"));
  const title = (src.match(/^# (.+)$/m) || [, "Replicate"])[1].replace(/\.$/, "");

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preload" href="fonts/unbounded.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="unbounded.css">
</head>
<body>
<header><a href="../">Dominic Baggott</a></header>
<article>
${html}</article>
</body>
</html>
`;
}
