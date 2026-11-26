# Calistenia Militar - Funil / Quiz Completo

Clone completo da página e funil interativo da **Calistenia Militar** (`https://calisteniamilitar.site`).

## 📁 Estrutura de Arquivos
- `index.html`: Landing page e quiz interativo (Next.js / Tailwind CSS / Turbopack bundle estático).
- `assets/`: Todas as imagens de corpo, objetivos, transformações e aplicativo.
- `_next/`: Chunks estáticos de CSS, JS e fontes otimizadas (woff2).
- `t/`: Script de tracking (`t.js`) com configuração de pixels e passagem de parâmetros UTM para Hotmart / Stripe.

## 🚀 Como Executar Localmente
Você pode rodar qualquer servidor estático HTTP localmente:

### Usando Python:
```bash
python -m http.server 3000
```
Depois acesse `http://localhost:3000` no navegador.

### Usando Node / npx:
```bash
npx serve .
```

## 🛠️ Personalização do Checkout
Para alterar o link de checkout / oferta:
- O link original aponta para: `https://pay.hotmart.com/C104688609X?checkoutMode=10`
- Altere esse valor no chunk correspondente em `_next/static/chunks/` ou configure via script de redirecionamento.
