// Renders when-bottlenecks-move.md as this specimen's page, with stock
// markdown-it. No plugins, no custom syntax: every bit of styling comes from
// terminal.css. Called by the site build (npm run build, from the top level).
import { readFileSync } from "node:fs";
import MarkdownIt from "markdown-it";

export default function page() {
  const source = readFileSync(new URL("./when-bottlenecks-move.md", import.meta.url), "utf8");
  const md = new MarkdownIt();

  // A `---` line ends the piece. Anything after the last one is an aside about the
  // piece, not part of it, so it's set outside the <article>. (`* * *` is the
  // section break inside the piece.)
  const parts = source.split(/^---[ \t]*$/m);
  const after = parts.length > 1 ? parts.pop() : "";
  const body = md.render(parts.join("---"));
  const aside = after.trim() ? `<aside>\n${md.render(after).trim()}\n</aside>\n` : "";
  const title = (source.match(/^# (.+)$/m) || [, "Untitled"])[1].replace(/&shy;/g, "");

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preload" href="fonts/martian-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="terminal.css">
</head>
<body>
<header><a href="../">Dominic Baggott</a><p>Specimen #1A2CFF · Opinion</p></header>
<article>
${body.trim()}
</article>
${aside}<footer>
<p>Set in <a href="https://github.com/evilmartians/mono">Martian Mono</a> by Evil Martians, with asides in <a href="https://github.com/undercasetype/Fraunces">Fraunces</a> by Undercase Type. Both under the SIL Open Font License.</p>
<div aria-hidden="true">
<p>Aa<i>Aa</i></p>
<p>¶§†•№½<i>¶§†•½&amp;</i></p>
</div>
</footer>
</body>
</html>
`;
}
