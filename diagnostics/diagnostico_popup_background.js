console.log('🔍 DIAGNÓSTICO: ¿Qué datos recibe el popup del background?');
console.log('=======================================================');

// Simular la llamada que hace el popup
chrome.runtime.sendMessage({ action: 'getArbitrages' }, (response) => {
  console.log('📥 Respuesta del background:');
  console.log('   - Tiene respuesta:', !!response);
  console.log('   - Tiene oficial:', !!response?.oficial);
  console.log('   - oficial.compra:', response?.oficial?.compra);
  console.log('   - oficial.source:', response?.oficial?.source);
  console.log('   - lastUpdate:', new Date(response?.lastUpdate).toLocaleString());

  if (response?.oficial) {
    console.log('✅ El background está enviando datos de oficial');
    console.log('   Precio que debería mostrarse:', response.oficial.compra);
  } else {
    console.log('❌ El background NO está enviando datos de oficial');
  }

  // Verificar configuración actual
  chrome.storage.local.get('notificationSettings', (result) => {
    const settings = result.notificationSettings || {};
    console.log('\n📋 Configuración actual:');
    console.log('   - dollarPriceSource:', settings.dollarPriceSource);
    console.log('   - manualDollarPrice:', settings.manualDollarPrice);

    const expectedPrice = settings.dollarPriceSource === 'manual'
      ? settings.manualDollarPrice || 1400
      : 'precio de API';

    console.log('   - Precio esperado:', expectedPrice);
    console.log('   - Precio recibido:', response?.oficial?.compra);

    if (settings.dollarPriceSource === 'manual' && response?.oficial?.compra !== settings.manualDollarPrice) {
      console.log('❌ ¡DESAJUSTE! El precio recibido no coincide con la configuración manual');
      console.log('   Configurado:', settings.manualDollarPrice);
      console.log('   Recibido:', response?.oficial?.compra);
    } else if (settings.dollarPriceSource === 'manual') {
      console.log('✅ El precio manual coincide correctamente');
    } else {
      console.log('ℹ️ Modo automático - el precio depende de la API');
    }
  });
});