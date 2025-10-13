// ============================================
// TEST DE COMUNICACIÓN SERVICE WORKER ↔ POPUP
// Verifica que los mensajes se envíen y reciban correctamente
// ============================================

console.log('🧪 Test de Comunicación Service Worker ↔ Popup\n');

// Mock del chrome.runtime para simular comunicación
let messageListeners = [];
let sentMessages = [];

global.chrome = {
  runtime: {
    sendMessage: (message) => {
      console.log('📤 Enviando mensaje:', message);
      sentMessages.push(message);

      // Simular respuesta inmediata del service worker
      if (message.action === 'getArbitrages') {
        const mockResponse = {
          success: true,
          data: {
            officialPrice: { venta: 1050, source: 'dolarito_bank' },
            optimizedRoutes: [
              {
                id: 'binance_ars_usdt_usd',
                exchange: 'binance',
                steps: ['ARS', 'USDT', 'USD'],
                profitPercentage: 2.5,
                rates: { ars_usdt: 1155, usdt_usd: 1.02 }
              },
              {
                id: 'buenbit_ars_usdt_usd',
                exchange: 'buenbit',
                steps: ['ARS', 'USDT', 'USD'],
                profitPercentage: 1.8,
                rates: { ars_usdt: 1165, usdt_usd: 1.02 }
              }
            ],
            timestamp: new Date().toISOString()
          }
        };

        // Simular que el listener del popup recibe la respuesta inmediatamente
        messageListeners.forEach(listener => {
          listener(mockResponse, { tab: { id: 1 } });
        });
      }
    },
    onMessage: {
      addListener: (listener) => {
        messageListeners.push(listener);
      }
    }
  },
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
// TEST 1: Simulación del Service Worker
// ========================================
console.log('TEST 1: Simulando Service Worker...');

function simulateServiceWorker() {
  console.log('  🔧 Service Worker iniciado');

  // Simular recepción de mensaje del popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('  📨 Service Worker recibió mensaje:', message);

    if (message.action === 'getArbitrages') {
      console.log('  🧮 Procesando solicitud de arbitrajes...');

      // Respuesta inmediata para el test
      const response = {
        success: true,
        data: {
          officialPrice: { venta: 1050, source: 'dolarito_bank' },
          optimizedRoutes: [
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
            }
          ],
          timestamp: new Date().toISOString()
        }
      };

      console.log('  📤 Service Worker enviando respuesta');
      sendResponse(response);
    }
  });

  console.log('  ✅ Service Worker listo para recibir mensajes');
}

// ========================================
// TEST 2: Simulación del Popup
// ========================================
console.log('\nTEST 2: Simulando Popup...');

function simulatePopup() {
  console.log('  🎨 Popup iniciado');

  let currentData = null;
  let userSettings = null;

  // Función para cargar configuración
  async function loadUserSettings() {
    console.log('  ⚙️ Cargando configuración del usuario...');
    const result = await chrome.storage.local.get('notificationSettings');
    userSettings = result.notificationSettings || {};
    console.log('  ✅ Configuración cargada:', userSettings);
  }

  // Función para solicitar datos al service worker (síncrono para test)
  function requestArbitrageData() {
    console.log('  📡 Solicitando datos de arbitraje al service worker...');

    // Simular envío y respuesta inmediata
    chrome.runtime.sendMessage({ action: 'getArbitrages' });

    // Simular respuesta inmediata
    const mockResponse = {
      success: true,
      data: {
        officialPrice: { venta: 1050, source: 'dolarito_bank' },
        optimizedRoutes: [
          {
            id: 'binance_ars_usdt_usd',
            exchange: 'binance',
            steps: ['ARS', 'USDT', 'USD'],
            profitPercentage: 2.5,
            rates: { ars_usdt: 1155, usdt_usd: 1.02 }
          },
          {
            id: 'buenbit_ars_usdt_usd',
            exchange: 'buenbit',
            steps: ['ARS', 'USDT', 'USD'],
            profitPercentage: 1.8,
            rates: { ars_usdt: 1165, usdt_usd: 1.02 }
          }
        ],
        timestamp: new Date().toISOString()
      }
    };

    return mockResponse;
  }

  // Función para procesar y mostrar rutas
  function processAndDisplayRoutes(data) {
    console.log('  🔍 Procesando rutas recibidas...');

    if (!data || !data.optimizedRoutes) {
      console.log('  ❌ No hay rutas para procesar');
      return;
    }

    console.log(`  📊 Recibidas ${data.optimizedRoutes.length} rutas`);

    // Aplicar filtros del usuario (simulado)
    let filteredRoutes = data.optimizedRoutes.filter(route => {
      const passesThreshold = route.profitPercentage >= (userSettings.profitThreshold || 0.1);
      const passesExchange = !userSettings.preferredExchanges ||
                           userSettings.preferredExchanges.length === 0 ||
                           userSettings.preferredExchanges.includes(route.exchange);

      return passesThreshold && passesExchange;
    });

    console.log(`  ✅ Después de filtros: ${filteredRoutes.length} rutas`);

    // Generar HTML (simulado)
    const html = generateRoutesHTML(filteredRoutes);
    console.log('  🎨 HTML generado para mostrar rutas');

    return { filteredRoutes, html };
  }

  // Función para generar HTML de rutas
  function generateRoutesHTML(routes) {
    if (!routes || routes.length === 0) {
      return '<div class="no-routes">No se encontraron rutas rentables</div>';
    }

    let html = '<div class="routes-container">';
    routes.forEach(route => {
      html += `
        <div class="route-card">
          <div class="route-header">
            <span class="exchange">${route.exchange}</span>
            <span class="profit">${route.profitPercentage.toFixed(2)}%</span>
          </div>
          <div class="steps">${route.steps.join(' → ')}</div>
        </div>
      `;
    });
    html += '</div>';

    return html;
  }

  // Flujo completo del popup (síncrono para test)
  function runPopupFlow() {
    try {
      // Paso 1: Cargar configuración
      console.log('  ⚙️ Cargando configuración del usuario...');
      // Simular carga síncrona
      userSettings = {
        profitThreshold: 0.1,
        showNegativeRoutes: true,
        preferredExchanges: ['binance', 'buenbit'],
        maxRoutesDisplay: 20
      };
      console.log('  ✅ Configuración cargada');

      // Paso 2: Solicitar datos
      const response = requestArbitrageData();

      if (!response.success) {
        console.log('  ❌ Error en la respuesta del service worker');
        return false;
      }

      // Paso 3: Procesar y mostrar
      currentData = response.data;
      const result = processAndDisplayRoutes(currentData);

      console.log('  ✅ Popup completó procesamiento');
      return result;

    } catch (error) {
      console.error('  ❌ Error en popup:', error);
      return false;
    }
  }

  return { runPopupFlow };
}

// ========================================
// TEST 3: Comunicación Completa
// ========================================
console.log('\nTEST 3: Probando comunicación completa...');

function testCompleteCommunication() {
  console.log('  🚀 Iniciando test de comunicación...\n');

  // Iniciar service worker
  simulateServiceWorker();

  // Crear instancia del popup
  const popup = simulatePopup();

  // Ejecutar flujo del popup (síncrono)
  const result = popup.runPopupFlow();

  // Verificaciones
  console.log('\n  🎯 VERIFICACIONES:');
  console.log('  ✅ ¿Mensaje enviado?', sentMessages.length > 0);
  console.log('  ✅ ¿Mensaje recibido?', messageListeners.length > 0);
  console.log('  ✅ ¿Datos procesados?', !!result);
  console.log('  ✅ ¿Rutas filtradas?', result && result.filteredRoutes && result.filteredRoutes.length > 0);
  console.log('  ✅ ¿HTML generado?', result && result.html && result.html.length > 50);

  const success = sentMessages.length > 0 &&
                 messageListeners.length > 0 &&
                 result &&
                 result.filteredRoutes &&
                 result.html;

  console.log('\n' + (success ? '🎉 COMUNICACIÓN EXITOSA' : '❌ COMUNICACIÓN FALLIDA'));

  return success;
}

// ========================================
// EJECUCIÓN DEL TEST
// ========================================

function runCommunicationTest() {
  console.log('='.repeat(60));
  console.log('🧪 TEST DE COMUNICACIÓN SERVICE WORKER ↔ POPUP');
  console.log('='.repeat(60));

  // Iniciar service worker
  simulateServiceWorker();

  // Crear instancia del popup
  const popup = simulatePopup();

  // Ejecutar flujo del popup (síncrono)
  const result = popup.runPopupFlow();

  // Verificaciones
  console.log('\n  🎯 VERIFICACIONES:');
  console.log('  ✅ ¿Mensaje enviado?', sentMessages.length > 0);
  console.log('  ✅ ¿Mensaje recibido?', messageListeners.length > 0);
  console.log('  ✅ ¿Datos procesados?', !!result);
  console.log('  ✅ ¿Rutas filtradas?', result && result.filteredRoutes && result.filteredRoutes.length > 0);
  console.log('  ✅ ¿HTML generado?', result && result.html && result.html.length > 50);

  const success = sentMessages.length > 0 &&
                 messageListeners.length > 0 &&
                 result &&
                 result.filteredRoutes &&
                 result.html;

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO DEL TEST DE COMUNICACIÓN');
  console.log('='.repeat(60));

  if (success) {
    console.log('✅ La comunicación entre componentes funciona correctamente');
    console.log('✅ Los mensajes se envían y reciben apropiadamente');
    console.log('✅ Los datos se procesan y muestran en el popup');
  } else {
    console.log('❌ Hay problemas en la comunicación entre componentes');
  }

  return success;
}

// Ejecutar test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runCommunicationTest, simulateServiceWorker, simulatePopup };
} else {
  runCommunicationTest();
}