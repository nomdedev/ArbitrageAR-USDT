/**
 * Script de prueba para notificaciones en vivo
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abre la extensión en Chrome
 * 2. Ve a chrome://extensions/
 * 3. Busca "ArbitrARS" y haz clic en "Service Worker" para abrir la consola
 * 4. Copia y pega este código en la consola
 * 5. Ejecuta testNotificationSystem() para probar las notificaciones
 * 
 * O ejecuta directamente:
 *   testSingleNotification() - Para probar una sola notificación
 *   testAllNotificationLevels() - Para probar todos los niveles de urgencia
 */

// === FUNCIÓN PRINCIPAL DE PRUEBA ===
async function testSingleNotification() {
  console.log('🧪 Iniciando prueba de notificación...');
  
  const testArbitrage = {
    broker: 'Binance',
    profitPercentage: 5.5,
    usdToUsdtRate: 0.98,
    usdtArsBid: 1250.50
  };
  
  try {
    const notificationId = `test_${Date.now()}`;
    
    await chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '💰 Oportunidad interesante en Binance',
      message: `Ganancia neta estimada: +${testArbitrage.profitPercentage.toFixed(2)}%\nPrecio USDT: $${testArbitrage.usdtArsBid.toLocaleString('es-AR')} ARS\n⏰ Detectado a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
      priority: 2,
      requireInteraction: false,
      silent: false
    });
    
    console.log('✅ Notificación enviada exitosamente!');
    console.log('📋 ID:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar notificación:', error);
    return false;
  }
}

// === PRUEBA DE TODOS LOS NIVELES ===
async function testAllNotificationLevels() {
  console.log('🧪 Probando todos los niveles de notificación...\n');
  
  const levels = [
    { profit: 3.5, icon: '📊', label: 'Oportunidad detectada', broker: 'Ripio' },
    { profit: 7.5, icon: '💰', label: 'Oportunidad interesante', broker: 'Buenbit' },
    { profit: 12.0, icon: '💎', label: '¡Gran oportunidad!', broker: 'Lemon' },
    { profit: 18.5, icon: '🚀', label: '¡OPORTUNIDAD EXCEPCIONAL!', broker: 'Binance' }
  ];
  
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const notificationId = `test_level_${i}_${Date.now()}`;
    
    console.log(`📤 Enviando nivel ${i + 1}/4: ${level.label} (${level.profit}%)`);
    
    try {
      await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `${level.icon} ${level.label} en ${level.broker}`,
        message: `Ganancia neta estimada: +${level.profit.toFixed(2)}%\nPrecio USDT: $1,${(200 + Math.random() * 100).toFixed(2)} ARS\n⏰ Detectado a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
        priority: level.profit >= 10 ? 2 : 1,
        requireInteraction: level.profit >= 10,
        silent: false
      });
      
      console.log(`   ✅ Notificación ${i + 1} enviada`);
    } catch (error) {
      console.error(`   ❌ Error en nivel ${i + 1}:`, error);
    }
    
    // Esperar 2 segundos entre notificaciones
    if (i < levels.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 Prueba de niveles completada!');
}

// === VERIFICAR CONFIGURACIÓN ===
async function checkNotificationSettings() {
  console.log('🔍 Verificando configuración de notificaciones...\n');
  
  try {
    const result = await chrome.storage.local.get('notificationSettings');
    const settings = result.notificationSettings || {};
    
    console.log('📋 Configuración actual:');
    console.log('   • Notificaciones habilitadas:', settings.notificationsEnabled !== false ? '✅ SÍ' : '❌ NO');
    console.log('   • Umbral de alerta:', settings.alertThreshold ?? 1.0, '%');
    console.log('   • Frecuencia:', settings.notificationFrequency || '1min');
    console.log('   • Sonido:', settings.soundEnabled !== false ? '✅ SÍ' : '❌ NO');
    console.log('   • Horario silencioso:', settings.quietHoursEnabled ? '✅ ACTIVO' : '❌ NO');
    
    if (settings.quietHoursEnabled) {
      console.log('   • Inicio silencioso:', settings.quietStart || '22:00');
      console.log('   • Fin silencioso:', settings.quietEnd || '08:00');
    }
    
    const exchanges = settings.notificationExchanges || [];
    console.log('   • Exchanges configurados:', exchanges.length > 0 ? exchanges.join(', ') : 'Todos');
    
    return settings;
  } catch (error) {
    console.error('❌ Error al leer configuración:', error);
    return null;
  }
}

// === PRUEBA COMPLETA DEL SISTEMA ===
async function testNotificationSystem() {
  console.log('═'.repeat(50));
  console.log('🧪 PRUEBA COMPLETA DEL SISTEMA DE NOTIFICACIONES');
  console.log('═'.repeat(50));
  console.log('');
  
  // 1. Verificar configuración
  console.log('📌 PASO 1: Verificar configuración');
  console.log('─'.repeat(40));
  await checkNotificationSettings();
  console.log('');
  
  // 2. Probar una notificación simple
  console.log('📌 PASO 2: Probar notificación simple');
  console.log('─'.repeat(40));
  const singleResult = await testSingleNotification();
  console.log('');
  
  if (!singleResult) {
    console.log('⚠️ La prueba de notificación simple falló.');
    console.log('   Verifica que la extensión tiene permisos de notificación.');
    return;
  }
  
  // 3. Preguntar si quiere probar todos los niveles
  console.log('📌 PASO 3: ¿Probar todos los niveles?');
  console.log('─'.repeat(40));
  console.log('   Ejecuta testAllNotificationLevels() para probar todos los niveles');
  console.log('');
  
  console.log('═'.repeat(50));
  console.log('✅ PRUEBA BÁSICA COMPLETADA');
  console.log('═'.repeat(50));
  console.log('');
  console.log('💡 Comandos disponibles:');
  console.log('   • testSingleNotification() - Prueba una notificación');
  console.log('   • testAllNotificationLevels() - Prueba todos los niveles');
  console.log('   • checkNotificationSettings() - Ver configuración');
}

// === INICIAR PRUEBA AUTOMÁTICAMENTE ===
console.log('');
console.log('╔════════════════════════════════════════════════╗');
console.log('║  🔔 SCRIPT DE PRUEBA DE NOTIFICACIONES v1.0    ║');
console.log('╠════════════════════════════════════════════════╣');
console.log('║  Ejecuta: testNotificationSystem()             ║');
console.log('║  Para iniciar la prueba completa               ║');
console.log('╚════════════════════════════════════════════════╝');
console.log('');
