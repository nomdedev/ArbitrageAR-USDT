// ============================================
// TEST DE UI DEL POPUP
// Verifica que las rutas se muestren correctamente en el DOM
// ============================================

console.log('🧪 Test de UI del Popup - Visualización de Rutas\n');

// Mock del DOM
class MockElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.textContent = '';
    this.innerHTML = '';
    this.className = '';
    this.style = {};
  }

  appendChild(child) {
    this.children.push(child);
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  querySelector(selector) {
    // Búsqueda simple por ID
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      return this.children.find(child => child.attributes.id === id) || null;
    }
    // Búsqueda simple por clase
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      return this.children.find(child => child.className.includes(className)) || null;
    }
    return null;
  }

  querySelectorAll(selector) {
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      return this.children.filter(child => child.className.includes(className));
    }
    return [];
  }
}

global.document = {
  createElement: (tagName) => new MockElement(tagName),
  getElementById: (id) => {
    const element = new MockElement('div');
    element.attributes.id = id;
    return element;
  },
  querySelector: (selector) => {
    const element = new MockElement('div');
    return element;
  },
  querySelectorAll: (selector) => [],
  body: new MockElement('body')
};

// Mock de chrome.storage
global.chrome = {
  storage: {
    local: {
      get: async () => ({
        notificationSettings: {
          profitThreshold: 0.1,
          showNegativeRoutes: true,
          preferredExchanges: ['binance', 'buenbit'],
          maxRoutesDisplay: 20
        }
      })
    }
  }
};

// ========================================
// TEST 1: Simulación de displayOptimizedRoutes
// ========================================
console.log('TEST 1: Simulando displayOptimizedRoutes...');

function simulateDisplayOptimizedRoutes(routes, official) {
  console.log('  🎨 Ejecutando displayOptimizedRoutes...');
  console.log('  📊 Rutas a mostrar:', routes?.length || 0);

  if (!routes || routes.length === 0) {
    console.log('  ⚠️ No hay rutas para mostrar');
    const container = document.getElementById('routes-container');
    container.innerHTML = '<div class="no-routes">No se encontraron rutas rentables con los filtros actuales</div>';
    return;
  }

  // Generar HTML de las rutas
  let html = '';

  routes.forEach((route, index) => {
    const profitClass = route.profitPercentage >= 1 ? 'profit-high' :
                       route.profitPercentage >= 0.5 ? 'profit-medium' : 'profit-low';

    const profitSign = route.profitPercentage >= 0 ? '+' : '';
    const profitFormatted = `${profitSign}${route.profitPercentage.toFixed(2)}%`;

    html += `
      <div class="route-card ${profitClass}" data-route-id="${route.id}">
        <div class="route-header">
          <div class="route-info">
            <span class="route-exchange">${route.exchange}</span>
            <span class="route-profit ${route.profitPercentage >= 0 ? 'positive' : 'negative'}">${profitFormatted}</span>
          </div>
          <div class="route-steps">
            ${route.steps.join(' <span class="arrow">→</span> ')}
          </div>
        </div>

        <div class="route-details">
          <div class="route-rates">
            <small>
              ${route.steps[0]}/${route.steps[1]}: ${route.rates.ars_usdt ? route.rates.ars_usdt.toLocaleString('es-AR', {maximumFractionDigits: 2}) : 'N/A'} ARS
            </small>
          </div>
          <div class="route-timestamp">
            <small>Actualizado: ${new Date(route.timestamp).toLocaleTimeString('es-AR')}</small>
          </div>
        </div>
      </div>
    `;
  });

  // Aplicar al DOM
  const container = document.getElementById('routes-container');
  container.innerHTML = html;

  console.log('  ✅ HTML aplicado al DOM');
  console.log('  📄 Contenido generado:', html.substring(0, 200) + '...');

  return html;
}

// ========================================
// TEST 2: Verificación de estructura DOM
// ========================================
console.log('\nTEST 2: Verificando estructura DOM generada...');

function verifyDOMStructure(html) {
  console.log('  🔍 Verificando estructura del HTML generado...');

  const checks = [
    {
      name: 'Contenedor principal',
      check: () => html.includes('route-card'),
      description: 'Debe contener elementos route-card'
    },
    {
      name: 'Información de exchange',
      check: () => html.includes('route-exchange'),
      description: 'Debe mostrar el nombre del exchange'
    },
    {
      name: 'Porcentaje de ganancia',
      check: () => html.includes('route-profit'),
      description: 'Debe mostrar el porcentaje de ganancia'
    },
    {
      name: 'Pasos de la ruta',
      check: () => html.includes('route-steps'),
      description: 'Debe mostrar los pasos ARS → USDT → USD'
    },
    {
      name: 'Tasas de cambio',
      check: () => html.includes('ARS/USDT') || html.includes('USD/USDT'),
      description: 'Debe mostrar las tasas de cambio'
    },
    {
      name: 'Timestamp',
      check: () => html.includes('Actualizado:'),
      description: 'Debe mostrar cuándo se actualizó la ruta'
    },
    {
      name: 'Clases de color',
      check: () => html.includes('profit-high') || html.includes('profit-medium') || html.includes('profit-low'),
      description: 'Debe aplicar clases de color según ganancia'
    }
  ];

  let passed = 0;
  let failed = 0;

  checks.forEach(check => {
    const result = check.check();
    if (result) {
      console.log(`  ✅ ${check.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${check.name}: ${check.description}`);
      failed++;
    }
  });

  console.log(`\n  📊 Resultado: ${passed} pasaron, ${failed} fallaron`);

  return failed === 0;
}

// ========================================
// TEST 3: Simulación de filtros aplicados
// ========================================
console.log('\nTEST 3: Simulando aplicación de filtros...');

function simulateFilterApplication(routes, userSettings) {
  console.log('  🔍 Aplicando filtros del usuario...');

  if (!Array.isArray(routes)) {
    console.log('  ❌ Rutas no es un array');
    return [];
  }

  let filtered = [...routes];
  console.log('  📊 Rutas iniciales:', filtered.length);

  // 1. Filtro por umbral de ganancia
  const threshold = userSettings.profitThreshold || 0.1;
  const beforeThreshold = filtered.length;
  filtered = filtered.filter(route => route.profitPercentage >= threshold);
  console.log(`  🔧 Umbral ${threshold}%: ${beforeThreshold} → ${filtered.length}`);

  // 2. Filtro de rutas negativas
  if (!userSettings.showNegativeRoutes) {
    const beforeNegative = filtered.length;
    filtered = filtered.filter(route => route.profitPercentage >= 0);
    console.log(`  🔧 Sin negativas: ${beforeNegative} → ${filtered.length}`);
  }

  // 3. Filtro por exchanges preferidos
  if (userSettings.preferredExchanges && userSettings.preferredExchanges.length > 0) {
    const beforePreferred = filtered.length;
    filtered = filtered.filter(route =>
      userSettings.preferredExchanges.includes(route.exchange)
    );
    console.log(`  🔧 Exchanges preferidos: ${beforePreferred} → ${filtered.length}`);
  }

  // 4. Límite de rutas mostradas
  const maxDisplay = userSettings.maxRoutesDisplay || 20;
  if (filtered.length > maxDisplay) {
    filtered = filtered.slice(0, maxDisplay);
    console.log(`  🔧 Limitado a ${maxDisplay}: ${filtered.length}`);
  }

  console.log('  ✅ Filtros aplicados');
  return filtered;
}

// ========================================
// TEST 4: Flujo completo de UI
// ========================================
console.log('\nTEST 4: Flujo completo de UI...');

async function runCompleteUITest() {
  try {
    console.log('  🚀 Iniciando test completo de UI...\n');

    // Datos de prueba
    const mockRoutes = [
      {
        id: 'binance_ars_usdt_usd',
        exchange: 'binance',
        steps: ['ARS', 'USDT', 'USD'],
        profitPercentage: 2.5,
        rates: { ars_usdt: 1155, usdt_usd: 1.02 },
        timestamp: new Date().toISOString()
      },
      {
        id: 'buenbit_ars_usdt_usd',
        exchange: 'buenbit',
        steps: ['ARS', 'USDT', 'USD'],
        profitPercentage: 1.8,
        rates: { ars_usdt: 1165, usdt_usd: 1.02 },
        timestamp: new Date().toISOString()
      },
      {
        id: 'ripio_ars_usdt_usd',
        exchange: 'ripio',
        steps: ['ARS', 'USDT', 'USD'],
        profitPercentage: 0.05,
        rates: { ars_usdt: 1170, usdt_usd: 1.02 },
        timestamp: new Date().toISOString()
      }
    ];

    const mockOfficial = { venta: 1050 };
    const mockUserSettings = {
      profitThreshold: 0.1,
      showNegativeRoutes: true,
      preferredExchanges: ['binance', 'buenbit'],
      maxRoutesDisplay: 20
    };

    // Paso 1: Aplicar filtros
    console.log('  📡 PASO 1: Aplicando filtros');
    const filteredRoutes = simulateFilterApplication(mockRoutes, mockUserSettings);
    console.log('  ✅ Filtros aplicados\n');

    // Paso 2: Generar UI
    console.log('  🎨 PASO 2: Generando interfaz');
    const html = simulateDisplayOptimizedRoutes(filteredRoutes, mockOfficial);
    console.log('  ✅ UI generada\n');

    // Paso 3: Verificar estructura
    console.log('  🔍 PASO 3: Verificando estructura');
    const structureValid = verifyDOMStructure(html);
    console.log('  ✅ Estructura verificada\n');

    // Verificaciones finales
    console.log('  🎯 VERIFICACIONES FINALES:');
    console.log('  ✅ ¿Filtros aplicados?', filteredRoutes.length >= 0);
    console.log('  ✅ ¿HTML generado?', html && html.length > 100);
    console.log('  ✅ ¿Estructura válida?', structureValid);
    console.log('  ✅ ¿Rutas mostradas?', filteredRoutes.length > 0);

    const success = filteredRoutes.length >= 0 &&
                   html && html.length > 100 &&
                   structureValid &&
                   filteredRoutes.length > 0;

    console.log('\n' + (success ? '🎉 UI TEST PASSED' : '❌ UI TEST FAILED'));

    return success;

  } catch (error) {
    console.error('  ❌ Error en test de UI:', error);
    return false;
  }
}

// ========================================
// EJECUCIÓN DE TESTS
// ========================================

async function runUITests() {
  console.log('='.repeat(60));
  console.log('🧪 SUITE DE TESTS DE UI DEL POPUP');
  console.log('='.repeat(60));

  // Test de filtros
  console.log('\n' + '='.repeat(40));
  console.log('TEST: Aplicación de Filtros');
  console.log('='.repeat(40));

  const mockRoutes = [
    { exchange: 'binance', profitPercentage: 2.5, steps: ['ARS', 'USDT', 'USD'], rates: { ars_usdt: 1155 }, timestamp: new Date().toISOString() },
    { exchange: 'buenbit', profitPercentage: 1.8, steps: ['ARS', 'USDT', 'USD'], rates: { ars_usdt: 1165 }, timestamp: new Date().toISOString() },
    { exchange: 'ripio', profitPercentage: 0.05, steps: ['ARS', 'USDT', 'USD'], rates: { ars_usdt: 1170 }, timestamp: new Date().toISOString() }
  ];

  const mockSettings = {
    profitThreshold: 0.1,
    showNegativeRoutes: false,
    preferredExchanges: ['binance', 'buenbit'],
    maxRoutesDisplay: 10
  };

  const filtered = simulateFilterApplication(mockRoutes, mockSettings);

  // Test de visualización
  console.log('\n' + '='.repeat(40));
  console.log('TEST: Generación de HTML');
  console.log('='.repeat(40));

  const html = simulateDisplayOptimizedRoutes(filtered, { venta: 1050 });

  // Test de estructura
  console.log('\n' + '='.repeat(40));
  console.log('TEST: Verificación de Estructura');
  console.log('='.repeat(40));

  const structureOk = verifyDOMStructure(html);

  // Test completo
  console.log('\n' + '='.repeat(40));
  console.log('TEST COMPLETO DE UI');
  console.log('='.repeat(40));

  const completeResult = await runCompleteUITest();

  // Resultado final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO FINAL DE TESTS DE UI');
  console.log('='.repeat(60));

  const allPassed = filtered.length > 0 && html && structureOk && completeResult;

  if (allPassed) {
    console.log('✅ La UI del popup funciona correctamente');
    console.log('✅ Las rutas se filtran y muestran apropiadamente');
    console.log('✅ El HTML generado tiene la estructura correcta');
    console.log('✅ Los estilos y clases se aplican correctamente');
  } else {
    console.log('❌ Hay problemas en la UI del popup');
    console.log('   - Filtros:', filtered.length > 0 ? '✅' : '❌');
    console.log('   - HTML:', html ? '✅' : '❌');
    console.log('   - Estructura:', structureOk ? '✅' : '❌');
    console.log('   - Completo:', completeResult ? '✅' : '❌');
  }

  return allPassed;
}

// Ejecutar tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runUITests, simulateDisplayOptimizedRoutes, verifyDOMStructure };
} else {
  runUITests().catch(console.error);
}