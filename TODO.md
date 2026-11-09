# TODO

## Lint the Markdown for straight quotes

Add a check that fails on straight quotes (`'` and `"`) in a specimen's Markdown source, so apostrophes and quotation marks are always the curly ones (’ ‘ “ ”).

Places where straight quotes are legitimate, and should be skipped:

- fenced code blocks (the bottlenecks diagrams are in these)
- inline code spans, in backticks
- link URLs, in `[text](url)`
- raw HTML, including attribute values

Report the file, line and the word each one is in, and run it as part of `npm run build`, so a straight quote can't reach a built page. The READMEs are notes, not published, so leave them out.
