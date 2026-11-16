/* Imagens otimizadas geradas por `npm run images` (scripts/optimize-images.mjs). */
import heroCar960a from './img/hero-car-960.avif';
import heroCar960w from './img/hero-car-960.webp';
import heroCar1536a from './img/hero-car-1536.avif';
import heroCar1536w from './img/hero-car-1536.webp';
import studio640a from './img/studio-640.avif';
import studio640w from './img/studio-640.webp';
import studio930a from './img/studio-930.avif';
import studio930w from './img/studio-930.webp';
import logo160a from './img/logo-160.avif';
import logo160w from './img/logo-160.webp';
import logo320a from './img/logo-320.avif';
import logo320w from './img/logo-320.webp';

export type ImageSet = {
  avif: string;
  webp: string;
  fallback: string;
  width: number;
  height: number;
};

const set = (pairs: [string, string, number][], ratio: number): ImageSet => ({
  avif: pairs.map(([a, , w]) => `${a} ${w}w`).join(', '),
  webp: pairs.map(([, b, w]) => `${b} ${w}w`).join(', '),
  fallback: pairs[pairs.length - 1][1],
  width: pairs[pairs.length - 1][2],
  height: Math.round(pairs[pairs.length - 1][2] / ratio),
});

export const IMG = {
  heroCar: set([[heroCar960a, heroCar960w, 960], [heroCar1536a, heroCar1536w, 1536]], 1536 / 1024),
  studio: set([[studio640a, studio640w, 640], [studio930a, studio930w, 930]], 930 / 475),
  logo: set([[logo160a, logo160w, 160], [logo320a, logo320w, 320]], 1291 / 878),
};
