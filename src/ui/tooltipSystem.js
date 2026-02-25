/**
 * TooltipSystem - Sistema de Tooltips Interactivos
 * Fase 3: Sistema de Tooltips Interactivos
 *
 * Proporciona tooltips contextuales con:
 * - Posicionamiento inteligente (top > right > bottom > left)
 * - Animaciones suaves con GPU acceleration
 * - Soporte para contenido estático y dinámico
 * - Accesibilidad completa (teclado y ARIA)
 * - Multi-línea con &#10; como separador
 */

class TooltipSystem {
  constructor(options = {}) {
    // Configuración con valores por defecto
    this.options = {
      delay: options.delay ?? 300,           // Retraso antes de mostrar (ms)
      duration: options.duration ?? 200,     // Duración de animación (ms)
      offset: options.offset ?? 8,           // Distancia del elemento (px)
      maxWidth: options.maxWidth ?? 280,     // Ancho máximo del tooltip (px)
      zIndex: options.zIndex ?? 700,         // Z-index del tooltip
      showOnHover: options.showOnHover ?? true,
      showOnFocus: options.showOnFocus ?? true
    };

    // Estado interno
    this.container = null;
    this.currentElement = null;
    this.showTimer = null;
    this.hideTimer = null;
    this.isVisible = false;
    this.currentPosition = 'top';

    // Bind métodos para mantener contexto
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleEscape = this.handleEscape.bind(this);
  }

  /**
   * Inicializa el sistema de tooltips
   */
  init() {
    if (this.container) {
      console.warn('[TooltipSystem] Ya inicializado');
      return;
    }

    this.createTooltipContainer();
    this.attachEventListeners();
    window.Logger?.debug?.('[TooltipSystem] Inicializado correctamente');
  }

  /**
   * Crea el contenedor del tooltip en el DOM
   */
  createTooltipContainer() {
    this.container = document.createElement('div');
    this.container.className = 'tooltip-container';
    this.container.setAttribute('role', 'tooltip');
    this.container.setAttribute('aria-live', 'polite');
    this.container.style.maxWidth = `${this.options.maxWidth}px`;
    this.container.style.zIndex = this.options.zIndex;
    document.body.appendChild(this.container);
  }

  /**
   * Adjunta event listeners usando delegación de eventos
   */
  attachEventListeners() {
    // Event delegation para mejor performance
    document.addEventListener('mouseover', (e) => {
      if (!this.options.showOnHover) return;
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.handleMouseEnter(e);
      }
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      if (!this.options.showOnHover) return;
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.handleMouseLeave(e);
      }
    }, { passive: true });

    // Eventos de foco para accesibilidad
    document.addEventListener('focusin', (e) => {
      if (!this.options.showOnFocus) return;
      if (e.target.matches('[data-tooltip]')) {
        this.handleFocus(e);
      }
    }, { passive: true });

    document.addEventListener('focusout', (e) => {
      if (!this.options.showOnFocus) return;
      if (e.target.matches('[data-tooltip]')) {
        this.handleBlur(e);
      }
    }, { passive: true });

    // Cerrar con Escape
    document.addEventListener('keydown', this.handleEscape);
  }

  /**
   * Maneja el evento mouse enter
   */
  handleMouseEnter(e) {
    const target = e.target.closest('[data-tooltip]');
    if (!target) return;

    // Limpiar timer de ocultar si existe
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    // Programar mostrar con delay
    this.showTimer = setTimeout(() => {
      this.show(target);
    }, this.options.delay);
  }

  /**
   * Maneja el evento mouse leave
   */
  handleMouseLeave() {
    // Limpiar timer de mostrar si existe
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    // Ocultar inmediatamente
    this.hide();
  }

  /**
   * Maneja el evento focus
   */
  handleFocus(e) {
    const target = e.target;
    if (!target) return;

    // Para foco, mostrar sin delay
    this.show(target);
  }

  /**
   * Maneja el evento blur
   */
  handleBlur() {
    this.hide();
  }

  /**
   * Maneja la tecla Escape para cerrar el tooltip
   */
  handleEscape(e) {
    if (e.key === 'Escape' && this.isVisible) {
      this.hide();
    }
  }

  /**
   * Muestra el tooltip para un elemento
   */
  show(element, customContent = null) {
    if (!element || !this.container) return;

    // Actualizar referencia al elemento actual
    this.currentElement = element;

    // Obtener contenido
    const content = customContent || this.getContent(element);
    if (!content) return;

    // Actualizar contenido del tooltip
    this.updateContent(content);

    // Posicionar el tooltip
    this.position(element, this.container);

    // Mostrar con animación
    this.isVisible = true;
    this.container.classList.add('tooltip-visible');

    // Actualizar ARIA
    element.setAttribute('aria-describedby', 'tooltip-content');
  }

  /**
   * Oculta el tooltip
   */
  hide() {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.container.classList.remove('tooltip-visible');

    // Limpiar ARIA después de la animación
    setTimeout(() => {
      if (this.currentElement) {
        this.currentElement.removeAttribute('aria-describedby');
      }
      this.currentElement = null;
    }, this.options.duration);

    // Limpiar timers
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  /**
   * Posiciona el tooltip inteligentemente
   * Prioridad: top > right > bottom > left
   */
  position(element, tooltip) {
    const elementRect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Calcular espacio disponible en cada dirección
    const space = {
      top: elementRect.top,
      right: viewport.width - elementRect.right,
      bottom: viewport.height - elementRect.bottom,
      left: elementRect.left
    };

    // Determinar posición óptima
    let position = 'top';
    const minSpace = 60; // Espacio mínimo necesario

    // Prioridad: top > right > bottom > left
    if (space.top >= Math.max(tooltipRect.height, minSpace)) {
      position = 'top';
    } else if (space.right >= Math.max(tooltipRect.width, minSpace)) {
      position = 'right';
    } else if (space.bottom >= Math.max(tooltipRect.height, minSpace)) {
      position = 'bottom';
    } else if (space.left >= Math.max(tooltipRect.width, minSpace)) {
      position = 'left';
    }

    // Calcular coordenadas
    let top, left;
    const offset = this.options.offset;

    switch (position) {
      case 'top':
        top = elementRect.top - tooltipRect.height - offset;
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
        break;
      case 'right':
        top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
        left = elementRect.right + offset;
        break;
      case 'bottom':
        top = elementRect.bottom + offset;
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
        left = elementRect.left - tooltipRect.width - offset;
        break;
    }

    // Ajustar si se sale del viewport
    left = Math.max(8, Math.min(left, viewport.width - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, viewport.height - tooltipRect.height - 8));

    // Aplicar posición
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Actualizar clase de posición
    this.container.className = 'tooltip-container';
    this.container.classList.add(`tooltip-${position}`);
    this.currentPosition = position;

    // Agregar flecha indicadora
    this.updateArrow(elementRect, position);
  }

  /**
   * Actualiza la posición de la flecha indicadora
   */
  updateArrow(elementRect, position) {
    // Eliminar flecha existente
    const existingArrow = this.container.querySelector('.tooltip-arrow');
    if (existingArrow) {
      existingArrow.remove();
    }

    // Crear nueva flecha
    const arrow = document.createElement('div');
    arrow.className = 'tooltip-arrow';
    this.container.appendChild(arrow);

    // Posicionar flecha
    switch (position) {
      case 'top':
        arrow.style.bottom = '-6px';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%) rotate(45deg)';
        break;
      case 'right':
        arrow.style.left = '-6px';
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%) rotate(45deg)';
        break;
      case 'bottom':
        arrow.style.top = '-6px';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%) rotate(45deg)';
        break;
      case 'left':
        arrow.style.right = '-6px';
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%) rotate(45deg)';
        break;
    }
  }

  /**
   * Obtiene el contenido del tooltip desde el elemento
   * Soporta contenido estático (data-tooltip) y dinámico (data-tooltip-dynamic)
   */
  getContent(element) {
    // Contenido estático
    const staticContent = element.getAttribute('data-tooltip');
    if (staticContent) {
      return staticContent;
    }

    // Contenido dinámico
    const dynamicType = element.getAttribute('data-tooltip-dynamic');
    if (dynamicType) {
      return this.getDynamicContent(element, dynamicType);
    }

    return null;
  }

  /**
   * Genera contenido dinámico basado en el tipo
   */
  getDynamicContent(element, type) {
    switch (type) {
      case 'profit':
        return this.getProfitTooltip(element);
      case 'spread':
        return this.getSpreadTooltip(element);
      case 'execution-time':
        return this.getExecutionTimeTooltip(element);
      case 'risk-level':
        return this.getRiskLevelTooltip(element);
      case 'freshness':
        return this.getFreshnessTooltip(element);
      case 'badge':
        return this.getBadgeTooltip(element);
      case 'counter':
        return this.getCounterTooltip(element);
      case 'connection':
        return this.getConnectionTooltip(element);
      default:
        return null;
    }
  }

  /**
   * Genera tooltip para profit
   */
  getProfitTooltip(element) {
    const profit = element.textContent.trim();
    const percentage = parseFloat(profit);
    if (isNaN(percentage)) return profit;

    let level = 'bajo';
    if (percentage >= 3) level = 'alto';
    else if (percentage >= 1.5) level = 'medio';

    return `Ganancia estimada: ${profit}&#10;&#10;Nivel de rentabilidad: ${level}&#10;• Alto: ≥3%&#10;• Medio: 1.5-3%&#10;• Bajo: <1.5%`;
  }

  /**
   * Genera tooltip para spread
   */
  getSpreadTooltip(element) {
    const spread = element.textContent.trim();
    return `Spread de arbitraje: ${spread}&#10;&#10;Diferencia de precio entre&#10;compra y venta que genera&#10;la ganancia.`;
  }

  /**
   * Genera tooltip para tiempo de ejecución
   */
  getExecutionTimeTooltip(element) {
    const time = element.textContent.trim();
    return `Tiempo estimado: ${time}&#10;&#10;Duración aproximada desde&#10;que inicias hasta que recibís&#10;los fondos en tu cuenta.`;
  }

  /**
   * Genera tooltip para nivel de riesgo
   */
  getRiskLevelTooltip(element) {
    const risk = element.textContent.trim().toLowerCase();
    const descriptions = {
      'bajo': 'Riesgo bajo&#10;&#10;Operaciones con exchanges&#10;establecidos y alta liquidez.',
      'medio': 'Riesgo medio&#10;&#10;Balance entre riesgo y&#10;rentabilidad. Requiere atención.',
      'alto': 'Riesgo alto&#10;&#10;Operaciones con mayor&#10;volatilidad. Experiencia necesaria.'
    };
    return descriptions[risk] || `Nivel de riesgo: ${risk}`;
  }

  /**
   * Genera tooltip para indicador de frescura
   */
  getFreshnessTooltip(element) {
    const timestamp = element.getAttribute('data-timestamp');
    if (!timestamp) return 'Datos actualizados';

    const now = Date.now();
    const age = Math.floor((now - parseInt(timestamp)) / 1000 / 60); // minutos

    let level = 'actualizado';
    if (age > 10) level = 'desactualizado';
    else if (age > 5) level = 'por actualizar';

    const messages = {
      'actualizado': 'Datos actualizados&#10;Hace menos de 5 minutos',
      'por actualizar': `Datos por actualizar&#10;Hace ${age} minutos`,
      'desactualizado': `Datos desactualizados&#10;Hace ${age} minutos. Recomendado actualizar.`
    };

    return messages[level] || `Datos hace ${age} minutos`;
  }

  /**
   * Genera tooltip para badges
   */
  getBadgeTooltip(element) {
    const badgeType = element.className.match(/badge-(\w+)/);
    if (!badgeType) return element.textContent;

    const type = badgeType[1];
    const descriptions = {
      'p2p': 'Operación P2P&#10;&#10;Trading directo entre personas.&#10;Mayor privacidad pero más lento.',
      'direct': 'Operación Directa&#10;&#10;Sin intermediarios. Más rápido&#10;pero requiere más experiencia.',
      'express': 'Operación Express&#10;&#10;Ruta optimizada para velocidad.&#10;Ideal para traders activos.',
      'recommended': 'Recomendado&#10;&#10;Mejor relación rentabilidad/riesgo&#10;para la situación actual.',
      'hot': '¡Oportunidad!&#10;&#10;Arbitraje con rentabilidad&#10;excepcional. Actuar rápido.',
      'new': 'Nueva ruta&#10;&#10;Recién descubierta. Puede&#10;desaparecer pronto.'
    };

    return descriptions[type] || element.textContent;
  }

  /**
   * Genera tooltip para contadores
   */
  getCounterTooltip(element) {
    const count = parseInt(element.textContent);
    const type = element.getAttribute('data-counter-type') || 'rutas';

    if (type === 'rutas') {
      return `${count} rutas disponibles&#10;&#10;Haz clic para ver detalles`;
    }
    return `${count} ${type}`;
  }

  /**
   * Genera tooltip para estado de conexión
   */
  getConnectionTooltip(element) {
    const status = element.className.match(/status-(\w+)/);
    if (!status) return 'Estado de conexión';

    const statusType = status[1];
    const messages = {
      'connected': 'Conectado&#10;&#10;Sincronizado con el servidor',
      'syncing': 'Sincronizando...&#10;&#10;Actualizando datos',
      'error': 'Error de conexión&#10;&#10;Verifica tu internet',
      'offline': 'Sin conexión&#10;&#10;Modo offline activado'
    };

    return messages[statusType] || 'Estado de conexión';
  }

  /**
   * Actualiza el contenido del tooltip
   */
  updateContent(content) {
    // Convertir &#10; a <br> para multi-línea
    const formattedContent = content.replace(/&#10;/g, '<br>');
    this.container.innerHTML = `
      <div id="tooltip-content" class="tooltip-content">
        ${formattedContent}
      </div>
      <div class="tooltip-arrow"></div>
    `;
  }

  /**
   * Actualiza un tooltip existente
   */
  update(element, newContent) {
    if (this.currentElement === element && this.isVisible) {
      this.updateContent(newContent);
      this.position(element, this.container);
    }
  }

  /**
   * Destruye el sistema de tooltips
   */
  destroy() {
    this.hide();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.currentElement = null;
  }
}

// Instancia singleton por defecto
let defaultInstance = null;

/**
 * Inicializa el sistema de tooltips con configuración opcional
 */
function initTooltips(options = {}) {
  if (!defaultInstance) {
    defaultInstance = new TooltipSystem(options);
    defaultInstance.init();
  }
  return defaultInstance;
}

/**
 * Obtiene la instancia por defecto del sistema de tooltips
 */
function getTooltipSystem() {
  return defaultInstance;
}

/**
 * Muestra un tooltip manualmente para un elemento
 */
function showTooltip(element, content) {
  if (defaultInstance) {
    defaultInstance.show(element, content);
  }
}

/**
 * Oculta el tooltip actual
 */
function hideTooltip() {
  if (defaultInstance) {
    defaultInstance.hide();
  }
}

// Hacer funciones disponibles globalmente para uso en popup.js
window.initTooltips = initTooltips;
window.getTooltipSystem = getTooltipSystem;
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;
window.TooltipSystem = TooltipSystem;
