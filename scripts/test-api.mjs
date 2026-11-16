// Empacota api/cotacao.ts com o Vite (sem dependência extra) e roda os testes com um webhook falso local.
import { build } from 'vite';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const outDir = mkdtempSync(join(tmpdir(), 'cotacao-'));
await build({
  configFile: false,
  logLevel: 'error',
  build: { ssr: 'api/cotacao.ts', outDir, emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'cotacao.mjs', format: 'es' } } },
});
process.env.API_BUNDLE = pathToFileURL(join(outDir, 'cotacao.mjs')).href;
const origError = console.error;
console.error = (...a) => (String(a[0]).startsWith('[cotacao]') ? undefined : origError(...a));
await import('../tests/api-cotacao.test.mjs');
