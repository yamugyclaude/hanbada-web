const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('frontmatter not found');
  const [, fmBlock, body] = match;
  const data = {};
  fmBlock.split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    data[key] = value;
  });
  return { data, body };
}

function readEntries(dir, slugFromFilename) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    return {
      ...data,
      slug: slugFromFilename(file),
      html: marked.parse(body.trim()),
    };
  });
}

function blogSlug(filename) {
  const name = filename.replace(/\.md$/, '');
  return name.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function portfolioSlug(filename) {
  return filename.replace(/\.md$/, '');
}

function fill(template, values) {
  return Object.keys(values).reduce(
    (acc, key) => acc.split(`{{${key}}}`).join(values[key]),
    template
  );
}

function coverHtml(cover, title, root) {
  if (!cover) return '';
  return `<img class="cover" src="${root}${cover}" alt="${title}">`;
}

function listCardHtml(entry, showCategory) {
  const cover = entry.cover
    ? `<img class="cover" src="../${entry.cover}" alt="${entry.title}">`
    : '';
  const categoryHtml = showCategory ? `<span class="category">${entry.category}</span>` : '';
  return `<a class="list-card fade-in" href="${entry.slug}/">
  ${cover}
  <div class="body">
    <div class="meta">${entry.date}</div>
    ${categoryHtml}
    <h3>${entry.title}</h3>
    <p>${entry.summary}</p>
  </div>
</a>`;
}

function listPageHtml({ title, description, cards }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - 한바다</title>
<meta name="description" content="${description}">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
<link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<header class="site-header">
  <nav class="nav">
    <a class="logo" href="../">
      <img src="../assets/images/한바다로고2.png" alt="한바다">
      한바다
    </a>
    <ul class="nav-links">
      <li><a href="../services/">서비스</a></li>
      <li><a href="../portfolio/">포트폴리오</a></li>
      <li><a href="../blog/">블로그</a></li>
      <li><a href="../contact/">문의</a></li>
    </ul>
  </nav>
</header>

<section class="section container">
  <h2 class="fade-in">${title}</h2>
  <p class="section-desc fade-in">${description}</p>
  <div class="list-grid">
${cards.join('\n')}
  </div>
</section>

<footer class="site-footer">
  <div class="company">한바다</div>
  <div>대표 설전옥 · 전화 010-9525-2375</div>
</footer>

<script src="../assets/js/main.js"></script>
</body>
</html>
`;
}

function build() {
  const postTemplate = fs.readFileSync(path.join(ROOT, 'templates/post.html'), 'utf8');
  const portfolioTemplate = fs.readFileSync(path.join(ROOT, 'templates/portfolio.html'), 'utf8');

  const blogEntries = readEntries(path.join(ROOT, 'content/blog'), blogSlug)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const portfolioEntries = readEntries(path.join(ROOT, 'content/portfolio'), portfolioSlug)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  blogEntries.forEach((entry) => {
    const outDir = path.join(ROOT, 'blog', entry.slug);
    fs.mkdirSync(outDir, { recursive: true });
    const html = fill(postTemplate, {
      TITLE: entry.title,
      DATE: entry.date,
      SUMMARY: entry.summary,
      COVER_HTML: coverHtml(entry.cover, entry.title, '../../'),
      CONTENT: entry.html,
    });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
  });

  portfolioEntries.forEach((entry) => {
    const outDir = path.join(ROOT, 'portfolio', entry.slug);
    fs.mkdirSync(outDir, { recursive: true });
    const html = fill(portfolioTemplate, {
      TITLE: entry.title,
      DATE: entry.date,
      CATEGORY: entry.category,
      SUMMARY: entry.summary,
      COVER_HTML: coverHtml(entry.cover, entry.title, '../../'),
      CONTENT: entry.html,
    });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
  });

  fs.writeFileSync(
    path.join(ROOT, 'blog/index.html'),
    listPageHtml({
      title: '블로그',
      description: '한바다의 이야기를 전합니다.',
      cards: blogEntries.map((e) => listCardHtml(e, false)),
    })
  );

  fs.writeFileSync(
    path.join(ROOT, 'portfolio/index.html'),
    listPageHtml({
      title: '포트폴리오',
      description: '한바다와 함께한 행사를 소개합니다.',
      cards: portfolioEntries.map((e) => listCardHtml(e, true)),
    })
  );

  console.log(`blog: ${blogEntries.length}, portfolio: ${portfolioEntries.length}`);
}

build();
