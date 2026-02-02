/**
 * Notification Manager Module
 * Módulo para la gestión de notificaciones, toasts y banners
 * @module NotificationManager
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  // ==========================================
  // ESTADO DEL MÓDULO
  // ==========================================

  let activeToasts = [];
  let activeBanner = null;
  let userSettings = null;

  // ==========================================
  // CONSTANTES
  // ==========================================

  const TOAST_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  };

  const TOAST_DURATION = {
    SHORT: 2000,
    MEDIUM: 3000,
    LONG: 5000
  };

  const UPDATE_TYPES = {
    MAJOR: 'MAJOR',
    MINOR: 'MINOR',
    PATCH: 'PATCH'
  };

  // ==========================================
  // FUNCIONES PRIVADAS
  // ==========================================

  /**
   * Crear elemento de toast
   * @private
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de toast
   * @returns {HTMLElement} Elemento del toast
   */
  function createToastElement(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    const colors = {
      [TOAST_TYPES.INFO]: '#3b82f6',
      [TOAST_TYPES.SUCCESS]: '#10b981',
      [TOAST_TYPES.WARNING]: '#f59e0b',
      [TOAST_TYPES.ERROR]: '#ef4444'
    };

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors[TOAST_TYPES.INFO]};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
      word-wrap: break-word;
    `;

    toast.textContent = message;
    return toast;
  }

  /**
   * Aplicar animación de entrada al toast
   * @private
   * @param {HTMLElement} toast - Elemento del toast
   * @param {string} type - Tipo de toast
   */
  function applyToastAnimation(toast, type) {
    toast.style.animation = 'none';
    toast.offsetHeight; // Trigger reflow
    
    const animations = {
      [TOAST_TYPES.SUCCESS]: 'successPulse 0.6s ease-out',
      [TOAST_TYPES.ERROR]: 'errorShake 0.5s ease-out',
      [TOAST_TYPES.WARNING]: 'warningPulse 0.5s ease-out',
      [TOAST_TYPES.INFO]: 'toastSlideIn 0.3s ease-out'
    };

    toast.style.animation = animations[type] || animations[TOAST_TYPES.INFO];
  }

  /**
   * Aplicar animación de salida y remover toast
   * @private
   * @param {HTMLElement} toast - Elemento del toast
   */
  function removeToastWithAnimation(toast) {
    toast.style.animation = 'toastSlideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
      // Remover de la lista de activos
      const index = activeToasts.indexOf(toast);
      if (index > -1) {
        activeToasts.splice(index, 1);
      }
    }, 300);
  }

  /**
   * Determinar tipo de actualización
   * @private
   * @param {string} currentVersion - Versión actual
   * @param {string} latestVersion - Última versión
   * @returns {string} Tipo de actualización
   */
  function determineUpdateType(currentVersion, latestVersion) {
    const current = currentVersion.split('.').map(Number);
    const latest = latestVersion.split('.').map(Number);

    if (latest[0] > current[0]) return UPDATE_TYPES.MAJOR;
    if (latest[1] > current[1]) return UPDATE_TYPES.MINOR;
    return UPDATE_TYPES.PATCH;
  }

  /**
   * Verificar si una actualización fue descartada
   * @private
   * @param {Object} updateInfo - Información de actualización
   * @returns {Promise<boolean>} True si fue descartada
   */
  async function isUpdateDismissed(updateInfo) {
    const { dismissedUpdate } = await chrome.storage.local.get('dismissedUpdate');
    
    if (!dismissedUpdate) return false;
    if (dismissedUpdate.expiresAt > Date.now()) {
      return dismissedUpdate.version === updateInfo.latestVersion;
    }
    return false;
  }

  // ==========================================
  // FUNCIONES PÚBLICAS
  // ==========================================

  /**
   * Inicializar el módulo de notificaciones
   * @public
   * @param {Object} settings - Configuración del usuario
   */
  function init(settings) {
    userSettings = settings;
    setupUpdateBanner();
    console.log('✅ [NotificationManager] Módulo inicializado');
  }

  /**
   * Actualizar la configuración del usuario
   * @public
   * @param {Object} settings - Nueva configuración
   */
  function updateSettings(settings) {
    userSettings = settings;
  }

  /**
   * Mostrar notificación toast
   * @public
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación (info, success, warning, error)
   * @param {number} duration - Duración en milisegundos
   * @returns {HTMLElement} Elemento del toast creado
   */
  function showToast(message, type = TOAST_TYPES.INFO, duration = TOAST_DURATION.MEDIUM) {
    // Verificar preferencia de movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const toast = createToastElement(message, type);
    
    if (!prefersReducedMotion) {
      applyToastAnimation(toast, type);
    }

    document.body.appendChild(toast);
    activeToasts.push(toast);

    // Auto-remover después de la duración
    setTimeout(() => {
      if (toast.parentNode) {
        if (!prefersReducedMotion) {
          removeToastWithAnimation(toast);
        } else {
          toast.remove();
          const index = activeToasts.indexOf(toast);
          if (index > -1) {
            activeToasts.splice(index, 1);
          }
        }
      }
    }, duration);

    console.log(`🔔 [NotificationManager] Toast mostrado: ${type} - ${message}`);
    return toast;
  }

  /**
   * Mostrar toast de éxito
   * @public
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en milisegundos
   */
  function showSuccess(message, duration = TOAST_DURATION.MEDIUM) {
    return showToast(message, TOAST_TYPES.SUCCESS, duration);
  }

  /**
   * Mostrar toast de error
   * @public
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en milisegundos
   */
  function showError(message, duration = TOAST_DURATION.LONG) {
    return showToast(message, TOAST_TYPES.ERROR, duration);
  }

  /**
   * Mostrar toast de advertencia
   * @public
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en milisegundos
   */
  function showWarning(message, duration = TOAST_DURATION.MEDIUM) {
    return showToast(message, TOAST_TYPES.WARNING, duration);
  }

  /**
   * Mostrar toast de información
   * @public
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en milisegundos
   */
  function showInfo(message, duration = TOAST_DURATION.MEDIUM) {
    return showToast(message, TOAST_TYPES.INFO, duration);
  }

  /**
   * Cerrar todos los toasts activos
   * @public
   */
  function closeAllToasts() {
    activeToasts.forEach(toast => {
      if (toast.parentNode) {
        toast.remove();
      }
    });
    activeToasts = [];
    console.log('🔕 [NotificationManager] Todos los toasts cerrados');
  }

  /**
   * Configurar banner de actualización
   * @private
   */
  async function setupUpdateBanner() {
    const { pendingUpdate } = await chrome.storage.local.get('pendingUpdate');
    
    if (!pendingUpdate) {
      console.log('✅ [NotificationManager] No hay actualizaciones pendientes');
      return;
    }

    // Verificar si fue descartada
    if (await isUpdateDismissed(pendingUpdate)) {
      console.log('✅ [NotificationManager] Actualización ya descartada');
      return;
    }

    showUpdateBanner(pendingUpdate);
  }

  /**
   * Mostrar banner de actualización
   * @public
   * @param {Object} updateInfo - Información de actualización
   */
  function showUpdateBanner(updateInfo) {
    const banner = document.getElementById('update-banner');
    if (!banner) {
      console.warn('⚠️ [NotificationManager] Banner #update-banner no encontrado');
      return;
    }

    const currentVersionEl = document.getElementById('current-version');
    const newVersionEl = document.getElementById('new-version');
    const messageEl = document.getElementById('update-message');
    const typeBadgeEl = document.getElementById('update-type');

    if (currentVersionEl) currentVersionEl.textContent = `v${updateInfo.currentVersion}`;
    if (newVersionEl) newVersionEl.textContent = `v${updateInfo.latestVersion}`;
    if (messageEl) messageEl.textContent = updateInfo.message || 'Nueva versión disponible';

    // Determinar tipo de actualización
    const updateType = determineUpdateType(
      updateInfo.currentVersion,
      updateInfo.latestVersion
    );

    if (typeBadgeEl) {
      typeBadgeEl.textContent = updateType;
    }

    banner.className = `update-banner type-${updateType.toLowerCase()}`;
    banner.style.display = 'flex';
    activeBanner = updateInfo;

    // Configurar botones
    setupUpdateBannerButtons(updateInfo);

    console.log(`📢 [NotificationManager] Banner de actualización mostrado: ${updateType}`);
  }

  /**
   * Configurar botones del banner de actualización
   * @private
   * @param {Object} updateInfo - Información de actualización
   */
  function setupUpdateBannerButtons(updateInfo) {
    const viewBtn = document.getElementById('view-update');
    const dismissBtn = document.getElementById('dismiss-update');

    if (viewBtn) {
      // Remover listener anterior si existe
      const newViewBtn = viewBtn.cloneNode(true);
      viewBtn.parentNode.replaceChild(newViewBtn, viewBtn);

      newViewBtn.addEventListener('click', () => {
        console.log('🖱️ [NotificationManager] Click en "Ver cambios"');
        if (updateInfo?.url) {
          chrome.tabs.create({ url: updateInfo.url });
        }
      });
    }

    if (dismissBtn) {
      // Remover listener anterior si existe
      const newDismissBtn = dismissBtn.cloneNode(true);
      dismissBtn.parentNode.replaceChild(newDismissBtn, dismissBtn);

      newDismissBtn.addEventListener('click', async () => {
        console.log('🖱️ [NotificationManager] Click en "Cerrar"');

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        const dismissedData = {
          dismissedUpdate: {
            version: updateInfo.latestVersion,
            dismissedAt: Date.now(),
            expiresAt: expiryDate.getTime()
          }
        };

        await chrome.storage.local.set(dismissedData);
        console.log('💾 [NotificationManager] Actualización descartada');

        hideUpdateBanner();
      });
    }
  }

  /**
   * Ocultar banner de actualización
   * @public
   */
  function hideUpdateBanner() {
    const banner = document.getElementById('update-banner');
    if (!banner) {
      console.warn('⚠️ [NotificationManager] Banner #update-banner no encontrado para ocultar');
      return;
    }

    banner.style.display = 'none';
    banner.classList.add('hidden');
    banner.setAttribute('aria-hidden', 'true');
    activeBanner = null;

    console.log('🔽 [NotificationManager] Banner de actualización oculto');
  }

  /**
   * Verificar actualizaciones al cargar
   * @public
   * @async
   */
  async function checkForUpdates() {
    const { pendingUpdate } = await chrome.storage.local.get('pendingUpdate');

    if (!pendingUpdate) {
      console.log('✅ [NotificationManager] No hay actualizaciones pendientes');
      return;
    }

    // Verificar si fue descartada
    if (await isUpdateDismissed(pendingUpdate)) {
      console.log('✅ [NotificationManager] Actualización ya descartada');
      return;
    }

    showUpdateBanner(pendingUpdate);
  }

  /**
   * Obtener el banner activo
   * @public
   * @returns {Object|null} Información del banner activo
   */
  function getActiveBanner() {
    return activeBanner;
  }

  /**
   * Verificar si hay un banner activo
   * @public
   * @returns {boolean} True si hay banner activo
   */
  function hasActiveBanner() {
    return activeBanner !== null;
  }

  /**
   * Obtener toasts activos
   * @public
   * @returns {Array} Lista de toasts activos
   */
  function getActiveToasts() {
    return [...activeToasts];
  }

  /**
   * Verificar si hay toasts activos
   * @public
   * @returns {boolean} True si hay toasts activos
   */
  function hasActiveToasts() {
    return activeToasts.length > 0;
  }

  // ==========================================
  // EXPORTAR MÓDULO
  // ==========================================

  const NotificationManager = {
    // Constantes
    TOAST_TYPES,
    TOAST_DURATION,
    UPDATE_TYPES,

    // Inicialización
    init,
    updateSettings,

    // Toasts
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAllToasts,
    getActiveToasts,
    hasActiveToasts,

    // Banner de actualización
    showUpdateBanner,
    hideUpdateBanner,
    checkForUpdates,
    getActiveBanner,
    hasActiveBanner
  };

  // Exportar para uso global
  window.NotificationManager = NotificationManager;

  console.log('✅ [NotificationManager] Módulo cargado correctamente');

})(window);
