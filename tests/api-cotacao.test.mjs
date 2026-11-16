// Testes da função POST /api/cotacao (rodar com: npm test)
import http from 'node:http';
import assert from 'node:assert/strict';
const got = [];
const hook = http.createServer((q, r) => { let b=''; q.on('data',c=>b+=c); q.on('end',()=>{ got.push({auth:q.headers.authorization, body:JSON.parse(b)}); r.writeHead(q.url==='/fail'?500:200); r.end('ok'); }); });
await new Promise(r => hook.listen(0, r));
const port = hook.address().port;
// o handler exige https; para o teste local, troca o fetch para mandar ao http local
const realFetch = globalThis.fetch;
globalThis.fetch = (url, opt) => realFetch(String(url).replace('https://hook.test', `http://127.0.0.1:${port}`), opt);
process.env.QUOTE_WEBHOOK_URL = 'https://hook.test/ok';
process.env.QUOTE_WEBHOOK_TOKEN = 'segredo-de-teste';
const { POST } = await import(process.env.API_BUNDLE);
const good = { nome: 'Maria Souza', whatsapp: '(83) 99999-1234', tipo: 'moto', modelo: 'Honda CG 160', ano: 2022, cidade: 'Campina Grande', aceite_contato: true, empresa: '', t: 9000 };
let ipn = 0;
const req = (body, { origin = 'https://liderprev.com.br', host = 'liderprev.com.br', type = 'application/json', ip } = {}) =>
  new Request('https://liderprev.com.br/api/cotacao', { method: 'POST', headers: { origin, host, 'content-type': type, 'x-forwarded-for': ip || `10.0.0.${++ipn}` }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const R = async (...a) => { const r = await POST(req(...a)); return [r.status, await r.json(), r.headers]; };
const results = [];
const t = async (name, fn) => { try { await fn(); results.push(['OK', name]); } catch (e) { results.push(['FALHOU', name, e.message]); } };

await t('pedido válido é repassado com allowlist e token', async () => {
  const [s, b, h] = await R({ ...good, papel: 'admin', __proto__x: 1, preco: 0 });
  assert.equal(s, 200); assert.deepEqual(b, { ok: true }); assert.equal(h.get('cache-control'), 'no-store');
  const last = got.at(-1); assert.equal(last.auth, 'Bearer segredo-de-teste');
  assert.deepEqual(Object.keys(last.body).sort(), ['aceite_contato','ano','cidade','modelo','nome','origem','recebido_em','tipo','whatsapp']);
  assert.equal(last.body.whatsapp, '83999991234');
});
await t('origem de outro site é recusada (403)', async () => { const [s] = await R(good, { origin: 'https://golpe.example' }); assert.equal(s, 403); });
await t('sem cabeçalho Origin é recusado (403)', async () => { const [s] = await R(good, { origin: '' }); assert.equal(s, 403); });
await t('content-type diferente de JSON (415)', async () => { const [s] = await R(JSON.stringify(good), { type: 'text/plain' }); assert.equal(s, 415); });
await t('JSON quebrado (400)', async () => { const [s] = await R('{nome:'); assert.equal(s, 400); });
await t('corpo acima de 4 KB (413)', async () => { const [s] = await R({ ...good, nome: 'x'.repeat(5000) }); assert.equal(s, 413); });
await t('dados inválidos (422) sem eco dos valores', async () => { const [s, b] = await R({ ...good, whatsapp: '123', tipo: 'aviao', ano: 1800 }); assert.equal(s, 422); assert.deepEqual(b.campos.sort(), ['ano','tipo','whatsapp']); assert.ok(!JSON.stringify(b).includes('aviao')); });
await t('sem aceite de contato (422)', async () => { const [s] = await R({ ...good, aceite_contato: 'true' }); assert.equal(s, 422); });
await t('injeção de HTML/SQL vira texto limpo, sem quebrar', async () => {
  const n = got.length;
  const [s] = await R({ ...good, nome: "Ana'); DROP TABLE leads;-- <script>alert(1)</script>", modelo: 'Gol' + String.fromCharCode(0, 0x2028) + ' 1.0' });
  assert.equal(s, 200); const body = got.at(-1).body; assert.equal(got.length, n + 1);
  // eslint-disable-next-line no-control-regex -- o teste confere justamente a remoção de caracteres de controle
  assert.ok(!new RegExp('[\\x00\\u2028]').test(body.modelo)); assert.ok(body.nome.length <= 80);
});
await t('robô: campo armadilha preenchido → 200 mas NÃO repassa', async () => { const n = got.length; const [s] = await R({ ...good, empresa: 'ACME' }); assert.equal(s, 200); assert.equal(got.length, n); });
await t('robô: envio rápido demais → 200 mas NÃO repassa', async () => { const n = got.length; const [s] = await R({ ...good, t: 300 }); assert.equal(s, 200); assert.equal(got.length, n); });
await t('limite: 6º pedido do mesmo IP em 10 min → 429', async () => {
  const codes = []; for (let i = 0; i < 6; i++) codes.push((await R(good, { ip: '203.0.113.9' }))[0]);
  assert.deepEqual(codes, [200,200,200,200,200,429]);
});
await t('destino fora do ar → 502 genérico, sem detalhes', async () => { process.env.QUOTE_WEBHOOK_URL = 'https://hook.test/fail'; const [s, b] = await R(good); assert.equal(s, 502); assert.deepEqual(b, { ok: false, error: 'falha_no_envio' }); process.env.QUOTE_WEBHOOK_URL = 'https://hook.test/ok'; });
await t('webhook sem https → 503 e nada sai', async () => { process.env.QUOTE_WEBHOOK_URL = 'http://hook.test/ok'; const n = got.length; const [s] = await R(good); assert.equal(s, 503); assert.equal(got.length, n); process.env.QUOTE_WEBHOOK_URL = 'https://hook.test/ok'; });
await t('ALLOWED_ORIGINS restringe a lista', async () => { process.env.ALLOWED_ORIGINS = 'https://www.liderprev.com.br'; const [a] = await R(good, { origin: 'https://liderprev.com.br' }); const [b] = await R(good, { origin: 'https://www.liderprev.com.br' }); assert.equal(a, 403); assert.equal(b, 200); delete process.env.ALLOWED_ORIGINS; });
for (const r of results) console.log(r.join(' | '));
const okN = results.filter(r => r[0] === 'OK').length;
console.log(okN + '/' + results.length + ' testes ok');
if (okN !== results.length) process.exitCode = 1;
hook.close();
