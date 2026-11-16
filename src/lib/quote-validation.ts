/* ─────────────────────────────────────────────────────────────
   Regras do pedido de cotação — fonte única.
   Usadas no navegador (mensagens de erro) e na função de servidor
   (api/cotacao.ts), que nunca confia no que veio do cliente.
   ───────────────────────────────────────────────────────────── */

export const VEHICLE_KINDS = ['carro', 'moto', 'caminhao', 'utilitario'] as const;
export type QuoteKind = (typeof VEHICLE_KINDS)[number];

/** Tamanho máximo de cada campo de texto (o navegador também corta no maxLength). */
export const MAX = { nome: 80, whatsapp: 16, modelo: 60, ano: 4, cidade: 60 } as const;

export const YEAR_MIN = 1960;
export const yearMax = () => new Date().getFullYear() + 1;

export const onlyDigits = (v: string) => v.replace(/\D/g, '');

// caracteres de controle, de largura zero e separadores de linha Unicode
// eslint-disable-next-line no-control-regex -- intencional: é exatamente o que precisamos remover
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u2028\\u2029]', 'g');

/** Remove caracteres de controle e espaços repetidos; corta no limite. */
export function cleanText(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export type QuoteInput = {
  nome: string;
  whatsapp: string;
  tipo: string;
  modelo: string;
  ano: string;
  cidade: string;
  aceite: boolean;
};
export type QuoteErrors = Partial<Record<keyof QuoteInput, string>>;

export function validateQuote(f: QuoteInput): QuoteErrors {
  const e: QuoteErrors = {};
  const nome = f.nome.trim();
  if (!nome) e.nome = 'Informe seu nome.';
  else if (nome.length < 3 || !/[a-zA-ZÀ-ú]{2,}/.test(nome)) e.nome = 'Digite seu nome completo ou como prefere ser chamado.';
  else if (nome.length > MAX.nome) e.nome = `Use até ${MAX.nome} caracteres.`;

  const tel = onlyDigits(f.whatsapp);
  if (!tel) e.whatsapp = 'Informe seu WhatsApp com DDD.';
  else if (tel.length < 10 || tel.length > 11) e.whatsapp = 'O número precisa ter DDD e 8 ou 9 dígitos. Ex.: (83) 99999-9999.';
  else if (Number(tel.slice(0, 2)) < 11) e.whatsapp = 'Confira o DDD: ele vai de 11 a 99.';
  else if (tel.length === 11 && tel[2] !== '9') e.whatsapp = 'Celulares com 11 dígitos começam com 9 depois do DDD.';

  if (!(VEHICLE_KINDS as readonly string[]).includes(f.tipo)) e.tipo = 'Escolha o tipo de veículo.';

  const modelo = f.modelo.trim();
  if (modelo.length < 2) e.modelo = 'Informe a marca e o modelo. Ex.: Toyota SW4.';
  else if (modelo.length > MAX.modelo) e.modelo = `Use até ${MAX.modelo} caracteres.`;

  const ano = Number(f.ano);
  if (!f.ano) e.ano = 'Informe o ano do veículo.';
  else if (!/^\d{4}$/.test(f.ano) || ano < YEAR_MIN || ano > yearMax()) e.ano = `Use um ano entre ${YEAR_MIN} e ${yearMax()}.`;

  if (f.cidade.trim().length > MAX.cidade) e.cidade = `Use até ${MAX.cidade} caracteres.`;

  if (!f.aceite) e.aceite = 'Para enviarmos a cotação, autorize o contato pelo WhatsApp.';
  return e;
}

/** Payload que sai do site — só estes campos (allowlist), já limpos. */
export type QuotePayload = {
  nome: string;
  whatsapp: string;
  tipo: QuoteKind;
  modelo: string;
  ano: number;
  cidade: string | null;
  aceite_contato: true;
  origem: 'site';
};

/**
 * Converte um corpo desconhecido (JSON vindo da rede) em payload válido, ou devolve os erros.
 * Campos fora da allowlist são descartados (bloqueia mass assignment).
 */
export function parseQuote(body: unknown): { ok: true; data: QuotePayload } | { ok: false; errors: QuoteErrors } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const input: QuoteInput = {
    nome: cleanText(b.nome, MAX.nome + 1),
    whatsapp: onlyDigits(cleanText(b.whatsapp, MAX.whatsapp + 4)),
    tipo: cleanText(b.tipo, 12),
    modelo: cleanText(b.modelo, MAX.modelo + 1),
    ano: cleanText(typeof b.ano === 'number' ? String(b.ano) : b.ano, 5),
    cidade: cleanText(b.cidade ?? '', MAX.cidade + 1),
    aceite: b.aceite_contato === true,
  };
  const errors = validateQuote(input);
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      nome: input.nome,
      whatsapp: input.whatsapp,
      tipo: input.tipo as QuoteKind,
      modelo: input.modelo,
      ano: Number(input.ano),
      cidade: input.cidade || null,
      aceite_contato: true,
      origem: 'site',
    },
  };
}
