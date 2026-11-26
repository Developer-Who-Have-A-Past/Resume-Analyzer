# Resume Lab

An Overleaf-style resume editor that runs entirely in the browser. Write your resume as simple text, watch the A4 preview update, tailor it to a job description and get an ATS-style analysis.

## Features

- Live editor with line numbers and A4 preview; Classic, Modern and Compact templates
- LaTeX view you can paste into Overleaf
- Job description matching: keyword score, missing keywords, bullet and format checks
- AI review and tailoring with apply / skip / undo for every suggested edit
- Import from pasted text or .txt / .md / .tex files
- Export to PDF (real text, ATS friendly), HTML, Markdown source and LaTeX

## Project layout

```
index.html                    page structure
styles.css                    app styles
app.js                        parser, analyser, preview, LaTeX/PDF export, AI client
.github/workflows/pages.yml   deploys to GitHub Pages on every push to main
```

No build step and no dependencies to install. jsPDF and the fonts load from public CDNs.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## Deploy on GitHub Pages

1. Create a repository and push these files to the `main` branch.
2. In the repository go to **Settings > Pages** and set **Source** to **GitHub Actions**.
3. The workflow runs on the push. When it finishes, the site is at `https://<your-username>.github.io/<repo-name>/`.

## AI features

Click **AI settings**, paste an Anthropic API key and save. The key stays in your browser's local storage and requests go directly from your browser to the Anthropic API. Use a key with a spend limit and never enter it on a shared computer. GitHub Pages is static hosting, so there is no server to hold a secret; if you want AI for other people without their own keys, put a small proxy (a Cloudflare Worker, for example) in front of the API.

Without a key, the editor, preview, local analyser and exports all still work. Your resume and job description are saved in your browser only.

## License

MIT
