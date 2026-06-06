/* ------------------------------------------------------------------ *
 *  DES307 Journal — static build
 *  Reads notes/*.md in filename order, bakes one cohesive index.html.
 *  Run:  npm install   (once)   then   npm run build
 * ------------------------------------------------------------------ */

const fs = require('fs');
const path = require('path');
let marked = require('marked');
marked = marked.marked || marked;            // works on marked v4 and v12

/* ---- Config ------------------------------------------------------ */
const NOTES_DIR  = path.join(__dirname, 'notes');
const IMAGES_DIR = 'images';                 // folder images live in, relative to index.html
const OUTPUT     = path.join(__dirname, 'index.html');

const SITE_TITLE    = 'Hello Stranger';
const SITE_SUBTITLE = 'Project Journal';
const SITE_META     = 'DES307 · Matthew Bissell · 2026';

// Pretty eyebrow label per file (filename without .md). Anything not listed
// is auto-derived. Reorder the document by renaming the number prefixes.
const LABELS = {
  '01_WK_1-3_JournalNotes'      : 'Weeks 1–3 · Exploring the space',
  '02_WK_3-6_JournalNotes'      : 'Weeks 4–6 · Grounding the language',
  '03_WK_7-10_JournalNotes'     : 'Weeks 7–10 · Building the pipeline',
  '04_WK_11-13_JournalingFInal' : 'Weeks 11–13 · The final push',
  '05_WK_12_Reflection'         : 'Reflection',
  '06_WK_References'            : 'References',
  '07_WK12_Concept_of_record'   : 'Concept of record',
};
/* ------------------------------------------------------------------ */

const slugify = s => s.toLowerCase().trim()
  .replace(/<[^>]+>/g, '')
  .replace(/&[a-z]+;/g, '')
  .replace(/[^\w\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

// Alt text we treat as "no caption" (placeholders left in the markdown)
const PLACEHOLDER_ALT = /^(alt[\s_-]?text|image|img)?$/i;
// Headings we don't want cluttering the contents list
const NOISE_HEADING   = /^(entry\s*\d+.*|↑.*back to top.*)$/i;

function autoLabel(stem) {
  return stem
    .replace(/^\d+[_-]?/, '')
    .replace(/WK[_-]?/i, '')
    .replace(/JournalNotes|Journaling.*|Notes/gi, '')
    .replace(/[_-]+/g, ' ')
    .trim() || stem;
}

/* Rewrite every local image to images/<basename>, regardless of how it
   was originally written (../images/x.png, /images/x.png, x.png). */
function normalizeImages(md) {
  return md.replace(/!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (m, alt, src) => {
    if (/^https?:\/\//i.test(src)) return m;
    const base = src.split('/').pop().split('?')[0];
    return `![${alt}](${IMAGES_DIR}/${base})`;
  });
}

/* Add ids to headings + collect them for the contents list. */
function processHeadings(html, headings) {
  return html.replace(/<(h[1-6])>([\s\S]*?)<\/\1>/gi, (m, tag, inner) => {
    const level = Number(tag[1]);
    const text  = inner.replace(/<[^>]+>/g, '').trim();
    let slug    = slugify(text) || ('h' + headings.length);
    if (headings.some(h => h.slug === slug)) slug += '-' + headings.length;
    if (level <= 3 && text && !NOISE_HEADING.test(text)) headings.push({ level, text, slug });
    return `<${tag} id="${slug}">${inner}</${tag}>`;
  });
}

/* Wrap images in <figure>; turn meaningful alt text into a caption;
   flag images missing from disk so they're visible, not broken icons. */
function processFigures(html) {
  html = html.replace(/<img\s+([^>]*?)>/gi, (imgTag, attrs) => {
    const altM = attrs.match(/alt="([^"]*)"/i);
    const srcM = attrs.match(/src="([^"]*)"/i);
    const alt  = altM ? altM[1] : '';
    const src  = srcM ? srcM[1] : '';
    const onDisk = src && fs.existsSync(path.join(__dirname, src));
    const caption = PLACEHOLDER_ALT.test(alt.trim()) ? '' : `<figcaption>${alt}</figcaption>`;
    if (!onDisk) {
      return `<figure class="fig fig-missing"><div class="missing">missing image · <code>${src || '?'}</code></div>${caption}</figure>`;
    }
    return `<figure class="fig">${imgTag}${caption}</figure>`;
  });
  // Unwrap the <p> marked puts around standalone images
  return html.replace(/<p>(\s*<figure[\s\S]*?<\/figure>\s*)<\/p>/gi, '$1');
}

function buildChapterToc(headings) {
  if (!headings.length) return '';
  const items = headings.map(h =>
    `<li class="lvl-${h.level}"><a href="#${h.slug}">${h.text}</a></li>`).join('');
  return `<ul>${items}</ul>`;
}

/* ---- Read + render every note ------------------------------------ */
const files = fs.readdirSync(NOTES_DIR)
  .filter(f => f.endsWith('.md'))
  .sort();                                    // numeric prefix = order

let chapters = '';
let toc = '';

files.forEach((file, i) => {
  const stem  = file.replace(/\.md$/, '');
  const label = LABELS[stem] || autoLabel(stem);
  const num   = String(i + 1).padStart(2, '0');
  const chapId = 'ch-' + slugify(stem);

  let md = fs.readFileSync(path.join(NOTES_DIR, file), 'utf8').replace(/\r\n/g, '\n');
  md = normalizeImages(md);

  const headings = [];
  let html = marked.parse(md);
  html = processHeadings(html, headings);
  html = processFigures(html);

  chapters += `
<section class="chapter" id="${chapId}">
  <p class="eyebrow"><span class="num">${num}</span>${label}</p>
  ${html}
</section>`;

  toc += `
<li class="toc-chapter">
  <a class="toc-chapter-link" href="#${chapId}"><span class="num">${num}</span>${label}</a>
  ${buildChapterToc(headings)}
</li>`;
});

/* ---- Page shell -------------------------------------------------- */
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${SITE_TITLE} — ${SITE_SUBTITLE}</title>
<meta name="description" content="${SITE_TITLE} — ${SITE_SUBTITLE}. ${SITE_META}" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css" />
</head>
<body>
<header class="masthead">
  <div class="masthead-inner">
    <p class="kicker">${SITE_META}</p>
    <h1 class="title">${SITE_TITLE}</h1>
    <p class="subtitle">${SITE_SUBTITLE}</p>
  </div>
</header>

<div class="layout">
  <aside class="sidebar">
    <nav class="toc" aria-label="Contents">
      <p class="toc-head">Contents</p>
      <ol>${toc}
      </ol>
    </nav>
  </aside>

  <main class="content">
    ${chapters}
  </main>
</div>

<button id="top" class="to-top" aria-label="Back to top">↑</button>

<script>
  // Back-to-top
  const topBtn = document.getElementById('top');
  addEventListener('scroll', () => topBtn.classList.toggle('show', scrollY > 600));
  topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  // Scrollspy: highlight the chapter currently in view
  const links = [...document.querySelectorAll('.toc-chapter-link')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        map.get(e.target.id)?.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  document.querySelectorAll('.chapter').forEach(c => spy.observe(c));
</script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT, page, 'utf8');
console.log(`Built ${OUTPUT} from ${files.length} notes:`);
files.forEach((f, i) => console.log(`  ${String(i + 1).padStart(2, '0')}  ${f}`));
