# README_STATE.md — PriceIQ Project State Snapshot
> Context reset document. Use this as the sole reference for continuing development.

---

## 1. PROJECT OVERVIEW

**PriceIQ** — Calculadora de precificação SaaS para marketplaces brasileiros.
Single-file HTML app (+ 1 página de guia). Calcula preço ideal de venda considerando custos, taxas reais de cada marketplace, tributação, margem de lucro, taxa do gestor e custo de ADS.
Marca: **Pack de Ferramentas do Nayder**.

---

## 2. CURRENT FEATURES

### Abas / Módulos
| Tab ID | Nome | Descrição |
|---|---|---|
| `calculator` | ⚙️ Calculadora | Cálculo principal em tempo real |
| `comparator` | 📊 Comparador | Compara os 4 MPs lado a lado |
| `reverse` | ↩ Simulação Reversa | Dado um preço, mostra o lucro real |
| `advanced` | 🔧 Modo Avançado | Edita taxas + toggles de Gestor/ADS |
| `saved` | 💾 Simulações | Salva/carrega/compartilha via Web Share API |
| `bulk` | ⚡ Em Massa | Upload CSV/XLSX → preços para os 4 MPs |

### Funcionalidades completas
- Campos de entrada: nome produto (opcional), custo produto, custo envio, taxas extras, margem (slider 0–100%), alíquota tributária
- **Taxa do Gestor** (toggle no Modo Avançado): valor em % sobre o preço de venda
- **Custo Por Venda ADS** (toggle no Modo Avançado): valor fixo em R$ por venda (soma ao custo base)
- Detalhamento completo no breakdown: comissão, taxa fixa, afiliados (TikTok), gestor, ADS, impostos, receita, lucro
- Barra de margem efetiva
- Simulação reversa com tabela de faixas Shopee (highlight da faixa ativa)
- Modo Avançado: editar taxas por faixa Shopee (5 faixas, cada com comissão% + taxa fixa R$), ML, TikTok (comissão + afiliados separados), Shein
- Restaurar padrões no Modo Avançado
- Salvar simulação (localStorage, max 50)
- Copiar resultado (CTRL+C): formato WhatsApp com `*negrito*`, emoji da plataforma na 1ª linha, nome após `===`, lucro em negrito, rodapé "Pack de Ferramentas do Nayder"
- Copiar comparativo: resumo compacto dos 4 MPs
- Compartilhar via Web Share API (mobile nativo) com fallback copy
- Botão WhatsApp (ícone SVG) em cada simulação salva
- Precificação em massa: drag-and-drop ou click, CSV/XLSX, chunk processing, barra de progresso, badges de faixa Shopee coloridos na tabela, exportar CSV/XLSX, imprimir (janela nova clean)
- Modelo CSV para download
- Google Analytics GA4 com eventos customizados
- Botão "Grupo Exclusivo" (WhatsApp) no header
- Link "Como Usar" no header → `como-usar.html`
- Scroll progress bar em `como-usar.html`

---

## 3. PROJECT STRUCTURE

```
outputs/
├── calculadora-marketplace.html   # App principal (106 KB, ~1970 linhas)
└── como-usar.html                 # Página de guia/SEO (34 KB, ~589 linhas)
```

> Em produção renomear `calculadora-marketplace.html` → `index.html`

---

## 4. IMPORTANT RULES / DECISIONS

### Fórmula de precificação (forward)
```
price = (custoTotal + fixedFee + adsValor) / (1 - comPct - aflPct - taxPct - gestorPct - margemPct)
```
- **Gestor** = % sobre preço → entra no divisor como `gestorPct`
- **ADS** = R$ fixo por venda → entra no numerador como `adsValor` (igual ao custo fixo)
- Shopee usa **convergência iterativa** (25 iterações) porque a faixa depende do preço final
- `calcIdealPrice(mp, custoTotal, margemPct, aliquotaPct, gestorPct, adsValor)` — todos os 4 MPs passam pelos mesmos parâmetros

### Textos copiados (WhatsApp)
- Formato com `*asteriscos*` para negrito nativo no WhatsApp
- Estrutura padrão:
  ```
  {emoji MP} *{nome MP}*
  ===============================
  📦 Produto: *{nome}*        ← só se preenchido
  *💸 Custo do produto: R$ X*
  📊 Margem: X%
  🏦 Alíquota: X%
  👤 Taxa do Gestor: X%       ← só se habilitado
  📣 Custo Por Venda (ADS): R$ X ← só se habilitado
  -------------------------------
  ✅ Preço ideal de venda: R$ X
  📉 Comissão: −R$ X
  📉 Taxa fixa: −R$ X         ← Shopee e ML
  📉 Taxa de afiliados: −R$ X ← TikTok
  👤 Taxa do Gestor: −R$ X (X%)
  📣 Custo ADS: −R$ X
  📉 Impostos: −R$ X
  📈 Receita líquida: R$ X
  *💰 Lucro líquido: R$ X*
  ===============================
  Pack de Ferramentas do Nayder
  ```

### Taxas padrão (editáveis no Modo Avançado)
| Plataforma | Taxa |
|---|---|
| Shopee Faixa 1 | ≤ R$79,99 → 20% + R$4 |
| Shopee Faixa 2 | R$80–99,99 → 14% + R$16 |
| Shopee Faixa 3 | R$100–199,99 → 14% + R$20 |
| Shopee Faixa 4 | R$200–499,99 → 14% + R$26 |
| Shopee Faixa 5 | > R$500 → 14% + R$26 |
| Mercado Livre | 19% + R$6 fixo |
| TikTok Shop | 12% comissão + 5% afiliados = 17% total |
| Shein | 16% |

### Badges de faixa Shopee (Em Massa)
- Faixa 1 = verde (`#00d4aa`), Faixa 2 = azul (`#4f8aff`), Faixa 3 = amarelo (`#ffb830`), Faixa 4 = laranja (`#ff7c4d`), Faixa 5 = vermelho (`#ff5470`)

### Sem frameworks
- Zero dependências externas de runtime (SheetJS carregado sob demanda via CDN para XLSX)
- Tudo em um único arquivo HTML + CSS + JS inline

### Validação JS
- Sempre validar com `python3 -c "import re,subprocess; ..."` extraindo o `<script>` e rodando `node --eval`
- Guard `if(typeof gtag !== 'undefined')` em todos os eventos GA4

---

## 5. TECH STACK

- **HTML5 + CSS3 + Vanilla JS** — single file, sem bundler
- **Fontes:** Google Fonts — `Syne` (display/títulos) + `DM Sans` (corpo)
- **XLSX:** SheetJS `0.18.5` via `cdnjs.cloudflare.com` (lazy load)
- **Analytics:** Google Analytics GA4
- **Deploy:** Vercel ou Netlify (drag-and-drop do HTML)
- **Paleta de cores:** dark theme com CSS custom properties (`:root` vars)

---

## 6. CURRENT TASK / NEXT STEP

**Snapshot gerado após:** implementação do Custo Por Venda (ADS).
**Próxima tarefa:** a definir pelo usuário.

---

## 7. KNOWN VARIABLES / CONFIGS

| Chave | Valor |
|---|---|
| GA4 ID | `G-BPWZQ2PZET` |
| WhatsApp Grupo | `https://chat.whatsapp.com/DpZLiJzuct14jsR5Bkvt6g` |
| Marca/Rodapé | `Pack de Ferramentas do Nayder` |
| Produto | `PriceIQ` |
| localStorage key | `priceiq_saves` |
| Max simulações salvas | 50 |
| Default alíquota | 6% |
| Default margem | 20% |
| Default gestor | 5% |
| Default ADS | R$ 5,00 |

### IDs de elementos críticos
```
Inputs calc:    nome_produto, custo_produto, custo_envio, taxas_extras,
                margem_lucro (range), aliquota, taxa_gestor, custo_ads
Toggles:        gestor-enabled, ads-enabled
Adv fields:     adv-gestor-pct, adv-ads-valor
Results:        res-preco, res-lucro-badge, bi-custo, bi-comissao,
                bi-taxa-fixa, bi-afiliados, bi-gestor, bi-ads,
                bi-imposto, bi-receita, bi-lucro, margin-pct, margin-fill
Rows hidden:    row-taxa-fixa, row-afiliados, row-gestor, row-ads
Rev inputs:     rev_preco
Bulk:           bulk-file-input, bulk-table-body, bulk-results-wrap
```

### Funções JS principais
```js
calcIdealPrice(mp, custoTotal, margemPct, aliquotaPct, gestorPct, adsValor)
getMPFees(mp, price)            // retorna { com, fixed, afl }
getShopeeTier(price)            // retorna tier object
getShopeeTierIndex(price)       // retorna 0-4
calc()                          // recalcula tela principal
calcReverse()                   // recalcula simulação reversa
updateComparator()              // renderiza cards do comparador
copiarResultado()               // copia texto formatado
copiarComparador()              // copia comparativo resumido
buildShareText(savedItem)       // monta texto para WA share
toggleGestor()                  // habilita/desabilita gestor
toggleADS()                     // habilita/desabilita ADS
syncADS()                       // sincroniza adv-ads-valor → custo_ads
handleBulkFile(file)            // processa CSV ou XLSX
processBulk(items)              // calcula preços em massa
exportBulkCSV() / exportBulkXLSX() / printBulkTable()
salvarSimulacao() / renderSaved() / loadSimulation(id) / clearSaved()
switchTab(tab)                  // troca aba ativa
```

---

## 8. ASSUMPTIONS

- O arquivo `calculadora-marketplace.html` será renomeado para `index.html` em produção
- Hospedagem em HTTPS (necessário para Web Share API e GA4 com `cookie_flags`)
- Usuário (Alvaro) opera no contexto brasileiro (BRL, marketplaces BR)
- Taxas dos marketplaces podem ser personalizadas pelo usuário via Modo Avançado
- Dados salvos ficam no `localStorage` do navegador (não há backend)
- Modificações no código são feitas via Python string replace nos arquivos de output
