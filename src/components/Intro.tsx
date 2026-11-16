import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../hooks/useScrollFx';
import { SITE } from '../config/site';
import emblem from '../assets/img/logo-720.webp';
import '../styles/intro.css';

export const INTRO_KEY = 'liderprev:intro-vista';
const KEY = INTRO_KEY;
const TOTAL = 3950; // ms até sair da tela
const EXIT = 3200; // ms em que a cortina começa a subir

const seen = () => {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Entrada do site: a faixa vermelha desce, o emblema cai dentro dela, a faixa abre espaço
 * para o título e a cortina sobe revelando o site. Roda uma vez por sessão, pode ser pulada
 * (botão, Esc ou clique) e não aparece para quem pede movimento reduzido.
 */
export function Intro() {
  // Igual no servidor e no navegador ('on'); a decisão de pular acontece depois de montar.
  // Um script mínimo no <head> já esconde a entrada antes disso (classe no-intro), sem piscar.
  const [phase, setPhase] = useState<'on' | 'out' | 'off'>('on');

  useEffect(() => {
    const html = document.documentElement;
    if (html.classList.contains('no-intro') || prefersReducedMotion() || seen()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- decisão depende do navegador (sessão e preferência de movimento)
      setPhase('off');
      return;
    }
    html.classList.add('intro-lock');
    // a animação CSS começou na primeira pintura do HTML; os tempos contam a partir dela
    const elapsed = Math.max(0, Math.round(performance.now()) - 150);
    const t1 = window.setTimeout(() => setPhase('out'), Math.max(0, EXIT - elapsed));
    const t2 = window.setTimeout(() => setPhase('off'), Math.max(400, TOTAL - elapsed));
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'off') return;
    document.documentElement.classList.remove('intro-lock');
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* navegação privada: tudo bem repetir */
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'on') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const skip = () => {
    setPhase('out');
    window.setTimeout(() => setPhase('off'), 750);
  };

  if (phase === 'off') return null;

  return (
    <div className={`intro ${phase === 'out' ? 'is-out' : ''}`} role="presentation" onClick={skip}>
      <div className="intro__stage" aria-hidden="true">
        <div className="intro__band">
          <span className="intro__band-thin" />
          <img className="intro__emblem" src={emblem} alt="" width={720} height={468} decoding="async" />
        </div>
      </div>

      <div className="intro__copy" aria-hidden="true">
        <p className="intro__title">
          <span className="intro__line">
            <span>
              Sua jornada<span className="dot">.</span>
            </span>
          </span>
          <span className="intro__line">
            <span>
              Nossa proteção<span className="dot">.</span>
            </span>
          </span>
        </p>
        <p className="intro__meta">
          <span>{SITE.name}</span>
          <span>Proteção veicular</span>
          <span>
            {SITE.city} · {SITE.state}
          </span>
        </p>
      </div>

      <button
        type="button"
        className="intro__skip"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
      >
        Pular
      </button>
    </div>
  );
}
