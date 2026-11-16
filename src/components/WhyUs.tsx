import { useRef, type PointerEvent, type CSSProperties } from 'react';
import { Lines } from './ui/Primitives';

/** Somente benefícios divulgados publicamente pela LíderPrev. */
const PLATES = [
  { plate: '24 HORAS', t: 'Assistência 24 horas', d: 'Atendimento a qualquer hora, todos os dias, inclusive de madrugada e no fim de semana.' },
  { plate: 'BRASIL', t: 'Abrangência nacional', d: 'A proteção acompanha você para além da Paraíba, nas estradas de todo o país.' },
  { plate: 'FIPE', t: 'Indenização pela tabela FIPE', d: 'Quando há indenização, a referência é o valor FIPE do veículo, conforme o regulamento.' },
  { plate: 'TERCEIROS', t: 'Cobertura para terceiros', d: 'Proteção também para danos causados a terceiros, nos termos do regulamento.' },
  { plate: '10 ANOS', t: '10 anos de mercado', d: 'Uma década de experiência em proteção veicular, com sede em Campina Grande.' },
  { plate: 'TODOS', t: 'Carros, motos e caminhões', d: 'Proteção para diferentes veículos e perfis de motorista, inclusive utilitários.' },
];

/** Placa no padrão Mercosul, que inclina seguindo o ponteiro. */
function Plate({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = ref.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current!.style.setProperty('--rx', `${(-y * 16).toFixed(1)}deg`);
    ref.current!.style.setProperty('--ry', `${(x * 22).toFixed(1)}deg`);
    ref.current!.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(0)}%`);
  };
  const reset = () => {
    ref.current!.style.setProperty('--rx', '0deg');
    ref.current!.style.setProperty('--ry', '0deg');
  };
  return (
    <div ref={ref} className="plate" onPointerMove={onMove} onPointerLeave={reset} aria-hidden="true">
      <div className="plate__band">
        <span>LÍDERPREV</span>
        <span className="plate__br">BR</span>
      </div>
      <div className="plate__text" style={{ '--len': text.length } as CSSProperties}>
        {text}
      </div>
      <span className="plate__shine" />
    </div>
  );
}

/** 05 — Por que LíderPrev: trilho de placas que se arrasta para os lados. */
export function WhyUs() {
  const railRef = useRef<HTMLOListElement>(null);
  const drag = useRef({ on: false, x: 0, left: 0, moved: false });

  const onDown = (e: PointerEvent<HTMLOListElement>) => {
    if (e.pointerType !== 'mouse') return; // toque usa a rolagem nativa
    const r = railRef.current!;
    drag.current = { on: true, x: e.clientX, left: r.scrollLeft, moved: false };
    r.setPointerCapture(e.pointerId);
    r.classList.add('is-dragging');
  };
  const onMove = (e: PointerEvent<HTMLOListElement>) => {
    const d = drag.current;
    if (!d.on) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 3) d.moved = true;
    railRef.current!.scrollLeft = d.left - dx;
  };
  const onUp = () => {
    drag.current.on = false;
    railRef.current?.classList.remove('is-dragging');
  };
  const nudge = (dir: number) => {
    const r = railRef.current!;
    r.scrollBy({ left: dir * Math.min(r.clientWidth * 0.8, 440), behavior: 'smooth' });
  };

  return (
    <section id="beneficios" className="why tone-light cut-top" aria-labelledby="why-title">
      <div className="wrap why__head">
        <h2 id="why-title" className="display display--xl">
          <Lines lines={['O que vem com', <>a sua proteção<span className="dot">.</span></>]} />
        </h2>
        <div className="why__nav">
          <button type="button" className="why__arrow" onClick={() => nudge(-1)} aria-label="Placas anteriores" data-cursor="Voltar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12 4 6 10l6 6" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <button type="button" className="why__arrow" onClick={() => nudge(1)} aria-label="Próximas placas" data-cursor="Avançar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m8 4 6 6-6 6" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      </div>

      <ol
        ref={railRef}
        className="why__rail"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        data-cursor="Arraste"
        tabIndex={0}
        aria-label="Benefícios divulgados pela LíderPrev"
      >
        {PLATES.map((p) => (
          <li key={p.t} className="why__item">
            <Plate text={p.plate} />
            <h3 className="why__t">{p.t}</h3>
            <p className="why__d">{p.d}</p>
          </li>
        ))}
      </ol>

      <p className="wrap fineprint why__fine" data-reveal>
        Coberturas, limites e condições estão descritos no regulamento da LíderPrev. Converse com um especialista antes de
        contratar.
      </p>
    </section>
  );
}
