/**
 * Modal Manager Module
 * Módulo para la gestión de modales y diálogos en la aplicación
 * @module ModalManager
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  // ==========================================
  // ESTADO DEL MÓDULO
  // ==========================================

  let activeModal = null;
  const modalHistory = [];

  // ==========================================
  // CONSTANTES
  // ==========================================

  const MODAL_TYPES = {
    ROUTE_DETAILS: 'route-details',
    CRYPTO_DETAILS: 'crypto-details',
    CONFIRMATION: 'confirmation',
    ALERT: 'alert',
    INFO: 'info'
  };

  const MODAL_STATES = {
    CLOSED: 'closed',
    OPENING: 'opening',
    OPEN: 'open',
    CLOSING: 'closing'
  };

  // ==========================================
  // FUNCIONES PRIVADAS
  // ==========================================

  /**
   * Calcular valores para la guía paso a paso
   * @private
   * @param {Object} arb - Datos del arbitraje
   * @returns {Object} Valores calculados
   */
  function calculateGuideValues(arb) {
    const calc = arb.calculation || {};
    const correctProfitPercentage =
      calc.profitPercentage !== undefined ? calc.profitPercentage : arb.profitPercentage || 0;

    const initial = calc.initial || 100000;
    const officialPrice = arb.officialPrice || 1000;
    const usdAmount = calc.usdPurchased || initial / officialPrice;
    const usdtAfterFees = calc.usdtAfterFees || usdAmount;
    const sellPrice = arb.sellPrice || arb.usdtArsBid || 1000;
    const arsFromSale = calc.arsFromSale || usdtAfterFees * sellPrice;
    const finalAmount = calc.finalAmount || arsFromSale;
    const profit = calc.netProfit || (finalAmount - initial);

    return {
      estimatedInvestment: initial,
      officialPrice,
      usdAmount,
      usdtAfterFees,
      sellPrice,
      arsFromSale,
      finalAmount,
      profit,
      profitPercentage: correctProfitPercentage,
      usdToUsdtRate: typeof arb.usdToUsdtRate === 'number' && isFinite(arb.usdToUsdtRate)
        ? arb.usdToUsdtRate
        : null,
      usdtArsBid: arb.usdtArsBid || arb.sellPrice || 1000,
      fees: arb.fees || { trading: 0, withdrawal: 0, total: 0 },
      broker: arb.broker || 'Exchange'
    };
  }

  /**
   * Generar HTML del header de la guía
   * @private
   * @param {string} broker - Nombre del broker
   * @param {number} profitPercentage - Porcentaje de ganancia
   * @returns {string} HTML del header
   */
  function generateGuideHeader(broker, profitPercentage) {
    const Fmt = window.Formatters || { formatNumber: n => n?.toLocaleString('es-AR') || '0' };
    const isProfitable = profitPercentage >= 0;

    return `
      <div class="guide-header-simple">
        <div class="guide-title">
          <h3>📋 Cómo hacer el arbitraje en <span class="broker-name">${sanitizeHTML(broker)}</span></h3>
        </div>
        <div class="profit-badge ${isProfitable ? 'profit-positive' : 'profit-negative'}">
          <span class="profit-icon">${isProfitable ? '📈' : '📉'}</span>
          <span class="profit-text">
            ${isProfitable ? 'Ganancia' : 'Pérdida'}: 
            <strong>${isProfitable ? '+' : ''}${Fmt.formatNumber(profitPercentage)}%</strong>
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Generar HTML de los pasos de la guía
   * @private
   * @param {Object} values - Valores calculados
   * @returns {string} HTML de los pasos
   */
  function generateGuideSteps(values) {
    const Fmt = window.Formatters || { formatNumber: n => n?.toLocaleString('es-AR') || '0' };

    const {
      estimatedInvestment,
      officialPrice,
      usdAmount,
      usdToUsdtRate,
      usdtAfterFees,
      usdtArsBid,
      arsFromSale,
      finalAmount,
      profit,
      profitPercentage,
      broker
    } = values;

    return `
      <div class="steps-simple">
        <!-- Paso 1: Comprar USD -->
        <div class="step-simple" data-step="1">
          <div class="step-number">1</div>
          <div class="step-simple-content">
            <h4>💵 Comprar Dólares Oficiales</h4>
            <p class="step-simple-text">Ve a tu banco y compra USD al precio oficial</p>
            <div class="step-simple-calc">
              <span class="calc-label">Precio:</span>
              <span class="calc-value">$${Fmt.formatNumber(officialPrice)}/USD</span>
              <span class="calc-arrow">→</span>
              <span class="calc-result">Obtienes ${Fmt.formatNumber(usdAmount)} USD</span>
            </div>
            <div class="step-simple-note">
              💡 Verifica los límites actuales con tu banco
            </div>
          </div>
        </div>

        <!-- Paso 2: USD → USDT -->
        <div class="step-simple" data-step="2">
          <div class="step-number">2</div>
          <div class="step-simple-content">
            <h4>🔄 Convertir USD a USDT</h4>
            <p class="step-simple-text">Deposita tus USD en <strong>${sanitizeHTML(broker)}</strong> y cómpralos por USDT</p>
            <div class="step-simple-calc">
              <span class="calc-label">Tasa:</span>
              <span class="calc-value">${Fmt.formatUsdUsdtRatio ? Fmt.formatUsdUsdtRatio(usdToUsdtRate) : usdToUsdtRate?.toFixed(4)} USD = 1 USDT</span>
              <span class="calc-arrow">→</span>
              <span class="calc-result">${Fmt.formatNumber(usdtAfterFees)} USDT</span>
            </div>
            ${
  typeof usdToUsdtRate === 'number' && isFinite(usdToUsdtRate) && usdToUsdtRate > 1.005
    ? `
            <div class="step-simple-warning">
              ⚠️ El exchange cobra ${Fmt.formatCommissionPercent ? Fmt.formatCommissionPercent((usdToUsdtRate - 1) * 100) : ((usdToUsdtRate - 1) * 100).toFixed(2)}% para esta conversión
            </div>
            `
    : ''
  }
          </div>
        </div>

        <!-- Paso 3: USDT → ARS -->
        <div class="step-simple" data-step="3">
          <div class="step-number">3</div>
          <div class="step-simple-content">
            <h4>💸 Vender USDT por Pesos</h4>
            <p class="step-simple-text">Vende tus USDT en <strong>${sanitizeHTML(broker)}</strong> y recibe pesos</p>
            <div class="step-simple-calc highlight-profit">
              <span class="calc-label">Precio:</span>
              <span class="calc-value big">$${Fmt.formatNumber(usdtArsBid)}/USDT</span>
              <span class="calc-arrow">→</span>
              <span class="calc-result big">$${Fmt.formatNumber(arsFromSale)}</span>
            </div>
            <div class="step-simple-success">
              ✅ Aquí está la ganancia: diferencia entre dólar oficial y USDT
            </div>
          </div>
        </div>

        <!-- Paso 4: Retirar -->
        <div class="step-simple" data-step="4">
          <div class="step-number">4</div>
          <div class="step-simple-content">
            <h4>🏦 Retirar a tu Banco</h4>
            <p class="step-simple-text">Transfiere los pesos a tu cuenta bancaria</p>
            <div class="step-simple-calc final">
              <span class="calc-label">Después de comisiones:</span>
              <span class="calc-result">$${Fmt.formatNumber(finalAmount)}</span>
            </div>
            <div class="profit-summary ${profit >= 0 ? 'positive' : 'negative'}">
              <div class="profit-main">
                <span class="profit-icon">${profit >= 0 ? '📈' : '📉'}</span>
                <span class="profit-amount">${profit >= 0 ? '+' : ''}$${Fmt.formatNumber(profit)}</span>
                <span class="profit-percent">(${profit >= 0 ? '+' : ''}${Fmt.formatNumber(profitPercentage)}%)</span>
              </div>
              <div class="profit-subtitle">
                ${profit >= 0 ? 'Ganancia neta' : 'Pérdida neta'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen Rápido -->
      <div class="quick-summary">
        <h4>📊 Resumen Rápido</h4>
        <div class="summary-flow">
          <div class="summary-item">
            <span class="summary-label">Inversión</span>
            <span class="summary-value">$${Fmt.formatNumber(estimatedInvestment)}</span>
          </div>
          <span class="summary-arrow">→</span>
          <div class="summary-item">
            <span class="summary-label">USD Oficial</span>
            <span class="summary-value">${Fmt.formatNumber(usdAmount)} USD</span>
          </div>
          <span class="summary-arrow">→</span>
          <div class="summary-item">
            <span class="summary-label">USDT</span>
            <span class="summary-value">${Fmt.formatNumber(usdtAfterFees)} USDT</span>
          </div>
          <span class="summary-arrow">→</span>
          <div class="summary-item highlight">
            <span class="summary-label">Resultado</span>
            <span class="summary-value big">$${Fmt.formatNumber(finalAmount)}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Sanitizar HTML para prevenir XSS
   * @private
   * @param {string} text - Texto a sanitizar
   * @returns {string} Texto sanitizado
   */
  function sanitizeHTML(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Configurar animaciones del modal
   * @private
   * @param {HTMLElement} container - Contenedor del modal
   */
  function setupModalAnimations(container) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('active');
            }, index * 100);
          }
        });
      },
      { threshold: 0.5 }
    );

    const stepItems = container.querySelectorAll('.step-item');
    stepItems.forEach(step => observer.observe(step));
  }

  // ==========================================
  // FUNCIONES PÚBLICAS
  // ==========================================

  /**
   * Inicializar el módulo de modales
   * @public
   * @param {Object} settings - Configuración del usuario
   */
  function init(_settings) {
    setupGlobalEventListeners();
    console.log('✅ [ModalManager] Módulo inicializado');
  }

  /**
   * Configurar event listeners globales
   * @private
   */
  function setupGlobalEventListeners() {
    // Event listener para cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeModal) {
        closeModal();
      }
    });

    // Configurar modal de detalles de ruta
    setupRouteDetailsModal();
  }

  /**
   * Configurar modal de detalles de ruta
   * @public
   */
  function setupRouteDetailsModal() {
    console.log('📱 [ModalManager] Configurando modal de detalles de ruta');

    const modal = document.getElementById('route-details-modal');
    if (!modal) {
      console.warn('⚠️ [ModalManager] Modal #route-details-modal no encontrado');
      return;
    }

    // Event listener para cerrar modal
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    // Event listener para cerrar al hacer click en el overlay
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    console.log('✅ [ModalManager] Modal de detalles configurado');
  }

  /**
   * Abrir modal con detalles de ruta
   * @public
   * @param {Object} arbitrage - Datos del arbitraje
   */
  function openRouteDetailsModal(arbitrage) {
    console.log('📱 [ModalManager] Abriendo modal de detalles para:', arbitrage);

    const modal = document.getElementById('route-details-modal');
    if (!modal) {
      console.error('❌ [ModalManager] Modal #route-details-modal no encontrado');
      return;
    }

    // Calcular valores
    const values = calculateGuideValues(arbitrage);

    // Generar HTML
    const modalHtml = `
      <div class="guide-container-simple">
        ${generateGuideHeader(values.broker, values.profitPercentage)}
        ${generateGuideSteps(values)}
      </div>
    `;

    // Insertar contenido
    const modalBody = document.getElementById('modal-body');
    if (modalBody) {
      modalBody.innerHTML = modalHtml;
      setupModalAnimations(modalBody);
    } else {
      console.error('❌ [ModalManager] #modal-body no encontrado');
    }

    // Mostrar modal
    modal.style.display = 'flex';
    activeModal = 'route-details';

    // Agregar al historial
    modalHistory.push('route-details');

    console.log('✅ [ModalManager] Modal abierto');
  }

  /**
   * Cerrar modal activo
   * @public
   */
  function closeModal() {
    if (!activeModal) {
      console.warn('⚠️ [ModalManager] No hay modal activo para cerrar');
      return;
    }

    console.log('📱 [ModalManager] Cerrando modal:', activeModal);

    const modal = document.getElementById('route-details-modal');
    if (modal) {
      modal.style.display = 'none';
    }

    // Remover del historial
    if (modalHistory.length > 0) {
      modalHistory.pop();
    }

    // Establecer modal activo anterior
    activeModal = modalHistory.length > 0 ? modalHistory[modalHistory.length - 1] : null;

    console.log('✅ [ModalManager] Modal cerrado');
  }

  /**
   * Mostrar modal de confirmación
   * @public
   * @param {string} message - Mensaje a mostrar
   * @param {Function} onConfirm - Callback al confirmar
   * @param {Function} onCancel - Callback al cancelar
   * @returns {Promise<boolean>} Promise que resuelve con la elección del usuario
   */
  function showConfirmation(message, onConfirm, onCancel) {
    return new Promise((resolve) => {
      // Crear modal dinámicamente
      const modal = document.createElement('div');
      modal.className = 'modal-overlay confirmation-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>⚠️ Confirmación</h3>
          </div>
          <div class="modal-body">
            <p>${sanitizeHTML(message)}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-action="cancel">Cancelar</button>
            <button class="btn btn-primary" data-action="confirm">Confirmar</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Configurar event listeners
      const confirmBtn = modal.querySelector('[data-action="confirm"]');
      const cancelBtn = modal.querySelector('[data-action="cancel"]');

      const handleConfirm = () => {
        document.body.removeChild(modal);
        if (onConfirm) onConfirm();
        resolve(true);
      };

      const handleCancel = () => {
        document.body.removeChild(modal);
        if (onCancel) onCancel();
        resolve(false);
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);

      // Cerrar al hacer click fuera
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          handleCancel();
        }
      });

      // Mostrar modal
      setTimeout(() => modal.classList.add('active'), 10);
    });
  }

  /**
   * Mostrar modal de alerta
   * @public
   * @param {string} title - Título de la alerta
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de alerta (info, warning, error, success)
   * @returns {Promise<void>} Promise que resuelve cuando se cierra
   */
  function showAlert(title, message, type = 'info') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = `modal-overlay alert-modal alert-${type}`;
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${sanitizeHTML(title)}</h3>
          </div>
          <div class="modal-body">
            <p>${sanitizeHTML(message)}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" data-action="close">Cerrar</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const closeBtn = modal.querySelector('[data-action="close"]');
      const handleClose = () => {
        document.body.removeChild(modal);
        resolve();
      };

      closeBtn.addEventListener('click', handleClose);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          handleClose();
        }
      });

      setTimeout(() => modal.classList.add('active'), 10);
    });
  }

  /**
   * Mostrar modal de información
   * @public
   * @param {string} title - Título
   * @param {string} content - Contenido HTML
   */
  function showInfo(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay info-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${sanitizeHTML(title)}</h3>
          <span class="modal-close">&times;</span>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    const handleClose = () => {
      document.body.removeChild(modal);
    };

    closeBtn.addEventListener('click', handleClose);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        handleClose();
      }
    });

    setTimeout(() => modal.classList.add('active'), 10);
  }

  /**
   * Obtener el modal activo
   * @public
   * @returns {string|null} Tipo de modal activo
   */
  function getActiveModal() {
    return activeModal;
  }

  /**
   * Verificar si hay un modal activo
   * @public
   * @returns {boolean} True si hay modal activo
   */
  function hasActiveModal() {
    return activeModal !== null;
  }

  // ==========================================
  // EXPORTAR MÓDULO
  // ==========================================

  const ModalManager = {
    // Constantes
    MODAL_TYPES,
    MODAL_STATES,

    // Inicialización
    init,

    // Modal de ruta
    setupRouteDetailsModal,
    openRouteDetailsModal,
    closeModal,

    // Modales genéricos
    showConfirmation,
    showAlert,
    showInfo,

    // Estado
    getActiveModal,
    hasActiveModal
  };

  // Exportar para uso global
  window.ModalManager = ModalManager;

  console.log('✅ [ModalManager] Módulo cargado correctamente');

})(window);
