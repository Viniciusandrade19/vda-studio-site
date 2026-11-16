import { useEffect, useRef, useState } from 'react';
import { openQuote } from '../lib/quote';
import { prefersReducedMotion } from '../hooks/useScrollFx';
import { Lines } from './ui/Primitives';
import carroJpg from '../assets/video/carro-parado.jpg';
import carroWebp from '../assets/video/carro-parado.webp';
import carroWebp640 from '../assets/video/carro-parado-640.webp';
import carroWebp960 from '../assets/video/carro-parado-960.webp';
import motoJpg from '../assets/video/moto-parada.jpg';
import motoWebp from '../assets/video/moto-parada.webp';
import motoWebp640 from '../assets/video/moto-parada-640.webp';
import motoWebp960 from '../assets/video/moto-parada-960.webp';
import caminhaoJpg from '../assets/video/caminhao-parado.jpg';
import caminhaoWebp from '../assets/video/caminhao-parado.webp';
import caminhaoWebp640 from '../assets/video/caminhao-parado-640.webp';
import caminhaoWebp960 from '../assets/video/caminhao-parado-960.webp';

type Item = { title: string; text: string };
type Vehicle = {
  id: 'carro' | 'moto' | 'caminhao';
  tab: string;
  cta: string;
  /** vídeo em loop; sem ele, o veículo aparece em foto (still = srcset webp) */
  video?: string;
  webm?: string;
  still?: string;
  /** foco horizontal da foto quando o recorte aperta (celular) */
  focus?: string;
  poster: string;
  alt: string;
  items: Item[];
};

/* Benefícios divulgados pela LíderPrev, por tipo de veículo. */
const VEHICLES: Vehicle[] = [
  {
    id: 'carro',
    tab: 'Carro e utilitário',
    cta: 'Cotar meu carro',
    still: `${carroWebp640} 640w, ${carroWebp960} 960w, ${carroWebp} 1280w`,
    focus: '62%',
    poster: carroJpg,
    alt: 'Carro branco com o emblema da LíderPrev na porta, numa avenida ao entardecer',
    items: [
      { title: 'Assistência 24 horas', text: 'Se o carro parar, você tem com quem falar a qualquer hora.' },
      { title: 'Indenização pela FIPE', text: 'Quando há indenização, a referência é o valor FIPE do veículo, conforme o regulamento.' },
      { title: 'Cobertura para terceiros', text: 'Proteção também para danos causados a terceiros, nos termos do regulamento.' },
    ],
  },
  {
    id: 'moto',
    tab: 'Moto',
    cta: 'Cotar minha moto',
    still: `${motoWebp640} 640w, ${motoWebp960} 960w, ${motoWebp} 1280w`,
    focus: '50%',
    poster: motoJpg,
    alt: 'Moto azul estacionada com o emblema da LíderPrev no tanque, em frente a prédios envidraçados',
    items: [
      { title: 'Assistência 24 horas', text: 'No trânsito ou na estrada, a assistência atende a qualquer hora.' },
      { title: 'Indenização pela FIPE', text: 'A referência de indenização é o valor FIPE da moto, conforme o regulamento.' },
      { title: 'Abrangência nacional', text: 'A proteção acompanha a moto para além da Paraíba.' },
    ],
  },
  {
    id: 'caminhao',
    tab: 'Caminhão',
    cta: 'Cotar meu caminhão',
    still: `${caminhaoWebp640} 640w, ${caminhaoWebp960} 960w, ${caminhaoWebp} 1280w`,
    focus: '40%',
    poster: caminhaoJpg,
    alt: 'Caminhão branco com o emblema da LíderPrev na lateral do baú, numa rodovia',
    items: [
      { title: 'Assistência 24 horas', text: 'Na estrada, de dia ou de madrugada, você tem com quem falar.' },
      { title: 'Abrangência nacional', text: 'Frete interestadual? A proteção tem abrangência nacional.' },
      { title: 'Cobertura para terceiros', text: 'Proteção também para danos a terceiros, nos termos do regulamento.' },
    ],
  },
];

/**
 * Coberturas por veículo: uma foto de cada tipo, com passagem suave ao trocar de aba.
 * (O componente ainda aceita vídeo em loop, caso o cliente queira voltar a usar.)
 */
export function Garage() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preferência do sistema, lida depois de montar (HTML pré-renderizado)
    if (prefersReducedMotion()) setPaused(true);
  }, []);
  const stageRef = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const visible = useRef(false);

  // toca só o vídeo da aba ativa, e só quando a seção está visível
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === current && visible.current && !paused) {
        v.play().catch(() => undefined);
      } else {
        v.pause();
      }
    });
  }, [current, paused]);

  useEffect(() => {
    const el = stageRef.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        const v = videos.current[current];
        if (!v) return;
        if (e.isIntersecting && !paused) v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [current, paused]);

  const choose = (i: number) => {
    if (i === current) return;
    const v = videos.current[i];
    if (v) v.currentTime = 0;
    setCurrent(i);
  };

  const onTabsKey = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (current + d + VEHICLES.length) % VEHICLES.length;
    choose(n);
    document.getElementById(`tab-${VEHICLES[n].id}`)?.focus();
  };

  const vh = VEHICLES[current];

  return (
    <section id="solucoes" className="garage cut-top" aria-labelledby="garage-title">
      <div className="wrap garage__head">
        <h2 id="garage-title" className="display display--xl">
          <Lines lines={['Uma proteção para', <>cada caminho<span className="dot">.</span></>]} />
        </h2>
        <p className="garage__intro" data-reveal>
          Escolha o seu veículo e veja o que a proteção LíderPrev inclui. Coberturas, limites e condições seguem o regulamento.
        </p>
      </div>

      <div className="garage__shell">
        <div className="garage__tabs" role="tablist" aria-label="Escolha o veículo" onKeyDown={onTabsKey}>
          {VEHICLES.map((v, i) => (
            <button
              key={v.id}
              id={`tab-${v.id}`}
              type="button"
              role="tab"
              aria-selected={current === i}
              aria-controls="garage-panel"
              tabIndex={current === i ? 0 : -1}
              className={`garage__tab ${current === i ? 'is-on' : ''}`}
              onClick={() => choose(i)}
            >
              <span className="garage__tab-name">{v.tab}</span>
            </button>
          ))}
        </div>

        <div id="garage-panel" role="tabpanel" aria-labelledby={`tab-${vh.id}`}>
          <div ref={stageRef} className="garage__stage garage__stage--video">
            {VEHICLES.map((v, i) =>
              v.still ? (
                <picture key={v.id}>
                  <source srcSet={v.still} sizes="(max-width: 1023px) 100vw, min(1100px, 76vw)" type="image/webp" />
                  <img
                    className={`garage__video ${current === i ? 'is-on' : ''}`}
                    src={v.poster}
                    alt={current === i ? v.alt : ''}
                    aria-hidden={current !== i}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    style={{ objectPosition: `${v.focus ?? '50%'} 50%` }}
                    width={1280}
                    height={720}
                  />
                </picture>
              ) : (
              <video
                key={v.id}
                ref={(el) => {
                  videos.current[i] = el;
                }}
                className={`garage__video ${current === i ? 'is-on' : ''}`}
                poster={v.poster}
                muted
                loop
                playsInline
                preload={i === 0 ? 'auto' : 'metadata'}
                aria-hidden={current !== i}
                aria-label={v.alt}
                tabIndex={-1}
              >
                <source src={v.webm} type="video/webm" />
                <source src={v.video} type="video/mp4" />
              </video>
              ),
            )}
            {!vh.still && (
            <button
              type="button"
              className="garage__play"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Reproduzir vídeo' : 'Pausar vídeo'}
            >
              {paused ? (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M3 1.5v11l9-5.5z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor" />
                </svg>
              )}
            </button>
            )}
          </div>

          <ul className="garage__legend" aria-label={`O que a proteção cobre: ${vh.tab}`}>
            {vh.items.map((h) => (
              <li key={`${vh.id}-${h.title}`}>
                <div className="legend">
                  <span className="legend__t">{h.title}</span>
                  <span className="legend__d">{h.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="garage__bar">
          <a
            href="#cotacao"
            className="btn btn--red garage__cta"
            onClick={(e) => {
              e.preventDefault();
              openQuote(vh.id);
            }}
          >
            <span className="btn__label">
              <span className="btn__text">{vh.cta}</span>
              <span className="btn__text btn__text--clone" aria-hidden="true">
                {vh.cta}
              </span>
            </span>
            <span className="btn__icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 12 12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
