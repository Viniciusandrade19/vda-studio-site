# LíderPrev — Proteção Veicular · v3

Site da LíderPrev — Proteção Veicular (Campina Grande, PB).
Experiência digital desenvolvida por **VDA Studio**. React 19 + TypeScript + Vite, sem bibliotecas de animação.

## Rodar, testar e publicar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes da função de servidor /api/cotacao (15 casos)
npm run lint       # oxlint
npm run build      # tipos + build + pré-renderização + SEO + cabeçalhos de segurança → dist/
npm run preview    # testa o build
```

O `npm run build` faz, além do build normal (`scripts/prerender.mjs`):

- **pré-renderiza** a página: o HTML já sai com todo o texto (Google, IAs e prévias de link leem sem rodar JavaScript);
- gera **`robots.txt`**, **`sitemap.xml`** (precisa de `VITE_SITE_URL`) e **`llms.txt`**;
- gera os **cabeçalhos de segurança**: `vercel.json` (Vercel) e `dist/_headers` (Netlify / Cloudflare Pages);
- **recusa o build** se `VITE_SITE_URL` não for `https://` ou se `VITE_QUOTE_ENDPOINT` não for `https://` nem um caminho do próprio site.

Vercel e Netlify detectam o Vite sozinhos (build `npm run build`, saída `dist`).
Em hospedagem comum (Apache, Nginx, cPanel), envie `dist/` e configure à mão os cabeçalhos que estão em `dist/_headers` e o redirecionamento para HTTPS.

## Configuração

Copie `.env.example` para `.env`. O `.env` não vai para o Git.

**Variáveis públicas** (vão para o navegador; nunca coloque segredo com prefixo `VITE_`):

| Variável | Para que serve |
|---|---|
| `VITE_SITE_URL` | URL pública, `https://` e sem barra final. Liga canonical, og:url, sitemap e dados estruturados. |
| `VITE_QUOTE_ENDPOINT` | Para onde o formulário envia. **Vazio:** abre o WhatsApp com a mensagem pronta. **`/api/cotacao`:** função de servidor deste projeto (recomendado na Vercel). |

**Variáveis de servidor** (configure no painel da hospedagem; só a função `api/cotacao.ts` lê):

| Variável | Para que serve |
|---|---|
| `QUOTE_WEBHOOK_URL` | Endereço do CRM / Make / Zapier / planilha que recebe as cotações. Precisa ser `https://`. **Fica escondido do navegador.** |
| `QUOTE_WEBHOOK_TOKEN` | Opcional. Enviado como `Authorization: Bearer …` para o webhook conferir que o pedido veio do site. |
| `ALLOWED_ORIGINS` | Opcional. Origens aceitas, separadas por vírgula. Sem ela, só o próprio domínio é aceito. |

> Não coloque a URL do webhook direto em `VITE_QUOTE_ENDPOINT`: ela ficaria visível no código do site e qualquer pessoa poderia enviar dados falsos para o seu CRM. Use `/api/cotacao`.

WhatsApp, telefone e Instagram oficiais ficam em `src/config/site.ts`.

### Função `POST /api/cotacao`

Recebe o pedido do formulário, **valida de novo no servidor** (mesmas regras do navegador, em `src/lib/quote-validation.ts`) e repassa ao `QUOTE_WEBHOOK_URL`:

```json
{ "nome": "Maria Souza", "whatsapp": "83999998888", "tipo": "moto", "modelo": "Honda CG 160",
  "ano": 2022, "cidade": null, "aceite_contato": true, "origem": "site", "recebido_em": "2026-11-16T12:22:01.172Z" }
```

| Defesa | Como |
|---|---|
| Só os campos esperados | allowlist: qualquer outro campo é descartado (bloqueia *mass assignment*) |
| Validação no servidor | tipos, tamanhos, DDD, ano, tipo de veículo, aceite de contato |
| Limpeza de texto | remove caracteres de controle e invisíveis; corta no tamanho máximo |
| Origem | recusa pedidos vindos de outros sites (403) |
| Tamanho | corpo acima de 4 KB recusado (413); só `application/json` (415) |
| Robôs | campo invisível + tempo mínimo de preenchimento: responde "ok" e **não** repassa |
| Excesso de pedidos | 5 por IP a cada 10 min por instância (429) |
| Erros | respostas genéricas, sem stack trace, sem dados pessoais e sem o endereço do webhook nos logs |

**Limite global de pedidos:** o limite acima vale por instância da função. Para um limite único entre todas as instâncias, ative uma regra de *rate limit* no **Vercel Firewall** para `/api/cotacao` (ou use Upstash Redis).

## Segurança de navegação

Gerados no build, com o hash exato do único script inline (nada de `'unsafe-inline'` para scripts):

`Content-Security-Policy` · `Strict-Transport-Security` · `X-Content-Type-Options` · `X-Frame-Options: DENY` · `Referrer-Policy` · `Permissions-Policy` · `Cross-Origin-Opener-Policy`.

Se o script inline mudar (`scripts/prerender.mjs`), o hash muda junto, porque os dois são gerados no mesmo passo.

## Jornada da página

0. **Entrada** — faixa vermelha desce, o emblema cai, o título aparece e a cortina sobe. Uma vez por sessão; pode ser pulada; não aparece com "reduzir movimento".
1. **Hero** — título, subtítulo, "Solicitar cotação" e "Ver coberturas", SW4 sobre a faixa vermelha.
2. **Benefícios** — placas Mercosul arrastáveis.
3. **Coberturas por veículo** — fotos de carro, moto e caminhão com o emblema; "Cotar meu…" abre o formulário com o veículo escolhido.
4. **Como funciona** — três passos numa estrada que o carro percorre com a rolagem.
5. **Diferenciais** — mostrador 24h arrastável e mapa do Brasil com rotas.
6. **Cotação** — formulário com validação, máscara de WhatsApp, rascunho só na aba (expira em 24 h), carregamento, sucesso e falha.
7. **Dúvidas** — oito perguntas com busca e sanfona.
8. **CTA final** — escolha do veículo e "deslize para chamar" no WhatsApp.
9. **Rodapé institucional** — navegação, atendimento, aviso legal (proteção veicular não é seguro) e política de privacidade.

## Onde editar

| O quê | Arquivo |
|---|---|
| Contato, mensagens do WhatsApp, menu | `src/config/site.ts` |
| Regras de validação (navegador e servidor) | `src/lib/quote-validation.ts` |
| Formulário de cotação | `src/components/QuoteForm.tsx` |
| Função de servidor da cotação | `api/cotacao.ts` (testes em `tests/`) |
| Entrada animada | `src/components/Intro.tsx`, `src/styles/intro.css` |
| Fotos dos veículos | `src/assets/video/*-parad*.{jpg,webp}` + `src/components/Garage.tsx` |
| Perguntas frequentes | `src/components/Faq.tsx` |
| Passos do processo | `src/components/HowItWorks.tsx` |
| Benefícios | `src/components/WhyUs.tsx` |
| SEO, robots, sitemap, llms.txt, cabeçalhos | `scripts/prerender.mjs`, `index.html` |
| Cores, tipografia, espaçamentos | `src/styles/tokens.css` (camada visual da v3 em `src/styles/v3.css`) |

## Regras de conteúdo

- Nenhum preço, cotação calculada, depoimento, número de clientes, parceiro ou garantia inventados.
- Benefícios sempre com a ressalva "conforme o regulamento".
- O formulário se apresenta como **solicitação de contato**, não como contratação.
- Dados estruturados usam `LocalBusiness` (não `InsuranceAgency`): proteção veicular não é seguro.
- Antes de publicar para uma empresa real, confirme com ela cada benefício, o texto do aviso legal e a política de privacidade.
- Confirme o direito de uso das fotos (SW4 do hero, SW4 em estúdio e as fotos dos veículos).
