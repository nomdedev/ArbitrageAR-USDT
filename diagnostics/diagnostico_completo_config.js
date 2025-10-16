console.log('🔍 DIAGNÓSTICO COMPLETO DE CONFIGURACIÓN DEL DÓLAR');
console.log('==================================================');

// Verificar configuración guardada
chrome.storage.local.get('notificationSettings', (result) => {
  const settings = result.notificationSettings || {};

  console.log('📋 Configuración actual en storage:');
  console.log('  - dollarPriceSource:', settings.dollarPriceSource || 'NO DEFINIDO (debería ser "auto" o "manual")');
  console.log('  - manualDollarPrice:', settings.manualDollarPrice || 'NO DEFINIDO (debería ser un número)');

  // Verificar si hay valores por defecto
  const isManual = settings.dollarPriceSource === 'manual';
  const manualPrice = settings.manualDollarPrice;

  console.log('');
  console.log('🔍 Análisis:');
  console.log('  - Modo actual:', isManual ? 'MANUAL' : 'AUTOMÁTICO');
  console.log('  - Precio manual configurado:', manualPrice ? `$${manualPrice}` : 'NINGUNO');

  if (isManual && manualPrice) {
    console.log('  ✅ Configuración correcta: Manual con precio', manualPrice);
  } else if (isManual && !manualPrice) {
    console.log('  ❌ ERROR: Modo manual pero sin precio definido');
  } else {
    console.log('  ✅ Configuración correcta: Automático (usa API)');
  }

  console.log('');
  console.log('💡 Si cambiaste a manual 1440 pero sigue mostrando 1410:');
  console.log('  1. Verifica que hiciste clic en "Guardar"');
  console.log('  2. Recarga la extensión (chrome://extensions/)');
  console.log('  3. Recarga el popup');
  console.log('  4. Si no funciona, el botón guardar puede no estar implementado');
});