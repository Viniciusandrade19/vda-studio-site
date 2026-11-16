import { useMemo, useState } from 'react';
import { Lines } from './ui/Primitives';
import { openQuote } from '../lib/quote';
import { WA_MESSAGES, waLink } from '../config/site';

/* Respostas gerais e verificáveis. Detalhes de cobertura sempre remetem ao regulamento. */
const QA = [
  {
    q: 'O que é proteção veicular?',
    a: 'É um modelo em que os associados de uma associação dividem entre si os custos de reparos e indenizações dos veículos protegidos. As regras ficam no regulamento, que você recebe antes de aderir.',
  },
  {
    q: 'Proteção veicular é a mesma coisa que seguro?',
    a: 'Não. O seguro é contratado com uma seguradora. A proteção veicular é oferecida por uma associação, com regras próprias definidas em regulamento. Leia o regulamento com atenção antes de decidir.',
  },
  {
    q: 'Quais veículos a LíderPrev protege?',
    a: 'Carros, motos, caminhões e utilitários. No formulário de cotação você escolhe o tipo e informa marca, modelo e ano.',
  },
  {
    q: 'A assistência funciona a qualquer hora?',
    a: 'Sim. A assistência atende 24 horas por dia, todos os dias, inclusive fins de semana e feriados. Os serviços incluídos estão descritos no regulamento.',
  },
  {
    q: 'A proteção vale fora do meu estado?',
    a: 'Sim. A proteção tem abrangência nacional, nos termos do regulamento.',
  },
  {
    q: 'Como é definida a indenização?',
    a: 'Quando há indenização, a referência é o valor do veículo na tabela FIPE, conforme as regras do regulamento.',
  },
  {
    q: 'Pedir uma cotação me obriga a contratar?',
    a: 'Não. A solicitação só serve para um consultor entrar em contato com as condições para o seu veículo. A decisão é sua, depois de ler o regulamento.',
  },
  {
    q: 'Como recebo a cotação?',
    a: 'Pelo WhatsApp que você informar no formulário. Por isso pedimos o número com DDD.',
  },
];

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = norm(query.trim());
    return QA.map((item, i) => ({ ...item, i })).filter((item) => !q || norm(item.q + ' ' + item.a).includes(q));
  }, [query]);

  return (
    <section id="duvidas" className="faq tone-light cut-top cut-top--from-dark" aria-labelledby="faq-title">
      <div className="wrap faq__grid">
        <div className="faq__aside">
          <h2 id="faq-title" className="display display--xl">
            <Lines lines={['Perguntas', <>frequentes<span className="dot">.</span></>]} />
          </h2>
          <label className="faq__search" data-reveal>
            <span>Procurar uma dúvida</span>
            <input id="faq-busca" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: assistência, FIPE, moto" />
          </label>
          <p className="faq__more" data-reveal>
            Não encontrou a sua?{' '}
            <a href={waLink(WA_MESSAGES.especialista)} target="_blank" rel="noopener noreferrer">
              Pergunte a um consultor
            </a>{' '}
            ou{' '}
            <a
              href="#cotacao"
              onClick={(e) => {
                e.preventDefault();
                openQuote();
              }}
            >
              peça sua cotação
            </a>
            .
          </p>
        </div>

        <div className="faq__list">
          {list.length === 0 && (
            <p className="faq__empty" role="status">
              Nenhuma pergunta com “{query}”. Tente outra palavra ou pergunte direto a um consultor.
            </p>
          )}
          {list.map(({ q, a, i }) => {
            const isOpen = open === i;
            return (
              <div key={q} className={`faq__item ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button type="button" id={`faq-q-${i}`} aria-expanded={isOpen} aria-controls={`faq-a-${i}`} onClick={() => setOpen(isOpen ? null : i)} data-cursor={isOpen ? 'Fechar' : 'Abrir'}>
                    <span>{q}</span>
                    <span className="faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="faq__a" inert={!isOpen}>
                  <div>
                    <p>{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
