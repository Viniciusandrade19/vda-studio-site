import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { BRAZIL_STATES, BRAZIL_VIEWBOX } from '../data/brazil';
import { SITE, WA_MESSAGES } from '../config/site';
import { Lines, WhatsAppButton } from './ui/Primitives';
import { sound } from '../lib/sound';

// posição de Campina Grande dentro do retângulo da Paraíba
const CG = { x: 0.726, y: 0.53 };
type Pt = { x: number; y: number };

/**
 * 04 — Abrangência nacional. Toque num estado (ou escolha na lista) e uma rota
 * sai de Campina Grande até ele. Sem distâncias ou números inventados.
 */
export function Coverage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [centers, setCenters] = useState<Record<string, Pt>>({});
  const [home, setHome] = useState<Pt | null>(null);
  const [dest, setDest] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    const svg = svgRef.current!;
    const c: Record<string, Pt> = {};
    svg.querySelectorAll<SVGPathElement>('.map__state').forEach((p) => {
      const b = p.getBBox();
      c[p.dataset.id!] = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      if (p.dataset.id === 'pb') setHome({ x: b.x + b.width * CG.x, y: b.y + b.height * CG.y });
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- medição do SVG já desenhado (getBBox), só existe depois de montar
    setCenters(c);
  }, []);

  const byId = useMemo(() => Object.fromEntries(BRAZIL_STATES.map((s) => [s.id, s.name])), []);
  const sorted = useMemo(() => [...BRAZIL_STATES].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), []);

  const route = useMemo(() => {
    if (!dest || !home || !centers[dest] || dest === 'pb') return null;
    const a = home;
    const b = centers[dest];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    // arco curvado para o lado de fora do mapa
    const cx = mx - (dy / len) * len * 0.28;
    const cy = my + (dx / len) * len * 0.28 * -1;
    return `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
  }, [dest, home, centers]);

  const pick = (id: string) => {
    setDest(id);
    setRunKey((k) => k + 1);
    sound.tick();
  };

  const destName = dest ? byId[dest] : null;

  return (
    <section id="cobertura" className="cover" aria-labelledby="cover-title">
      <div className="wrap cover__grid">
        <div className="cover__text">
          <h2 id="cover-title" className="display display--xl">
            <Lines lines={['Daqui para', 'qualquer lugar', <>do Brasil<span className="dot">.</span></>]} />
          </h2>
          <p className="cover__lede" data-reveal>
            A sede fica em {SITE.city}, na Paraíba, e a proteção LíderPrev tem abrangência nacional. Escolha um destino no
            mapa e veja a rota sair daqui.
          </p>

          <label className="cover__select" data-reveal>
            <span>Para onde você vai?</span>
            <select id="destino" value={dest ?? ''} onChange={(e) => e.target.value && pick(e.target.value)}>
              <option value="" disabled>
                Escolha um estado
              </option>
              {sorted.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="cover__result" aria-live="polite">
            {destName ? (
              dest === 'pb' ? (
                <p>
                  <strong>Paraíba.</strong> Você está em casa, perto da sede da LíderPrev.
                </p>
              ) : (
                <p>
                  <strong>
                    {SITE.city} até {destName}.
                  </strong>{' '}
                  Dentro da abrangência nacional da proteção.
                </p>
              )
            ) : (
              <p className="cover__empty">Nenhum destino escolhido ainda.</p>
            )}
          </div>

          <div data-reveal className="cover__cta">
            <WhatsAppButton
              message={destName && dest !== 'pb' ? `Olá, LíderPrev! Vim pelo site. Vou rodar até ${destName} e quero entender a abrangência nacional da proteção.` : WA_MESSAGES.cobertura}
              variant="ghost"
            >
              Tirar dúvidas sobre a cobertura
            </WhatsAppButton>
          </div>
          <p className="fineprint" data-reveal>
            Coberturas, limites e condições seguem o regulamento da associação. Consulte um especialista.
          </p>
        </div>

        <figure className="cover__map" data-reveal>
          <svg ref={svgRef} viewBox={BRAZIL_VIEWBOX} role="img" aria-label="Mapa do Brasil. A sede da LíderPrev fica em Campina Grande, Paraíba.">
            <defs>
              <radialGradient id="pin-glow">
                <stop offset="0" stopColor="var(--red)" stopOpacity="0.55" />
                <stop offset="1" stopColor="var(--red)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g className="map__states" onPointerLeave={() => setHover(null)}>
              {BRAZIL_STATES.map((s, i) => (
                <path
                  key={s.id}
                  data-id={s.id}
                  d={s.path}
                  pathLength={1}
                  className={`map__state ${s.id === 'pb' ? 'map__state--home' : ''} ${dest === s.id ? 'is-dest' : ''}`}
                  style={{ '--s': i } as CSSProperties}
                  onPointerEnter={() => setHover(s.name)}
                  onClick={() => pick(s.id)}
                  data-cursor="Ir"
                />
              ))}
            </g>
            {route && (
              <g key={runKey} className="map__route">
                <path d={route} className="map__route-glow" />
                <path d={route} className="map__route-line" pathLength={1} />
                <circle r="5" className="map__car">
                  <animateMotion dur="1.6s" path={route} fill="freeze" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.65 0 0.35 1" />
                </circle>
                {dest && centers[dest] && <circle cx={centers[dest].x} cy={centers[dest].y} r="5" className="map__dest" />}
              </g>
            )}
            {home && (
              <g className="map__pin" transform={`translate(${home.x} ${home.y})`}>
                <circle r="34" fill="url(#pin-glow)" className="map__pulse" />
                <circle r="4.5" className="map__dot" />
              </g>
            )}
          </svg>
          <figcaption className="cover__hud">
            <span className="cover__hud-v">{hover ?? destName ?? 'Campina Grande, PB'}</span>
            <span className="cover__hud-s">{hover || destName ? 'Abrangência nacional' : 'Sede LíderPrev'}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
