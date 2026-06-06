# Hello Stranger — DES307 Project Journal

A tiny static-site generator. It reads the markdown notes in `notes/`, in
filename order, and bakes them into a single cohesive `index.html` you can push
to GitHub Pages.

## Folder structure

```
des307_journal/
├── notes/          ← your markdown, numbered for order (01_, 02_, …)
├── images/         ← ALL images go here (flat, no subfolders)
├── build.js        ← the generator
├── style.css       ← the look (edit freely)
├── index.html      ← GENERATED — don't hand-edit, it gets overwritten
├── package.json
└── .github/workflows/deploy.yml   ← optional auto-publish
```

## Publishing (the two-step you asked for)

```bash
npm install      # once
npm run build    # rebuild index.html from the notes
git add -A && git commit -m "update journal" && git push
```

Then in your repo: **Settings → Pages → Build and deployment → Deploy from a
branch → `main` / `(root)`**. Your journal is live at
`https://<username>.github.io/<repo>/`.

> Prefer not to run Node locally? Use the included GitHub Action
> (`.github/workflows/deploy.yml`): it builds on every push and deploys for you.
> If you use it, set Pages source to **GitHub Actions** instead of a branch, and
> you don't need to commit `index.html`.

## How it handles the things that were breaking

- **No backend needed.** The old `index.html` fetched `/api/notes`, which only
  works with a live server — on GitHub Pages it would load blank. The build
  bakes everything in, so the output is fully static.
- **Image paths are normalised.** Write `![](anything/foo.png)`,
  `![](/images/foo.png)`, or just `![](foo.png)` — all resolve to `images/foo.png`.
  Just drop every image into `images/`.
- **Working contents + anchors.** Heading links in the sidebar actually jump now.

## Editing conventions

- **Order** = the number prefix. To move the Concept of Record to the front as
  framing, rename it `00_…` (or renumber the others). The build re-sorts itself.
- **Captions:** the image alt text becomes a caption *only* if it isn't a
  placeholder. `![](image-5.png)` → no caption. `![Material graph: three Lerp
  nodes compositing the zones](image-5.png)` → that line prints under the image.
  Worth doing for the dense node-graph screenshots that are otherwise unreadable.
- **Chapter labels:** edit the `LABELS` map at the top of `build.js`.
- **The look:** all in `style.css`. Fonts are Fraunces (headings) + Hanken
  Grotesk (body); accent colour is one lavender ink, nodding to the pulse.
```
