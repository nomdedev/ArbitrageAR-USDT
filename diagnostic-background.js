// ============================================
// DIAGNÓSTICO RÁPIDO - Verificar estado del background
// ============================================

console.log('🔍 [DIAGNÓSTICO] Iniciando verificación del background...');

// 1. Verificar que el service worker está registrado
chrome.runtime.getBackgroundPage((backgroundPage) => {
  if (chrome.runtime.lastError) {
    console.error('❌ Error obteniendo background page:', chrome.runtime.lastError);
    return;
  }
  
  if (backgroundPage) {
    console.log('✅ Background page existe');
  } else {
    console.error('❌ Background page es null');
  }
});

// 2. Probar enviar mensaje al background
console.log('📤 Enviando mensaje de prueba al background...');

chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
  if (chrome.runtime.lastError) {
    console.error('❌ Error en runtime:', chrome.runtime.lastError.message);
    console.error('Posibles causas:');
    console.error('1. Background script no se cargó correctamente');
    console.error('2. Error en imports de módulos ES6');
    console.error('3. Service worker inactivo');
    return;
  }
  
  if (response) {
    console.log('✅ Background respondió:', response);
  } else {
    console.warn('⚠️ Background no respondió (timeout o no hay listener)');
  }
});

// 3. Verificar manifest
fetch(chrome.runtime.getURL('manifest.json'))
  .then(r => r.json())
  .then(manifest => {
    console.log('📋 Manifest version:', manifest.version);
    console.log('📋 Service worker:', manifest.background?.service_worker);
    console.log('📋 Permissions:', manifest.permissions);
  })
  .catch(err => console.error('❌ Error leyendo manifest:', err));

// 4. Listar extensiones activas
chrome.management.getAll((extensions) => {
  const thisExtension = extensions.find(ext => ext.id === chrome.runtime.id);
  if (thisExtension) {
    console.log('✅ Extensión encontrada:', {
      name: thisExtension.name,
      version: thisExtension.version,
      enabled: thisExtension.enabled,
      type: thisExtension.type
    });
  }
});

console.log('🔍 [DIAGNÓSTICO] Verificación completada');
console.log('💡 Si ves errores arriba, abre la consola del background:');
console.log('   chrome://extensions/ → ArbitrARS → Service Worker (inspect)');
