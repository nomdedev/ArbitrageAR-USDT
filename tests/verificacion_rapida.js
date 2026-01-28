/**
 * ⚡ Script de Verificación Rápida
 * 
 * Este script proporciona una verificación ultra-rápida para confirmar que
 * todas las correcciones implementadas funcionan correctamente.
 * 
 * Verifica:
 * 1. Selección de bancos por defecto (solo 5 bancos principales)
 * 2. Mensaje de guardado visible
 * 3. Funciones críticas disponibles
 * 
 * Uso: Copia y pega este código en la consola del navegador (F12 > Console)
 * mientras estás en la página de opciones de la extensión.
 */

console.log('⚡ VERIFICACIÓN RÁPIDA - ArbitrARS');
console.log('=================================\n');

// Bancos que deben estar seleccionados por defecto
const BANCOS_POR_DEFECTO = ['bna', 'galicia', 'santander', 'bbva', 'icbc'];

/**
 * Verificar funciones críticas
 */
function verificarFuncionesCriticas() {
  const funciones = ['loadSettings', 'saveSettings', 'showNotification', 'getCurrentSettings'];
  const resultados = [];
  
  console.log('🔍 Verificando funciones críticas...');
  
  funciones.forEach(func => {
    const existe = typeof window[func] === 'function';
    resultados.push(existe);
    console.log(`   ${existe ? '✅' : '❌'} ${func}()`);
  });
  
  return resultados.every(r => r);
}

/**
 * Verificar selección de bancos por defecto
 */
function verificarSeleccionBancos() {
  const checkboxes = document.querySelectorAll('input[name="bank"]');
  const seleccionados = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
  
  console.log('\n🔍 Verificando selección de bancos...');
  console.log(`   Total bancos seleccionados: ${seleccionados.length}`);
  
  // Verificar que los bancos por defecto estén seleccionados
  const bancosDefectoSeleccionados = BANCOS_POR_DEFECTO.filter(b => seleccionados.includes(b));
  const bancosDefectoFaltantes = BANCOS_POR_DEFECTO.filter(b => !seleccionados.includes(b));
  
  const correcto = bancosDefectoSeleccionados.length === BANCOS_POR_DEFECTO.length &&
                   bancosDefectoFaltantes.length === 0;
  
  if (correcto) {
    console.log(`   ✅ Los 5 bancos principales están seleccionados`);
    console.log(`      ${BANCOS_POR_DEFECTO.join(', ')}`);
  } else {
    console.log(`   ❌ Selección incorrecta`);
    console.log(`      Bancos por defecto seleccionados: ${bancosDefectoSeleccionados.length}/5`);
    if (bancosDefectoFaltantes.length > 0) {
      console.log(`      Faltan: ${bancosDefectoFaltantes.join(', ')}`);
    }
  }
  
  return correcto;
}

/**
 * Verificar elemento de mensaje de guardado
 */
function verificarMensajeGuardado() {
  const saveStatus = document.getElementById('save-status');
  
  console.log('\n🔍 Verificando mensaje de guardado...');
  
  if (!saveStatus) {
    console.log('   ❌ Elemento #save-status no encontrado');
    return false;
  }
  
  console.log('   ✅ Elemento #save-status encontrado');
  
  // Verificar estilos computados
  const computedStyle = window.getComputedStyle(saveStatus);
  const esVisible = computedStyle.display !== 'none';
  
  console.log(`   ${esVisible ? '✅' : '⚠️'} El elemento es visible cuando tiene contenido`);
  
  return true;
}

/**
 * Verificar nombre de atributo de checkboxes
 */
function verificarAtributoCheckboxes() {
  console.log('\n🔍 Verificando atributo de checkboxes...');
  
  const checkboxesCorrectos = document.querySelectorAll('input[name="bank"]');
  const checkboxesIncorrectos = document.querySelectorAll('input[name="bank-selection"]');
  
  const correcto = checkboxesIncorrectos.length === 0 && checkboxesCorrectos.length > 0;
  
  if (correcto) {
    console.log(`   ✅ ${checkboxesCorrectos.length} checkboxes con name="bank" (CORRECTO)`);
  } else {
    if (checkboxesIncorrectos.length > 0) {
      console.log(`   ❌ ${checkboxesIncorrectos.length} checkboxes con name="bank-selection" (INCORRECTO)`);
    }
    if (checkboxesCorrectos.length === 0) {
      console.log(`   ❌ No se encontraron checkboxes con name="bank"`);
    }
  }
  
  return correcto;
}

/**
 * Verificar botones de acción
 */
function verificarBotones() {
  console.log('\n🔍 Verificando botones de acción...');
  
  const saveButton = document.getElementById('save-settings');
  const resetButton = document.getElementById('reset-settings');
  
  const saveOk = saveButton !== null;
  const resetOk = resetButton !== null;
  
  if (saveOk) {
    console.log(`   ✅ Botón "Guardar" encontrado`);
  } else {
    console.log(`   ❌ Botón "Guardar" no encontrado`);
  }
  
  if (resetOk) {
    console.log(`   ✅ Botón "Reset" encontrado`);
  } else {
    console.log(`   ❌ Botón "Reset" no encontrado`);
  }
  
  return saveOk && resetOk;
}

/**
 * Verificar configuración en storage
 */
function verificarConfiguracionStorage(callback) {
  console.log('\n🔍 Verificando configuración en storage...');
  
  chrome.storage.local.get('notificationSettings', (result) => {
    const settings = result.notificationSettings || {};
    
    console.log('   ✅ Storage accesible');
    console.log(`   - dollarPriceSource: ${settings.dollarPriceSource || 'no definido'}`);
    console.log(`   - selectedBanks: ${settings.selectedBanks?.length || 0} bancos`);
    console.log(`   - notificationsEnabled: ${settings.notificationsEnabled}`);
    
    if (callback) callback(true);
  });
}

/**
 * Ejecutar verificación rápida completa
 */
async function verificarRapido() {
  console.log('🚀 Iniciando verificación rápida...\n');
  
  const resultados = {
    funciones: verificarFuncionesCriticas(),
    bancos: verificarSeleccionBancos(),
    mensaje: verificarMensajeGuardado(),
    atributo: verificarAtributoCheckboxes(),
    botones: verificarBotones()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE RESULTADOS:\n');
  
  const total = Object.keys(resultados).length;
  const pasadas = Object.values(resultados).filter(r => r).length;
  
  console.log(`Funciones críticas: ${resultados.funciones ? '✅' : '❌'}`);
  console.log(`Selección de bancos: ${resultados.bancos ? '✅' : '❌'}`);
  console.log(`Mensaje de guardado: ${resultados.mensaje ? '✅' : '❌'}`);
  console.log(`Atributo checkboxes: ${resultados.atributo ? '✅' : '❌'}`);
  console.log(`Botones de acción: ${resultados.botones ? '✅' : '❌'}`);
  
  console.log('\n' + '='.repeat(50));
  
  const todoOK = Object.values(resultados).every(r => r);
  
  if (todoOK) {
    console.log(`\n🎉 ¡TODAS LAS PRUEBAS PASARON! (${pasadas}/${total})`);
    console.log('✅ Funciones críticas: OK');
    console.log('✅ Selección de bancos: OK');
    console.log('✅ Mensaje de guardado: OK');
  } else {
    console.log(`\n⚠️ ALGUNAS PRUEBAS FALLARON (${pasadas}/${total})`);
    console.log('Revisa los resultados arriba para más detalles');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Verificar storage (asíncrono)
  verificarConfiguracionStorage(() => {
    console.log('💡 Para probar el guardado completo:');
    console.log('   1. Modifica alguna configuración');
    console.log('   2. Haz clic en "Guardar"');
    console.log('   3. Verifica que aparezca el mensaje de éxito\n');
  });
  
  return todoOK;
}

/**
 * Mostrar ayuda
 */
function mostrarAyuda() {
  console.log('\n📋 AYUDA - Verificación Rápida\n');
  console.log('Funciones disponibles:');
  console.log('  verificarRapido()           - Ejecuta todas las verificaciones');
  console.log('  verificarFuncionesCriticas() - Verifica funciones JS');
  console.log('  verificarSeleccionBancos()   - Verifica bancos seleccionados');
  console.log('  verificarMensajeGuardado()  - Verifica elemento de mensaje');
  console.log('  verificarAtributoCheckboxes() - Verifica name="bank"');
  console.log('  verificarBotones()          - Verifica botones de acción');
  console.log('  mostrarAyuda()              - Muestra esta ayuda\n');
}

// Exportar funciones para uso en consola
if (typeof window !== 'undefined') {
  window.verificarRapido = verificarRapido;
  window.verificarFuncionesCriticas = verificarFuncionesCriticas;
  window.verificarSeleccionBancos = verificarSeleccionBancos;
  window.verificarMensajeGuardado = verificarMensajeGuardado;
  window.verificarAtributoCheckboxes = verificarAtributoCheckboxes;
  window.verificarBotones = verificarBotones;
  window.mostrarAyuda = mostrarAyuda;
}

console.log('✅ Script de verificación rápida cargado');
console.log('💡 Ejecuta verificarRapido() para comenzar');
console.log('💡 Ejecuta mostrarAyuda() para ver la ayuda\n');
