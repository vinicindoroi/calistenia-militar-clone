/**
 * Cloudflare Worker - Checkout Tático Calistenia Militar
 * ZERO DEPENDÊNCIAS (Zero npm / Zero import).
 * Pode colar direto no editor web da Cloudflare Workers!
 * Funciona perfeitamente mesmo antes de você colocar as chaves da Stripe (Modo Demo/Preview).
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Rota 1: Renderizar Página de Checkout Estilizada
    if (url.pathname === '/' || url.pathname === '/checkout') {
      const html = renderCheckoutHtml(env, url.searchParams);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders }
      });
    }

    // Rota 2: Config Pública
    if (url.pathname === '/api/config') {
      return new Response(JSON.stringify({
        publishableKey: env.STRIPE_PUBLISHABLE_KEY || '',
        currency: env.CURRENCY || 'usd',
        defaultPrice: env.DEFAULT_PRICE_CENTS ? Number(env.DEFAULT_PRICE_CENTS) : 1900,
        discountPrice: env.DISCOUNT_PRICE_CENTS ? Number(env.DISCOUNT_PRICE_CENTS) : 1400
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Rota 3: Criar Payment Intent via REST API nativo da Stripe (sem biblioteca stripe)
    if (url.pathname === '/api/create-payment-intent' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const hasDiscount = Boolean(body.discount || body.coupon === 'MILITAR5');
        const orderBump = Boolean(body.orderBump);

        let amount = hasDiscount
          ? (Number(env.DISCOUNT_PRICE_CENTS) || 1400)
          : (Number(env.DEFAULT_PRICE_CENTS) || 1900);

        if (orderBump) {
          amount += 700; // +$7.00 USD
        }

        const stripeSecretKey = env.STRIPE_SECRET_KEY;

        // Se ainda NÃO colocou a chave da Stripe, retorna modo demo para não quebrar a tela
        if (!stripeSecretKey || stripeSecretKey.includes('SEU_') || !stripeSecretKey.startsWith('sk_')) {
          return new Response(JSON.stringify({
            clientSecret: 'demo_mode_no_key_configured',
            demo: true,
            amount: amount,
            message: 'Modo Demonstração ativo. Configure STRIPE_SECRET_KEY nas variáveis para pagamentos reais.'
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // Chamada HTTP nativa para api.stripe.com (100% compatível com Cloudflare Worker)
        const params = new URLSearchParams();
        params.append('amount', amount.toString());
        params.append('currency', (env.CURRENCY || 'usd').toLowerCase());
        params.append('automatic_payment_methods[enabled]', 'true');
        params.append('description', env.PRODUCT_NAME || 'Operación Calistenia Militar - 21 Días');
        params.append('metadata[customer_email]', body.email || '');
        params.append('metadata[customer_name]', body.name || '');
        params.append('metadata[has_discount]', hasDiscount ? 'true' : 'false');
        params.append('metadata[order_bump]', orderBump ? 'true' : 'false');
        if (body.utm_source) params.append('metadata[utm_source]', body.utm_source);
        if (body.utm_campaign) params.append('metadata[utm_campaign]', body.utm_campaign);

        const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        const stripeData = await stripeRes.json();

        if (stripeData.error) {
          return new Response(JSON.stringify({ error: stripeData.error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(JSON.stringify({
          clientSecret: stripeData.client_secret,
          amount: amount,
          demo: false
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

/**
 * Interface Visual: Dark Tático Militar de Alta Conversão
 */
function renderCheckoutHtml(env, searchParams) {
  const isDiscounted = searchParams.get('offDiscount') === 'MILITAR5' || searchParams.get('discount') === 'true';
  const defaultPrice = (Number(env.DEFAULT_PRICE_CENTS) || 1900) / 100;
  const discountPrice = (Number(env.DISCOUNT_PRICE_CENTS) || 1400) / 100;
  const publishableKey = env.STRIPE_PUBLISHABLE_KEY || '';

  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finalizar Inscripción — Operación Calistenia Militar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://js.stripe.com/v3/"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            tactical: ['"Chakra Petch"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #08090a; color: #f3f4f6; font-family: 'Inter', sans-serif; }
    .tactical-font { font-family: 'Chakra Petch', sans-serif; }
    .glow-military { box-shadow: 0 0 25px rgba(34, 197, 94, 0.25); }
    .glow-neon { box-shadow: 0 0 35px rgba(74, 222, 128, 0.4); }
  </style>
</head>
<body class="min-h-screen bg-[#08090a] text-neutral-100 flex flex-col selection:bg-emerald-500 selection:text-black relative overflow-x-hidden">

  <!-- Background Glows -->
  <div class="fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none"></div>
  <div class="fixed bottom-0 left-0 w-[500px] h-[400px] bg-[#5c7a5c]/10 blur-[120px] rounded-full pointer-events-none"></div>
  <div class="fixed inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

  <!-- Top Bar -->
  <header class="sticky top-0 z-50 bg-[#0e110f]/90 backdrop-blur-md border-b border-emerald-900/40 px-3 py-2 text-xs">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span class="font-bold text-emerald-400 tactical-font tracking-wider uppercase text-[11px] sm:text-xs">
          SESIÓN DE PAGO ENCRIPTADA (256-BIT SSL)
        </span>
      </div>
      <div class="flex items-center gap-1.5 text-neutral-400 bg-neutral-900/80 px-2.5 py-1 rounded-md border border-neutral-800">
        <i data-lucide="clock" class="w-3.5 h-3.5 text-emerald-400"></i>
        <span class="text-[11px]">Tu cupo expira en:</span>
        <span id="timer" class="font-mono font-bold text-emerald-400 text-xs">09:59</span>
      </div>
    </div>
  </header>

  <!-- Main Checkout -->
  <main class="max-w-4xl mx-auto px-4 py-8 sm:py-12 relative z-10 w-full flex-grow">
    
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-3">
        <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> PASO FINAL: ASIGNACIÓN DE EXPEDIENTE
      </div>
      <h1 class="text-2xl sm:text-4xl font-black uppercase tactical-font tracking-wide text-white">
        ACCESO AL PROTOCOLO MILITAR 21 DÍAS
      </h1>
      <p class="text-neutral-400 text-sm mt-2 max-w-xl mx-auto">
        Completa tus datos para sincronizar tu plan táctico personalizado y desbloquear la plataforma de entrenamiento militar.
      </p>
    </div>

    <!-- Banner Informativo se Stripe não estiver conectada ainda -->
    <div id="stripe-pending-banner" class="hidden max-w-4xl mx-auto mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 text-xs font-mono flex items-center gap-3">
      <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-400 shrink-0"></i>
      <div>
        <strong class="text-white block font-sans text-sm">Visualização de Demonstração Ativa</strong>
        A interface e cálculos estão 100% funcionais. Quando quiser receber pagamentos reais, basta adicionar suas chaves <code>STRIPE_SECRET_KEY</code> e <code>STRIPE_PUBLISHABLE_KEY</code> na Cloudflare.
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <!-- Formulário de Pagamento -->
      <div class="lg:col-span-7 bg-[#0c100e] border border-emerald-900/50 rounded-2xl p-5 sm:p-7 shadow-2xl relative">
        <div class="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
          <h2 class="text-lg font-bold tactical-font uppercase text-white flex items-center gap-2">
            <i data-lucide="credit-card" class="w-5 h-5 text-emerald-400"></i> Datos de Acceso y Pago
          </h2>
          <span class="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
            SEGURO & VERIFICADO
          </span>
        </div>

        <form id="payment-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase text-neutral-300 mb-1 tactical-font">Nombre y Apellido</label>
            <input type="text" id="cust-name" required placeholder="Ej. Carlos Mendoza" 
              class="w-full bg-[#141916] border border-neutral-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-colors" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase text-neutral-300 mb-1 tactical-font">Email donde recibirás tu acceso</label>
            <input type="email" id="cust-email" required placeholder="tucorreo@ejemplo.com" 
              class="w-full bg-[#141916] border border-neutral-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-colors" />
            <p class="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
              <i data-lucide="info" class="w-3 h-3 text-neutral-400"></i> Tus credenciales de la app serán enviadas a esta dirección.
            </p>
          </div>

          <!-- Stripe Card Area / Demo Area -->
          <div class="pt-2">
            <label class="block text-xs font-semibold uppercase text-neutral-300 mb-2 tactical-font">Información de Tarjeta / Método de Pago</label>
            <div id="payment-element-container" class="bg-[#141916] border border-neutral-800 rounded-xl p-3.5 focus-within:border-emerald-500 transition-colors min-h-[140px]">
              <div id="stripe-mount"></div>
              
              <!-- Demo Placeholder Visual (enquanto não coloca as chaves da Stripe) -->
              <div id="demo-card-preview" class="space-y-3">
                <div class="relative">
                  <input type="text" placeholder="1234 5678 9101 1121" disabled class="w-full bg-[#0d110f] border border-neutral-800 rounded-lg px-3 py-2.5 text-xs text-neutral-400 font-mono tracking-wider cursor-not-allowed" />
                  <div class="absolute right-3 top-2.5 flex gap-1">
                    <span class="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-1 rounded">VISA</span>
                    <span class="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-1 rounded">MC</span>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="MM / AA" disabled class="w-full bg-[#0d110f] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-400 font-mono cursor-not-allowed" />
                  <input type="text" placeholder="CVC" disabled class="w-full bg-[#0d110f] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-400 font-mono cursor-not-allowed" />
                </div>
                <p class="text-[10px] text-emerald-400/80 font-mono text-center pt-1">
                  🔒 Pasarela Stripe pronta para receber chaves
                </p>
              </div>
            </div>
          </div>

          <!-- Order Bump Tático -->
          <div class="mt-4 p-3.5 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/30 transition-colors cursor-pointer" onclick="toggleBump()">
            <div class="flex items-start gap-3">
              <input type="checkbox" id="order-bump-check" class="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-neutral-900 border-neutral-700" />
              <div>
                <p class="text-xs font-bold uppercase text-emerald-300 tactical-font flex items-center gap-1.5">
                  <span class="bg-emerald-500 text-black text-[10px] font-black px-1.5 rounded">OFERTA ÚNICA</span>
                  Añadir Protocolo de Nutrición Táctica (+ $7.00 USD)
                </p>
                <p class="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                  Acelera la pérdida de grasa y definición muscular con las 42 recetas de campamento militar sin pasar hambre.
                </p>
              </div>
            </div>
          </div>

          <!-- Feedback de Erro ou Sucesso -->
          <div id="payment-message" class="hidden p-3 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono"></div>

          <!-- Botão CTA -->
          <button type="submit" id="submit-btn" 
            class="w-full mt-4 py-4 px-6 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 hover:from-emerald-400 hover:to-green-300 text-black font-black text-base sm:text-lg uppercase text-center rounded-xl shadow-[0_0_25px_rgba(34,197,94,0.45)] hover:shadow-[0_0_35px_rgba(34,197,94,0.7)] transition-all tactical-font tracking-wider flex items-center justify-center gap-2 group cursor-pointer">
            <span id="btn-text">DESBLOQUEAR MI ACCESO INMEDIATO</span>
            <i data-lucide="arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform"></i>
          </button>
        </form>

        <div class="mt-4 flex items-center justify-center gap-4 text-neutral-500 text-xs">
          <span class="flex items-center gap-1"><i data-lucide="lock" class="w-3.5 h-3.5 text-emerald-400"></i> SSL 256-Bit</span>
          <span>•</span>
          <span class="flex items-center gap-1"><i data-lucide="zap" class="w-3.5 h-3.5 text-emerald-400"></i> Entrega Instantánea</span>
          <span>•</span>
          <span class="flex items-center gap-1"><i data-lucide="shield" class="w-3.5 h-3.5 text-emerald-400"></i> Garantía 30 Días</span>
        </div>
      </div>

      <!-- Resumo do Pedido -->
      <div class="lg:col-span-5 space-y-5">
        
        <div class="bg-[#0c100e] border border-neutral-800 rounded-2xl p-5 shadow-xl">
          <h3 class="text-xs font-mono uppercase text-neutral-400 tracking-wider mb-3">RESUMEN DE TU PLAN</h3>
          
          <div class="flex items-center gap-3.5 pb-4 border-b border-neutral-800/80">
            <div class="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <i data-lucide="award" class="w-6 h-6 text-emerald-400"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-white tactical-font">PROGRAMA CALISTENIA MILITAR 21D</h4>
              <p class="text-xs text-neutral-400">Acceso vitalicio + Actualizaciones de por vida</p>
            </div>
          </div>

          <div class="py-3 space-y-2 text-xs">
            <div class="flex justify-between text-neutral-400">
              <span>Precio regular:</span>
              <span class="line-through">$97.00 USD</span>
            </div>
            <div class="flex justify-between text-emerald-400 font-semibold">
              <span>Descuento de Evaluación:</span>
              <span id="discount-label">-${(97 - (isDiscounted ? discountPrice : defaultPrice)).toFixed(2)} USD</span>
            </div>
            <div id="bump-row" class="hidden flex justify-between text-emerald-300 font-semibold">
              <span>Protocolo de Nutrición Táctica:</span>
              <span>+$7.00 USD</span>
            </div>
            <div class="flex justify-between text-white font-black text-base pt-2 border-t border-neutral-800 tactical-font">
              <span>TOTAL A PAGAR:</span>
              <span id="display-total" class="text-emerald-400 text-xl">$${(isDiscounted ? discountPrice : defaultPrice).toFixed(2)} USD</span>
            </div>
          </div>

          <div class="mt-2 p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400 text-center font-mono">
            ⚡ Pago único. Sin cobros recurrentes ni suscripciones sorpresa.
          </div>
        </div>

        <div class="bg-[#0c100e] border border-neutral-800 rounded-2xl p-5 space-y-3">
          <h3 class="text-xs font-mono uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
            <i data-lucide="check-circle-2" class="w-4 h-4"></i> TODO LO QUE RECIBES HOY:
          </h3>
          <ul class="text-xs text-neutral-300 space-y-2">
            <li class="flex items-start gap-2">
              <i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
              <span><strong>Protocolo Táctico Diario:</strong> Rutinas de 15-20 min sin equipamiento.</span>
            </li>
            <li class="flex items-start gap-2">
              <i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
              <span><strong>Guía de Postura e Hipertrofia:</strong> Máxima ganancia muscular.</span>
            </li>
            <li class="flex items-start gap-2">
              <i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
              <span><strong>Comunidad Privada de Reclutas:</strong> Motivación y soporte 24/7.</span>
            </li>
          </ul>
        </div>

        <div class="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
            <i data-lucide="shield-alert" class="w-5 h-5"></i>
          </div>
          <div class="text-xs">
            <h4 class="font-bold text-white uppercase tactical-font">Garantía Blindada de Acero (30 Días)</h4>
            <p class="text-neutral-400 mt-1 leading-relaxed">
              Prueba el protocolo por 30 días. Si no notas cambios visibles en tu fuerza y definición muscular, te devolvemos el 100% de tu dinero sin preguntas.
            </p>
          </div>
        </div>

      </div>

    </div>
  </main>

  <footer class="border-t border-neutral-900 py-6 text-center text-xs text-neutral-600 font-mono">
    <p>Operación Calistenia Militar © Todos los derechos reservados.</p>
  </footer>

  <script>
    lucide.createIcons();

    // Cronômetro de Urgência
    let timeLeft = 599;
    const timerElem = document.getElementById('timer');
    setInterval(() => {
      if (timeLeft <= 0) return;
      timeLeft--;
      const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
      const s = String(timeLeft % 60).padStart(2, '0');
      timerElem.innerText = m + ':' + s;
    }, 1000);

    const urlParams = new URLSearchParams(window.location.search);
    const isDiscount = urlParams.get('offDiscount') === 'MILITAR5' || urlParams.get('discount') === 'true';
    let basePrice = isDiscount ? ${discountPrice} : ${defaultPrice};
    let currentTotal = basePrice;
    let stripe = null;
    let elements = null;
    let publishableKey = "${publishableKey}";
    let isDemoMode = !publishableKey || !publishableKey.startsWith('pk_');

    if (isDemoMode) {
      document.getElementById('stripe-pending-banner').classList.remove('hidden');
    }

    function toggleBump() {
      const check = document.getElementById('order-bump-check');
      check.checked = !check.checked;
      updateTotal();
    }
    document.getElementById('order-bump-check').addEventListener('click', (e) => {
      e.stopPropagation();
      updateTotal();
    });

    function updateTotal() {
      const bumpChecked = document.getElementById('order-bump-check').checked;
      const bumpRow = document.getElementById('bump-row');
      currentTotal = basePrice + (bumpChecked ? 7.00 : 0.00);
      
      if (bumpChecked) {
        bumpRow.classList.remove('hidden');
      } else {
        bumpRow.classList.add('hidden');
      }
      document.getElementById('display-total').innerText = '$' + currentTotal.toFixed(2) + ' USD';
      
      if (!isDemoMode) {
        initStripeElements();
      }
    }

    async function initStripeElements() {
      if (isDemoMode) return;

      try {
        const bumpChecked = document.getElementById('order-bump-check').checked;
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discount: isDiscount,
            orderBump: bumpChecked,
            email: document.getElementById('cust-email').value,
            name: document.getElementById('cust-name').value
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        if (!stripe) {
          stripe = Stripe(publishableKey);
        }

        const appearance = {
          theme: 'night',
          variables: {
            colorPrimary: '#22c55e',
            colorBackground: '#141916',
            colorText: '#f3f4f6',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '12px',
          }
        };

        elements = stripe.elements({ appearance, clientSecret: data.clientSecret });
        const paymentElement = elements.create('payment');
        
        document.getElementById('demo-card-preview').classList.add('hidden');
        const mount = document.getElementById('stripe-mount');
        mount.innerHTML = '';
        paymentElement.mount('#stripe-mount');
      } catch (e) {
        console.warn('Stripe Init:', e);
      }
    }

    initStripeElements();

    // Envio do Formulário
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('submit-btn');
      const btnText = document.getElementById('btn-text');
      const messageElem = document.getElementById('payment-message');
      
      submitBtn.disabled = true;
      btnText.innerText = 'PROCESANDO TRANSACCIÓN...';
      messageElem.classList.add('hidden');

      if (isDemoMode) {
        // Se ainda não conectou a Stripe, simula aprovação com sucesso para testar o fluxo!
        setTimeout(() => {
          showSuccessScreen();
        }, 1200);
        return;
      }

      const name = document.getElementById('cust-name').value;
      const email = document.getElementById('cust-email').value;

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/checkout?success=true',
          receipt_email: email,
          payment_method_data: {
            billing_details: { name, email }
          }
        }
      });

      if (error) {
        messageElem.textContent = error.message;
        messageElem.classList.remove('hidden');
        submitBtn.disabled = false;
        btnText.innerText = 'DESBLOQUEAR MI ACCESO INMEDIATO';
      }
    });

    function showSuccessScreen() {
      document.querySelector('main').innerHTML = \`
        <div class="max-w-md mx-auto text-center py-16 bg-[#0c100e] border border-emerald-500/40 rounded-2xl p-8 glow-military">
          <div class="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 mb-4">
            <i data-lucide="check" class="w-8 h-8"></i>
          </div>
          <h2 class="text-2xl font-black tactical-font text-white uppercase">¡PAGO CONFIRMADO CON ÉXITO!</h2>
          <p class="text-xs font-mono text-emerald-400 mt-2">RECLUTA ADMITIDO AL SISTEMA</p>
          <p class="text-neutral-300 text-sm mt-4">
            Hemos enviado las instrucciones tácticas y tu acceso inmediato al correo electrónico proporcionado.
          </p>
          <a href="/checkout" class="mt-6 inline-block w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-xl tactical-font transition-all">
            VOLVER AL INICIO
          </a>
        </div>
      \`;
      lucide.createIcons();
    }

    if (urlParams.get('redirect_status') === 'succeeded' || urlParams.get('success') === 'true') {
      showSuccessScreen();
    }
  </script>
</body>
</html>`;
}
