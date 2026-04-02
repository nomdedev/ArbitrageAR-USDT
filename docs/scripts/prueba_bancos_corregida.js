/**
 * 🔧 Script de Diagnóstico: Selección de Bancos (CORREGIDO)
 * 
 * Este script verifica que la selección de bancos por defecto funcione correctamente
 * después de la corrección del nombre del atributo de los checkboxes.
 * 
 * CORRECCIÓN: Los checkboxes ahora usan name="bank" en lugar de name="bank-selection"
 * 
 * Uso: Copia y pega este código en la consola del navegador (F12 > Console)
 * mientras estás en la página de opciones de la extensión.
 */

console.log('🔍 DIAGNÓSTICO: Selección de Bancos (CORREGIDO)');
console.log('================================================\n');

// Bancos que deben estar seleccionados por defecto
const BANCOS_POR_DEFECTO = ['bna', 'galicia', 'santander', 'bbva', 'icbc'];

// Mapeo de IDs a nombres legibles
const NOMBRES_BANCOS = {
  'bna': 'Nación',
  'galicia': 'Galicia',
  'santander': 'Santander',
  'bbva': 'BBVA',
  'icbc': 'ICBC',
  'ciudad': 'Ciudad',
  'provincia': 'Provincia',
  'chaco': 'Chaco',
  'pampa': 'Pampa',
  'bancor': 'Bancor',
  'supervielle': 'Supervielle',
  'patagonia': 'Patagonia',
  'hipotecario': 'Hipotecario',
  'comafi': 'Comafi',
  'piano': 'Piano',
  'bind': 'Bind'
};

/**
 * Verificar que los checkboxes tengan el nombre correcto
 */
function verificarNombreCheckboxes() {
  console.log('1️⃣ VERIFICANDO NOMBRE DE CHECKBOXES...\n');
  
  // Buscar checkboxes con name="bank" (CORRECTO)
  const checkboxesCorrectos = document.querySelectorAll('input[name="bank"]');
  console.log(`✅ Encontrados ${checkboxesCorrectos.length} checkboxes con name="bank" (CORRECTO)`);
  
  // Buscar checkboxes con name="bank-selection" (INCORRECTO)
  const checkboxesIncorrectos = document.querySelectorAll('input[name="bank-selection"]');
  if (checkboxesIncorrectos.length > 0) {
    console.log(`⚠️ Encontrados ${checkboxesIncorrectos.length} checkboxes con name="bank-selection" (INCORRECTO)`);
    console.log('   Estos checkboxes no serán reconocidos por el código JavaScript');
  } else {
    console.log('✅ No se encontraron checkboxes con name="bank-selection" (CORRECTO)');
  }
  
  console.log('');
  return checkboxesIncorrectos.length === 0;
}

/**
 * Verificar el estado actual de selección de bancos
 */
function verificarSeleccionBancosActual() {
  console.log('2️⃣ VERIFICANDO ESTADO ACTUAL DE SELECCIÓN...\n');
  
  const checkboxes = document.querySelectorAll('input[name="bank"]');
  const seleccionados = [];
  const noSeleccionados = [];
  
  checkboxes.forEach(cb => {
    if (cb.checked) {
      seleccionados.push(cb.value);
    } else {
      noSeleccionados.push(cb.value);
    }
  });
  
  console.log(`📊 Total de checkboxes: ${checkboxes.length}`);
  console.log(`✅ Seleccionados: ${seleccionados.length}`);
  console.log(`⬜ No seleccionados: ${noSeleccionados.length}\n`);
  
  console.log('📋 Bancos seleccionados:');
  seleccionados.forEach(bankId => {
    const nombre = NOMBRES_BANCOS[bankId] || bankId;
    const esDefecto = BANCOS_POR_DEFECTO.includes(bankId);
    const icono = esDefecto ? '⭐' : '  ';
    console.log(`   ${icono} ${nombre} (${bankId})`);
  });
  
  console.log('\n📋 Bancos NO seleccionados:');
  noSeleccionados.forEach(bankId => {
    const nombre = NOMBRES_BANCOS[bankId] || bankId;
    const esDefecto = BANCOS_POR_DEFECTO.includes(bankId);
    const icono = esDefecto ? '⚠️' : '  ';
    console.log(`   ${icono} ${nombre} (${bankId})`);
  });
  
  console.log('');
  
  // Verificar si los bancos por defecto están seleccionados
  const bancosDefectoFaltantes = BANCOS_POR_DEFECTO.filter(b => !seleccionados.includes(b));
  const bancosDefectoSeleccionados = BANCOS_POR_DEFECTO.filter(b => seleccionados.includes(b));
  
  console.log('⭐ VERIFICACIÓN DE BANCOS POR DEFECTO:');
  console.log(`   Bancos por defecto seleccionados: ${bancosDefectoSeleccionados.length}/${BANCOS_POR_DEFECTO.length}`);
  
  if (bancosDefectoFaltantes.length > 0) {
    console.log('   ⚠️ Bancos por defecto NO seleccionados:');
    bancosDefectoFaltantes.forEach(bankId => {
      console.log(`      - ${NOMBRES_BANCOS[bankId] || bankId} (${bankId})`);
    });
  } else {
    console.log('   ✅ Todos los bancos por defecto están seleccionados');
  }
  
  console.log('');
  
  return {
    total: checkboxes.length,
    seleccionados,
    noSeleccionados,
    bancosDefectoSeleccionados,
    bancosDefectoFaltantes
  };
}

/**
 * Verificar la función loadSettings
 */
function verificarFuncionLoadSettings() {
  console.log('3️⃣ VERIFICANDO FUNCIÓN loadSettings()...\n');
  
  if (typeof loadSettings !== 'function') {
    console.log('❌ Función loadSettings() NO encontrada');
    return false;
  }
  
  console.log('✅ Función loadSettings() encontrada');
  
  // Intentar obtener el código fuente de la función
  const funcionStr = loadSettings.toString();
  
  // Verificar que la función busca el atributo correcto
  if (funcionStr.includes('name="bank"')) {
    console.log('✅ La función busca correctamente name="bank"');
  } else if (funcionStr.includes('name="bank-selection"')) {
    console.log('⚠️ La función busca name="bank-selection" (INCORRECTO)');
    console.log('   Esto causará que los checkboxes no sean reconocidos');
  } else {
    console.log('⚠️ No se pudo verificar qué atributo busca la función');
  }
  
  // Verificar que usa los bancos por defecto correctos
  const bancosDefectoEnCodigo = ['bna', 'galicia', 'santander', 'bbva', 'icbc'];
  let todosEncontrados = true;
  
  bancosDefectoEnCodigo.forEach(bankId => {
    if (funcionStr.includes(`'${bankId}'`) || funcionStr.includes(`"${bankId}"`)) {
      console.log(`✅ Banco por defecto encontrado: ${bankId}`);
    } else {
      console.log(`⚠️ Banco por defecto NO encontrado: ${bankId}`);
      todosEncontrados = false;
    }
  });
  
  console.log('');
  return todosEncontrados;
}

/**
 * Verificar la función getCurrentSettings
 */
function verificarFuncionGetCurrentSettings() {
  console.log('4️⃣ VERIFICANDO FUNCIÓN getCurrentSettings()...\n');
  
  if (typeof getCurrentSettings !== 'function') {
    console.log('❌ Función getCurrentSettings() NO encontrada');
    return false;
  }
  
  console.log('✅ Función getCurrentSettings() encontrada');
  
  // Intentar obtener el código fuente de la función
  const funcionStr = getCurrentSettings.toString();
  
  // Verificar que la función busca el atributo correcto
  if (funcionStr.includes('name="bank"')) {
    console.log('✅ La función busca correctamente name="bank"');
  } else if (funcionStr.includes('name="bank-selection"')) {
    console.log('⚠️ La función busca name="bank-selection" (INCORRECTO)');
  } else {
    console.log('⚠️ No se pudo verificar qué atributo busca la función');
  }
  
  console.log('');
  return true;
}

/**
 * Aplicar corrección manual si falla la selección automática
 */
function aplicarCorreccionManual() {
  console.log('5️⃣ APLICANDO CORRECCIÓN MANUAL...\n');
  
  console.log('🔄 Marcando los 5 bancos principales por defecto...');
  
  BANCOS_POR_DEFECTO.forEach(bankId => {
    const checkbox = document.querySelector(`input[name="bank"][value="${bankId}"]`);
    if (checkbox) {
      checkbox.checked = true;
      console.log(`   ✅ Marcado: ${NOMBRES_BANCOS[bankId] || bankId}`);
    } else {
      console.log(`   ❌ No encontrado: ${bankId}`);
    }
  });
  
  console.log('\n💡 Ahora puedes hacer clic en "Guardar" para guardar esta configuración\n');
  
  return true;
}

/**
 * Verificar configuración guardada en storage
 */
function verificarConfiguracionGuardada() {
  console.log('6️⃣ VERIFICANDO CONFIGURACIÓN EN STORAGE...\n');
  
  chrome.storage.local.get('notificationSettings', (result) => {
    const settings = result.notificationSettings || {};
    const selectedBanks = settings.selectedBanks;
    
    if (!selectedBanks || selectedBanks.length === 0) {
      console.log('ℹ️ No hay configuración de bancos guardada');
      console.log('   Se usarán los bancos por defecto al cargar la página\n');
      return;
    }
    
    console.log(`📋 Bancos guardados en storage: ${selectedBanks.length}`);
    selectedBanks.forEach(bankId => {
      const nombre = NOMBRES_BANCOS[bankId] || bankId;
      const esDefecto = BANCOS_POR_DEFECTO.includes(bankId);
      const icono = esDefecto ? '⭐' : '  ';
      console.log(`   ${icono} ${nombre} (${bankId})`);
    });
    
    console.log('');
  });
}

/**
 * Ejecutar todas las verificaciones
 */
async function verificarSeleccionBancosCorregida() {
  console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...\n');
  
  const resultados = {
    nombreCheckboxes: verificarNombreCheckboxes(),
    seleccionActual: verificarSeleccionBancosActual(),
    funcionLoadSettings: verificarFuncionLoadSettings(),
    funcionGetCurrentSettings: verificarFuncionGetCurrentSettings()
  };
  
  console.log('================================================');
  console.log('📊 RESUMEN DE RESULTADOS:\n');
  
  console.log('✅ Nombre de checkboxes:', resultados.nombreCheckboxes ? 'OK' : 'FALLÓ');
  console.log('✅ Selección actual:', resultados.seleccionActual.bancosDefectoFaltantes.length === 0 ? 'OK' : 'REVISAR');
  console.log('✅ Función loadSettings():', resultados.funcionLoadSettings ? 'OK' : 'FALLÓ');
  console.log('✅ Función getCurrentSettings():', resultados.funcionGetCurrentSettings ? 'OK' : 'FALLÓ');
  
  const todoOK = resultados.nombreCheckboxes && 
                 resultados.funcionLoadSettings && 
                 resultados.funcionGetCurrentSettings &&
                 resultados.seleccionActual.bancosDefectoFaltantes.length === 0;
  
  console.log('\n' + (todoOK ? '🎉 ¡TODAS LAS VERIFICACIONES PASARON!' : '⚠️ HAY PROBLEMAS QUE REQUIEREN ATENCIÓN'));
  console.log('================================================\n');
  
  if (!todoOK) {
    console.log('💡 Si la selección de bancos no es correcta:');
    console.log('   Ejecuta: aplicarCorreccionManual()');
    console.log('   Luego haz clic en "Guardar"\n');
  }
  
  return todoOK;
}

/**
 * Función principal para ejecutar todas las pruebas
 */
async function ejecutarPruebasCompletas() {
  const resultado = await verificarSeleccionBancosCorregida();
  
  // Verificar configuración guardada
  verificarConfiguracionGuardada();
  
  return resultado;
}

// Exportar funciones para uso en consola
if (typeof window !== 'undefined') {
  window.verificarSeleccionBancosCorregida = verificarSeleccionBancosCorregida;
  window.verificarFuncionLoadSettingsCorregida = verificarFuncionLoadSettings;
  window.aplicarCorreccionManual = aplicarCorreccionManual;
  window.ejecutarPruebasCompletas = ejecutarPruebasCompletas;
}

console.log('✅ Script cargado correctamente');
console.log('📋 Funciones disponibles:');
console.log('   - verificarSeleccionBancosCorregida()');
console.log('   - verificarFuncionLoadSettingsCorregida()');
console.log('   - aplicarCorreccionManual()');
console.log('   - ejecutarPruebasCompletas()');
console.log('');
console.log('💡 Ejecuta ejecutarPruebasCompletas() para comenzar\n');
