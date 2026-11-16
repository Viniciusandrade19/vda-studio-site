/* ─────────────────────────────────────────────────────────────
   POST /api/cotacao — função de servidor (Vercel, runtime Node).

   Recebe o pedido de cotação do site, valida tudo de novo no servidor e
   repassa para o sistema de atendimento (CRM, Make, Zapier, planilha…).
   O endereço desse sistema fica só aqui, na variável QUOTE_WEBHOOK_URL,
   e nunca vai para o navegador.

   Defesas:
   • só POST com JSON de até 4 KB;
   • origem conferida (ALLOWED_ORIGINS), contra envio a partir de outros sites;
   • allowlist de campos + validação compartilhada (src/lib/quote-validation.ts);
   • armadilha anti-robô (campo invisível) e tempo mínimo de preenchimento;
   • limite de pedidos por IP (por instância — veja o README para o limite global);
   • respostas e logs sem stack trace, sem dados pessoais e sem o endereço do webhook.
   ───────────────────────────────────────────────────────────── */
import { parseQuote } from '../src/lib/quote-validation';

const MAX_BODY = 4 * 1024;
const MIN_FILL_MS = 2500;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const FORWARD_TIMEOUT_MS = 8000;

const hits = new Map<string, number[]>();

const json = (status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extra,
    },
  });

function clientIp(req: Request) {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0] : req.headers.get('x-real-ip') || 'desconhecido').trim();
}

/** Janela deslizante simples em memória. */
export function rateLimited(ip: string, now = Date.now()) {
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // não deixa o mapa crescer sem limite
  return false;
}

function allowedOrigin(req: Request) {
  const origin = req.headers.get('origin');
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (!allowed.length) {
    // sem lista configurada: aceita apenas o próprio host
    const host = req.headers.get('host');
    return !!origin && !!host && new URL(origin).host === host;
  }
  return !!origin && allowed.includes(origin.replace(/\/$/, ''));
}

export async function POST(req: Request): Promise<Response> {
  try {
    if (!allowedOrigin(req)) return json(403, { ok: false, error: 'origem_nao_permitida' });

    const type = req.headers.get('content-type') || '';
    if (!type.toLowerCase().startsWith('application/json')) return json(415, { ok: false, error: 'formato_invalido' });

    const len = Number(req.headers.get('content-length') || 0);
    if (len > MAX_BODY) return json(413, { ok: false, error: 'pedido_grande_demais' });

    if (rateLimited(clientIp(req))) {
      return json(429, { ok: false, error: 'muitas_tentativas' }, { 'retry-after': String(WINDOW_MS / 1000) });
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY) return json(413, { ok: false, error: 'pedido_grande_demais' });

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(400, { ok: false, error: 'json_invalido' });
    }

    const b = body as Record<string, unknown>;
    // robô: preencheu o campo invisível ou enviou rápido demais. Responde como sucesso e descarta.
    const trap = typeof b?.empresa === 'string' && b.empresa.trim() !== '';
    const tooFast = typeof b?.t !== 'number' || b.t < MIN_FILL_MS;
    if (trap || tooFast) return json(200, { ok: true });

    const parsed = parseQuote(body);
    if (!parsed.ok) return json(422, { ok: false, error: 'dados_invalidos', campos: Object.keys(parsed.errors) });

    const target = process.env.QUOTE_WEBHOOK_URL;
    if (!target || !target.startsWith('https://')) {
      console.error('[cotacao] QUOTE_WEBHOOK_URL ausente ou sem https');
      return json(503, { ok: false, error: 'indisponivel' });
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FORWARD_TIMEOUT_MS);
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (process.env.QUOTE_WEBHOOK_TOKEN) headers.authorization = `Bearer ${process.env.QUOTE_WEBHOOK_TOKEN}`;
      const res = await fetch(target, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...parsed.data, recebido_em: new Date().toISOString() }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        console.error('[cotacao] destino respondeu', res.status);
        return json(502, { ok: false, error: 'falha_no_envio' });
      }
    } finally {
      clearTimeout(timer);
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error('[cotacao] erro inesperado', (err as Error)?.name || 'Error');
    return json(500, { ok: false, error: 'erro_interno' });
  }
}
