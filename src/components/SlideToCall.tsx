import { useRef, useState, type PointerEvent, type MouseEvent } from 'react';
import { WhatsAppGlyph } from './ui/Icons';
import { sound } from '../lib/sound';

/**
 * "Deslize para chamar": arraste a alça até o fim para abrir o WhatsApp.
 * Continua sendo um link de verdade — clique, Enter e leitores de tela funcionam normalmente.
 */
export function SlideToCall({ href, label }: { href: string; label: string }) {
  const trackRef = useRef<HTMLAnchorElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const st = useRef({ on: false, x0: 0, max: 0, moved: false, p: 0 });
  const [done, setDone] = useState(false);

  const set = (p: number) => {
    st.current.p = p;
    trackRef.current!.style.setProperty('--p', p.toFixed(3));
  };

  const onDown = (e: PointerEvent<HTMLAnchorElement>) => {
    if (!(e.target as HTMLElement).closest('.slide__knob')) return;
    e.preventDefault();
    const track = trackRef.current!.getBoundingClientRect();
    const knob = knobRef.current!.getBoundingClientRect();
    st.current = { on: true, x0: e.clientX, max: track.width - knob.width - 12, moved: false, p: 0 };
    trackRef.current!.setPointerCapture(e.pointerId);
    trackRef.current!.classList.add('is-dragging');
  };
  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const s = st.current;
    if (!s.on) return;
    const dx = e.clientX - s.x0;
    if (Math.abs(dx) > 4) s.moved = true;
    set(Math.min(1, Math.max(0, dx / s.max)));
  };
  const onUp = () => {
    const s = st.current;
    if (!s.on) return;
    s.on = false;
    trackRef.current!.classList.remove('is-dragging');
    if (s.p > 0.86) {
      set(1);
      setDone(true);
      sound.rev(0.3);
      window.open(href, '_blank', 'noopener');
      window.setTimeout(() => {
        set(0);
        setDone(false);
      }, 1600);
    } else set(0);
  };
  // um arrasto que não chegou ao fim não deve virar clique
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (st.current.moved) {
      e.preventDefault();
      st.current.moved = false;
    }
  };

  return (
    <a
      ref={trackRef}
      className={`slide ${done ? 'is-done' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClick={onClick}
      onDragStart={(e) => e.preventDefault()}
      draggable={false}
      data-cursor="Deslize"
    >
      <span className="slide__fill" aria-hidden="true" />
      <span ref={knobRef} className="slide__knob" aria-hidden="true">
        <WhatsAppGlyph size={24} />
      </span>
      <span className="slide__label">
        <span className="slide__hint" aria-hidden="true">
          Deslize para chamar
        </span>
        <span className="slide__v">{done ? 'Abrindo o WhatsApp…' : label}</span>
      </span>
      <span className="sr-only"> no WhatsApp (abre em nova aba)</span>
    </a>
  );
}
