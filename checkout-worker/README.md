# ⚡ Checkout Próprio - Operación Calistenia Militar (Cloudflare Worker + Stripe)

Checkout de alta conversão construído com o mesmo branding tático militar da landing page (`#08090a`, tipografia *Chakra Petch*, cards táticos, micro-urgência, garantia blindada e order bump integrado).

---

## 📁 Estrutura do Worker

```text
checkout-worker/
├── package.json          # Dependências (Stripe + Wrangler)
├── wrangler.toml         # Configurações do Cloudflare Worker e variáveis
└── src/
    └── index.js          # Worker com Stripe Elements, PaymentIntent e Webhooks
```

---

## 🔑 Onde Colocar Suas Chaves da Stripe

Existem dois lugares para configurar as chaves:

### 1. Chave Pública (Publishable Key)
Abra o arquivo [wrangler.toml](file:///c:/Users/vinic/OneDrive/Documentos/segundo-cerebro/Desenvolvimento/calistenia-militar-clone/checkout-worker/wrangler.toml) e altere a variável `STRIPE_PUBLISHABLE_KEY`:

```toml
[vars]
STRIPE_PUBLISHABLE_KEY = "pk_live_SEU_CODIGO_AQUI"
```

### 2. Chave Secreta e Webhook Secret (Produção Segura)
A `STRIPE_SECRET_KEY` e o `STRIPE_WEBHOOK_SECRET` **nunca devem ficar salvos no código**. No terminal, dentro da pasta `checkout-worker`, rode:

```bash
cd Desenvolvimento/calistenia-militar-clone/checkout-worker

# 1. Definir a chave secreta da Stripe:
npx wrangler secret put STRIPE_SECRET_KEY
# Cole: sk_live_... (ou sk_test_...)

# 2. Definir o segredo de webhook (opcional, para ouvir eventos confirmados):
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Cole: whsec_...
```

---

## 🚀 Como Testar Localmente

1. Entre na pasta do worker e instale as dependências:
   ```bash
   cd Desenvolvimento/calistenia-militar-clone/checkout-worker
   npm install
   ```
2. Inicie o servidor local do Cloudflare Worker:
   ```bash
   npm run dev
   ```
3. Abra `http://localhost:8787` para visualizar o checkout rodando.

---

## 🌐 Como Fazer o Deploy para a Cloudflare

Basta rodar:
```bash
npm run deploy
```
O Cloudflare Worker vai gerar uma URL pública instantânea, como:
`https://calistenia-checkout.seu-usuario.workers.dev`

---

## 🔗 Como Ligar a Landing Page ao Novo Checkout

No arquivo [index.html](file:///c:/Users/vinic/OneDrive/Documentos/segundo-cerebro/Desenvolvimento/calistenia-militar-clone/index.html), você só precisa trocar o link do botão de checkout (`https://pay.hotmart.com/C104688609X...`) para a URL do seu worker:

* **Botão Principal (Oferta Regular $19 USD):**
  `https://calistenia-checkout.seu-usuario.workers.dev/checkout`
* **Botão do Modal de Saída / Desconto Emergencial ($14 USD):**
  `https://calistenia-checkout.seu-usuario.workers.dev/checkout?offDiscount=MILITAR5`
