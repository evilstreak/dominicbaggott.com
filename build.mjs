// Builds the site from src/ into build/, ready to upload as it is.
//
//   npm install   (once)
//   npm run build
//
// 1. Pages. Starting at the homepage, it follows every local link. Each page
//    is a folder in src/: if the folder has a page.mjs, that renders the page;
//    otherwise its index.html is used as written.
//
// 2. Everything a page needs. It copies the stylesheets, fonts and any other
//    files that a page or stylesheet refers to, and nothing else, so READMEs,
//    Markdown sources, licence files and design concepts stay behind. HTML and
//    CSS are never minified. Pages are indented to show how their elements
//    nest, so view source reads well, but nothing within a line is touched.
//    It also copies src/_headers, Cloudflare's cache settings, which nothing
//    links to.
//
// 3. Fonts. It opens every page in headless Chromium, at widths either side of
//    each breakpoint in its CSS, and works out which characters each font file
//    is actually used for, including CSS-generated text and text-transform.
//    Then it cuts each font file down to just those glyphs (and the OpenType
//    features the page uses). A font file shared between pages, like the ones
//    the homepage cards borrow, gets the glyphs for all of them.
//
//    Each subset gets a short hash of its contents in its filename, so a
//    server can tell browsers to cache fonts forever: when a piece starts
//    using a new character, the font's name changes too.

import { readFile, writeFile, mkdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as hb from "harfbuzzjs";
import fontverter from "fontverter";
import subsetFont from "subset-font";
import { chromium } from "playwright-core";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "build");
const ORIGIN = "http://site.test"; // the address headless Chromium sees the site at

// The site as it will be uploaded: path on the site → file contents.
const site = new Map();

// ---- 1 and 2: pages and the files they need ------------------------------------

const isFont = (p) => /\.(woff2?|ttf|otf)$/i.test(p);
const isText = (p) => /\.(html|css|svg|txt|xml|json|js|mjs)$/i.test(p);
const isPage = (p) => p.endsWith("/") || p.endsWith(".html");

// Every reference to another file in a page or stylesheet: href, src and
// poster attributes, url() and @import. `fn` gets the reference as written
// and returns what to put in its place.
const PATTERNS = {
  html: [/(\s(?:href|src|poster)\s*=\s*")([^"]*)(")/gi, /(\s(?:href|src|poster)\s*=\s*')([^']*)(')/gi],
  css: [/(url\(\s*["']?)([^"')]+?)(["']?\s*\))/gi, /(@import\s+["'])([^"']+)(["'])/gi],
};
PATTERNS.html.push(...PATTERNS.css); // inline styles and <style> blocks
function eachRef(text, kind, fn) {
  for (const re of PATTERNS[kind]) text = text.replace(re, (_, pre, ref, post) => pre + fn(ref) + post);
  return text;
}

// The site path a reference points to, or null if it points off the site.
function resolve(ref, from) {
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref) || ref === "") return null;
  return decodeURIComponent(new URL(ref, ORIGIN + from).pathname);
}

async function render(page) {
  const dir = path.join(SRC, page);
  if (existsSync(path.join(dir, "page.mjs"))) {
    const { default: render } = await import(pathToFileURL(path.join(dir, "page.mjs")));
    return indent(render());
  }
  return indent(await readFile(page.endsWith("/") ? path.join(dir, "index.html") : dir, "utf8"));
}

// Indents a page, two spaces per level, so its source shows how its block
// elements nest. It only changes the whitespace at the start of each line,
// which browsers ignore between blocks and collapse inside text, and leaves
// <pre> (and <script>, <style> and <textarea>) exactly as they are. <head>
// and <body> aren't indented inside <html>. Running it on a page that's
// already indented changes nothing.
const BLOCKS = new Set(
  ("head body header main footer nav article section aside div p h1 h2 h3 h4 h5 h6 " +
    "ul ol li dl dt dd blockquote figure figcaption table thead tbody tfoot tr th td " +
    "details summary form fieldset svg g").split(" "),
);
function indent(html) {
  const out = [];
  let depth = 0;
  let verbatim = null; // the closing tag that ends a <pre> or similar
  for (const line of html.split("\n")) {
    if (verbatim) {
      out.push(line);
      if (line.includes(verbatim)) verbatim = null;
      continue;
    }
    const text = line.trim();
    if (!text) {
      out.push("");
      continue;
    }
    const tags = [...text.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/gi)]
      .filter((m) => BLOCKS.has(m[2].toLowerCase()) && !m[3]);
    let leading = 0; // closing tags at the very start of the line
    for (const m of tags) {
      if (m[1] && text.slice(0, m.index).replace(/<\/[a-z0-9]+>/gi, "").trim() === "") leading++;
      else break;
    }
    const net = tags.reduce((n, m) => n + (m[1] ? -1 : 1), 0);
    out.push("  ".repeat(Math.max(0, depth - leading)) + text);
    depth = Math.max(0, depth + net);

    const opened = /<(pre|script|style|textarea)\b/i.exec(text);
    if (opened && !new RegExp(`</${opened[1]}>`, "i").test(text.slice(opened.index))) verbatim = `</${opened[1]}>`;
  }
  return out.join("\n");
}

async function collect() {
  const queue = [["/", "(start)"]];
  const seen = new Set();
  while (queue.length) {
    let [p, from] = queue.shift();
    // A link to a folder without its trailing slash still means that page.
    if (!isPage(p) && existsSync(path.join(SRC, p)) && (await stat(path.join(SRC, p))).isDirectory()) p += "/";
    if (seen.has(p)) continue;
    seen.add(p);

    const file = p.endsWith("/") ? p + "index.html" : p;
    if (!existsSync(path.join(SRC, file)) && !existsSync(path.join(SRC, p, "page.mjs"))) {
      throw new Error(`${from} refers to ${p}, which isn't in src/`);
    }

    let contents;
    if (isPage(p)) contents = await render(p);
    else if (isText(p)) contents = await readFile(path.join(SRC, p), "utf8");
    else contents = await readFile(path.join(SRC, p));
    site.set(file, contents);

    const kind = p.endsWith(".css") ? "css" : isPage(p) ? "html" : null;
    if (kind) {
      eachRef(contents, kind, (ref) => {
        const target = resolve(ref, file);
        if (target) queue.push([target, file]);
        return ref;
      });
    }
  }
}

// ---- 3: which characters each font is used for ---------------------------------

// Runs inside each page. Returns the page's @font-face rules, its breakpoints,
// and every run of text with the font files it would be drawn from, in order
// of preference, plus the OpenType features it asks for.
function trace() {
  const unquote = (s) => s.trim().replace(/^(["'])(.*)\1$/, "$2");
  const families = (list) =>
    list.match(/"[^"]*"|'[^']*'|[^,]+/g).map((f) => unquote(f).toLowerCase());

  // @font-face rules and breakpoints, from every stylesheet.
  const faces = [];
  const breakpoints = [];
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule instanceof CSSFontFaceRule) {
        const s = rule.style;
        const base = rule.parentStyleSheet.href || location.href;
        const urls = [...s.getPropertyValue("src").matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map(
          (m) => decodeURIComponent(new URL(m[1], base).pathname),
        );
        if (!urls.length) continue;
        const weights = (s.getPropertyValue("font-weight") || "400")
          .split(/\s+/)
          .map((w) => ({ normal: 400, bold: 700 })[w] || Number(w));
        faces.push({
          family: unquote(s.getPropertyValue("font-family")).toLowerCase(),
          italic: /italic|oblique/.test(s.getPropertyValue("font-style")),
          weights: [weights[0], weights.at(-1)],
          key: urls.join(" "),
        });
      } else if (rule.cssRules) {
        if (rule instanceof CSSMediaRule && /width/.test(rule.conditionText)) {
          for (const [, n, unit] of rule.conditionText.matchAll(/([\d.]+)(px|rem|em)/g)) {
            breakpoints.push(Number(n) * (unit === "px" ? 1 : 16));
          }
        }
        walk(rule.cssRules);
      }
    }
  };
  for (const sheet of document.styleSheets) walk(sheet.cssRules);

  // The faces a run of text is drawn from: for each family in its stack that
  // has an @font-face, the face that best matches its style and weight. The
  // browser falls back along this list, character by character.
  function facesFor(style) {
    const out = [];
    for (const family of families(style.fontFamily)) {
      let candidates = faces.filter((f) => f.family === family);
      if (!candidates.length) break; // a system font from here on
      const italic = style.fontStyle !== "normal";
      if (candidates.some((f) => f.italic === italic)) candidates = candidates.filter((f) => f.italic === italic);
      const w = Number(style.fontWeight);
      const distance = (f) => Math.max(f.weights[0] - w, w - f.weights[1], 0);
      out.push(candidates.sort((a, b) => distance(a) - distance(b))[0].key);
    }
    return out;
  }

  // OpenType features asked for by font-feature-settings and font-variant-*.
  const VARIANTS = {
    "lining-nums": ["lnum"], "oldstyle-nums": ["onum"], "proportional-nums": ["pnum"],
    "tabular-nums": ["tnum"], "diagonal-fractions": ["frac"], "stacked-fractions": ["afrc"],
    ordinal: ["ordn"], "slashed-zero": ["zero"], "small-caps": ["smcp"], "all-small-caps": ["smcp", "c2sc"],
    "petite-caps": ["pcap"], "all-petite-caps": ["pcap", "c2pc"], unicase: ["unic"], "titling-caps": ["titl"],
    "discretionary-ligatures": ["dlig"], "historical-ligatures": ["hlig"], sub: ["subs"], super: ["sups"],
    "historical-forms": ["hist"],
  };
  function featuresFor(style) {
    const out = [];
    for (const m of style.fontFeatureSettings.matchAll(/"(\w{4})"\s*(\w*)/g)) {
      if (m[2] !== "0" && m[2] !== "off") out.push(m[1]);
    }
    const variants = [style.fontVariantNumeric, style.fontVariantCaps, style.fontVariantLigatures,
      style.fontVariantPosition, style.fontVariantAlternates].join(" ");
    for (const word of variants.split(/\s+/)) out.push(...(VARIANTS[word] || []));
    return out;
  }

  function transform(text, style) {
    // Small caps drawn by the browser, when a font has none, are capitals.
    const caps = style.fontVariantCaps !== "normal" ? text.toUpperCase() : "";
    switch (style.textTransform) {
      case "uppercase": return text.toUpperCase();
      case "lowercase": return text.toLowerCase();
      case "capitalize": return text + text.toUpperCase();
      default: return text + caps;
    }
  }

  // The characters a pseudo-element's `content` puts on the page.
  const STYLES = {
    "lower-roman": "ivxlcdm", "upper-roman": "IVXLCDM",
    "lower-alpha": "abcdefghijklmnopqrstuvwxyz", "lower-latin": "abcdefghijklmnopqrstuvwxyz",
    "upper-alpha": "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "upper-latin": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    disc: "•", circle: "◦", square: "▪", none: "",
  };
  const counterChars = (style) => (style in STYLES ? STYLES[style] : "0123456789-");
  function generated(content, el, style) {
    let out = "";
    let i = 0;
    const string = () => {
      const q = content[i++];
      let s = "";
      while (i < content.length && content[i] !== q) {
        if (content[i] === "\\") {
          const hex = /^\\([0-9a-fA-F]{1,6})\s?/.exec(content.slice(i));
          if (hex) { s += String.fromCodePoint(parseInt(hex[1], 16)); i += hex[0].length; }
          else { s += content[i + 1]; i += 2; }
        } else s += content[i++];
      }
      i++;
      return s;
    };
    while (i < content.length) {
      const c = content[i];
      if (c === '"' || c === "'") out += string();
      else if (c === "/") break; // what follows is alt text, which is read out, not drawn
      else if (/[a-z-]/i.test(c)) {
        const m = /^([a-z-]+)(?:\(([^)]*)\))?/i.exec(content.slice(i));
        i += m[0].length;
        const args = (m[2] || "").split(",").map((a) => a.trim());
        if (m[1] === "counter") out += counterChars(args[1] || "decimal");
        else if (m[1] === "counters") out += unquote(args[1] || "") + counterChars(args[2] || "decimal");
        else if (m[1] === "attr") out += el.getAttribute(args[0]) || "";
        else if (/quote$/.test(m[1])) out += style.quotes === "auto" ? "“”‘’\"'" : style.quotes;
      } else i++;
    }
    return out;
  }

  const runs = [];
  const add = (style, text) => {
    if (!text.trim()) return;
    // Where a line breaks at a soft hyphen, or hyphens: auto, the browser
    // draws a hyphen: U+2010 if the font has one, otherwise a hyphen-minus.
    const hyphens = /\u00AD/.test(text) || style.hyphens === "auto" ? "-\u2010" : "";
    runs.push({ faces: facesFor(style), features: featuresFor(style), text, hyphens });
  };

  const SKIP = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"]);
  for (const el of [document.body, ...document.body.querySelectorAll("*")]) {
    if (SKIP.has(el.tagName)) continue;
    const style = getComputedStyle(el);
    const own = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.data).join("");
    add(style, transform(own + (el.tagName === "Q" ? "“”‘’" : ""), style));

    for (const pseudo of ["::before", "::after", "::marker"]) {
      const ps = getComputedStyle(el, pseudo);
      let text = "";
      if (ps.content !== "none" && ps.content !== "normal") text = generated(ps.content, el, ps);
      else if (pseudo === "::marker" && style.display === "list-item") {
        const type = style.listStyleType;
        text = /^["']/.test(type) ? generated(type, el, ps) : counterChars(type) + ". ";
      }
      add(ps, transform(text, ps));
    }
    // ::first-line and ::first-letter only matter if they change the font.
    for (const pseudo of ["::first-line", "::first-letter"]) {
      const ps = getComputedStyle(el, pseudo);
      const same = ["fontFamily", "fontStyle", "fontWeight", "textTransform", "fontVariantCaps"].every(
        (k) => ps[k] === style[k],
      );
      if (!same) add(ps, transform(el.textContent, ps));
    }
  }

  return { faces: faces.map((f) => f.key), breakpoints, runs };
}

// Playwright's own headless Chromium, at the build that matches the pinned
// playwright-core version, so every machine traces fonts with the same browser.
async function launch() {
  try {
    return await chromium.launch();
  } catch {
    throw new Error("Working out which glyphs to keep needs Playwright's Chromium. Run this once: npx playwright-core install --only-shell chromium");
  }
}

const TYPES = { html: "text/html", css: "text/css", svg: "image/svg+xml", woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf", otf: "font/otf" };

async function traceFonts() {
  const browser = await launch();
  const tab = await browser.newPage();
  await tab.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) return route.abort();
    const p = decodeURIComponent(url.pathname);
    const body = site.get(p.endsWith("/") ? p + "index.html" : p);
    if (body === undefined) return route.fulfill({ status: 404 });
    return route.fulfill({ status: 200, contentType: TYPES[p.split(".").pop()] || (p.endsWith("/") ? "text/html" : "application/octet-stream"), body });
  });

  const runs = []; // { page, faces, features, text, hyphens }
  const declared = new Set();
  for (const file of site.keys()) {
    if (!file.endsWith(".html")) continue;
    const page = file.replace(/index\.html$/, "");
    await tab.setViewportSize({ width: 1440, height: 900 });
    await tab.goto(ORIGIN + page, { waitUntil: "load" });
    const first = await tab.evaluate(trace);
    const widths = new Set([360, 1440, ...first.breakpoints.flatMap((b) => [Math.floor(b) - 1, Math.ceil(b)])]);
    for (const width of [...widths].sort((a, b) => a - b)) {
      await tab.setViewportSize({ width, height: 900 });
      const found = width === 1440 ? first : await tab.evaluate(trace);
      found.faces.forEach((f) => declared.add(f));
      for (const run of found.runs) if (run.faces.length) runs.push({ page, ...run });
    }
  }
  await browser.close();
  return { declared, runs };
}

// ---- 3, continued: cutting the fonts down ---------------------------------------

const ALWAYS = " \u00A0"; // spaces, so the browser never reaches for a fallback font for one

// OpenType features browsers turn on by themselves for Latin text.
const DEFAULT_FEATURES = ["ccmp", "locl", "mark", "mkmk", "rlig", "calt", "clig", "liga", "kern", "dist", "curs", "rclt", "rvrn", "abvm", "blwm", "ltra", "ltrm"];

async function subsetFonts({ declared, runs }) {
  const fonts = [...site.keys()].filter(isFont);
  const cmaps = new Map();
  for (const f of fonts) {
    const sfnt = await fontverter.convert(site.get(f), "truetype");
    cmaps.set(f, new Set(new hb.Face(new hb.Blob(sfnt)).collectUnicodes()));
  }

  // Give each character to the first face in its run's list that has it,
  // which is what the browser does.
  const chars = new Map(fonts.map((f) => [f, new Set(ALWAYS)]));
  const features = new Map(fonts.map((f) => [f, new Set(DEFAULT_FEATURES)]));
  const missing = new Map(); // "page|char" → families
  const has = (key, ch) => cmaps.get(key.split(" ")[0]).has(ch.codePointAt(0));
  const give = (key, ch, wanted) => {
    for (const file of key.split(" ")) {
      chars.get(file).add(ch);
      wanted.forEach((t) => features.get(file).add(t));
      if (ch === "\u2044") ["frac", "numr", "dnom"].forEach((t) => features.get(file).add(t));
    }
  };
  for (const { page, faces, features: wanted, text, hyphens } of runs) {
    for (const ch of new Set(text)) {
      if (/\s/.test(ch) || ch === "\u00AD") continue;
      const face = faces.find((key) => has(key, ch));
      if (face) give(face, ch, wanted);
      else missing.set(`${page}|${ch}`, faces.map((k) => path.basename(k.split(" ")[0])));
    }
    for (const ch of hyphens) {
      const face = faces.find((key) => has(key, ch));
      if (face) give(face, ch, wanted);
    }
  }

  for (const [key, fams] of missing) {
    const [page, ch] = key.split("|");
    console.warn(`  ! ${page}: “${ch}” (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}) isn't in ${fams.join(" or ")}, so it falls back to a system font`);
  }

  const renamed = new Map();
  for (const f of fonts) {
    const used = [...declared].some((k) => k.split(" ").includes(f)) && chars.get(f).size > ALWAYS.length;
    if (!used) console.warn(`  ! ${f} is referenced, but no text on the site is set in it`);
    const before = site.get(f);
    const after = await subsetFont(before, [...chars.get(f)].join(""), {
      preserveNameIds: [0, 13, 14], // copyright, licence and licence URL, which the OFL asks to travel with the font
      keepFeatures: [...features.get(f)],
    });
    const hash = createHash("sha256").update(after).digest("hex").slice(0, 8);
    const name = f.replace(/(\.\w+)$/, `.${hash}$1`);
    site.delete(f);
    site.set(name, after);
    renamed.set(f, name);
    fontReport.push({ file: name, before: before.length, after: after.length, chars: chars.get(f).size - ALWAYS.length });
  }

  // Point the pages and stylesheets at the new names.
  for (const [file, contents] of site) {
    const kind = file.endsWith(".css") ? "css" : file.endsWith(".html") ? "html" : null;
    if (!kind) continue;
    site.set(file, eachRef(contents, kind, (ref) => {
      const target = resolve(ref, file);
      return renamed.has(target) ? ref.replace(/[^/]+$/, path.posix.basename(renamed.get(target))) : ref;
    }));
  }
}
const fontReport = [];

// ---- Write it out --------------------------------------------------------------------

const kb = (n) => `${(n / 1024).toFixed(1)} KB`.padStart(9);

await collect();
if (existsSync(path.join(SRC, "_headers"))) site.set("/_headers", await readFile(path.join(SRC, "_headers"), "utf8"));
console.log(`Tracing which glyphs each font needs…`);
await subsetFonts(await traceFonts());

await rm(OUT, { recursive: true, force: true });
for (const [file, contents] of site) {
  await mkdir(path.join(OUT, path.dirname(file)), { recursive: true });
  await writeFile(path.join(OUT, file), contents);
}

console.log(`\nWrote build/:\n`);
let total = 0, totalGz = 0;
for (const file of [...site.keys()].sort()) {
  const bytes = Buffer.byteLength(site.get(file));
  const font = fontReport.find((r) => r.file === file);
  const gz = isText(file) ? gzipSync(site.get(file)).length : bytes;
  total += bytes;
  totalGz += gz;
  const note = font ? `${font.chars} characters, from ${kb(font.before).trim()}` : isText(file) ? `${kb(gz).trim()} gzipped` : "";
  console.log(`  ${file.slice(1).padEnd(64)} ${kb(bytes)}   ${note}`);
}
console.log(`\n  ${"Total".padEnd(64)} ${kb(total)}   ${kb(totalGz).trim()} with HTML and CSS gzipped`);
