import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { NAV_ITEMS, WA_MESSAGES, waLink } from '../config/site';
import { Logo } from './Logo';
import { sound } from '../lib/sound';
import { openQuote } from '../lib/quote';

function SoundToggle() {
  const [on, setOn] = useState(sound.on);
  useEffect(() => sound.subscribe(setOn), []);
  return (
    <button type="button" className={`nav__sound ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => sound.toggle()} data-cursor={on ? 'Silenciar' : 'Ligar som'}>
      <span className="nav__bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="nav__sound-t">Som</span>
    </button>
  );
}
import { WhatsAppGlyph } from './ui/Icons';

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState<string>('');
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Estado da barra: sólida após o hero, some ao descer e volta ao subir
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 40);
        setHidden(y > 600 && y > last + 4);
        if (y < last - 4) setHidden(false);
        last = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Seção ativa no menu
  useEffect(() => {
    const sections = NAV_ITEMS.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Menu aberto: trava rolagem, Esc fecha, foco preso no painel
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('menu-open');
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>('a, button');
    focusables?.[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === 'Tab' && focusables && focusables.length) {
        const first = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const close = () => mq.matches && setOpen(false);
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''} ${hidden && !open ? 'nav--hidden' : ''} ${open ? 'nav--open' : ''}`}>
      <div className="nav__bar">
        <a href="#topo" className="nav__brand" aria-label="LíderPrev — voltar ao início" onClick={() => setOpen(false)}>
          <Logo />
        </a>

        <nav className="nav__links" aria-label="Principal">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className={active === item.id ? 'is-active' : ''} aria-current={active === item.id ? 'true' : undefined}>
                  <span className="nav__label" data-text={item.label}>
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <SoundToggle />

        <a
          className="nav__cta"
          href="#cotacao"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            openQuote();
          }}
        >
          Solicitar cotação
        </a>

        <button
          ref={toggleRef}
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? 'Fechar menu' : 'Abrir menu'}</span>
          <span className="nav__toggle-word" aria-hidden="true">
            {open ? 'Fechar' : 'Menu'}
          </span>
          <span className="nav__burger" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </div>

      <div id="menu-mobile" ref={panelRef} className="menu" inert={!open} aria-hidden={!open} aria-label="Menu">
        <ol className="menu__list">
          {NAV_ITEMS.map((item, i) => (
            <li key={item.id} style={{ '--i': i } as CSSProperties}>
              <a href={`#${item.id}`} onClick={() => setOpen(false)}>
                <span className="menu__label">{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
        <div className="menu__foot">
          <a className="btn btn--blue" href={waLink(WA_MESSAGES.geral)} target="_blank" rel="noopener noreferrer">
            <span className="btn__label">
              <span className="btn__text">Falar no WhatsApp</span>
            </span>
            <span className="btn__icon" aria-hidden="true">
              <WhatsAppGlyph size={16} />
            </span>
          </a>
          <p className="menu__meta">Atendimento 24 horas</p>
        </div>
      </div>
    </header>
  );
}
