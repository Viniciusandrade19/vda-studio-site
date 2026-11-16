import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Lines } from './ui/Primitives';
import { openQuote } from '../lib/quote';
import { prefersReducedMotion } from '../hooks/useScrollFx';

const STEPS = [
  {
    t: 'Peça sua cotação',
    d: 'Preencha nome, WhatsApp e os dados do veículo no formulário. Leva menos de um minuto e não obriga você a nada.',
  },
  {
    t: 'Fale com um consultor',
    d: 'Um consultor da LíderPrev responde pelo WhatsApp que você informou, com as condições para o seu veículo.',
  },
  {
    t: 'Leia o regulamento e decida',
    d: 'Você recebe o regulamento para ler com calma, tira as dúvidas e só faz a adesão se fizer sentido para você.',
  },
];

/**
 * Como funciona: três paradas numa estrada. O carro avança conforme a rolagem
 * e cada parada acende quando ele passa; clicar numa parada também a destaca.
 */
export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(prefersReducedMotion() ? 1 : 0);
  const [focus, setFocus] = useState<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current!;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.25)));
      setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const reached = (i: number) => progress >= i / (STEPS.length - 1) - 0.02;

  return (
    <section id="como-funciona" className="how tone-light cut-top cut-top--from-dark" aria-labelledby="how-title">
      <div className="wrap how__head">
        <h2 id="how-title" className="display display--xl">
          <Lines lines={['Da cotação à', <>estrada em 3 passos<span className="dot">.</span></>]} />
        </h2>
        <p className="how__intro" data-reveal>
          Sem cotação automática e sem letra miúda escondida: uma pessoa de verdade conversa com você antes de qualquer
          decisão.
        </p>
      </div>

      <div ref={ref} className="wrap how__road" style={{ '--p': progress } as CSSProperties}>
        <div className="how__track" aria-hidden="true">
          <span className="how__lane" />
          <span className="how__fill" />
          <span className="how__car">
            <svg viewBox="0 0 48 24" width="48" height="24">
              <path d="M4 17h40v-3l-6-2-6-6H16l-6 6-6 1z" fill="currentColor" />
              <circle cx="14" cy="18" r="4" fill="#0d0f12" stroke="#fff" strokeWidth="1.5" />
              <circle cx="35" cy="18" r="4" fill="#0d0f12" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </span>
        </div>

        <ol className="how__steps">
          {STEPS.map((s, i) => (
            <li
              key={s.t}
              className={`how__step ${reached(i) ? 'is-on' : ''} ${focus === i ? 'is-focus' : ''}`}
              onMouseEnter={() => setFocus(i)}
              onMouseLeave={() => setFocus(null)}
            >
              <span className="how__n" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="how__t">{s.t}</h3>
              <p className="how__d">{s.d}</p>
              {i === 0 && (
                <a
                  href="#cotacao"
                  className="how__link"
                  onClick={(e) => {
                    e.preventDefault();
                    openQuote();
                  }}
                >
                  Ir para o formulário
                </a>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
