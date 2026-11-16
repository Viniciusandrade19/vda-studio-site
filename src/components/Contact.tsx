import { useState } from 'react';
import { SITE, VEHICLE_LABEL, WA_MESSAGES, waLink, type VehicleKind } from '../config/site';
import { Lines } from './ui/Primitives';
import { InstagramGlyph, PhoneGlyph } from './ui/Icons';
import { SlideToCall } from './SlideToCall';
import { sound } from '../lib/sound';
import { openQuote } from '../lib/quote';

const KINDS: VehicleKind[] = ['carro', 'moto', 'caminhao', 'utilitario'];

/** CTA final: conversa direta pelo WhatsApp, com a mensagem pronta para o veículo escolhido. */
export function Contact() {
  const [kind, setKind] = useState<VehicleKind | null>(null);
  const message = kind ? WA_MESSAGES.vehicle(kind) : WA_MESSAGES.geral;
  const v = kind ? VEHICLE_LABEL[kind] : null;

  return (
    <section id="contato" className="contact cut-top" aria-labelledby="contact-title">
      <div className="contact__beam" aria-hidden="true" />
      <div className="wrap">
        <h2 id="contact-title" className="contact__title">
          <Lines lines={['Vamos seguir', 'juntos na', <>próxima estrada<span className="dot">?</span></>]} />
        </h2>

        <div className="contact__grid">
          <div className="contact__builder" data-reveal>
            <p className="contact__alt">
              Prefere deixar seus dados para um consultor chamar você?{' '}
              <a
                href="#cotacao"
                onClick={(e) => {
                  e.preventDefault();
                  openQuote(kind ?? undefined);
                }}
              >
                Preencher a cotação
              </a>
            </p>
            <p className="contact__q" id="kind-q">
              O que você quer proteger?
            </p>
            <div className="chips" role="radiogroup" aria-labelledby="kind-q">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  className={`chip ${kind === k ? 'is-on' : ''}`}
                  onClick={() => {
                    setKind(kind === k ? null : k);
                    sound.tick();
                  }}
                  data-cursor="Escolher"
                >
                  {VEHICLE_LABEL[k].label}
                </button>
              ))}
            </div>

            <div className="contact__preview" aria-live="polite">
              <span className="contact__preview-k">Sua mensagem vai assim:</span>
              <p>“{message}”</p>
            </div>

            <SlideToCall href={waLink(message)} label={v ? `Proteger ${v.article} ${v.label}` : 'Falar com a LíderPrev'} />
          </div>

          <ul className="contact__channels" data-reveal>
            <li>
              <a href={SITE.phoneHref}>
                <PhoneGlyph size={18} />
                <span className="contact__ch-k">Telefone</span>
                <span className="contact__ch-v">{SITE.phoneDisplay}</span>
              </a>
            </li>
            <li>
              <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
                <InstagramGlyph size={18} />
                <span className="contact__ch-k">Instagram</span>
                <span className="contact__ch-v">{SITE.instagramHandle}</span>
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
            <li>
              <span className="contact__ch-static">
                <span className="contact__ch-dot" aria-hidden="true" />
                <span className="contact__ch-k">Sede</span>
                <span className="contact__ch-v">
                  {SITE.city} — {SITE.state}
                </span>
              </span>
            </li>
            <li>
              <span className="contact__ch-static">
                <span className="contact__ch-dot contact__ch-dot--live" aria-hidden="true" />
                <span className="contact__ch-k">Horário</span>
                <span className="contact__ch-v">Aberto 24 horas</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
