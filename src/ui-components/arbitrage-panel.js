/* ==========================================
   ARBITRAGEAR - ARBITRAGE PANEL JS v7.0
   Funcionalidades del Panel de Arbitraje
   ========================================== */

/**
 * Clase para manejar el panel de arbitraje
 */
class ArbitragePanel {
  constructor(container) {
    this.container = container;
    this.ring = container.querySelector('.progress-ring-fill');
    this.percentElement = container.querySelector('.profit-percent .value');
    this.detailsButton = container.querySelector('.btn-details');
    this.expandableDetails = container.querySelector('.panel-details-expandable');
    this.actionButton = container.querySelector('.btn-action');

    // Accesibilidad: Agregar atributos ARIA al anillo de progreso
    if (this.ring) {
      this.ring.setAttribute('role', 'progressbar');
      this.ring.setAttribute('aria-valuenow', '0');
      this.ring.setAttribute('aria-valuemin', '0');
      this.ring.setAttribute('aria-valuemax', '100');
      this.ring.setAttribute('aria-label', 'Progreso de arbitraje');
    }

    // Accesibilidad: Agregar aria-live para actualizaciones dinámicas
    this.container.setAttribute('aria-live', 'polite');

    this.init();
  }

  /**
   * Inicializar eventos y animaciones
   */
  init() {
    // Animar el ring progress
    this.animateRing();

    // Animar count-up del porcentaje
    this.animateCountUp();

    // Configurar botón de detalles
    if (this.detailsButton && this.expandableDetails) {
      this.detailsButton.addEventListener('click', () => this.toggleDetails());
    }

    // Configurar botón de acción
    if (this.actionButton) {
      // Accesibilidad: Agregar aria-label descriptivo
      this.actionButton.setAttribute('aria-label', 'Ver detalles de esta oportunidad de arbitraje');
      this.actionButton.addEventListener('click', () => this.handleAction());
    }
  }

  /**
   * Animar el ring progress de 0 al valor
   */
  animateRing() {
    if (!this.ring) return;

    // Obtener el porcentaje del data attribute
    const targetPercent = parseFloat(this.percentElement?.textContent) || 0;

    // Calcular el stroke-dashoffset
    // stroke-dasharray: 283 (2 * PI * 45)
    // offset = 283 - (283 * percent / 100)
    const circumference = 283;
    const targetOffset = circumference - (circumference * targetPercent) / 100;

    // Accesibilidad: Actualizar aria-valuenow con el porcentaje actual
    this.ring.setAttribute('aria-valuenow', targetPercent.toFixed(0));

    // Animar usando Web Animations API
    this.ring.animate([{ strokeDashoffset: circumference }, { strokeDashoffset: targetOffset }], {
      duration: 1000,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards'
    });
  }

  /**
   * Animar count-up de números
   */
  animateCountUp() {
    if (!this.percentElement) return;

    const finalValue = parseFloat(this.percentElement.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();
    const startValue = 0;

    const animate = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: ease-out-expo
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentValue = startValue + (finalValue - startValue) * easedProgress;
      this.percentElement.textContent = currentValue.toFixed(1) + '%';

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Toggle de detalles expandibles
   */
  toggleDetails() {
    if (!this.expandableDetails) return;

    const isExpanded = this.expandableDetails.classList.contains('expanded');

    if (isExpanded) {
      this.expandableDetails.classList.remove('expanded');
      this.detailsButton.textContent = 'Ver detalles';
    } else {
      this.expandableDetails.classList.add('expanded');
      this.detailsButton.textContent = 'Ocultar detalles';
    }
  }

  /**
   * Manejar clic en botón de acción
   */
  handleAction() {
    // Dispatch custom event para que el código principal lo maneje
    const event = new CustomEvent('arbitrage-simulate', {
      detail: {
        panel: this.container,
        profitability: this.container.dataset.profitability
      },
      bubbles: true
    });

    this.container.dispatchEvent(event);
  }

  /**
   * Actualizar el panel con nuevos datos
   */
  update(data) {
    // Actualizar data attributes
    if (data.profitability) {
      this.container.dataset.profitability = data.profitability;
    }

    // Actualizar porcentaje
    if (data.percent !== undefined && this.percentElement) {
      this.percentElement.textContent = data.percent.toFixed(1) + '%';
    }

    // Re-animar
    this.animateRing();
    this.animateCountUp();
  }
}

/**
 * Utilidad para crear un panel de arbitraje
 */
function createArbitragePanel(data) {
  const panel = document.createElement('div');
  panel.className = 'arbitrage-panel';
  panel.dataset.profitability = data.profitability || 'medium';

  // Seguridad: Sanitizar todos los datos dinámicos antes de insertarlos en HTML
  panel.innerHTML = `
    <div class="panel-header">
      <div class="profit-indicator">
        <div class="profit-ring">
          <svg class="progress-ring" viewBox="0 0 100 100">
            <circle class="progress-ring-bg" cx="50" cy="50" r="45"/>
            <circle class="progress-ring-fill" cx="50" cy="50" r="45"/>
          </svg>
        </div>
        <div class="profit-percent">
          <span class="value">${sanitizeHTML(data.percent.toFixed(1) + '%')}</span>
          <span class="label">Ganancia</span>
        </div>
      </div>
      
      <div class="arbitrage-details">
        <h3 class="arbitrage-title">${sanitizeHTML(data.title || 'Oportunidad Detectada')}</h3>
        <p class="arbitrage-route">
          ${sanitizeHTML(data.fromExchange)} <span class="route-arrow">→</span> ${sanitizeHTML(data.toExchange)}
        </p>
      </div>
    </div>
    
    <div class="panel-body">
      <div class="calculation-row">
        <span class="calc-label">Inversión:</span>
        <span class="calc-value">${sanitizeHTML(formatCurrency(data.investment))}</span>
      </div>
      <div class="calculation-row highlight">
        <span class="calc-label">Ganancia estimada:</span>
        <span class="calc-value">+${sanitizeHTML(formatCurrency(data.profit))}</span>
      </div>
      ${
  data.fees
    ? `
      <div class="calculation-row">
        <span class="calc-label">Comisiones:</span>
        <span class="calc-value">-${sanitizeHTML(formatCurrency(data.fees))}</span>
      </div>
      `
    : ''
}
    </div>
    
    <div class="panel-actions">
      <button class="btn-action" aria-label="Ver detalles de esta oportunidad de arbitraje">
        <span>Simular Operación</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
      <button class="btn-details">Ver detalles</button>
    </div>
    
    <div class="panel-details-expandable">
      <div class="details-content">
        <div class="detail-section">
          <h4 class="detail-section-title">Desglose de Costos</h4>
          <div class="detail-list">
            <div class="detail-item">
              <span class="label">Compra USDT:</span>
              <span class="value">${sanitizeHTML(formatCurrency(data.breakdown?.buyPrice || 0))}</span>
            </div>
            <div class="detail-item">
              <span class="label">Fee ${sanitizeHTML(data.fromExchange)}:</span>
              <span class="value">-${sanitizeHTML(formatCurrency(data.breakdown?.buyFee || 0))}</span>
            </div>
            <div class="detail-item">
              <span class="label">Venta USDT:</span>
              <span class="value">${sanitizeHTML(formatCurrency(data.breakdown?.sellPrice || 0))}</span>
            </div>
            <div class="detail-item">
              <span class="label">Fee ${sanitizeHTML(data.toExchange)}:</span>
              <span class="value">-${sanitizeHTML(formatCurrency(data.breakdown?.sellFee || 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Inicializar el panel
  new ArbitragePanel(panel);

  return panel;
}

/**
 * Formatear moneda
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Seguridad: Función para sanitizar HTML (previene XSS)
 * Escapa caracteres especiales HTML para prevenir inyección de código malicioso
 */
function sanitizeHTML(text) {
  if (typeof text !== 'string') {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Inicializar todos los paneles de arbitraje en el contenedor
 */
function initArbitragePanels(container) {
  const panels = container.querySelectorAll('.arbitrage-panel');

  panels.forEach(panel => {
    new ArbitragePanel(panel);
  });
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ArbitragePanel,
    createArbitragePanel,
    initArbitragePanels,
    formatCurrency,
    sanitizeHTML
  };
}

// Exportar al ámbito global para uso en el navegador
if (typeof window !== 'undefined') {
  window.ArbitragePanel = ArbitragePanel;
  window.createArbitragePanel = createArbitragePanel;
  window.initArbitragePanels = initArbitragePanels;
  window.sanitizeHTML = sanitizeHTML;
}
