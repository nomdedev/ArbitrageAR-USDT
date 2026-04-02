/**
 * Script de prueba para el indicador de actualización no invasivo
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abre la extensión en Chrome
 * 2. Ve a chrome://extensions/
 * 3. Busca "ArbitrARS" y haz clic en "Service Worker" para abrir la consola
 * 4. Copia y pega este código en la consola
 * 5. Ejecuta las funciones para simular diferentes tipos de actualizaciones
 */

// === SIMULAR ACTUALIZACIÓN PATCH (v6.0.0 → v6.0.1) ===
async function simulatePatchUpdate() {
  console.log('🔧 Simulando actualización PATCH...');
  
  const updateInfo = {
    currentVersion: '6.0.0',
    latestVersion: '6.0.1',
    message: 'Correcciones de errores menores y mejoras de estabilidad.',
    features: [
      'Corrección de bug en notificaciones',
      'Mejoras de rendimiento'
    ],
    downloadUrl: 'https://github.com/nomdedev/ArbitrageAR-USDT/releases/latest'
  };
  
  await chrome.storage.local.set({ pendingUpdate: updateInfo });
  console.log('✅ Actualización PATCH simulada. Recarga el popup para ver el indicador.');
  return updateInfo;
}

// === SIMULAR ACTUALIZACIÓN MINOR (v6.0.0 → v6.1.0) ===
async function simulateMinorUpdate() {
  console.log('✨ Simulando actualización MINOR...');
  
  const updateInfo = {
    currentVersion: '6.0.0',
    latestVersion: '6.1.0',
    message: 'Nueva versión con funcionalidades mejoradas.',
    features: [
      'Nuevo sistema de alertas mejorado',
      'Soporte para más exchanges',
      'Interfaz de usuario optimizada'
    ],
    downloadUrl: 'https://github.com/nomdedev/ArbitrageAR-USDT/releases/latest'
  };
  
  await chrome.storage.local.set({ pendingUpdate: updateInfo });
  console.log('✅ Actualización MINOR simulada. Recarga el popup para ver el indicador.');
  return updateInfo;
}

// === SIMULAR ACTUALIZACIÓN MAJOR (v6.0.0 → v7.0.0) ===
async function simulateMajorUpdate() {
  console.log('🚀 Simulando actualización MAJOR...');
  
  const updateInfo = {
    currentVersion: '6.0.0',
    latestVersion: '7.0.0',
    message: '¡Gran actualización con cambios importantes y nuevas funcionalidades!',
    features: [
      '🎨 Interfaz completamente rediseñada',
      '⚡ Motor de cálculo 3x más rápido',
      '🔔 Sistema de alertas inteligentes',
      '📊 Nuevos gráficos de tendencias',
      '🔐 Mejoras de seguridad'
    ],
    downloadUrl: 'https://github.com/nomdedev/ArbitrageAR-USDT/releases/latest'
  };
  
  await chrome.storage.local.set({ pendingUpdate: updateInfo });
  console.log('✅ Actualización MAJOR simulada. Recarga el popup para ver el MODAL.');
  return updateInfo;
}

// === LIMPIAR ACTUALIZACIÓN SIMULADA ===
async function clearSimulatedUpdate() {
  console.log('🧹 Limpiando actualización simulada...');
  await chrome.storage.local.remove(['pendingUpdate', 'dismissedUpdate']);
  console.log('✅ Datos de actualización limpiados. Recarga el popup.');
}

// === VER ESTADO ACTUAL ===
async function checkUpdateStatus() {
  const result = await chrome.storage.local.get(['pendingUpdate', 'dismissedUpdate']);
  console.log('📋 Estado actual:');
  console.log('   pendingUpdate:', result.pendingUpdate || 'No hay');
  console.log('   dismissedUpdate:', result.dismissedUpdate || 'No hay');
  return result;
}

// === MOSTRAR MENÚ DE AYUDA ===
function showHelp() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔔 SCRIPT DE PRUEBA - INDICADOR DE ACTUALIZACIÓN v1.0    ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║                                                            ║');
  console.log('║  Comandos disponibles:                                     ║');
  console.log('║                                                            ║');
  console.log('║  simulatePatchUpdate()  - Simula actualización PATCH       ║');
  console.log('║                          (Solo muestra badge verde)        ║');
  console.log('║                                                            ║');
  console.log('║  simulateMinorUpdate()  - Simula actualización MINOR       ║');
  console.log('║                          (Solo muestra badge verde)        ║');
  console.log('║                                                            ║');
  console.log('║  simulateMajorUpdate()  - Simula actualización MAJOR       ║');
  console.log('║                          (Muestra badge + modal)           ║');
  console.log('║                                                            ║');
  console.log('║  clearSimulatedUpdate() - Limpia los datos simulados       ║');
  console.log('║                                                            ║');
  console.log('║  checkUpdateStatus()    - Ver estado actual                ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('💡 Después de ejecutar un comando, cierra y abre el popup');
  console.log('   para ver los cambios.');
  console.log('');
}

// Mostrar ayuda al cargar
showHelp();
