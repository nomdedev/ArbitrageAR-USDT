// Diagnóstico para extension ArbitrageAR
// Ejecutar en la consola del navegador (F12) en la página de extensiones

console.log('🔍 DIAGNÓSTICO EXTENSIÓN ARBITRAGEAR');
console.log('=====================================');

// 1. Verificar si chrome.runtime está disponible
console.log('1. Chrome Runtime:', !!window.chrome?.runtime);

// 2. Verificar permisos de host
console.log('2. Verificando permisos de red...');
fetch('https://dolarapi.com/v1/dolares/oficial')
  .then(r => console.log('   ✅ DolarAPI accesible'))
  .catch(e => console.log('   ❌ DolarAPI bloqueado:', e.message));

fetch('https://criptoya.com/api/usdt/ars')
  .then(r => console.log('   ✅ CriptoYa accesible'))
  .catch(e => console.log('   ❌ CriptoYa bloqueado:', e.message));

// 3. Verificar service worker
console.log('3. Service Worker:');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    const arbitrageSW = registrations.find(r => r.scope.includes('ArbitrageAR'));
    if (arbitrageSW) {
      console.log('   ✅ Service Worker registrado');
      console.log('   📍 Scope:', arbitrageSW.scope);
      console.log('   🔄 Estado:', arbitrageSW.active?.state);
    } else {
      console.log('   ❌ Service Worker NO registrado');
    }
  });
} else {
  console.log('   ❌ Service Worker no soportado');
}

// 4. Verificar storage
console.log('4. Chrome Storage:');
if (chrome?.storage?.local) {
  chrome.storage.local.get(null).then(data => {
    console.log('   ✅ Storage accesible');
    console.log('   📦 Datos guardados:', Object.keys(data));
  }).catch(e => console.log('   ❌ Storage error:', e.message));
} else {
  console.log('   ❌ Storage no disponible');
}

// 5. Simular comunicación con background
console.log('5. Probando comunicación con background...');
if (chrome?.runtime?.sendMessage) {
  chrome.runtime.sendMessage({ action: 'getArbitrages' }, response => {
    if (chrome.runtime.lastError) {
      console.log('   ❌ Error de comunicación:', chrome.runtime.lastError.message);
    } else if (response) {
      console.log('   ✅ Comunicación exitosa');
      console.log('   📊 Rutas recibidas:', response.data?.optimizedRoutes?.length || 0);
      if (response.data?.optimizedRoutes?.length > 0) {
        console.log('   🎯 Top ruta:', response.data.optimizedRoutes[0].exchange,
          response.data.optimizedRoutes[0].profitPercentage.toFixed(2) + '%');
      }
    } else {
      console.log('   ❌ No se recibió respuesta');
    }
  });
} else {
  console.log('   ❌ sendMessage no disponible');
}

console.log('=====================================');
console.log('💡 Si hay errores, intenta:');
console.log('   1. Recargar la extensión en chrome://extensions/');
console.log('   2. Reiniciar el navegador');
console.log('   3. Verificar permisos de la extensión');