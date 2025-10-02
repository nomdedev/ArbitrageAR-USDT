// Service worker mínimo para testing
console.log('🧪 [TEST] Service worker de prueba cargado exitosamente');

// Verificar que podemos importar módulos básicos
try {
  console.log('🧪 [TEST] Intentando importar config...');
  // Aquí irían los imports reales
  console.log('✅ [TEST] Imports básicos funcionan');
} catch (error) {
  console.error('❌ [TEST] Error en imports:', error);
}

// Listener básico de mensajes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 [TEST] Mensaje recibido:', request);
  if (request.action === 'test') {
    sendResponse({ success: true, message: 'Service worker funcionando' });
  }
  return true;
});

console.log('✅ [TEST] Service worker de prueba inicializado');