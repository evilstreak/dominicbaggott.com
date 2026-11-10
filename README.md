# dominicbaggott.com

If you’ve come here from the site, hello. You probably wanted to see how it’s put together, so here’s the short version.

This is the source for [dominicbaggott.com](https://dominicbaggott.com): a small book of specimens of my work and opinions. I’ve always loved typography, and browsing a foundry’s site always had me wishing I had a project that would justify using some of the beautiful typefaces. Fast forward a decade or two and we’ve got a web that has hundreds of extremely high quality fonts available under the SIL Open Font License, and browsers that properly support them. We’ve also got AI coding assistants that can do in minutes what would’ve taken days.

So, given my portfolio site was due a refresh, I figured why not have some fun? Like a type foundry’s specimen book, each piece I write is set in its own faces, and the homepage is the plain cover that holds them together. Each specimen is an opportunity to be bold, to show a little personality.

## How it’s made

Each piece starts as plain Markdown. A small script per piece turns it into plain HTML: no classes, no framework, no JavaScript. All the typography lives in one stylesheet per piece that styles ordinary elements. A paragraph is a paragraph, and the CSS decides that the first one is the lede, or that every one gets a tape counter in the margin.

I built the site working with Claude, and [CLAUDE.md](CLAUDE.md) is the brief it works from, so you can see that side of it too. And although the words on my site are mine, this README is slightly more of a joint effort, so if you catch some of Claude’s voice in here don’t be surprised.

View source was one of the best things about the web. Growing up in the ’90s, I learned web development by viewing the source of my favourite sites and taking the best bits. It’s not fashionable any more, with fair reason: writing HTML and CSS by hand is incredibly tedious (speaking as someone who built the frontend templates for online banking systems), and modern templating and build systems that remove that tedium also make it hard to have elegant output. But I have a coding assistant that doesn’t experience tedium like I do, so the HTML and CSS are all crafted to be readable: whitespace, comments and all.

I measured it just to check what it’s costing me: minifying everything would save about 5 KB across the whole site once it’s gzipped for delivery.

The fonts are where the weight is, so that’s where the effort goes. The build opens every page in a headless browser and works out exactly which characters each font is used for, down to the text CSS generates, then cuts each font down to just those glyphs. The homepage loads all the typefaces because of the cards, so that’ll be the first to suffer. But even there, at the time of writing, it’s only about 160 KB in total.

## The specimens

Each piece becomes a specimen in the type-foundry sense: writing set to show off its typefaces. Except in this case it’s the writing I’m showing off, dressed up as a specimen. Type-foundry cosplay? All the specimens follow the same rules: plain Markdown in, semantic markup out, one stylesheet, faces of their own, and a ground colour that’s unused by any other specimen. I liked the flavour of giving each specimen a label, but didn’t want anything chronological. So a specimen’s code is the hex of its ground colour, another nod to me cutting my teeth working as a frontend developer.

The best way to view these is via the site, but if you want to see the source code you can browse through the folders in `src/`. Each folder has its own README, with a list of the faces and settings, and a table of what each bit of Markdown becomes.


## Building it

You’ll need Node 24, and Playwright’s Chromium for the build:

```
npm install
npx playwright-core install --only-shell chromium   # once
npm run build    # writes the finished site to build/
npm run serve    # http://localhost:8000
```

## Typefaces

All under the SIL Open Font License, with the licence carried in each font’s metadata and included alongside each source font.

- [Anton](https://github.com/googlefonts/AntonFont) by Vernon Adams
- [Archivo](https://github.com/Omnibus-Type/Archivo) by Omnibus-Type
- [Besley](https://github.com/indestructible-type/Besley) by Owen Earl
- [Bodoni Moda](https://github.com/indestructible-type/Bodoni) by Owen Earl (the cover)
- [Fraunces](https://github.com/undercasetype/Fraunces) by Undercase Type
- [Martian Mono](https://github.com/evilmartians/mono) by Evil Martians
- [Newsreader](https://github.com/productiontype/Newsreader) by Production Type
- [Unbounded](https://github.com/googlefonts/unbounded)
- [Young Serif](https://github.com/noirblancrouge/YoungSerif) by Bastien Sozeau

## Licence

The build code (`build.mjs` and each piece’s `page.mjs`) is MIT-licensed, so take it and use it however you like. The writing, HTML, CSS and design are mine, all rights reserved. See [LICENSE](LICENSE).
