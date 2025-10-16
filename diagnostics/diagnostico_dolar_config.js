console.log('🔍 DIAGNÓSTICO DE CONFIGURACIÓN DEL DÓLAR');
console.log('==========================================');

// Verificar configuración guardada
chrome.storage.local.get('notificationSettings', (result) => {
  const settings = result.notificationSettings || {};

  console.log('📋 Configuración actual:');
  console.log('  - dollarPriceSource:', settings.dollarPriceSource || 'auto (por defecto)');
  console.log('  - manualDollarPrice:', settings.manualDollarPrice || '1400 (por defecto)');

  const isManual = settings.dollarPriceSource === 'manual';
  const priceToUse = isManual ? (settings.manualDollarPrice || 1400) : 'precio de API';

  console.log('');
  console.log('🎯 Modo actual:', isManual ? 'MANUAL' : 'AUTOMÁTICO');
  console.log('💵 Precio que debería usarse:', isManual ? `$${priceToUse}` : priceToUse);

  if (isManual && settings.manualDollarPrice == 1410) {
    console.log('✅ El precio 1410 está configurado correctamente como precio manual');
  } else if (!isManual) {
    console.log('ℹ️ Está en modo automático - el precio 1410 viene de la API');
  } else {
    console.log('⚠️ Configuración inconsistente');
  }
});