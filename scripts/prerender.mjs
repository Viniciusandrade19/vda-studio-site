/* ─────────────────────────────────────────────────────────────
   Pós-build: o que a IA costuma esquecer quando o site sai da máquina.

   1. Pré-renderiza a página (HTML completo para Google, IAs e prévias de link).
   2. Gera robots.txt, sitemap.xml e llms.txt.
   3. Gera os cabeçalhos de segurança (CSP, HSTS, etc.) para Vercel (vercel.json)
      e para Netlify/Cloudflare Pages (dist/_headers), com o hash exato do único
      script inline, sem 'unsafe-inline' para scripts.

   Uso: node scripts/prerender.mjs [--dist dist] [--ssr dist-ssr] [--no-vercel]
   ───────────────────────────────────────────────────────────── */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const DIST = resolve(arg('dist', 'dist'));
const SSR = resolve(arg('ssr', 'dist-ssr'));
const WRITE_VERCEL = !process.argv.includes('--no-vercel');

const env = loadEnv('production', process.cwd(), '');
const SITE_URL = (env.VITE_SITE_URL || '').trim().replace(/\/$/, '');
const ENDPOINT = (env.VITE_QUOTE_ENDPOINT || '').trim();

const warn = (m) => console.warn(`\x1b[33m[prerender] ${m}\x1b[0m`);
const fail = (m) => {
  console.error(`\x1b[31m[prerender] ${m}\x1b[0m`);
  process.exit(1);
};

// ── Conferências de configuração ─────────────────────────────
if (SITE_URL && !/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(SITE_URL)) fail('VITE_SITE_URL precisa ser https://dominio, sem caminho.');
if (ENDPOINT && !(ENDPOINT.startsWith('/') || ENDPOINT.startsWith('https://')))
  fail('VITE_QUOTE_ENDPOINT precisa ser um caminho do site (ex.: /api/cotacao) ou https://.');
if (ENDPOINT.startsWith('https://'))
  warn('VITE_QUOTE_ENDPOINT aponta para fora do site: esse endereço fica visível no navegador. Prefira /api/cotacao (veja o README).');
if (!SITE_URL) warn('VITE_SITE_URL vazio: sem canonical, og:url, sitemap absoluto e imagem de compartilhamento absoluta.');

// ── 1. Pré-renderização ─────────────────────────────────────
const indexPath = join(DIST, 'index.html');
let html = readFileSync(indexPath, 'utf8');
const { render } = await import(pathToFileURL(join(SSR, 'entry-server.js')).href);
let appHtml = render();
// Build com base relativa (--base=./, para abrir o site numa subpasta): a renderização no servidor
// sempre gera /assets/…; ajusta para ./assets/… para bater com o JavaScript e não quebrar as imagens.
const RELATIVE = /src="\.\/assets\//.test(html);
if (RELATIVE) appHtml = appHtml.replace(/(["\s,])\/assets\//g, '$1./assets/');
if (!html.includes('<div id="root"></div>')) fail('index.html sem <div id="root"></div>.');
html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

// Script mínimo e estático: decide antes da primeira pintura se a entrada aparece.
const INLINE = `(function(){var d=document.documentElement,s=false;try{s=sessionStorage.getItem('liderprev:intro-vista')==='1'}catch(e){}if(s||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){d.classList.add('no-intro')}else{d.classList.add('intro-lock')}})();`;
const inlineHash = `sha256-${createHash('sha256').update(INLINE).digest('base64')}`;
html = html.replace('<head>', `<head>\n    <script>${INLINE}</script>`);

// Dados estruturados com URL do site, quando houver
if (SITE_URL) {
  html = html.replace('"sameAs":', `"url": "${SITE_URL}/",\n        "image": "${SITE_URL}/og.jpg",\n        "sameAs":`);
}
writeFileSync(indexPath, html);

// ── 2. robots.txt, sitemap.xml, llms.txt ─────────────────────
const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(DIST, 'robots.txt'),
  ['User-agent: *', 'Allow: /', 'Disallow: /api/', SITE_URL ? `\nSitemap: ${SITE_URL}/sitemap.xml` : ''].join('\n').trim() + '\n',
);
if (SITE_URL) {
  writeFileSync(
    join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n</urlset>\n`,
  );
} else if (existsSync(join(DIST, 'sitemap.xml'))) rmSync(join(DIST, 'sitemap.xml'));

const site = (await import(pathToFileURL(join(SSR, 'entry-server.js')).href)).SITE_INFO;
const link = (hash) => (SITE_URL ? `${SITE_URL}/#${hash}` : `/#${hash}`);
writeFileSync(
  join(DIST, 'llms.txt'),
  `# ${site.fullName}

> ${site.name} oferece proteção veicular para carro, moto, caminhão e utilitário, com sede em ${site.city} - ${site.state}, assistência 24 horas e abrangência nacional. Coberturas, limites e condições seguem o regulamento da associação. O site não calcula preço: a cotação é feita por um consultor pelo WhatsApp.

## Atendimento

- WhatsApp e telefone: ${site.phoneDisplay} (https://wa.me/${site.whatsappNumber})
- Instagram: ${site.instagramHandle} (${site.instagramUrl})
- Horário: 24 horas, todos os dias
- Cidade: ${site.city} - ${site.state}, Brasil

## Páginas

- [Benefícios](${link('beneficios')}): o que a proteção inclui
- [Coberturas por veículo](${link('solucoes')}): carro e utilitário, moto e caminhão
- [Como funciona](${link('como-funciona')}): do pedido de cotação à adesão
- [Pedir cotação](${link('cotacao')}): formulário de contato (não é contratação)
- [Dúvidas frequentes](${link('duvidas')})
`,
);

// ── 3. Cabeçalhos de segurança ──────────────────────────────
const connect = ["'self'"];
if (ENDPOINT.startsWith('https://')) connect.push(new URL(ENDPOINT).origin);
const CSP = [
  "default-src 'self'",
  `script-src 'self' '${inlineHash}'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
  `connect-src ${connect.join(' ')}`,
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');
const SECURITY = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

// Netlify / Cloudflare Pages
const headersFile = [
  '/*',
  ...Object.entries(SECURITY).map(([k, v]) => `  ${k}: ${v}`),
  '',
  '/assets/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
  '/api/*',
  '  Cache-Control: no-store',
  '',
].join('\n');
writeFileSync(join(DIST, '_headers'), headersFile);

// Vercel
if (WRITE_VERCEL) {
  const vercel = {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    cleanUrls: true,
    trailingSlash: false,
    headers: [
      { source: '/(.*)', headers: Object.entries(SECURITY).map(([key, value]) => ({ key, value })) },
      { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/api/(.*)', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ],
  };
  writeFileSync('vercel.json', JSON.stringify(vercel, null, 2) + '\n');
}

rmSync(SSR, { recursive: true, force: true });
console.log(`[prerender] ok · ${Math.round(appHtml.length / 1024)} KB de HTML · CSP com ${inlineHash.slice(0, 18)}…`);
