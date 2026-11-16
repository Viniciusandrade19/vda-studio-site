import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { SITE, WA_MESSAGES } from '../config/site';
import { Lines, WhatsAppButton } from './ui/Primitives';
import { sound } from '../lib/sound';

const TZ = 'America/Fortaleza'; // fuso de Campina Grande (UTC−3)

function nowInCampina() {
  const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

const fmt = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Situações do dia a dia, sem prometer serviços específicos — só que há atendimento. */
function moment(min: number) {
  const h = min / 60;
  if (h < 5) return { when: 'Madrugada', line: 'Voltando de viagem enquanto a cidade dorme.' };
  if (h < 8) return { when: 'Início do dia', line: 'Saindo cedo para o trabalho, antes do trânsito.' };
  if (h < 12) return { when: 'Manhã', line: 'No meio das entregas, com a agenda cheia.' };
  if (h < 14) return { when: 'Meio-dia', line: 'Na pausa do almoço, longe de casa.' };
  if (h < 18) return { when: 'Tarde', line: 'Na estrada, entre uma cidade e outra.' };
  if (h < 22) return { when: 'Noite', line: 'Voltando para casa depois de um dia longo.' };
  return { when: 'Fim da noite', line: 'Na última viagem do dia.' };
}

/**
 * 03 — Assistência 24 horas. O ponteiro começa no horário real de Campina Grande;
 * arraste (ou use as setas) para qualquer hora — a resposta é sempre a mesma.
 */
export function Assistance() {
  // HTML pré-renderizado sai com uma hora fixa; o navegador troca pela hora real ao montar
  const [real, setReal] = useState(12 * 60);
  const [value, setValue] = useState<number | null>(null); // null = acompanhando o horário real
  const dialRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const lastTick = useRef(-1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- relógio real (sistema externo), lido ao montar
    setReal(nowInCampina());
    const id = window.setInterval(() => setReal(nowInCampina()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const min = value ?? real;
  const angle = (min / 1440) * 360;
  const m = moment(min);

  const setFromPointer = (clientX: number, clientY: number) => {
    const r = dialRef.current!.getBoundingClientRect();
    const a = Math.atan2(clientX - (r.left + r.width / 2), -(clientY - (r.top + r.height / 2)));
    const deg = (a * 180) / Math.PI;
    const v = Math.round((((deg + 360) % 360) / 360) * 1440 / 15) * 15 % 1440;
    if (v !== lastTick.current) {
      lastTick.current = v;
      sound.tick();
    }
    setValue(v);
  };

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX, e.clientY);
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current) setFromPointer(e.clientX, e.clientY);
  };
  const onUp = () => {
    dragging.current = false;
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 15, ArrowUp: 15, ArrowLeft: -15, ArrowDown: -15, PageUp: 60, PageDown: -60 }[e.key];
    if (e.key === 'Home') {
      e.preventDefault();
      setValue(null);
      return;
    }
    if (!step) return;
    e.preventDefault();
    setValue(((min + step) % 1440 + 1440) % 1440);
    sound.tick();
  };

  const ticks = Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2 - Math.PI / 2;
    const major = i % 4 === 0;
    const r1 = major ? 166 : 174;
    return <line key={i} x1={200 + Math.cos(a) * r1} y1={200 + Math.sin(a) * r1} x2={200 + Math.cos(a) * 182} y2={200 + Math.sin(a) * 182} className={major ? 'dial__tick dial__tick--major' : 'dial__tick'} />;
  });
  const labels = [0, 3, 6, 9, 12, 15, 18, 21].map((hh) => {
    const a = (hh / 24) * Math.PI * 2 - Math.PI / 2;
    return (
      <text key={hh} x={200 + Math.cos(a) * 144} y={200 + Math.sin(a) * 144 + 4} textAnchor="middle" className="dial__label">
        {hh}h
      </text>
    );
  });
  // arco do horário escolhido até agora
  const sweepLen = angle / 360;

  return (
    <section id="assistencia" className="assist cut-top" aria-labelledby="assist-title">
      <div className="assist__giant" data-progress aria-hidden="true">
        <span className="assist__num">24</span>
        <span className="assist__num assist__num--fill">24</span>
      </div>

      <div className="wrap assist__grid">
        <div className="assist__text">
          <h2 id="assist-title" className="display display--xl">
            <Lines lines={['Imprevisto não', <>marca horário<span className="dot">.</span></>]} />
          </h2>
          <p className="assist__lede" data-reveal>
            A assistência LíderPrev funciona 24 horas por dia. Gire o ponteiro e escolha qualquer hora: a resposta é a mesma.
          </p>
          <div className="assist__story" aria-live="polite">
            <p className="assist__when">
              {m.when}, {fmt(min)}
            </p>
            <p className="assist__line">{m.line}</p>
            <p className="assist__answer">A assistência atende.</p>
          </div>
          <div data-reveal className="assist__cta">
            <WhatsAppButton message={WA_MESSAGES.assistencia} variant="blue">
              Falar com a assistência
            </WhatsAppButton>
          </div>
        </div>

        <div
          className="assist__dial"
          data-reveal
          role="slider"
          tabIndex={0}
          aria-label="Horário do dia"
          aria-valuemin={0}
          aria-valuemax={1439}
          aria-valuenow={min}
          aria-valuetext={`${fmt(min)} — a assistência atende`}
          onKeyDown={onKey}
          data-cursor="Girar"
        >
          <svg
            ref={dialRef}
            className="dial"
            viewBox="0 0 400 400"
            aria-hidden="true"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <circle cx="200" cy="200" r="190" className="dial__ring" />
            <circle cx="200" cy="200" r="118" className="dial__inner" />
            {ticks}
            {labels}
            <circle
              cx="200"
              cy="200"
              r="182"
              className="dial__arc"
              pathLength={1}
              style={{ strokeDasharray: `${sweepLen} 1` }}
            />
            <g className="dial__hand" style={{ transform: `rotate(${angle}deg)` }}>
              <line x1="200" y1="70" x2="200" y2="30" />
              <circle cx="200" cy="30" r="9" className="dial__grip" />
            </g>
          </svg>
          <div className="assist__clock">
            <span className="assist__clock-v">{fmt(min)}</span>
            <span className="assist__clock-s">
              <i aria-hidden="true" /> Atendimento disponível
            </span>
            {value !== null ? (
              <button type="button" className="assist__now" onClick={() => setValue(null)}>
                Voltar para agora em {SITE.city}
              </button>
            ) : (
              <span className="assist__clock-k">Agora em {SITE.city}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
