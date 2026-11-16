import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Injeta og:image, og:url e canonical a partir de VITE_SITE_URL (ou caminhos relativos se vazio). */
function seoUrls(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/$/, '');
  return {
    name: 'liderprev-seo-urls',
    transformIndexHtml: {
      order: 'post',
      handler: () => {
        const tags = [
          { tag: 'meta', attrs: { property: 'og:image', content: `${base}/og.jpg` }, injectTo: 'head' as const },
          { tag: 'meta', attrs: { name: 'twitter:image', content: `${base}/og.jpg` }, injectTo: 'head' as const },
        ];
        if (base) {
          tags.push(
            { tag: 'meta', attrs: { property: 'og:url', content: `${base}/` }, injectTo: 'head' as const },
            { tag: 'link', attrs: { rel: 'canonical', href: `${base}/` } as never, injectTo: 'head' as const },
          );
        }
        return tags;
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), seoUrls(env.VITE_SITE_URL ?? '')],
    // a pré-renderização (scripts/prerender.mjs) embute as dependências: roda de qualquer pasta
    ssr: { noExternal: true },
    build: {
      target: 'es2020',
      cssCodeSplit: false,
      assetsInlineLimit: 0,
    },
  };
});
