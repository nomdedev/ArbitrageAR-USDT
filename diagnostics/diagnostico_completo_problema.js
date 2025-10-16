console.log('🔍 DIAGNÓSTICO COMPLETO DEL PROBLEMA DEL PRECIO MANUAL');
console.log('=======================================================');

// 1. Verificar configuración guardada
console.log('\n1. 📋 CONFIGURACIÓN GUARDADA:');
chrome.storage.local.get('notificationSettings', (result) => {
  const settings = result.notificationSettings || {};
  console.log('   dollarPriceSource:', settings.dollarPriceSource || 'NO DEFINIDO');
  console.log('   manualDollarPrice:', settings.manualDollarPrice || 'NO DEFINIDO');

  // 2. Simular lógica del background script
  console.log('\n2. 🤖 SIMULACIÓN DE LÓGICA BACKGROUND:');
  let simulatedOficial;

  if (settings.dollarPriceSource === 'manual') {
    const manualPrice = settings.manualDollarPrice || 1400;
    console.log('   ✅ Modo MANUAL detectado');
    console.log('   💵 Precio manual a usar:', manualPrice);
    simulatedOficial = {
      compra: manualPrice,
      venta: manualPrice,
      source: 'manual'
    };
  } else {
    console.log('   ⚠️ Modo AUTOMÁTICO detectado (no debería pasar si configuraste manual)');
    simulatedOficial = {
      compra: 1410, // precio de API simulado
      venta: 1410,
      source: 'api'
    };
  }

  console.log('   📊 Oficial simulado:', simulatedOficial);

  // 3. Verificar datos actuales del popup
  console.log('\n3. 🖥️ DATOS ACTUALES DEL POPUP:');
  // Intentar acceder a las variables globales del popup
  if (typeof currentData !== 'undefined') {
    console.log('   currentData.oficial:', currentData.oficial);
    console.log('   currentData.lastUpdate:', new Date(currentData.lastUpdate));
  } else {
    console.log('   ❌ currentData no disponible (popup no cargado?)');
  }

  // 4. Verificar si hay mensajes entre background y popup
  console.log('\n4. 📡 MENSAJES BACKGROUND-POPUP:');
  chrome.runtime.sendMessage({ action: 'getCurrentData' }, (response) => {
    if (response) {
      console.log('   Respuesta del background:', response);
      console.log('   oficial.compra:', response.oficial?.compra);
      console.log('   oficial.source:', response.oficial?.source);
    } else {
      console.log('   ❌ No hay respuesta del background');
    }
  });
});

// 5. Verificar estado del service worker
console.log('\n5. 🔧 ESTADO SERVICE WORKER:');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('   Service workers registrados:', registrations.length);
    registrations.forEach(reg => {
      console.log('   - Estado:', reg.active?.state);
      console.log('   - Script URL:', reg.active?.scriptURL);
    });
  });
} else {
  console.log('   ❌ Service Worker no soportado');
}

console.log('\n💡 PRUEBAS A REALIZAR:');
console.log('   1. ¿La configuración se guardó correctamente?');
console.log('   2. ¿El background script está leyendo la configuración correcta?');
console.log('   3. ¿El popup está recibiendo los datos correctos?');
console.log('   4. ¿Es necesario recargar la extensión completamente?');