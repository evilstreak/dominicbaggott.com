// Renders thoughts-on-recording-thoughts.md as this specimen's page. Called by
// the site build (npm run build, from the top level).
//
// Plain Markdown, plus footnotes in the usual [^label] / [^label]: syntax.
// Everything else comes from studio.css; this only adds what CSS can't work
// out for itself:
//
//   - the title, one span per letter, each with its own weight, width and
//     height (--w, --s, --a), swelling and fading along its line
//   - the strip under it: the whole piece as one waveform, drawn from the
//     lengths of its words, and its running time
//   - on each paragraph, the tape counter (--t) and how far through the tape
//     it starts (--pos, 0 to 1), at 150 words a minute read aloud
//   - the notes, gathered at the end as the B-side

import { readFileSync } from "node:fs";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: true });

const WPM = 150; // a comfortable speaking pace
const LINES = ["Thoughts", "on recording", "thoughts"]; // the title, as set on the label

const REF = /\[\^([\w-]+)\]/g;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const words = (s) => s.replace(REF, "").split(/\s+/).filter(Boolean);
const clock = (w) => {
  const s = Math.round((w / WPM) * 60);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
const marker = (n) =>
  `<sup><a href="#fn-${n}" id="fnref-${n}" role="doc-noteref" aria-label="Note ${n}">${n}</a></sup>`;

export default function page() {
  let src = readFileSync(new URL("./thoughts-on-recording-thoughts.md", import.meta.url), "utf8");

  // ---- Footnotes ----------------------------------------------------------------

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
  const note = (label) => {
    const n = number(label);
    return (
      `<p id="fn-${n}" role="doc-footnote"><b>${n}</b> ${md.renderInline(defs[label])} ` +
      `<a href="#fnref-${n}" role="doc-backlink" aria-label="Back to the text">↑</a></p>`
    );
  };

  // ---- The text -------------------------------------------------------------------

  const paras = src.trim().split(/\n{2,}/);
  const title = paras.shift().replace(/^# /, "");
  if (LINES.join(" ") !== title) throw new Error(`LINES doesn't match the title “${title}”`);

  const counts = paras.map((p) => words(p).length);
  const total = counts.reduce((a, b) => a + b, 0);

  // ---- The title: a waveform of itself --------------------------------------------

  // Each line swells towards its middle and fades at its ends, like the
  // envelope of a spoken phrase, with a little wobble letter to letter. The
  // letters have to stay on one line of HTML: a line break between them
  // would show as a space.
  const titleHTML = LINES.map((line, li) => {
    const chars = [...line];
    return `<span>${chars
      .map((ch, i) => {
        if (ch === " ") return " ";
        const x = i / (chars.length - 1);
        const a = Math.pow(Math.sin(Math.PI * (0.08 + 0.84 * x)), 1.4) * (0.75 + 0.25 * Math.sin(i * 1.7 + li));
        return `<span style="--a: ${a.toFixed(2)}; --w: ${Math.round(400 + 500 * a)}; --s: ${Math.round(75 + 50 * a)}">${esc(ch)}</span>`;
      })
      .join("")}</span>`;
  }).join(" ");

  // ---- The strip: the whole piece as one waveform --------------------------------

  // About 160 bars, each as tall as the longest word in its stretch of text.
  const lens = paras.flatMap(words).map((w) => w.replace(/[^\p{L}\p{N}]/gu, "").length || 1);
  const per = Math.ceil(lens.length / 160);
  const bars = [];
  for (let i = 0; i < lens.length; i += per) bars.push(Math.max(...lens.slice(i, i + per)));
  const H = 40;
  const wave =
    `<svg aria-hidden="true" viewBox="0 0 ${bars.length * 3} ${H}" preserveAspectRatio="none">\n` +
    bars
      .map((len, i) => {
        const h = Math.max(4, Math.min(H, (len - 1) * 3.4));
        return `<rect x="${i * 3}" y="${(H - h) / 2}" width="1.8" height="${h}"/>\n`;
      })
      .join("") +
    `</svg>`;

  // ---- Paragraphs, with their counters ------------------------------------------

  let elapsed = 0;
  const body = paras.map((p, i) => {
    const t = clock(elapsed);
    const pos = (elapsed / total).toFixed(3);
    elapsed += counts[i];
    const html = md.render(p.replace(REF, (_, l) => marker(number(l)))).trim();
    return html.replace(/^<p>/, `<p style="--t: '${t}'; --pos: ${pos}">`);
  });

  const notes = order.length
    ? `<section aria-label="Notes">\n<h2>Side B</h2>\n${order.map(note).join("\n")}\n</section>`
    : "";

  // ---- Page --------------------------------------------------------------------------

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preload" href="fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/besley.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="studio.css">
</head>
<body>
<header><a href="../">Dominic Baggott</a><p>Specimen #E8431C · Opinion</p></header>
<article>
<h1 aria-label="${esc(title)}">${titleHTML}</h1>
<p aria-hidden="true"><span>Side A</span>${wave}<span>${clock(total)}</span></p>
${body.join("\n")}
${notes}
</article>
<footer>
<p>Set in <a href="https://github.com/indestructible-type/Besley">Besley</a> by Owen Earl, with the label in <a href="https://github.com/Omnibus-Type/Archivo">Archivo</a> by Omnibus-Type. Both under the SIL Open Font License. The counter assumes you read it aloud at ${WPM} words a minute; the waveform is drawn from the lengths of its words.</p>
</footer>
</body>
</html>
`;
}
