import { SITE, WA_MESSAGES, waLink } from '../config/site';
import { Logo } from './Logo';
import { openPrivacy } from '../lib/privacy';
import { openQuote } from '../lib/quote';

const year = new Date().getFullYear();

const COLS = [
  {
    t: 'Proteção',
    links: [
      { href: '#beneficios', label: 'Benefícios' },
      { href: '#solucoes', label: 'Coberturas por veículo' },
      { href: '#assistencia', label: 'Assistência 24 horas' },
      { href: '#cobertura', label: 'Abrangência nacional' },
    ],
  },
  {
    t: 'Atendimento',
    links: [
      { href: '#como-funciona', label: 'Como funciona' },
      { href: '#cotacao', label: 'Solicitar cotação', quote: true },
      { href: '#duvidas', label: 'Perguntas frequentes' },
    ],
  },
];

/** Rodapé institucional: navegação, atendimento, aviso legal e privacidade. */
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__top">
        <div className="footer__about">
          <a href="#topo" className="footer__brand" aria-label="LíderPrev — voltar ao início">
            <Logo />
          </a>
          <p>Proteção veicular para carros, motos, caminhões e utilitários, com assistência 24 horas e abrangência nacional.</p>
          <a className="btn btn--red footer__cta" href={waLink(WA_MESSAGES.geral)} target="_blank" rel="noopener noreferrer">
            <span className="btn__label">
              <span className="btn__text">Falar no WhatsApp</span>
            </span>
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>

        {COLS.map((c) => (
          <nav key={c.t} className="footer__col" aria-label={c.t}>
            <h2>{c.t}</h2>
            <ul>
              {c.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={
                      'quote' in l
                        ? (e) => {
                            e.preventDefault();
                            openQuote();
                          }
                        : undefined
                    }
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="footer__col">
          <h2>Contato</h2>
          <ul>
            <li>
              <a href={SITE.phoneHref}>{SITE.phoneDisplay}</a>
            </li>
            <li>
              <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
                Instagram {SITE.instagramHandle}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
            <li>
              {SITE.city} — {SITE.state}
            </li>
            <li>Aberto 24 horas, todos os dias</li>
            <li>
              <button type="button" className="footer__link" onClick={openPrivacy}>
                Política de privacidade
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="wrap footer__legal">
        <p>
          Proteção veicular não é seguro. Ela é oferecida por associação, com regras definidas em regulamento próprio.
          Coberturas, limites e condições dependem do regulamento vigente e da adesão. Leia o regulamento antes de
          contratar.
        </p>
      </div>

      <p className="footer__word" aria-hidden="true">
        LíderPrev
      </p>

      <div className="wrap footer__base">
        <span>
          © {year} {SITE.fullName} · {SITE.city} — {SITE.state}
        </span>
        <a className="footer__studio" href={SITE.studio.url} target="_blank" rel="noopener noreferrer">
          Experiência digital desenvolvida por <strong>{SITE.studio.name}</strong>
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      </div>
    </footer>
  );
}
