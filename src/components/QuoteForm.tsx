import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { IMG } from '../assets/images';
import { SITE, VEHICLE_LABEL, waLink, type VehicleKind } from '../config/site';
import { QUOTE_EVENT } from '../lib/quote';
import { Lines, Picture } from './ui/Primitives';
import { openPrivacy } from '../lib/privacy';
import { sound } from '../lib/sound';
import { MAX, cleanText, validateQuote, type QuoteErrors } from '../lib/quote-validation';

/* ─────────────────────────────────────────────────────────────
   Solicitação de cotação.
   Não calcula preço e não finge contratar nada: monta um pedido de contato.
   Envio:
   • com VITE_QUOTE_ENDPOINT definido → POST JSON real para esse endereço (CRM, planilha, e-mail);
   • sem ele → abre o WhatsApp com a mensagem pronta, e a pessoa conclui tocando em Enviar.
   ───────────────────────────────────────────────────────────── */
const ENDPOINT = (import.meta.env.VITE_QUOTE_ENDPOINT as string | undefined)?.trim() || '';
const DRAFT_KEY = 'liderprev:cotacao';
/** O rascunho vive só nesta aba (sessionStorage) e expira em 24 h. */
const DRAFT_TTL = 24 * 60 * 60 * 1000;
/** Endereço do envio: só https ou caminho do próprio site (ex.: /api/cotacao). */
const ENDPOINT_OK = !ENDPOINT || ENDPOINT.startsWith('/') || ENDPOINT.startsWith('https://');
const KINDS: VehicleKind[] = ['carro', 'moto', 'caminhao', 'utilitario'];
const THIS_YEAR = new Date().getFullYear();

type Fields = {
  nome: string;
  whatsapp: string;
  tipo: VehicleKind | '';
  modelo: string;
  ano: string;
  cidade: string;
  aceite: boolean;
  empresa: string; // armadilha anti-robô, invisível para pessoas
};
type Errors = QuoteErrors & { empresa?: string };
type Status = 'idle' | 'sending' | 'sent' | 'whatsapp' | 'failed';

const EMPTY: Fields = { nome: '', whatsapp: '', tipo: '', modelo: '', ano: '', cidade: '', aceite: false, empresa: '' };

const digits = (v: string) => v.replace(/\D/g, '');
function maskPhone(v: string) {
  const d = digits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const validate = (f: Fields): Errors => validateQuote(f);

/** Lê o rascunho salvo aceitando só os campos conhecidos, como texto e dentro do limite. */
function readDraft(): Partial<Fields> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Record<string, unknown>;
    if (typeof d.at !== 'number' || Date.now() - d.at > DRAFT_TTL) {
      sessionStorage.removeItem(DRAFT_KEY);
      return null;
    }
    const tipo = KINDS.includes(d.tipo as VehicleKind) ? (d.tipo as VehicleKind) : '';
    return {
      nome: cleanText(d.nome, MAX.nome),
      whatsapp: maskPhone(cleanText(d.whatsapp, MAX.whatsapp)),
      tipo,
      modelo: cleanText(d.modelo, MAX.modelo),
      ano: digits(cleanText(d.ano, MAX.ano)),
      cidade: cleanText(d.cidade, MAX.cidade),
    };
  } catch {
    return null;
  }
}
const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(DRAFT_KEY); // versão antiga guardava no localStorage
  } catch {
    /* ignora */
  }
};

function buildMessage(f: Fields) {
  const lines = [
    `Olá, ${SITE.name}! Quero uma cotação de proteção veicular.`,
    '',
    `Nome: ${f.nome.trim()}`,
    `WhatsApp: ${maskPhone(f.whatsapp)}`,
    `Veículo: ${f.tipo ? VEHICLE_LABEL[f.tipo].label : ''}`,
    `Modelo: ${f.modelo.trim()}`,
    `Ano: ${f.ano}`,
  ];
  if (f.cidade.trim()) lines.push(`Cidade: ${f.cidade.trim()}`);
  return lines.join('\n');
}

const ORDER: (keyof Fields)[] = ['nome', 'whatsapp', 'tipo', 'modelo', 'ano', 'aceite'];

export function QuoteForm() {
  const uid = useId();
  // começa vazio (igual ao HTML pré-renderizado) e recupera o rascunho depois de montar
  const [f, setF] = useState<Fields>(EMPTY);
  const draftReady = useRef(false);
  const startedAt = useRef(0);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [failMsg, setFailMsg] = useState('');
  const [sentWith, setSentWith] = useState<Fields | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // pré-seleção vinda de outros botões do site ("Cotar meu carro")
  useEffect(() => {
    const on = (e: Event) => {
      const kind = (e as CustomEvent<{ kind?: VehicleKind }>).detail?.kind;
      if (kind) setF((prev) => ({ ...prev, tipo: kind }));
      setStatus((s) => (s === 'sent' || s === 'whatsapp' ? 'idle' : s));
    };
    window.addEventListener(QUOTE_EVENT, on);
    return () => window.removeEventListener(QUOTE_EVENT, on);
  }, []);

  useEffect(() => {
    startedAt.current = Date.now();
    try {
      localStorage.removeItem(DRAFT_KEY); // apaga rascunho antigo, de antes do prazo de validade
    } catch {
      /* ignora */
    }
    const d = readDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dado externo (armazenamento da aba), lido uma vez
    if (d) setF((prev) => ({ ...prev, ...d }));
    draftReady.current = true;
  }, []);

  // rascunho só nesta aba (sem aceite e sem armadilha), com data para expirar
  useEffect(() => {
    if (!draftReady.current) return;
    try {
      const { nome, whatsapp, tipo, modelo, ano, cidade } = f;
      if (!nome && !whatsapp && !tipo && !modelo && !ano && !cidade) sessionStorage.removeItem(DRAFT_KEY);
      else sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ nome, whatsapp, tipo, modelo, ano, cidade, at: Date.now() }));
    } catch {
      /* ignora */
    }
  }, [f]);

  useEffect(() => {
    if (status === 'sent' || status === 'whatsapp' || status === 'failed') resultRef.current?.focus();
  }, [status]);

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setF((prev) => {
      const next = { ...prev, [k]: v };
      if (touched[k]) setErrors(validate(next));
      return next;
    });
  };
  const blur = (k: keyof Fields) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate(f));
  };
  const showErr = (k: keyof Fields) => (touched[k] ? errors[k] : undefined);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    const errs = validate(f);
    setErrors(errs);
    setTouched({ nome: true, whatsapp: true, tipo: true, modelo: true, ano: true, aceite: true });
    const first = ORDER.find((k) => errs[k]);
    if (first) {
      const target = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
      target?.focus();
      return;
    }
    if (f.empresa) return; // robô

    if (!ENDPOINT) {
      // Sem integração: abre o WhatsApp com a mensagem pronta (precisa acontecer dentro do clique)
      window.open(waLink(buildMessage(f)), '_blank', 'noopener');
      sound.click();
      setSentWith(f);
      setStatus('whatsapp');
      clearDraft();
      return;
    }
    if (!ENDPOINT_OK) {
      setFailMsg('O envio está desativado por uma configuração insegura do site.');
      setStatus('failed');
      return;
    }

    setStatus('sending');
    try {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: cleanText(f.nome, MAX.nome),
          whatsapp: digits(f.whatsapp),
          tipo: f.tipo,
          modelo: cleanText(f.modelo, MAX.modelo),
          ano: Number(f.ano),
          cidade: cleanText(f.cidade, MAX.cidade) || null,
          aceite_contato: true,
          origem: 'site',
          // sinais anti-robô conferidos no servidor
          empresa: f.empresa,
          t: Date.now() - startedAt.current,
        }),
        credentials: 'omit',
        signal: ctrl.signal,
      });
      window.clearTimeout(timer);
      if (!res.ok) throw Object.assign(new Error('HTTP'), { status: res.status });
      setSentWith(f);
      setStatus('sent');
      sound.rev(0.3);
      clearDraft();
    } catch (err) {
      const code = (err as { status?: number }).status;
      setFailMsg(
        (err as Error).name === 'AbortError'
          ? 'O envio demorou demais e foi interrompido.'
          : code === 429
            ? 'Recebemos muitas tentativas deste aparelho. Aguarde alguns minutos ou fale direto pelo WhatsApp.'
            : code === 422
              ? 'Algum dado não passou na conferência. Revise os campos ou fale direto pelo WhatsApp.'
              : 'Não conseguimos registrar sua solicitação agora.',
      );
      setStatus('failed');
    }
  };

  const restart = () => {
    setF({ ...EMPTY });
    setErrors({});
    setTouched({});
    setStatus('idle');
    clearDraft();
    startedAt.current = Date.now();
    window.setTimeout(() => document.getElementById('q-nome')?.focus(), 50);
  };

  const done = status === 'sent' || status === 'whatsapp';
  const id = (k: string) => `${uid}-${k}`;
  const field = (k: keyof Fields) => ({
    'aria-invalid': showErr(k) ? true : undefined,
    'aria-describedby': showErr(k) ? id(`${k}-err`) : undefined,
  });
  const err = (k: keyof Fields) =>
    showErr(k) ? (
      <p id={id(`${k}-err`)} className="qf__err" role="alert">
        {showErr(k)}
      </p>
    ) : null;

  return (
    <section id="cotacao" className="quote" aria-labelledby="quote-title">
      <div className="quote__media" aria-hidden="true">
        <Picture img={IMG.studio} alt="" sizes="(max-width: 1023px) 100vw, 45vw" />
        <span className="quote__band" />
      </div>

      <div className="quote__inner">
        <div className="quote__intro">
          <h2 id="quote-title" className="display display--xl">
            <Lines lines={['Peça sua', <>cotação<span className="dot">.</span></>]} />
          </h2>
          <p className="quote__lede" data-reveal>
            Isto é uma solicitação de contato, não uma contratação nem uma cotação automática. Um consultor responde pelo
            WhatsApp com as condições para o seu veículo.
          </p>
          <ul className="quote__trust" data-reveal>
            <li>Sem compromisso de adesão</li>
            <li>Atendimento 24 horas</li>
            <li>Seus dados só para responder ao pedido</li>
          </ul>
        </div>

        <div className="quote__card tone-light">
          {!done && (
            <form ref={formRef} className="qf" noValidate onSubmit={onSubmit} aria-describedby={id('hint')}>
              <p id={id('hint')} className="qf__hint">
                Campos com * são obrigatórios.
              </p>

              <div className={`qf__row ${showErr('nome') ? 'has-err' : ''}`}>
                <label htmlFor="q-nome">Nome *</label>
                <input
                  id="q-nome"
                  data-field="nome"
                  name="nome"
                  autoComplete="name"
                  maxLength={MAX.nome}
                  value={f.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  onBlur={blur('nome')}
                  placeholder="Como podemos te chamar?"
                  {...field('nome')}
                />
                {err('nome')}
              </div>

              <div className={`qf__row ${showErr('whatsapp') ? 'has-err' : ''}`}>
                <label htmlFor="q-whatsapp">WhatsApp com DDD *</label>
                <input
                  id="q-whatsapp"
                  data-field="whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  maxLength={MAX.whatsapp}
                  value={f.whatsapp}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => set('whatsapp', maskPhone(e.target.value))}
                  onBlur={blur('whatsapp')}
                  placeholder="(00) 00000-0000"
                  {...field('whatsapp')}
                />
                {err('whatsapp')}
              </div>

              <fieldset className={`qf__row qf__kinds ${showErr('tipo') ? 'has-err' : ''}`} aria-describedby={showErr('tipo') ? id('tipo-err') : undefined}>
                <legend>Tipo de veículo *</legend>
                <div className="qf__chips">
                  {KINDS.map((k, i) => (
                    <label key={k} className={`qf__chip ${f.tipo === k ? 'is-on' : ''}`}>
                      <input
                        type="radio"
                        name="tipo"
                        value={k}
                        checked={f.tipo === k}
                        data-field={i === 0 ? 'tipo' : undefined}
                        onChange={() => {
                          set('tipo', k);
                          setTouched((t) => ({ ...t, tipo: true }));
                          sound.tick();
                        }}
                      />
                      <span>{VEHICLE_LABEL[k].label}</span>
                    </label>
                  ))}
                </div>
                {err('tipo')}
              </fieldset>

              <div className="qf__pair">
                <div className={`qf__row ${showErr('modelo') ? 'has-err' : ''}`}>
                  <label htmlFor="q-modelo">Marca e modelo *</label>
                  <input
                    id="q-modelo"
                    data-field="modelo"
                    name="modelo"
                    maxLength={MAX.modelo}
                    value={f.modelo}
                    onChange={(e) => set('modelo', e.target.value)}
                    onBlur={blur('modelo')}
                    placeholder="Ex.: Toyota SW4"
                    {...field('modelo')}
                  />
                  {err('modelo')}
                </div>
                <div className={`qf__row qf__row--year ${showErr('ano') ? 'has-err' : ''}`}>
                  <label htmlFor="q-ano">Ano *</label>
                  <input
                    id="q-ano"
                    data-field="ano"
                    name="ano"
                    inputMode="numeric"
                    maxLength={4}
                    value={f.ano}
                    onChange={(e) => set('ano', digits(e.target.value).slice(0, 4))}
                    onBlur={blur('ano')}
                    placeholder={String(THIS_YEAR)}
                    {...field('ano')}
                  />
                  {err('ano')}
                </div>
              </div>

              <div className="qf__row">
                <label htmlFor="q-cidade">
                  Cidade <span className="qf__opt">(opcional)</span>
                </label>
                <input
                  id="q-cidade"
                  name="cidade"
                  autoComplete="address-level2"
                  maxLength={MAX.cidade}
                  value={f.cidade}
                  onChange={(e) => set('cidade', e.target.value)}
                  placeholder="Onde o veículo circula mais"
                />
              </div>

              <div className="qf__trap" aria-hidden="true">
                <label htmlFor={id('empresa')}>Empresa</label>
                <input id={id('empresa')} name="empresa" tabIndex={-1} autoComplete="off" maxLength={80} value={f.empresa} onChange={(e) => set('empresa', e.target.value)} />
              </div>

              <div className={`qf__row qf__consent ${showErr('aceite') ? 'has-err' : ''}`}>
                <label className="qf__check">
                  <input
                    type="checkbox"
                    data-field="aceite"
                    checked={f.aceite}
                    onChange={(e) => {
                      set('aceite', e.target.checked);
                      setTouched((t) => ({ ...t, aceite: true }));
                    }}
                    {...field('aceite')}
                  />
                  <span className="qf__box" aria-hidden="true" />
                  <span>
                    Autorizo o contato pelo WhatsApp para receber a cotação. Veja como usamos seus dados na{' '}
                    <button type="button" className="qf__inline" onClick={openPrivacy}>
                      política de privacidade
                    </button>
                    .
                  </span>
                </label>
                {err('aceite')}
              </div>

              <button type="submit" className={`btn btn--red qf__submit ${status === 'sending' ? 'is-busy' : ''}`} disabled={status === 'sending'} aria-busy={status === 'sending'}>
                <span className="btn__label">
                  <span className="btn__text">{status === 'sending' ? 'Enviando…' : ENDPOINT ? 'Solicitar cotação' : 'Enviar pelo WhatsApp'}</span>
                </span>
                <span className="btn__icon" aria-hidden="true">
                  {status === 'sending' ? <span className="qf__spin" /> : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 12 12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" /></svg>}
                </span>
              </button>

              {status === 'failed' && (
                <div ref={resultRef} tabIndex={-1} className="qf__fail" role="alert">
                  <strong>{failMsg}</strong>
                  <span>Seus dados continuam aqui. Tente de novo ou mande a mesma solicitação pelo WhatsApp.</span>
                  <div className="qf__fail-actions">
                    <button type="submit" className="qf__inline">
                      Tentar de novo
                    </button>
                    <a className="qf__inline" href={waLink(buildMessage(f))} target="_blank" rel="noopener noreferrer">
                      Enviar pelo WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {!ENDPOINT && (
                <p className="qf__note">
                  Ao enviar, o WhatsApp abre com a sua mensagem pronta. A solicitação só chega quando você toca em Enviar na conversa.
                </p>
              )}
            </form>
          )}

          {done && sentWith && (
            <div ref={resultRef} tabIndex={-1} className="qf__done" role="status">
              <span className="qf__check-anim" aria-hidden="true">
                <svg viewBox="0 0 52 52" width="56" height="56">
                  <circle cx="26" cy="26" r="24" />
                  <path d="M15 27l7 7 15-16" />
                </svg>
              </span>
              <h3>{status === 'sent' ? 'Solicitação recebida.' : 'Sua mensagem está pronta no WhatsApp.'}</h3>
              <p>
                {status === 'sent'
                  ? `Obrigado, ${sentWith.nome.trim().split(' ')[0]}. Um consultor vai chamar você no WhatsApp ${maskPhone(sentWith.whatsapp)}.`
                  : 'Para concluir, toque em Enviar na conversa que abrimos. Se a janela não abriu, use o botão abaixo.'}
              </p>
              <dl className="qf__summary">
                <div>
                  <dt>Veículo</dt>
                  <dd>
                    {sentWith.tipo ? VEHICLE_LABEL[sentWith.tipo].label : ''} · {sentWith.modelo.trim()} · {sentWith.ano}
                  </dd>
                </div>
                <div>
                  <dt>WhatsApp</dt>
                  <dd>{maskPhone(sentWith.whatsapp)}</dd>
                </div>
              </dl>
              <div className="qf__done-actions">
                {status === 'whatsapp' && (
                  <a className="btn btn--red" href={waLink(buildMessage(sentWith))} target="_blank" rel="noopener noreferrer">
                    <span className="btn__label">
                      <span className="btn__text">Abrir o WhatsApp de novo</span>
                    </span>
                  </a>
                )}
                <button type="button" className="qf__inline" onClick={restart}>
                  Fazer outra solicitação
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
