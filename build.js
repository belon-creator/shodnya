// Генератор статичних сторінок: node build.js  ->  папка dist/
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('data.js', 'utf8') + ';this.SITE=SITE;this.RUBRICS=RUBRICS;this.ARTICLES=ARTICLES;', ctx);
const { SITE, RUBRICS, ARTICLES } = ctx;
const BASE = (SITE.url || '').replace(/\/$/, '');

const TR = {а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia'};
const slugify = t => { let s = [...t.toLowerCase()].map(c => TR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); if (s.length > 60) { s = s.slice(0, 60); s = s.slice(0, Math.max(s.lastIndexOf('-'), 20)); } return s; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const L = { timeZone: 'UTC' };
const dFull = d => new Date(d).toLocaleDateString('uk-UA', { ...L, day: 'numeric', month: 'long', year: 'numeric' });
const dMon = d => new Date(d + '-01').toLocaleDateString('uk-UA', { ...L, month: 'long', year: 'numeric' });
const dShort = d => new Date(d).toLocaleDateString('uk-UA', { ...L, day: 'numeric', month: 'short' });

const used = new Set();
const list = ARTICLES.map(a => { let s = slugify(a.title) || 'article-' + a.id; if (used.has(s)) s += '-' + a.id; used.add(s); return { ...a, url: `${a.rubric}/${s}.html` }; })
  .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
const months = [...new Set(list.map(a => a.date.slice(0, 7)))];

const out = (file, html) => { const f = path.join('dist', file); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const item = (a, r) => `<div class="item ${a.rubric}"><div><div class="meta"><a href="${r}${a.rubric}/">${RUBRICS[a.rubric]}</a> · <time datetime="${a.date}">${dFull(a.date)}</time></div>
<h2><a href="${r}${a.url}">${esc(a.title)}</a></h2><p>${esc(a.lead)}</p></div></div>`;
const stream = (rows, r) => { let last = '', h = ''; rows.forEach(a => { if (a.date !== last) { h += `<div class="day">${dFull(a.date)}</div>`; last = a.date; } h += item(a, r); }); return h; };

const sidebar = r => `<aside><section><h3>Популярне</h3><ol>${[...list].sort((a, b) => b.views - a.views).slice(0, 5).map(a => `<li><a href="${r}${a.url}">${esc(a.title)}</a></li>`).join('')}</ol></section>
<section><h3>Архів за місяцями</h3><ul>${months.map(m => `<li><a href="${r}archive.html#${m}">${dMon(m)}</a> <span class="n">(${list.filter(a => a.date.startsWith(m)).length})</span></li>`).join('')}</ul></section></aside>`;

const STRIP = `<div class="strip"><div class="wrap"><button class="chip" id="wx" type="button" title="Натисніть, щоб визначити ваше місто">Погода…</button><span class="chip" id="usd"></span><span class="chip" id="eur"></span></div></div>`;

const GTM = (SITE.gtm || '').trim(); // ID контейнера задається лише в data.js: SITE.gtm = 'GTM-XXXX'; порожньо — тег не додається
const gtmHead = GTM ? `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM}');</script>` : '';
const gtmBody = GTM ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>` : '';
// Google Analytics 4 напряму (без GTM): SITE.ga = 'G-XXXXXXXXXX'
const GA = (SITE.ga || '').trim();
const gaHead = GA ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA}');</script>` : '';
if (GA && GTM) console.warn('УВАГА: задано і SITE.ga, і SITE.gtm. Якщо GA4 також підключено всередині GTM, перегляди рахуватимуться двічі: залиште щось одне.');

function page({ title, desc, file, r = '', cur = '', main, type = 'website', ld = '', home = false, scripts = '' }) {
  const nav = [['Стрічка', r || './', 'home'], ...Object.entries(RUBRICS).map(([k, v]) => [v, `${r}${k}/`, k]), ['Архів', `${r}archive.html`, 'archive']]
    .map(([t, h, k]) => `<a href="${h}"${k === cur ? ' class="on"' : ''}>${t}</a>`).join('');
  out(file, `<!doctype html>
<html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${gtmHead}${gaHead}
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
${BASE ? `<link rel="canonical" href="${BASE}/${file.replace(/index\.html$/, '')}">` : ''}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="${type}"><meta property="og:locale" content="uk_UA">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;600;700&family=Source+Serif+4:wght@600;700;800&display=swap&subset=cyrillic" rel="stylesheet">
<link rel="icon" href="${r}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${r}style.css">${ld}</head><body>${gtmBody}
<header><div class="wrap"><a class="logo" href="${r || './'}">${esc(SITE.name)}<i></i></a><nav aria-label="Рубрики">${nav}</nav><form class="search" action="${r}search.html" role="search"><input name="q" type="search" placeholder="Пошук" aria-label="Пошук по сайту"></form></div></header>${home ? STRIP : ''}
<main class="wrap"><div>${main}</div>${sidebar(r)}</main>
<footer><div class="wrap">© ${new Date().getFullYear()} ${esc(SITE.name)}. ${esc(SITE.tagline)}.</div></footer>${home ? '<script src="widgets.js"></script>' : ''}${scripts}</body></html>`);
}

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');
fs.copyFileSync('style.css', 'dist/style.css');
fs.copyFileSync('widgets.src.js', 'dist/widgets.js');
fs.writeFileSync('dist/favicon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#ffd23f"/></svg>');

page({ title: `${SITE.name} — ${SITE.tagline}`, desc: SITE.tagline, file: 'index.html', cur: 'home', home: true, main: `<h1>Останні матеріали</h1>${stream(list, '')}` });
page({ title: `Архів — ${SITE.name}`, desc: `Усі матеріали сайту ${SITE.name} за місяцями.`, file: 'archive.html', cur: 'archive',
  main: `<div class="arch"><h1>Архів матеріалів</h1>${months.map(m => `<h2 id="${m}">${dMon(m)}</h2><ul>${list.filter(a => a.date.startsWith(m)).map(a => `<li><time datetime="${a.date}">${dShort(a.date)}</time><a href="${a.url}">${esc(a.title)}</a></li>`).join('')}</ul>`).join('')}</div>` });

for (const [k, v] of Object.entries(RUBRICS)) {
  const rows = list.filter(a => a.rubric === k);
  page({ title: `${v} — ${SITE.name}`, desc: `${v}: усі матеріали рубрики на ${SITE.name}.`, file: `${k}/index.html`, r: '../', cur: k, main: `<h1>${v}</h1>${rows.length ? stream(rows, '../') : '<p class="empty">У цій рубриці поки немає матеріалів.</p>'}` });
}

const searchIdx = [];
for (const a of list) {
  const body = typeof a.body === 'string' ? a.body : a.body.map(p => p.trim().startsWith('<') ? p : p.startsWith('```') ? `<pre><code>${esc(p.replace(/^```\w*\n?|\n?```$/g, ''))}</code></pre>` : p.startsWith('## ') ? `<h2>${esc(p.slice(3))}</h2>` : `<p>${esc(p)}</p>`).join('\n');
  const rel = list.filter(x => x.rubric === a.rubric && x.id !== a.id).slice(0, 3);
  const bodyL = body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, key, text) => {
    const k = key.trim().toLowerCase();
    const hits = list.filter(x => x.id !== a.id && x.title.toLowerCase().includes(k));
    if (hits.length !== 1) { console.warn(`УВАГА: у статті «${a.title}» посилання [[${key}]] ${hits.length ? 'підходить до кількох статей' : 'не знайдено'}`); return text || key; }
    return `<a href="../${hits[0].url}">${text || hits[0].title}</a>`;
  });
  searchIdx.push({ t: a.title, l: a.lead, u: a.url, k: a.rubric, n: RUBRICS[a.rubric], d: dFull(a.date),
    x: bodyL.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase().slice(0, 4000) });
  const ld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.lead, datePublished: a.date, inLanguage: 'uk', mainEntityOfPage: BASE ? `${BASE}/${a.url}` : undefined, publisher: { '@type': 'Organization', name: SITE.name } }).replace(/</g, '\\u003c')}</script>`;
  page({ title: `${a.title} — ${SITE.name}`, desc: a.lead, file: a.url, r: '../', cur: a.rubric, type: 'article', ld,
    main: `<article class="full ${a.rubric}"><div class="crumbs"><a href="../">Стрічка</a> / <a href="../${a.rubric}/">${RUBRICS[a.rubric]}</a></div>
<h1>${esc(a.title)}</h1><div class="meta"><time datetime="${a.date}">${dFull(a.date)}</time></div>
<p class="lead">${esc(a.lead)}</p>
${bodyL}</article>${rel.length ? `<h1 style="margin-top:40px">Читайте також</h1>${rel.map(x => item(x, '../')).join('')}` : ''}` });
}

fs.writeFileSync('dist/search-index.js', 'window.SEARCH=' + JSON.stringify(searchIdx) + ';');
fs.copyFileSync('search.src.js', 'dist/search.js');
page({ title: `Пошук — ${SITE.name}`, desc: `Пошук по сайту ${SITE.name}.`, file: 'search.html',
  ld: '<meta name="robots" content="noindex,follow">',
  main: '<h1 id="sq">Пошук по сайту</h1><div id="results"></div>',
  scripts: '<script src="search-index.js"></script><script src="search.js"></script>' });
const urls = ['', 'archive.html', ...Object.keys(RUBRICS).map(k => `${k}/`), ...list.map(a => a.url)];
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => { const a = list.find(x => x.url === u); return `<url><loc>${BASE}/${u}</loc>${a ? `<lastmod>${a.date}</lastmod>` : ''}</url>`; }).join('\n')}\n</urlset>\n`);
out('robots.txt', `User-agent: *\nAllow: /\n${BASE ? `Sitemap: ${BASE}/sitemap.xml\n` : ''}`);
out('.htaccess', `RewriteEngine On
RewriteCond %{THE_REQUEST} \\s/(.*/)?index\\.html[\\s?] [NC]
RewriteRule ^(.*/)?index\\.html$ /$1 [R=301,L]
`);
console.log(`Готово: ${list.length} статей у папці dist/`);
if (!BASE || BASE.includes('your-domain')) console.warn('УВАГА: вкажіть справжню адресу сайту в SITE.url у data.js і запустіть build.js ще раз.');