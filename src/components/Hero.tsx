import { useEffect, useRef, useState } from 'react';
import { IMG } from '../assets/images';
import { Picture, Button } from './ui/Primitives';
import { prefersReducedMotion } from '../hooks/useScrollFx';

/**
 * Hero v3: asfalto claro, a faixa vermelha cortando a tela em diagonal e a SW4 em primeiro plano.
 * O ponteiro desloca levemente carro, faixa e palavra de fundo em profundidades diferentes.
 * (A lanterna da v2 saiu: ela escondia o produto nos primeiros segundos, quando a pessoa decide se fica.)
 */
export function Hero() {
  const [ready, setReady] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const img = document.querySelector<HTMLImageElement>('.hero__car img');
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      requestAnimationFrame(() => setReady(true));
    };
    if (img?.complete) go();
    else img?.addEventListener('load', go, { once: true });
    const t = window.setTimeout(go, 800);
    return () => window.clearTimeout(t);
  }, []);

  // profundidade pelo ponteiro (só mouse; sem efeito em movimento reduzido)
  useEffect(() => {
    const hero = heroRef.current!;
    if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      hero.style.setProperty('--mx', cur.x.toFixed(3));
      hero.style.setProperty('--my', cur.y.toFixed(3));
      if (Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.001) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const move = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => {
      target.x = target.y = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <section id="topo" ref={heroRef} className={`hero tone-light ${ready ? 'is-ready' : ''}`} aria-labelledby="hero-title">
      <p className="hero__ghost" aria-hidden="true">
        LíderPrev
      </p>

      <div className="hero__band" aria-hidden="true">
        <span className="hero__band-main" />
        <span className="hero__band-thin" />
        <span className="hero__band-thin hero__band-thin--2" />
      </div>

      <div className="hero__inner">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero__title">
            <span className="hero__line">
              <span className="hero__line-inner">
                Sua jornada<span className="dot">.</span>
              </span>
            </span>
            <span className="hero__line">
              <span className="hero__line-inner">
                Nossa proteção<span className="dot">.</span>
              </span>
            </span>
          </h1>
          <p className="hero__lede">
            Proteção veicular para carro, moto, caminhão e utilitário, com assistência 24 horas e abrangência nacional.
          </p>
          <div className="hero__ctas">
            <Button href="#cotacao" variant="red" data-magnetic>
              Solicitar cotação
            </Button>
            <Button href="#solucoes" variant="ghost" icon="none">
              Ver coberturas
            </Button>
          </div>
          <ul className="hero__facts" aria-label="Destaques da proteção">
            <li>
              <strong>24 h</strong>
              <span>Assistência todos os dias</span>
            </li>
            <li>
              <strong>Brasil</strong>
              <span>Abrangência nacional</span>
            </li>
            <li>
              <strong>FIPE</strong>
              <span>Referência de indenização</span>
            </li>
          </ul>
        </div>

        <div className="hero__stage">
          <span className="hero__stage-band" aria-hidden="true" />
          <span className="hero__shadow" aria-hidden="true" />
          <Picture
            img={IMG.heroCar}
            alt="Toyota SW4 preta com o adesivo oficial da LíderPrev — Líder em Proteção Veicular"
            sizes="(max-width: 767px) 120vw, 62vw"
            className="hero__car"
            priority
          />
        </div>
      </div>

      <a href="#beneficios" className="hero__next">
        <span className="hero__next-track" aria-hidden="true">
          <span />
        </span>
        Conheça a proteção
      </a>
    </section>
  );
}
