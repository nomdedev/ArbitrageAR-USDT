// Debug script para identificar por qué no se muestran rutas
// Ejecutar con: node debug-extension.js

function isP2PRoute(route) {
  if (!route) return false;

  const brokerName = route.broker?.toLowerCase() || '';
  const buyName = route.buyExchange?.toLowerCase() || '';
  const sellName = route.sellExchange?.toLowerCase() || '';

  // Prioridad 1: Usar el campo requiresP2P calculado en backend
  if (typeof route.requiresP2P === 'boolean') {
    return route.requiresP2P;
  }

  // Fallback 1: Verificar nombre del broker
  if (brokerName.includes('p2p')) {
    return true;
  }

  // Fallback 2: Verificar nombres de exchanges
  if (buyName.includes('p2p') || sellName.includes('p2p')) {
    return true;
  }

  return false; // NO-P2P por defecto
}

async function fetchWithRateLimit(url) {
  console.log(`🌐 Fetching: ${url}`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(`✅ ${url}: OK`);
    return data;
  } catch(e) {
    console.log(`❌ ${url}: ${e.message}`);
    return null;
  }
}

async function fetchDolaritoOficial() {
  return await fetchWithRateLimit('https://dolarapi.com/v1/dolares/oficial');
}

async function fetchCriptoyaUSDT() {
  return await fetchWithRateLimit('https://criptoya.com/api/usdt/ars');
}

async function fetchCriptoyaUSDTtoUSD() {
  return await fetchWithRateLimit('https://criptoya.com/api/usdt/usd/1');
}

function calculateOptimizedRoutes(oficial, usdt, usdtUsd) {
  console.log('🧮 Calculando rutas...');

  if (!oficial || !usdt || !usdtUsd) {
    console.log('❌ Faltan datos:', { oficial: !!oficial, usdt: !!usdt, usdtUsd: !!usdtUsd });
    return [];
  }

  const routes = [];
  const officialSellPrice = oficial.venta;

  console.log(`💵 Dólar oficial: ${officialSellPrice}`);
  console.log(`📊 Exchanges USDT: ${Object.keys(usdt).length}`);

  // Iterar sobre exchanges USDT/ARS
  for (const [exchangeName, exchangeData] of Object.entries(usdt)) {
    if (!exchangeData || !exchangeData.ask || !exchangeData.totalAsk) continue;

    const usdtBuyPrice = exchangeData.totalAsk;
    const usdtSellPrice = exchangeData.totalBid;

    let usdToUsdtRate = 1;
    if (usdtUsd && usdtUsd.buenbit && usdtUsd.buenbit.ask) {
      usdToUsdtRate = usdtUsd.buenbit.ask;
    }

    // Ruta 1: ARS -> USDT -> USD
    const arsToUsdtToUsd = {
      id: `${exchangeName}_ars_usdt_usd`,
      exchange: exchangeName,
      steps: ['ARS', 'USDT', 'USD'],
      profitPercentage: ((officialSellPrice / usdtBuyPrice / usdToUsdtRate) - 1) * 100,
      requiresP2P: false
    };

    routes.push(arsToUsdtToUsd);

    // Ruta 2: USD -> USDT -> ARS
    const usdToUsdtToArs = {
      id: `${exchangeName}_usd_usdt_ars`,
      exchange: exchangeName,
      steps: ['USD', 'USDT', 'ARS'],
      profitPercentage: ((usdtSellPrice / usdToUsdtRate / officialSellPrice) - 1) * 100,
      requiresP2P: false
    };

    routes.push(usdToUsdtToArs);
  }

  routes.sort((a, b) => b.profitPercentage - a.profitPercentage);
  console.log(`✅ Calculadas ${routes.length} rutas`);
  console.log('📊 Top 3 rutas:', routes.slice(0, 3).map(r => `${r.exchange}: ${r.profitPercentage.toFixed(2)}%`));

  return routes.slice(0, 10);
}

async function debugExtension() {
  console.log('🔧 DEBUGGING EXTENSION\n');

  console.log('1. Testing APIs...');
  const [oficial, usdt, usdtUsd] = await Promise.all([
    fetchDolaritoOficial(),
    fetchCriptoyaUSDT(),
    fetchCriptoyaUSDTtoUSD()
  ]);

  console.log('\n2. API Results:');
  console.log(`Oficial: ${oficial ? 'OK' : 'FAILED'}`);
  console.log(`USDT: ${usdt ? Object.keys(usdt).length + ' exchanges' : 'FAILED'}`);
  console.log(`USDT/USD: ${usdtUsd ? 'OK' : 'FAILED'}`);

  if (!oficial || !usdt) {
    console.log('\n❌ CRITICAL: Missing required data - this would cause no routes to show');
    return;
  }

  console.log('\n3. Calculating routes...');
  const routes = calculateOptimizedRoutes(oficial, usdt, usdtUsd);

  console.log('\n4. Filtering simulation...');
  const profitThreshold = 1.0; // Default
  const showNegativeRoutes = true; // Default

  let filtered = routes.filter(r => showNegativeRoutes || r.profitPercentage >= profitThreshold);
  console.log(`Original routes: ${routes.length}`);
  console.log(`After profit filter (≥${profitThreshold}% or negative): ${filtered.length}`);

  // Simulate P2P filter (default: no-p2p)
  const noP2pRoutes = filtered.filter(route => !isP2PRoute(route));
  console.log(`After P2P filter (no-p2p): ${noP2pRoutes.length}`);

  console.log('\n5. P2P Analysis:');
  routes.slice(0, 5).forEach(route => {
    console.log(`${route.exchange}: P2P=${isP2PRoute(route)} (${route.profitPercentage.toFixed(2)}%)`);
  });

  if (noP2pRoutes.length === 0) {
    console.log('\n❌ RESULT: No routes would be shown to user!');
    console.log('Possible causes:');
    console.log('- All routes are P2P and filter is set to no-p2p');
    console.log('- All routes have profit < 1.0% and showNegativeRoutes is false');
    console.log('- API data is incorrect');
  } else {
    console.log('\n✅ RESULT: Routes would be shown');
    console.log('Sample routes:', noP2pRoutes.slice(0, 3).map(r => `${r.exchange}: ${r.profitPercentage.toFixed(2)}%`));
  }
}

debugExtension().catch(console.error);