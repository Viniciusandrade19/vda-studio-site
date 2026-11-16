/**
 * Gera as versões otimizadas (AVIF + WebP, várias larguras) das imagens do site.
 * Fonte: /assets-src  →  Saída: /src/assets/img  e  /public (favicons + OG)
 * Uso: npm run images
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets-src';
const OUT = 'src/assets/img';
await mkdir(OUT, { recursive: true });

/** [arquivo de origem, nome de saída, larguras, ajuste opcional] */
const jobs = [
  // Fundo do hero escurecido (o carro recortado fica por cima, em brilho total)
  ['sw4-hero.png', 'hero-bg', [960, 1536], (s) => s.modulate({ brightness: 0.62, saturation: 0.75 }).tint({ r: 205, g: 214, b: 235 })],
  ['sw4-hero-cutout.png', 'hero-car', [960, 1536]],
  ['sw4-studio.png', 'studio', [640, 930]],
  ['headlight.png', 'headlight', [480, 732]],
  ['logo-liderprev.png', 'logo', [160, 320]],
];

for (const [file, name, widths, tune] of jobs) {
  for (const w of widths) {
    let base = sharp(path.join(SRC, file)).resize({ width: w, withoutEnlargement: true });
    if (tune) base = tune(base);
    await base.clone().avif({ quality: 58, effort: 6 }).toFile(`${OUT}/${name}-${w}.avif`);
    await base.clone().webp({ quality: 80, effort: 6 }).toFile(`${OUT}/${name}-${w}.webp`);
  }
}

// Favicons a partir do escudo
const shield = sharp(path.join(SRC, 'logo-liderprev.png'));
const square = async (size) =>
  shield
    .clone()
    .resize(size, size, { fit: 'contain', background: { r: 7, g: 8, b: 10, alpha: 1 } })
    .png();
await (await square(32)).toFile('public/favicon-32.png');
await (await square(180)).toFile('public/apple-touch-icon.png');
await (await square(512)).toFile('public/icon-512.png');

console.log('Imagens geradas.');
