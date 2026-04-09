# PriceIQ — Shopee Proxy Worker

Proxy Cloudflare Worker que resolve o bloqueio de CORS da API da Shopee BR.
Gratuito: 100.000 requisições/dia no plano Free da Cloudflare.

---

## Deploy em 5 minutos

### Passo 1 — Criar conta Cloudflare (se não tiver)
https://dash.cloudflare.com/sign-up
> Não precisa de cartão de crédito. O plano Free é suficiente.

### Passo 2 — Criar o Worker
1. Acesse https://dash.cloudflare.com
2. Menu lateral → **Workers & Pages**
3. Clique em **Create** → **Create Worker**
4. Dê o nome: `shopee-proxy` (ou qualquer nome)
5. Clique em **Deploy** (sem editar ainda)

### Passo 3 — Colar o código
1. Na página do Worker recém-criado, clique em **Edit code**
2. Apague todo o conteúdo do editor
3. Cole o conteúdo do arquivo `worker.js`
4. Clique em **Deploy** (botão azul, canto superior direito)

### Passo 4 — Anotar a URL
Após o deploy, sua URL será algo como:
```
https://shopee-proxy.SEU-USUARIO.workers.dev
```
Anote essa URL — você vai colocá-la no PriceIQ.

### Passo 5 — Testar no browser
Abra:
```
https://shopee-proxy.SEU-USUARIO.workers.dev/health
```
Deve retornar:
```json
{"status":"ok","service":"PriceIQ Shopee Proxy","version":"1.0.0"}
```

Teste com um produto real:
```
https://shopee-proxy.SEU-USUARIO.workers.dev/item?shopid=183617096&itemid=25449166442
```

---

## Configurar no PriceIQ

No arquivo `index.html`, localize a linha:
```js
const PRICEIQ_WORKER_URL = 'https://shopee-proxy.SEU-USUARIO.workers.dev';
```
E substitua pela sua URL real do Worker.

---

## Como funciona

```
Usuário cola link          Worker (Cloudflare)        Shopee API
───────────────────────    ───────────────────────    ───────────────
PriceIQ extrai IDs    →   /item?shopid=X&itemid=Y  →  /api/v4/item/get
do link da Shopee         Adiciona headers corretos    Retorna JSON
                          Retorna dados limpos     ←  com preço, nome, etc.
                     ←
PriceIQ exibe resultado
```

## Rotas disponíveis

| Rota | Descrição |
|---|---|
| `GET /health` | Health check |
| `GET /item?shopid=X&itemid=Y` | Busca dados do produto |
| `GET /resolve?url=URL` | Resolve links encurtados (shope.ee) |

---

## Limites do plano Free Cloudflare
- 100.000 requests/dia
- 10ms de CPU por request
- Sem limite de banda

Para um uso pessoal/pequeno negócio, é mais do que suficiente.
