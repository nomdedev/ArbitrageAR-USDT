/* ==========================================
   ARBITRAGEAR - TABS SYSTEM JS v7.0
   Sistema de Tabs con Indicador Deslizante
   ========================================== */

/**
 * Clase para manejar el sistema de tabs
 */
class TabSystem {
  constructor(container) {
    this.container = container;
    this.tabs = container.querySelectorAll('[role="tab"]');
    this.panels = container.querySelectorAll('.tab-panel');
    this.indicator = container.querySelector('.tab-indicator');

    this.activeTab = null;
    this.activePanel = null;

    this.init();
  }

  /**
   * Inicializar eventos y estado inicial
   */
  init() {
    // Encontrar el tab activo inicial
    this.activeTab = this.container.querySelector('.tab-item.active') || this.tabs[0];

    if (this.activeTab) {
      const tabName = this.activeTab.dataset.tab;
      this.activePanel = this.container.querySelector(`.tab-panel[data-tab="${tabName}"]`);

      // Posicionar el indicador
      this.moveIndicator(this.activeTab);

      // Mostrar el panel activo
      if (this.activePanel) {
        this.activePanel.classList.add('active');
      }
    }

    // Agregar event listeners a los tabs
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab));
      tab.addEventListener('keydown', e => this.handleKeydown(e, tab));
    });

    // Actualizar indicador al redimensionar
    window.addEventListener('resize', () => {
      if (this.activeTab) {
        this.moveIndicator(this.activeTab);
      }
    });
  }

  /**
   * Cambiar al tab seleccionado
   */
  switchTab(selectedTab) {
    if (selectedTab === this.activeTab) return;

    const tabName = selectedTab.dataset.tab;
    const targetPanel = this.container.querySelector(`.tab-panel[data-tab="${tabName}"]`);

    if (!targetPanel) return;

    // Remover clase active del tab anterior
    if (this.activeTab) {
      this.activeTab.classList.remove('active');
      this.activeTab.setAttribute('aria-selected', 'false');
    }

    // Ocultar el panel anterior
    if (this.activePanel) {
      this.activePanel.classList.remove('active');
    }

    // Activar el nuevo tab
    selectedTab.classList.add('active');
    selectedTab.setAttribute('aria-selected', 'true');

    // Mostrar el nuevo panel
    targetPanel.classList.add('active');

    // Mover el indicador
    this.moveIndicator(selectedTab);

    // Actualizar referencias
    this.activeTab = selectedTab;
    this.activePanel = targetPanel;

    // Dispatch custom event
    const event = new CustomEvent('tab-change', {
      detail: {
        tabName,
        tab: selectedTab,
        panel: targetPanel
      },
      bubbles: true
    });

    this.container.dispatchEvent(event);
  }

  /**
   * Mover el indicador al tab
   */
  moveIndicator(tab) {
    if (!this.indicator || !tab) return;

    const containerRect = this.container.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    // Calcular posición y ancho del indicador
    const left = tabRect.left - containerRect.left;
    const width = tabRect.width;

    // Aplicar transform
    this.indicator.style.transform = `translateX(${left}px)`;
    this.indicator.style.width = `${width}px`;
  }

  /**
   * Manejar navegación por teclado
   */
  handleKeydown(event, tab) {
    const currentIndex = Array.from(this.tabs).indexOf(tab);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : this.tabs.length - 1;
        break;
      case 'ArrowRight':
        nextIndex = currentIndex < this.tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = this.tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.tabs[nextIndex].focus();
    this.switchTab(this.tabs[nextIndex]);
  }

  /**
   * Actualizar el contador de un tab
   */
  updateBadge(tabName, count, highlight = false) {
    const tab = this.container.querySelector(`[data-tab="${tabName}"]`);
    const badge = tab?.querySelector('.tab-badge');

    if (badge) {
      badge.textContent = count;

      if (highlight) {
        badge.classList.add('highlight');
        badge.classList.add('updating');

        setTimeout(() => {
          badge.classList.remove('updating');
        }, 600);
      }
    }
  }

  /**
   * Activar un tab específico
   */
  activateTab(tabName) {
    const tab = this.container.querySelector(`[data-tab="${tabName}"]`);
    if (tab) {
      this.switchTab(tab);
    }
  }

  /**
   * Obtener el tab activo
   */
  getActiveTab() {
    return this.activeTab;
  }

  /**
   * Obtener el panel activo
   */
  getActivePanel() {
    return this.activePanel;
  }
}

/**
 * Inicializar todos los sistemas de tabs en el documento
 */
function initTabSystems() {
  const tabContainers = document.querySelectorAll('.tabs-nav');

  tabContainers.forEach(container => {
    new TabSystem(container);
  });
}

/**
 * Crear un sistema de tabs dinámicamente
 */
function createTabSystem(config) {
  const container = document.createElement('nav');
  container.className = 'tabs-nav';
  container.setAttribute('role', 'tablist');

  // Crear indicador
  const indicator = document.createElement('div');
  indicator.className = 'tab-indicator';
  container.appendChild(indicator);

  // Crear tabs
  config.tabs.forEach((tabConfig, index) => {
    const tab = document.createElement('button');
    tab.className = 'tab-item';
    if (index === 0) tab.classList.add('active');
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    // Atributos ARIA para accesibilidad: ID y relación con el panel
    tab.id = `tab-${tabConfig.name}`;
    tab.setAttribute('aria-controls', `panel-${tabConfig.name}`);
    tab.dataset.tab = tabConfig.name;

    // Icono
    if (tabConfig.icon) {
      const icon = document.createElement('span');
      icon.className = 'tab-icon';
      // Seguridad: Usar textContent en lugar de innerHTML para prevenir XSS
      // Si se necesita renderizar HTML de iconos, considerar sanitizar previamente
      icon.textContent = tabConfig.icon;
      tab.appendChild(icon);
    }

    // Label
    const label = document.createElement('span');
    label.className = 'tab-label';
    label.textContent = tabConfig.label;
    tab.appendChild(label);

    // Badge (opcional)
    if (tabConfig.badge !== undefined) {
      const badge = document.createElement('span');
      badge.className = 'tab-badge';
      if (tabConfig.highlight) badge.classList.add('highlight');
      badge.textContent = tabConfig.badge;
      tab.appendChild(badge);
    }

    container.appendChild(tab);
  });

  // Crear contenedor de paneles
  const contentContainer = document.createElement('div');
  contentContainer.className = 'tabs-content';

  config.tabs.forEach((tabConfig, index) => {
    const panel = document.createElement('div');
    panel.className = 'tab-panel';
    if (index === 0) panel.classList.add('active');
    panel.dataset.tab = tabConfig.name;
    // Atributos ARIA para accesibilidad: role, ID y relación con el tab
    panel.setAttribute('role', 'tabpanel');
    panel.id = `panel-${tabConfig.name}`;
    panel.setAttribute('aria-labelledby', `tab-${tabConfig.name}`);
    // Seguridad: Usar textContent en lugar de innerHTML para prevenir XSS
    // Si se necesita renderizar HTML en el contenido, considerar sanitizar previamente
    panel.textContent = tabConfig.content || '';
    contentContainer.appendChild(panel);
  });

  // Inicializar el sistema
  new TabSystem(container);

  return {
    nav: container,
    content: contentContainer
  };
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TabSystem,
    initTabSystems,
    createTabSystem
  };
}

// Exportar al ámbito global para uso en el navegador
if (typeof window !== 'undefined') {
  window.TabSystem = TabSystem;
  window.initTabSystems = initTabSystems;
  window.createTabSystem = createTabSystem;
}

// Auto-inicializar cuando el DOM esté listo
// COMENTADO para evitar conflictos con el sistema de tabs existente en popup.js
// El sistema existente se maneja en setupTabNavigation() en popup.js
// if (typeof document !== 'undefined') {
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initTabSystems);
//   } else {
//     initTabSystems();
//   }
// }
