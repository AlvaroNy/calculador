/**
 * PriceIQ — Shopee Proxy Worker
 * Cloudflare Worker que faz proxy para a API interna da Shopee BR,
 * resolvendo o bloqueio de CORS e os headers necessários.
 *
 * Deploy: https://dash.cloudflare.com → Workers → Create Worker → cole este código
 * Após deploy, anote a URL: https://shopee-proxy.SEU-USUARIO.workers.dev
 */

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
// Domínios permitidos a chamar este Worker (coloque o seu domínio em produção)
// Use "*" para aceitar qualquer origem (menos seguro, ok para MVP)
const ALLOWED_ORIGINS = [
  "*", // libera tudo — troque pelo seu domínio em produção, ex: "https://priceiq.vercel.app"
];

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return corsResponse(null, 204);
    }

    // Apenas GET
    if (request.method !== "GET") {
      return corsResponse(JSON.stringify({ error: "Método não permitido" }), 405);
    }

    const url = new URL(request.url);

    // ── Rota: /item?shopid=XXX&itemid=YYY ─────────────────────────────────────
    if (url.pathname === "/item") {
      const shopid = url.searchParams.get("shopid");
      const itemid = url.searchParams.get("itemid");

      if (!shopid || !itemid) {
        return corsResponse(
          JSON.stringify({ error: "Parâmetros shopid e itemid são obrigatórios" }),
          400
        );
      }

      // Validar que são numéricos (segurança)
      if (!/^\d+$/.test(shopid) || !/^\d+$/.test(itemid)) {
        return corsResponse(
          JSON.stringify({ error: "shopid e itemid devem ser numéricos" }),
          400
        );
      }

      try {
        const data = await fetchShopeeItem(shopid, itemid);
        return corsResponse(JSON.stringify(data), 200);
      } catch (err) {
        return corsResponse(
          JSON.stringify({ error: err.message }),
          502
        );
      }
    }

    // ── Rota: /resolve?url=... (para links encurtados shope.ee) ───────────────
    if (url.pathname === "/resolve") {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl) {
        return corsResponse(JSON.stringify({ error: "Parâmetro url obrigatório" }), 400);
      }

      try {
        // Seguir redirect para resolver URL encurtada
        const resp = await fetch(targetUrl, {
          method: "HEAD",
          redirect: "follow",
          headers: { "User-Agent": UA },
        });
        return corsResponse(JSON.stringify({ resolved_url: resp.url }), 200);
      } catch (err) {
        return corsResponse(JSON.stringify({ error: err.message }), 502);
      }
    }

    // ── Rota raiz: health check ───────────────────────────────────────────────
    if (url.pathname === "/" || url.pathname === "/health") {
      return corsResponse(
        JSON.stringify({ status: "ok", service: "PriceIQ Shopee Proxy", version: "1.0.0" }),
        200
      );
    }

    return corsResponse(JSON.stringify({ error: "Rota não encontrada" }), 404);
  },
};

// ─── SHOPEE API FETCH ─────────────────────────────────────────────────────────
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function fetchShopeeItem(shopid, itemid) {
  const apiUrl = `https://shopee.com.br/api/v4/item/get?itemid=${itemid}&shopid=${shopid}`;

  const response = await fetch(apiUrl, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: `https://shopee.com.br/produto-i.${shopid}.${itemid}`,
      "x-shopee-language": "pt-BR",
      "x-requested-with": "XMLHttpRequest",
      "if-none-match-": "*",
    },
  });

  if (!response.ok) {
    throw new Error(`Shopee API retornou ${response.status}`);
  }

  const json = await response.json();

  // A Shopee armazena preços em centavos × 100000
  // Exemplo: R$ 29,90 → 2990000
  const item = json?.data?.item;
  if (!item) {
    throw new Error("Item não encontrado na resposta da Shopee");
  }

  const DIVISOR = 100000;

  const priceRaw          = item.price          ?? null;
  const priceBeforeRaw    = item.price_before_discount ?? null;
  const priceMinRaw       = item.price_min       ?? null;
  const priceMaxRaw       = item.price_max       ?? null;

  // Preço efetivo (pode ter desconto)
  const price         = priceRaw       != null ? priceRaw       / DIVISOR : null;
  const priceOriginal = priceBeforeRaw != null && priceBeforeRaw > 0
                          ? priceBeforeRaw / DIVISOR
                          : null;
  const priceMin      = priceMinRaw    != null ? priceMinRaw    / DIVISOR : null;
  const priceMax      = priceMaxRaw    != null ? priceMaxRaw    / DIVISOR : null;

  // Preço efetivo: usa price (já com desconto aplicado pela Shopee)
  // Se price == price_before_discount, não tem desconto
  const hasDiscount = priceOriginal != null && priceOriginal > price;

  return {
    ok: true,
    shopid: Number(shopid),
    itemid: Number(itemid),
    name: item.name ?? null,
    description: (item.description ?? "").substring(0, 200),
    price,                          // preço atual (com desconto se houver)
    price_original: hasDiscount ? priceOriginal : null,
    price_min: priceMin,
    price_max: priceMax,
    has_discount: hasDiscount,
    discount_pct: hasDiscount
      ? Math.round((1 - price / priceOriginal) * 100)
      : 0,
    stock: item.stock ?? null,
    sold: item.historical_sold ?? null,
    rating: item.item_rating?.rating_star ?? null,
    category: item.categories?.[0]?.display_name ?? null,
    currency: "BRL",
  };
}

// ─── CORS HELPER ──────────────────────────────────────────────────────────────
function corsResponse(body, status) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };

  if (body === null) {
    return new Response(null, { status, headers });
  }

  return new Response(body, { status, headers });
}
