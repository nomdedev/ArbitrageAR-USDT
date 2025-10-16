// Test básico para verificar funcionalidad de notificaciones
// Ejecutar con: node test_notifications.js

const fs = require('fs');

// Variables globales necesarias
let lastNotificationTime = 0;
let notifiedArbitrages = new Set();

// Simular chrome API para testing

// Simular chrome API para testing
global.chrome = {
  storage: {
    local: {
      get: async (key) => {
        return {
          notificationSettings: {
            notificationsEnabled: true,
            alertType: 'all',
            customThreshold: 5,
            notificationFrequency: '15min',
            soundEnabled: true,
            preferredExchanges: [],
            quietHoursEnabled: false,
            quietStart: '22:00',
            quietEnd: '08:00'
          }
        };
      }
    }
  },
  notifications: {
    create: async (id, options) => {
      console.log('🔔 NOTIFICACIÓN CREADA:');
      console.log('ID:', id);
      console.log('Título:', options.title);
      console.log('Mensaje:', options.message);
      console.log('Prioridad:', options.priority);
      console.log('Botones:', options.buttons?.length || 0);
      return id;
    }
  }
};

// Cargar el código del service worker
const serviceWorkerCode = fs.readFileSync('./src/background/main-simple.js', 'utf8');

// Extraer las funciones de notificación usando regex
const shouldSendNotificationMatch = serviceWorkerCode.match(/async function shouldSendNotification\([\s\S]*?\n}/);
const sendNotificationMatch = serviceWorkerCode.match(/async function sendNotification\([\s\S]*?\n}/);
const checkAndNotifyMatch = serviceWorkerCode.match(/async function checkAndNotify\([\s\S]*?\n}/);

if (!shouldSendNotificationMatch || !sendNotificationMatch || !checkAndNotifyMatch) {
  console.error('❌ No se pudieron extraer las funciones de notificación');
  process.exit(1);
}

// Crear funciones globales
eval(shouldSendNotificationMatch[0]);
eval(sendNotificationMatch[0]);
eval(checkAndNotifyMatch[0]);

// Test data
const testArbitrage = {
  broker: 'TestExchange',
  profitPercent: 8.5,
  usdToUsdtRate: 0.95,
  usdtArsBid: 950
};

const testSettings = {
  notificationsEnabled: true,
  alertType: 'all',
  customThreshold: 5,
  notificationFrequency: '15min',
  soundEnabled: true,
  preferredExchanges: [],
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '08:00'
};

async function runTests() {
  console.log('🧪 Ejecutando tests de notificaciones...\n');

  // Test 1: Verificar shouldSendNotification
  console.log('Test 1: shouldSendNotification');
  const shouldNotify = await shouldSendNotification(testSettings, testArbitrage);
  console.log('¿Debería notificar?', shouldNotify ? '✅ SÍ' : '❌ NO');
  console.log('');

  // Test 2: Verificar sendNotification
  console.log('Test 2: sendNotification');
  await sendNotification(testArbitrage, testSettings);
  console.log('');

  // Test 3: Verificar checkAndNotify
  console.log('Test 3: checkAndNotify');
  await checkAndNotify([testArbitrage]);
  console.log('');

  console.log('✅ Tests completados');
}

runTests().catch(console.error);