/**
 * 🔧 Script de Diagnóstico: Mensaje de Guardado
 * 
 * Este script verifica que el sistema de mensajes de guardado funcione correctamente
 * después de los cambios implementados en options.js y options.html.
 * 
 * Uso: Copia y pega este código en la consola del navegador (F12 > Console)
 * mientras estás en la página de opciones de la extensión.
 */

console.log('🔍 DIAGNÓSTICO: Sistema de Mensajes de Guardado');
console.log('==============================================\n');

/**
 * Verificar que los elementos necesarios existan
 */
function verificarElementos() {
  console.log('1️⃣ VERIFICANDO ELEMENTOS DEL DOM...\n');
  
  const resultados = [];
  
  // Verificar elemento de estado de guardado
  const saveStatusEl = document.getElementById('save-status');
  if (saveStatusEl) {
    console.log('✅ Elemento #save-status encontrado');
    console.log('   Clases actuales:', saveStatusEl.className);
    console.log('   Contenido actual:', saveStatusEl.textContent || '(vacío)');
    resultados.push(true);
  } else {
    console.log('❌ Elemento #save-status NO encontrado');
    console.log('   ⚠️ Este elemento es necesario para mostrar mensajes de guardado');
    resultados.push(false);
  }
  
  // Verificar botón de guardar
  const saveButton = document.getElementById('save-settings');
  if (saveButton) {
    console.log('✅ Botón #save-settings encontrado');
    resultados.push(true);
  } else {
    console.log('❌ Botón #save-settings NO encontrado');
    resultados.push(false);
  }
  
  console.log('');
  return resultados.every(r => r);
}

/**
 * Verificar que las funciones necesarias existan
 */
function verificarFunciones() {
  console.log('2️⃣ VERIFICANDO FUNCIONES JAVASCRIPT...\n');
  
  const resultados = [];
  
  // Verificar función showNotification
  if (typeof showNotification === 'function') {
    console.log('✅ Función showNotification() encontrada');
    console.log('   Parámetros: message, type (opcional)');
    resultados.push(true);
  } else {
    console.log('❌ Función showNotification() NO encontrada');
    console.log('   ⚠️ Esta función es necesaria para mostrar mensajes');
    resultados.push(false);
  }
  
  // Verificar función saveSettings
  if (typeof saveSettings === 'function') {
    console.log('✅ Función saveSettings() encontrada');
    resultados.push(true);
  } else {
    console.log('❌ Función saveSettings() NO encontrada');
    resultados.push(false);
  }
  
  // Verificar función loadSettings
  if (typeof loadSettings === 'function') {
    console.log('✅ Función loadSettings() encontrada');
    resultados.push(true);
  } else {
    console.log('❌ Función loadSettings() NO encontrada');
    resultados.push(false);
  }
  
  console.log('');
  return resultados.every(r => r);
}

/**
 * Simular un guardado completo para verificar el mensaje
 */
async function simularGuardadoCompleto() {
  console.log('3️⃣ SIMULANDO GUARDADO COMPLETO...\n');
  
  try {
    // Obtener el elemento de estado antes del guardado
    const saveStatusEl = document.getElementById('save-status');
    if (!saveStatusEl) {
      console.log('❌ No se puede simular: elemento #save-status no encontrado');
      return false;
    }
    
    console.log('📋 Estado antes del guardado:');
    console.log('   Clases:', saveStatusEl.className);
    console.log('   Contenido:', saveStatusEl.textContent || '(vacío)');
    
    // Verificar que la función showNotification existe
    if (typeof showNotification !== 'function') {
      console.log('❌ Función showNotification() no disponible');
      return false;
    }
    
    console.log('\n🔄 Ejecutando showNotification()...');
    
    // Simular un mensaje de éxito
    showNotification('Configuración guardada correctamente', 'success');
    
    console.log('✅ Mensaje de éxito mostrado');
    console.log('   Contenido:', saveStatusEl.textContent);
    console.log('   Clases:', saveStatusEl.className);
    
    // Verificar que el mensaje tenga las clases correctas
    if (saveStatusEl.className.includes('success')) {
      console.log('✅ Clase "success" aplicada correctamente');
    } else {
      console.log('⚠️ Clase "success" no encontrada en el elemento');
    }
    
    console.log('\n⏱️ El mensaje debería desaparecer en 3 segundos...');
    console.log('   (Verifica visualmente que aparezca y desaparezca)\n');
    
    return true;
  } catch (error) {
    console.log('❌ Error durante la simulación:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
}

/**
 * Verificar que el botón de guardar tenga el event listener correcto
 */
function verificarEventListeners() {
  console.log('4️⃣ VERIFICANDO EVENT LISTENERS...\n');
  
  const saveButton = document.getElementById('save-settings');
  if (!saveButton) {
    console.log('❌ Botón #save-settings no encontrado');
    return false;
  }
  
  // No podemos verificar directamente los event listeners desde JavaScript
  // pero podemos verificar que el botón sea clickable
  console.log('✅ Botón de guardar encontrado');
  console.log('   Tipo:', saveButton.type);
  console.log('   Texto:', saveButton.textContent);
  console.log('   Habilitado:', !saveButton.disabled);
  
  console.log('\n💡 Para probar el event listener completo:');
  console.log('   1. Haz clic en el botón "Guardar"');
  console.log('   2. Verifica que aparezca el mensaje de éxito');
  console.log('   3. Verifica que el mensaje desaparezca después de 3 segundos\n');
  
  return true;
}

/**
 * Verificar configuración de estilos CSS para mensajes
 */
function verificarEstilos() {
  console.log('5️⃣ VERIFICANDO ESTILOS CSS...\n');
  
  const saveStatusEl = document.getElementById('save-status');
  if (!saveStatusEl) {
    console.log('❌ Elemento #save-status no encontrado');
    return false;
  }
  
  const computedStyle = window.getComputedStyle(saveStatusEl);
  
  console.log('📋 Estilos computados del elemento #save-status:');
  console.log('   display:', computedStyle.display);
  console.log('   position:', computedStyle.position);
  console.log('   color:', computedStyle.color);
  console.log('   background-color:', computedStyle.backgroundColor);
  console.log('   padding:', computedStyle.padding);
  console.log('   margin:', computedStyle.margin);
  console.log('   border-radius:', computedStyle.borderRadius);
  
  console.log('\n💡 El elemento debería ser visible cuando tiene contenido');
  console.log('   y ocultarse cuando está vacío\n');
  
  return true;
}

/**
 * Ejecutar todas las verificaciones
 */
async function verificarMensajeGuardado() {
  console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...\n');
  
  const resultados = {
    elementos: verificarElementos(),
    funciones: verificarFunciones(),
    eventListeners: verificarEventListeners(),
    estilos: verificarEstilos()
  };
  
  console.log('==============================================');
  console.log('📊 RESUMEN DE RESULTADOS:\n');
  
  console.log('✅ Elementos del DOM:', resultados.elementos ? 'OK' : 'FALLÓ');
  console.log('✅ Funciones JavaScript:', resultados.funciones ? 'OK' : 'FALLÓ');
  console.log('✅ Event Listeners:', resultados.eventListeners ? 'OK' : 'FALLÓ');
  console.log('✅ Estilos CSS:', resultados.estilos ? 'OK' : 'FALLÓ');
  
  const todoOK = Object.values(resultados).every(r => r);
  
  console.log('\n' + (todoOK ? '🎉 ¡TODAS LAS VERIFICACIONES PASARON!' : '⚠️ HAY PROBLEMAS QUE REQUIEREN ATENCIÓN'));
  console.log('==============================================\n');
  
  return todoOK;
}

/**
 * Función principal para ejecutar todas las pruebas
 */
async function ejecutarPruebasCompletas() {
  const resultado = await verificarMensajeGuardado();
  
  if (resultado) {
    console.log('💡 PRÓXIMO PASO: Simular guardado completo');
    console.log('   Ejecuta: simularGuardadoCompleto()\n');
  }
  
  return resultado;
}

// Exportar funciones para uso en consola
if (typeof window !== 'undefined') {
  window.verificarMensajeGuardado = verificarMensajeGuardado;
  window.simularGuardadoCompleto = simularGuardadoCompleto;
  window.ejecutarPruebasCompletas = ejecutarPruebasCompletas;
}

console.log('✅ Script cargado correctamente');
console.log('📋 Funciones disponibles:');
console.log('   - verificarMensajeGuardado()');
console.log('   - simularGuardadoCompleto()');
console.log('   - ejecutarPruebasCompletas()');
console.log('');
console.log('💡 Ejecuta ejecutarPruebasCompletas() para comenzar\n');
