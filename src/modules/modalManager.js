/**
 * Modal Manager Module
 * Módulo para la gestión de modales y diálogos en la aplicación
 * @module ModalManager
 * @version 1.0.0
 */

(function (window) {
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
  /**
   * Generar HTML del header de la guía
   * @private
   * @param {string} broker - Nombre del broker
   * @param {number} profitPercentage - Porcentaje de ganancia
   * @returns {string} HTML del header
   */
  /**
   * Generar HTML de los pasos de la guía
   * @private
   * @param {Object} values - Valores calculados
   * @returns {string} HTML de los pasos
   */
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
    window.Logger?.debug(' [ModalManager] Módulo inicializado');
  }

  /**
   * Configurar event listeners globales
   * @private
   */
  function setupGlobalEventListeners() {
    // Event listener para cerrar modal con Escape
    document.addEventListener('keydown', e => {
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
    window.Logger?.debug(' [ModalManager] Configurando modal de detalles de ruta');

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
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeModal();
      }
    });

    window.Logger?.debug(' [ModalManager] Modal de detalles configurado');
  }

  /**
   * Abrir modal con detalles de ruta
   * @public
   * @param {Object} arbitrage - Datos del arbitraje
   */
  /**
   * Cerrar modal activo
   * @public
   */
  function closeModal() {
    if (!activeModal) {
      console.warn('⚠️ [ModalManager] No hay modal activo para cerrar');
      return;
    }

    window.Logger?.debug(' [ModalManager] Cerrando modal:', activeModal);

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

    window.Logger?.debug(' [ModalManager] Modal cerrado');
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
    return new Promise(resolve => {
      // Crear modal dinámicamente
      const modal = document.createElement('div');
      modal.className = 'modal-overlay confirmation-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
 <h3> Confirmación</h3>
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
      modal.addEventListener('click', e => {
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
    return new Promise(resolve => {
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
      modal.addEventListener('click', e => {
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
   * @param {string} content - Contenido HTML (DEBE ser sanitizado por el llamador)
   * @security El parámetro content se inserta directamente como HTML.
   *           El llamador ES RESPONSABLE de sanitizar cualquier contenido dinámico.
   *           Para contenido de usuario o APIs externas, usar sanitizeHTML() antes de llamar.
   */
  function showInfo(title, content) {
    // CORREGIDO v6.0.2: Agregar nota de seguridad - content debe ser sanitizado por el llamador
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
    modal.addEventListener('click', e => {
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

  window.Logger?.debug(' [ModalManager] Módulo cargado correctamente');
})(window);
