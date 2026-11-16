import { useEffect, useRef, useState } from 'react';

const STOPS = [
  { id: 'topo', label: 'Início' },
  { id: 'beneficios', label: 'Benefícios' },
  { id: 'solucoes', label: 'Coberturas' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'assistencia', label: 'Assistência 24h' },
  { id: 'cobertura', label: 'Abrangência' },
  { id: 'cotacao', label: 'Cotação' },
  { id: 'duvidas', label: 'Dúvidas' },
  { id: 'contato', label: 'Contato' },
];

/** Estrada lateral (desktop): um carrinho percorre a página e cada parada é um atalho. */
export function RoadProgress() {
  const carRef = useRef<HTMLSpanElement>(null);
  const [marks, setMarks] = useState<number[]>([]);
  const [active, setActive] = useState('topo');

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setMarks(STOPS.map((s) => {
        const el = document.getElementById(s.id);
        return el ? Math.min(1, (el.getBoundingClientRect().top + window.scrollY) / Math.max(1, max)) : 0;
      }));
    };
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = Math.min(1, window.scrollY / Math.max(1, max));
      carRef.current?.style.setProperty('--p', p.toFixed(4));
      let cur = 'topo';
      STOPS.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.45) cur = s.id;
      });
      setActive(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    update();
    const t = window.setTimeout(measure, 1200);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <nav className="road" aria-label="Atalhos da página">
      <span className="road__line" aria-hidden="true" />
      <span ref={carRef} className="road__car" aria-hidden="true" />
      <ol>
        {STOPS.map((s, i) => (
          <li key={s.id} style={{ top: `${(marks[i] ?? 0) * 100}%` }}>
            <a href={`#${s.id}`} className={active === s.id ? 'is-active' : ''} aria-current={active === s.id ? 'true' : undefined} data-cursor="Ir">
              <span className="road__label">{s.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
