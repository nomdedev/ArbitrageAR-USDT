/**
 * PRE-TESTING CHECK v5.0.75
 * Verifica que todos los archivos estén correctamente configurados antes del testing manual
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN PRE-TESTING v5.0.75\n');
console.log('='.repeat(60));

let allPassed = true;

// ============================================
// CHECK 1: Manifest Version
// ============================================
console.log('\n✓ CHECK 1: Versión en manifest.json');
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  if (manifest.version === '5.0.75') {
    console.log(`  ✅ Versión correcta: ${manifest.version}`);
  } else {
    console.log(`  ❌ Versión incorrecta: ${manifest.version} (esperado: 5.0.75)`);
    allPassed = false;
  }
} catch (err) {
  console.log(`  ❌ Error leyendo manifest: ${err.message}`);
  allPassed = false;
}

// ============================================
// CHECK 2: Route Calculator - Exchange Validation
// ============================================
console.log('\n✓ CHECK 2: Validación de exchanges en routeCalculator.js');
try {
  const routeCalc = fs.readFileSync('src/background/routeCalculator.js', 'utf8');
  
  // Verificar que existe getValidExchanges con la validación USD/USDT
  if (routeCalc.includes('getValidExchanges') && 
      routeCalc.includes('usdtUsd?.[key]') &&
      routeCalc.includes('askPrice') &&
      routeCalc.includes('0.95') &&
      routeCalc.includes('1.15')) {
    console.log('  ✅ Función getValidExchanges() con validación USD/USDT encontrada');
  } else {
    console.log('  ❌ Validación USD/USDT no encontrada o incompleta');
    allPassed = false;
  }
  
  // Verificar logs de debug
  if (routeCalc.includes('[DEBUG]') && 
      routeCalc.includes('válido')) {
    console.log('  ✅ Logs de debug configurados');
  } else {
    console.log('  ⚠️  Logs de debug no encontrados (opcional)');
  }
} catch (err) {
  console.log(`  ❌ Error leyendo routeCalculator.js: ${err.message}`);
  allPassed = false;
}

// ============================================
// CHECK 3: Popup.js - Status Indicators
// ============================================
console.log('\n✓ CHECK 3: Indicadores de estado en popup.js');
try {
  const popup = fs.readFileSync('src/popup.js', 'utf8');
  
  // Verificar función de frescura
  if (popup.includes('getDataFreshnessLevel')) {
    console.log('  ✅ Función getDataFreshnessLevel() encontrada');
  } else {
    console.log('  ❌ Función getDataFreshnessLevel() no encontrada');
    allPassed = false;
  }
  
  // Verificar función de validación
  if (popup.includes('validateRouteCalculations')) {
    console.log('  ✅ Función validateRouteCalculations() encontrada');
  } else {
    console.log('  ❌ Función validateRouteCalculations() no encontrada');
    allPassed = false;
  }
  
  // Verificar función de warning
  if (popup.includes('showDataFreshnessWarning')) {
    console.log('  ✅ Función showDataFreshnessWarning() encontrada');
  } else {
    console.log('  ❌ Función showDataFreshnessWarning() no encontrada');
    allPassed = false;
  }
} catch (err) {
  console.log(`  ❌ Error leyendo popup.js: ${err.message}`);
  allPassed = false;
}

// ============================================
// CHECK 4: Popup.js - Advanced Filters
// ============================================
console.log('\n✓ CHECK 4: Filtros avanzados en popup.js');
try {
  const popup = fs.readFileSync('src/popup.js', 'utf8');
  
  // Verificar objeto advancedFilters
  if (popup.includes('let advancedFilters = {')) {
    console.log('  ✅ Objeto advancedFilters declarado');
  } else {
    console.log('  ❌ Objeto advancedFilters no encontrado');
    allPassed = false;
  }
  
  // Verificar función setupAdvancedFilters
  if (popup.includes('function setupAdvancedFilters()')) {
    console.log('  ✅ Función setupAdvancedFilters() encontrada');
  } else {
    console.log('  ❌ Función setupAdvancedFilters() no encontrada');
    allPassed = false;
  }
  
  // Verificar función applyAllFilters
  if (popup.includes('function applyAllFilters()')) {
    console.log('  ✅ Función applyAllFilters() encontrada');
  } else {
    console.log('  ❌ Función applyAllFilters() no encontrada');
    allPassed = false;
  }
  
  // Verificar función sortRoutes
  if (popup.includes('function sortRoutes(')) {
    console.log('  ✅ Función sortRoutes() encontrada');
  } else {
    console.log('  ❌ Función sortRoutes() no encontrada');
    allPassed = false;
  }
  
  // Verificar función resetAdvancedFilters
  if (popup.includes('function resetAdvancedFilters()')) {
    console.log('  ✅ Función resetAdvancedFilters() encontrada');
  } else {
    console.log('  ❌ Función resetAdvancedFilters() no encontrada');
    allPassed = false;
  }
  
  // Verificar que se llama en DOMContentLoaded
  if (popup.includes('setupAdvancedFilters()')) {
    console.log('  ✅ setupAdvancedFilters() llamado en inicialización');
  } else {
    console.log('  ❌ setupAdvancedFilters() no se llama en inicialización');
    allPassed = false;
  }
} catch (err) {
  console.log(`  ❌ Error verificando filtros avanzados: ${err.message}`);
  allPassed = false;
}

// ============================================
// CHECK 5: Popup.html - UI Elements
// ============================================
console.log('\n✓ CHECK 5: Elementos UI en popup.html');
try {
  const html = fs.readFileSync('src/popup.html', 'utf8');
  
  // Verificar contenedor de warning
  if (html.includes('id="data-warning"')) {
    console.log('  ✅ Contenedor data-warning encontrado');
  } else {
    console.log('  ❌ Contenedor data-warning no encontrado');
    allPassed = false;
  }
  
  // Verificar panel de filtros avanzados
  if (html.includes('id="advanced-filters-panel"')) {
    console.log('  ✅ Panel advanced-filters-panel encontrado');
  } else {
    console.log('  ❌ Panel advanced-filters-panel no encontrado');
    allPassed = false;
  }
  
  // Verificar select de exchange
  if (html.includes('id="filter-exchange"')) {
    console.log('  ✅ Select filter-exchange encontrado');
  } else {
    console.log('  ❌ Select filter-exchange no encontrado');
    allPassed = false;
  }
  
  // Verificar slider de profit
  if (html.includes('id="filter-profit-min"')) {
    console.log('  ✅ Slider filter-profit-min encontrado');
  } else {
    console.log('  ❌ Slider filter-profit-min no encontrado');
    allPassed = false;
  }
  
  // Verificar checkbox hide negative
  if (html.includes('id="filter-hide-negative"')) {
    console.log('  ✅ Checkbox filter-hide-negative encontrado');
  } else {
    console.log('  ❌ Checkbox filter-hide-negative no encontrado');
    allPassed = false;
  }
  
  // Verificar select de ordenamiento
  if (html.includes('id="filter-sort"')) {
    console.log('  ✅ Select filter-sort encontrado');
  } else {
    console.log('  ❌ Select filter-sort no encontrado');
    allPassed = false;
  }
  
  // Verificar botones
  if (html.includes('id="apply-filters"') && html.includes('id="reset-filters"')) {
    console.log('  ✅ Botones apply-filters y reset-filters encontrados');
  } else {
    console.log('  ❌ Botones de filtros no encontrados');
    allPassed = false;
  }
  
  // Verificar botón toggle
  if (html.includes('id="toggle-advanced-filters"')) {
    console.log('  ✅ Botón toggle-advanced-filters encontrado');
  } else {
    console.log('  ❌ Botón toggle-advanced-filters no encontrado');
    allPassed = false;
  }
} catch (err) {
  console.log(`  ❌ Error leyendo popup.html: ${err.message}`);
  allPassed = false;
}

// ============================================
// CHECK 6: Popup.css - Styles
// ============================================
console.log('\n✓ CHECK 6: Estilos en popup.css');
try {
  const css = fs.readFileSync('src/popup.css', 'utf8');
  
  // Verificar estilos de warning
  if (css.includes('.data-warning-container')) {
    console.log('  ✅ Estilos data-warning-container encontrados');
  } else {
    console.log('  ❌ Estilos data-warning-container no encontrados');
    allPassed = false;
  }
  
  // Verificar estilos de timestamp freshness
  if (css.includes('.last-update-container.fresh') || 
      css.includes('.last-update-container.moderate') || 
      css.includes('.last-update-container.stale')) {
    console.log('  ✅ Estilos timestamp freshness encontrados');
  } else {
    console.log('  ❌ Estilos timestamp freshness no encontrados');
    allPassed = false;
  }
  
  // Verificar estilos de filtros avanzados
  if (css.includes('.filters-panel')) {
    console.log('  ✅ Estilos filters-panel encontrados');
  } else {
    console.log('  ❌ Estilos filters-panel no encontrados');
    allPassed = false;
  }
  
  // Verificar estilos de slider
  if (css.includes('.filter-range')) {
    console.log('  ✅ Estilos filter-range encontrados');
  } else {
    console.log('  ❌ Estilos filter-range no encontrados');
    allPassed = false;
  }
} catch (err) {
  console.log(`  ❌ Error leyendo popup.css: ${err.message}`);
  allPassed = false;
}

// ============================================
// CHECK 7: Changelogs
// ============================================
console.log('\n✓ CHECK 7: Documentación de changelogs');
const changelogs = [
  'docs/changelog/HOTFIX_V5.0.73_FILTER_EXCHANGES_WITHOUT_USDTUSD.md',
  'docs/changelog/FEATURE_V5.0.74_VALIDATION_AND_STATUS_INDICATORS.md',
  'docs/changelog/FEATURE_V5.0.75_ADVANCED_FILTERS.md'
];

changelogs.forEach(changelog => {
  if (fs.existsSync(changelog)) {
    console.log(`  ✅ ${path.basename(changelog)} existe`);
  } else {
    console.log(`  ❌ ${path.basename(changelog)} NO existe`);
    allPassed = false;
  }
});

// ============================================
// RESULTADO FINAL
// ============================================
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('\n✅ ¡TODO VERIFICADO CORRECTAMENTE!');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Abre Chrome/Edge → chrome://extensions');
  console.log('   2. Busca "ArbitrARS - Detector de Arbitraje"');
  console.log('   3. Click en 🔄 (Recargar)');
  console.log('   4. Abre el popup de la extensión');
  console.log('   5. Abre DevTools (F12) → Console');
  console.log('   6. Sigue el documento TESTING_MANUAL_v5.0.73-75.md');
  console.log('\n🎯 Versión lista para testing: v5.0.75\n');
  process.exit(0);
} else {
  console.log('\n❌ HAY PROBLEMAS QUE CORREGIR');
  console.log('   Revisa los errores marcados arriba.');
  console.log('   NO cargues la extensión hasta corregir.\n');
  process.exit(1);
}
