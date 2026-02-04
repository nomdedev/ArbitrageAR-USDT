/**
 * Script de Verificación Manual - Filter Buttons
 * Ejecutar en la consola del navegador para verificar manualmente
 */

console.log('%c🔍 Iniciando verificación manual de filtros...', 'color: #3b82f6; font-size: 16px; font-weight: bold;');

// 1. Verificar elementos HTML
console.log('\n%c1️⃣ Verificando elementos HTML...', 'color: #10b981; font-weight: bold;');
const filterButtons = document.querySelectorAll('.filter-btn-footer');
console.log(`   Botones encontrados: ${filterButtons.length}`);
filterButtons.forEach((btn, i) => {
  console.log(`   Botón ${i + 1}:`, {
    filter: btn.dataset.filter,
    tooltip: btn.dataset.tooltip,
    ariaLabel: btn.getAttribute('aria-label'),
    isActive: btn.classList.contains('active'),
    hasIcon: btn.querySelector('.icon svg') !== null
  });
});

// 2. Verificar FilterManager
console.log('\n%c2️⃣ Verificando FilterManager...', 'color: #10b981; font-weight: bold;');
if (typeof FilterManager !== 'undefined') {
  console.log('   ✅ FilterManager está disponible');
  console.log('   Filtro actual:', FilterManager.getCurrentFilter?.());
  console.log('   Métodos disponibles:', Object.keys(FilterManager).filter(k => typeof FilterManager[k] === 'function'));
} else {
  console.error('   ❌ FilterManager NO está disponible');
}

// 3. Verificar estilos CSS
console.log('\n%c3️⃣ Verificando estilos CSS...', 'color: #10b981; font-weight: bold;');
const firstButton = filterButtons[0];
if (firstButton) {
  const styles = window.getComputedStyle(firstButton);
  console.log('   Estilos del primer botón:', {
    width: styles.width,
    height: styles.height,
    backgroundColor: styles.backgroundColor,
    borderRadius: styles.borderRadius,
    transition: styles.transition
  });
}

// 4. Test de click interactivo
console.log('\n%c4️⃣ Ejecutando test de click...', 'color: #10b981; font-weight: bold;');
const testButton = document.querySelector('.filter-btn-footer[data-filter="p2p"]');
if (testButton) {
  const wasActive = testButton.classList.contains('active');
  console.log(`   Estado inicial del botón P2P: ${wasActive ? 'activo' : 'inactivo'}`);
  
  // Simular click
  testButton.click();
  
  setTimeout(() => {
    const isActive = testButton.classList.contains('active');
    console.log(`   Estado después del click: ${isActive ? 'activo' : 'inactivo'}`);
    
    if (isActive !== wasActive) {
      console.log('   ✅ Click funciona correctamente');
    } else {
      console.warn('   ⚠️ El click no cambió el estado');
    }
    
    // Restaurar estado
    if (!wasActive) {
      document.querySelector('.filter-btn-footer[data-filter="all"]').click();
    }
  }, 200);
}

// 5. Verificar estructura del footer
console.log('\n%c5️⃣ Verificando estructura del footer...', 'color: #10b981; font-weight: bold;');
const footer = document.querySelector('footer');
const footerContent = document.querySelector('.footer-content');
const footerLeft = document.querySelector('.footer-left');
const footerRight = document.querySelector('.footer-right');
const footerFilters = document.querySelector('.footer-filters');

console.log('   Elementos del footer:', {
  footer: footer !== null,
  footerContent: footerContent !== null,
  footerLeft: footerLeft !== null,
  footerRight: footerRight !== null,
  footerFilters: footerFilters !== null
});

// 6. Verificar íconos SVG
console.log('\n%c6️⃣ Verificando íconos SVG...', 'color: #10b981; font-weight: bold;');
const svgIcons = document.querySelectorAll('.filter-btn-footer .icon svg use');
svgIcons.forEach((use, i) => {
  const href = use.getAttribute('href');
  console.log(`   Ícono ${i + 1}: ${href}`);
});

// Resumen
console.log('\n%c📊 Resumen de Verificación', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
console.log('═'.repeat(50));
console.log(`✓ Botones de filtro: ${filterButtons.length === 3 ? '✅' : '❌'} (${filterButtons.length}/3)`);
console.log(`✓ FilterManager: ${typeof FilterManager !== 'undefined' ? '✅' : '❌'}`);
console.log(`✓ Estilos CSS: ${firstButton ? '✅' : '❌'}`);
console.log(`✓ Estructura HTML: ${footer && footerFilters ? '✅' : '❌'}`);
console.log(`✓ Íconos SVG: ${svgIcons.length === 3 ? '✅' : '❌'} (${svgIcons.length}/3)`);
console.log('═'.repeat(50));

// Instrucciones adicionales
console.log('\n%c💡 Prueba manual:', 'color: #3b82f6; font-weight: bold;');
console.log('   1. Click en cada botón del footer');
console.log('   2. Verifica que solo uno esté activo a la vez');
console.log('   3. Verifica que las rutas se filtren correctamente');
console.log('   4. Hover sobre los botones para ver el efecto visual');
console.log('   5. Verifica que los tooltips aparezcan');

console.log('\n%c✨ Verificación completada!', 'color: #10b981; font-size: 16px; font-weight: bold;');
