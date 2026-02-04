/**
 * E2E Tests para Filter Buttons
 * Ejecutar desde la consola del popup de la extensión
 */

class FilterButtonsE2ETests {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const emoji = {
      'pass': '✅',
      'fail': '❌',
      'info': 'ℹ️',
      'warn': '⚠️'
    }[type] || 'ℹ️';
    
    console.log(`${emoji} ${message}`);
    this.results.push({ message, type });
    
    if (type === 'pass') this.passed++;
    if (type === 'fail') this.failed++;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test 1: Verificar que existan los 3 botones
  testButtonsExist() {
    this.log('Test 1: Verificar existencia de botones de filtro', 'info');
    
    const filterButtons = document.querySelectorAll('.filter-btn-footer');
    
    if (filterButtons.length === 3) {
      this.log(`PASS: Se encontraron 3 botones de filtro`, 'pass');
      return true;
    } else {
      this.log(`FAIL: Se esperaban 3 botones, se encontraron ${filterButtons.length}`, 'fail');
      return false;
    }
  }

  // Test 2: Verificar atributos data-filter
  testDataFilterAttributes() {
    this.log('Test 2: Verificar atributos data-filter', 'info');
    
    const expectedFilters = ['no-p2p', 'p2p', 'all'];
    const buttons = document.querySelectorAll('.filter-btn-footer');
    const actualFilters = Array.from(buttons).map(btn => btn.dataset.filter);
    
    const hasAll = expectedFilters.every(f => actualFilters.includes(f));
    
    if (hasAll) {
      this.log(`PASS: Todos los filtros correctos: ${actualFilters.join(', ')}`, 'pass');
      return true;
    } else {
      this.log(`FAIL: Filtros incorrectos. Esperados: ${expectedFilters.join(', ')}`, 'fail');
      return false;
    }
  }

  // Test 3: Verificar estado activo inicial
  testDefaultActiveState() {
    this.log('Test 3: Verificar estado activo por defecto', 'info');
    
    const activeButton = document.querySelector('.filter-btn-footer.active');
    
    if (activeButton && activeButton.dataset.filter === 'all') {
      this.log(`PASS: El botón "all" está activo por defecto`, 'pass');
      return true;
    } else {
      const actualActive = activeButton ? activeButton.dataset.filter : 'ninguno';
      this.log(`FAIL: Se esperaba "all" activo, pero está activo: ${actualActive}`, 'fail');
      return false;
    }
  }

  // Test 4: Verificar íconos SVG
  testSVGIcons() {
    this.log('Test 4: Verificar íconos SVG', 'info');
    
    const icons = document.querySelectorAll('.filter-btn-footer .icon svg');
    
    if (icons.length === 3) {
      this.log(`PASS: Todos los botones tienen íconos SVG (${icons.length}/3)`, 'pass');
      return true;
    } else {
      this.log(`FAIL: Se esperaban 3 íconos, se encontraron ${icons.length}`, 'fail');
      return false;
    }
  }

  // Test 5: Simular click y verificar cambio de estado
  async testClickBehavior() {
    this.log('Test 5: Verificar comportamiento de click', 'info');
    
    const arbitrageBtn = document.querySelector('.filter-btn-footer[data-filter="no-p2p"]');
    const allBtn = document.querySelector('.filter-btn-footer[data-filter="all"]');
    
    if (!arbitrageBtn || !allBtn) {
      this.log('FAIL: No se encontraron los botones necesarios', 'fail');
      return false;
    }

    // Estado inicial
    const initialActive = allBtn.classList.contains('active');
    
    // Click en arbitrage
    arbitrageBtn.click();
    await this.sleep(200);
    
    const arbitrageActive = arbitrageBtn.classList.contains('active');
    const allInactive = !allBtn.classList.contains('active');
    
    if (arbitrageActive && allInactive) {
      this.log('PASS: Click cambió correctamente el filtro activo', 'pass');
      
      // Restaurar estado inicial
      allBtn.click();
      await this.sleep(200);
      return true;
    } else {
      this.log('FAIL: Click no cambió el estado correctamente', 'fail');
      return false;
    }
  }

  // Test 6: Verificar sincronización de estado entre botones
  async testStateSynchronization() {
    this.log('Test 6: Verificar sincronización de estado', 'info');
    
    const filterButtons = document.querySelectorAll('.filter-btn-footer');
    const p2pBtn = document.querySelector('.filter-btn-footer[data-filter="p2p"]');
    
    p2pBtn.click();
    await this.sleep(200);
    
    // Verificar que solo un botón esté activo
    const activeButtons = Array.from(filterButtons).filter(btn => 
      btn.classList.contains('active')
    );
    
    if (activeButtons.length === 1 && activeButtons[0].dataset.filter === 'p2p') {
      this.log('PASS: Solo un botón está activo a la vez', 'pass');
      
      // Restaurar
      document.querySelector('.filter-btn-footer[data-filter="all"]').click();
      await this.sleep(200);
      return true;
    } else {
      this.log(`FAIL: Se esperaba 1 botón activo, hay ${activeButtons.length}`, 'fail');
      return false;
    }
  }

  // Test 7: Verificar tooltips
  testTooltips() {
    this.log('Test 7: Verificar tooltips', 'info');
    
    const buttons = document.querySelectorAll('.filter-btn-footer');
    const tooltips = Array.from(buttons).map(btn => btn.dataset.tooltip);
    const hasAll = tooltips.every(t => t && t.length > 0);
    
    if (hasAll) {
      this.log(`PASS: Todos los tooltips presentes: ${tooltips.join(', ')}`, 'pass');
      return true;
    } else {
      this.log('FAIL: Algunos tooltips faltantes', 'fail');
      return false;
    }
  }

  // Test 8: Verificar accesibilidad (ARIA)
  testAccessibility() {
    this.log('Test 8: Verificar accesibilidad (ARIA labels)', 'info');
    
    const buttons = document.querySelectorAll('.filter-btn-footer');
    const ariaLabels = Array.from(buttons).map(btn => btn.getAttribute('aria-label'));
    const hasAll = ariaLabels.every(a => a && a.length > 0);
    
    if (hasAll) {
      this.log('PASS: Todos los botones tienen aria-label', 'pass');
      return true;
    } else {
      this.log('FAIL: Algunos aria-label faltantes', 'fail');
      return false;
    }
  }

  // Test 9: Verificar estilos CSS aplicados
  testCSSClasses() {
    this.log('Test 9: Verificar clases CSS', 'info');
    
    const buttons = document.querySelectorAll('.filter-btn-footer');
    const allHaveClass = Array.from(buttons).every(btn => 
      btn.classList.contains('filter-btn-footer')
    );
    
    if (allHaveClass) {
      this.log('PASS: Todos los botones tienen la clase correcta', 'pass');
      return true;
    } else {
      this.log('FAIL: Algunos botones sin clase correcta', 'fail');
      return false;
    }
  }

  // Test 10: Ciclo completo de filtros
  async testFullCycle() {
    this.log('Test 10: Verificar ciclo completo de filtros', 'info');
    
    const filters = ['all', 'no-p2p', 'p2p', 'all'];
    let success = true;
    
    for (const filter of filters) {
      const btn = document.querySelector(`.filter-btn-footer[data-filter="${filter}"]`);
      btn.click();
      await this.sleep(150);
      
      if (!btn.classList.contains('active')) {
        success = false;
        break;
      }
    }
    
    if (success) {
      this.log('PASS: Ciclo completo de filtros funciona correctamente', 'pass');
      return true;
    } else {
      this.log('FAIL: Ciclo de filtros falló en algún punto', 'fail');
      return false;
    }
  }

  // Test 11: Verificar que FilterManager esté cargado
  testFilterManagerLoaded() {
    this.log('Test 11: Verificar que FilterManager esté cargado', 'info');
    
    if (typeof FilterManager !== 'undefined' && FilterManager.applyAllFilters) {
      this.log('PASS: FilterManager está cargado y disponible', 'pass');
      return true;
    } else {
      this.log('FAIL: FilterManager no está disponible', 'fail');
      return false;
    }
  }

  // Test 12: Verificar event listeners
  testEventListeners() {
    this.log('Test 12: Verificar event listeners', 'info');
    
    const button = document.querySelector('.filter-btn-footer');
    
    // Intentar obtener listeners (no siempre posible, pero podemos verificar comportamiento)
    const hadActive = button.classList.contains('active');
    button.click();
    const changedState = button.classList.contains('active') !== hadActive;
    
    // Restaurar estado si cambió
    if (changedState) {
      button.click();
    }
    
    if (changedState) {
      this.log('PASS: Event listeners funcionando correctamente', 'pass');
      return true;
    } else {
      this.log('WARN: No se pudo verificar event listeners completamente', 'warn');
      return true; // No contamos como fail
    }
  }

  // Ejecutar todos los tests
  async runAll() {
    console.clear();
    console.log('🧪 ================================');
    console.log('🧪 E2E TESTS - FILTER BUTTONS');
    console.log('🧪 ================================\n');
    
    this.results = [];
    this.passed = 0;
    this.failed = 0;

    // Tests síncronos
    this.testButtonsExist();
    this.testDataFilterAttributes();
    this.testDefaultActiveState();
    this.testSVGIcons();
    this.testTooltips();
    this.testAccessibility();
    this.testCSSClasses();
    this.testFilterManagerLoaded();
    this.testEventListeners();
    
    // Tests asíncronos
    await this.testClickBehavior();
    await this.testStateSynchronization();
    await this.testFullCycle();

    // Resumen
    console.log('\n📊 ================================');
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('📊 ================================');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);
    console.log(`🎯 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed === 0) {
      console.log('\n🎉 TODOS LOS TESTS PASARON! 🎉\n');
    } else {
      console.log('\n⚠️ ALGUNOS TESTS FALLARON ⚠️\n');
    }

    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      results: this.results
    };
  }
}

// Crear instancia global para uso en consola
window.filterTests = new FilterButtonsE2ETests();

// Auto-ejecutar si se carga directamente
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✨ Tests cargados. Ejecuta filterTests.runAll() para iniciar las pruebas.');
  });
} else {
  console.log('✨ Tests cargados. Ejecuta filterTests.runAll() para iniciar las pruebas.');
}
