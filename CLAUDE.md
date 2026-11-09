# Working on dominicbaggott.com

The site is a specimen book. The homepage is the cover: Bodoni Moda on plain paper, with a card for each piece. Each piece (a specimen) is its own page, set in its own faces, like a foundry specimen. README.md is written for people curious about the site, not for you; the working detail is here and in each specimen's own README.

## Layout

```
src/                                 everything the site is made from
  index.html, home.css, fonts/       the homepage (hand-written)
  _headers                           Cloudflare cache settings
  <specimen>/                        one folder per specimen
build.mjs                            builds src/ into build/
build/                               the finished site (gitignored; never edit it by hand)
wrangler.jsonc, .github/workflows/   deployment (see Deploying)
TODO.md                              planned work
```

Each specimen folder holds its README (read it before touching the specimen: it maps every bit of Markdown to its typography), Markdown source, `page.mjs`, stylesheet and fonts. `page.mjs` has a default export that returns the page's HTML; the build calls it.

## Building and previewing

`npm install` once, then `npm run build`, then `npm run serve` for http://localhost:8000. Node 24 (`.nvmrc`; wrangler needs 22.12 or newer). The build needs Playwright's headless Chromium, installed once with `npx playwright-core install --only-shell chromium` (again after upgrading `playwright-core`). Don't fall back to Google Chrome or any other installed browser: one pinned Chromium means every machine traces fonts the same way. `npm run serve` is `wrangler dev`, which serves `build/` the way Cloudflare does, headers and redirects included.

What the build does, in order:

1. **Pages.** It starts at `src/index.html` and follows local links. A folder with a `page.mjs` is rendered by it; otherwise its `index.html` is used. Every page is then indented to show how its block elements nest (`indent()` in `build.mjs`), which only touches the whitespace at the start of each line and leaves `<pre>` alone. Anything nothing links to isn't built, so a draft specimen stays out of the site until the homepage links to it.
2. **Assets.** It copies only files a page or stylesheet refers to (`href`, `src`, `url()`, `@import`). READMEs, Markdown, licence texts and `concepts/` never ship.
3. **Fonts.** It opens every page in headless Chromium at widths either side of each CSS breakpoint, works out which characters each font file is drawn with (text, generated content, `text-transform`, counters, list markers), and subsets each file to those glyphs plus the OpenType features in use (browser defaults plus anything from `font-feature-settings` / `font-variant-*`). A file shared by several pages gets the union. Subsets keep name IDs 0, 13 and 14 (copyright, licence text, licence URL).
4. **Names.** Each subset gets an 8-character content hash in its filename, and references in HTML and CSS are rewritten to match.

It prints every file with its size, and warnings. Treat warnings as things to resolve or consciously accept, and mention them to Dominic:

- “isn't in X, so it falls back to a system font”: a character the face doesn't have. Known and accepted: the ↑ on the recording-thoughts notes (Besley has no ↑).
- “is referenced, but no text on the site is set in it”: a font that's declared but unused. Remove the `@font-face` (and the file) unless something is about to use it.

## Rules

- **HTML and CSS ship readable**: unminified, comments kept, never a minifier. Pages are indented two spaces per level of nesting; the build does this for generated pages, and `src/index.html` is written the same way, so the build leaves it unchanged. Keep generated HTML to one block element per line, and break up long runs (footnote groups, SVG rects) onto separate lines, so the indenting has something to work with. The exception is whitespace-sensitive inline content, like the per-letter spans in the recording-thoughts title, which must stay on one line. `<pre>` content stays at column 0, since spaces there are part of the diagram; start it on the line after the `<pre>` tag (browsers ignore that first newline) so its lines align.
- **No classes.** Styling targets plain elements, ARIA roles, `:has()` and position. Markdown stays plain: no custom syntax beyond `[^label]` footnotes.
- **Specimen labels** (which face, which settings) are CSS-generated content with empty alt text, `content: "…" / ""`, so screen readers skip them.
- **No leftovers.** When a feature, style or file stops being used, remove it. Don't leave dead code, unused CSS or orphaned fonts behind.
- **Curly quotes** in prose: ’ ‘ “ ”, never ' or ". (TODO.md has a planned lint for this.)
- **British spelling** (“licence”, “colour”), except in proper names: it’s the “SIL Open Font License”, and the licence file is `LICENSE`.
- **No JavaScript on the site** unless Dominic asks for it.
- **Homepage**: finished pieces only, no placeholder cards. Bodoni Moda has no arrows, so no ← or ↓ in homepage text.

## Fonts and the OFL

Every font on the site is under the SIL Open Font License. Serving a font with `@font-face` is distribution, and the OFL requires each copy to carry its copyright notice and the licence. Ours do that in the font's own metadata, which the OFL FAQ (1.10) accepts.

When adding a font:

1. Take it from the original project or Fontsource, Latin subset, as WOFF2. Keep the full source file in the specimen's `fonts/` folder; the build does the cutting down.
2. Put the licence text alongside it as `OFL-<name>.txt`.
3. Check the copyright line of the licence for a **Reserved Font Name**. If there is one, a subset is a Modified Version and can't use that name, so stop and raise it with Dominic. None of the current fonts has one.
4. Check its metadata has name ID 0 (copyright) and 13 and/or 14 (licence text, licence URL). If 13 and 14 are missing, add them, copying the wording from `martian-mono.woff2`, and change nothing else:

   ```python
   from fontTools.ttLib import TTFont  # pip install fonttools brotli
   ref = TTFont("src/when-bottlenecks-move/fonts/martian-mono.woff2")["name"]
   f = TTFont(path)
   f["name"].setName(ref.getDebugName(13), 13, 3, 1, 0x409)
   f["name"].setName(ref.getDebugName(14), 14, 3, 1, 0x409)
   f.flavor = "woff2"
   f.save(path)
   ```

5. In CSS, give the `@font-face` a family name of its own (“Terminal Martian”, “Studio Besley”, “Card Unbounded”) so a copy installed on a reader's computer can never stand in.
6. Credit it in the page's footer and in the homepage colophon by name. Naming the licence is enough; it doesn't need a link.

## Specimens

A specimen's code is the hex of its ground colour, which must be unique across the site. It appears on the homepage card, in the label at the top of the specimen's page, and in the colophon. Don't number specimens: a sequence implies a chronology.

To add one:

1. Make a folder in `src/` with a `page.mjs` (or a hand-written `index.html`), its stylesheet and `fonts/`, and a README in the style of the others. Give its header a link home: `<a href="../">Dominic Baggott</a>`.
2. Add a card to the list in `src/index.html`: an `<li>` holding an `<article>` whose first line is `<p><span>Specimen #XXXXXX</span> <span>Kind</span></p>`, then an `<h2>` holding the link to the folder. The link covers the whole card; give it an `aria-label` if the visible title is broken up for typographic effect. This link is what puts the specimen in the build.
3. Style the card in `home.css`, scoped as `li:has(> article [href^="folder-name"])`. Borrow the specimen's own font files from its folder with `@font-face` under a name starting with “Card”, so the homepage and the specimen share one file.
4. Add it to the colophon, and to the specimen list in README.md.

The homepage grid lets cards shrink to about 380px before it drops to one column, and fits three across at full width.

## Checking changes

- After any change, run the build and read its output.
- After changing `build.mjs`, a `page.mjs`, or a font file, check the pages still render the same: build before and after, serve both, and screenshot every page with Playwright (`deviceScaleFactor: 1`, full page, after `document.fonts.ready`) at 360, 1440 and either side of each breakpoint, then compare the images. Identical screenshots are the bar for changes that shouldn't change how anything looks.
- Look at a page yourself after any change that should change how it looks.

## Deploying

The site is served by Cloudflare, as a Worker with static assets only: no Worker code. Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and runs `npx wrangler deploy`, using the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. It has a “Run workflow” button for redeploying by hand.

- `wrangler.jsonc` points Cloudflare at `build/`. Folder URLs serve their `index.html`, and a folder URL without its trailing slash redirects to the one with it.
- `src/_headers` sets the caching, and the build copies it into `build/`. Cloudflare's default for everything is `public, max-age=0, must-revalidate` with an ETag, which is right for HTML and CSS. Fonts, whose names carry a hash of their contents, get `public, max-age=31536000, immutable`. If two rules set the same header, Cloudflare joins the values with a comma, so don't add overlapping `Cache-Control` rules.
- Cloudflare compresses HTML and CSS itself.

The repo is https://github.com/evilstreak/dominicbaggott.com, linked from the homepage colophon.

## Licensing

The build code (`build.mjs` and each `page.mjs`) is MIT; the writing, HTML, CSS and design are all rights reserved; the fonts are OFL. If you add a new code file, such as a lint script, name it in LICENSE and in the README's Licence section.
