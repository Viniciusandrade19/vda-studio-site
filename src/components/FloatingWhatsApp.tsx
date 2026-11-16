import { useEffect, useState } from 'react';
import { WA_MESSAGES, waLink } from '../config/site';
import { WhatsAppGlyph } from './ui/Icons';

/** Atalho discreto: aparece depois do hero e some quando a seção de contato está na tela. */
export function FloatingWhatsApp() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('topo');
    const contact = document.getElementById('contato');
    const quote = document.getElementById('cotacao');
    const footer = document.querySelector('footer');
    let pastHero = false;
    let nearEnd = false;
    let inQuote = false;
    const sync = () => setShow(pastHero && !nearEnd && !inQuote);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === hero) pastHero = !e.isIntersecting;
        else if (e.target === quote) inQuote = e.isIntersecting;
        else nearEnd = e.isIntersecting || (contact ? contact.getBoundingClientRect().top < window.innerHeight : false);
      });
      sync();
    }, { threshold: 0 });
    [hero, contact, footer, quote].forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <a
      className={`fab ${show ? 'is-on' : ''}`}
      href={waLink(WA_MESSAGES.geral)}
      target="_blank"
      rel="noopener noreferrer"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
    >
      <WhatsAppGlyph size={22} />
      <span className="fab__label">Fale conosco</span>
      <span className="sr-only"> pelo WhatsApp (abre em nova aba)</span>
    </a>
  );
}
