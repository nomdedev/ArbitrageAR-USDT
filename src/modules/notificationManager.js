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
  function init(_settings) {
    setupUpdateBanner();
    window.Logger?.debug('✅ [NotificationManager] Módulo inicializado');
  }

  /**
   * Actualizar la configuración del usuario
   * @public
   * @param {Object} settings - Nueva configuración
   */
  function updateSettings(_settings) {
    return;
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

    window.Logger?.debug(`🔔 [NotificationManager] Toast mostrado: ${type} - ${message}`);
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
    window.Logger?.debug('🔕 [NotificationManager] Todos los toasts cerrados');
  }

  /**
   * Configurar banner de actualización
   * @private
   */
  async function setupUpdateBanner() {
    const updateData =
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local &&
      typeof chrome.storage.local.get === 'function'
        ? await chrome.storage.local.get('pendingUpdate')
        : {};
    const pendingUpdate = updateData?.pendingUpdate;

    if (!pendingUpdate) {
      window.Logger?.debug('✅ [NotificationManager] No hay actualizaciones pendientes');
      return;
    }

    // Verificar si fue descartada
    if (await isUpdateDismissed(pendingUpdate)) {
      window.Logger?.debug('✅ [NotificationManager] Actualización ya descartada');
      return;
    }

    showUpdateBanner(pendingUpdate);
  }

  /**
   * Mostrar indicador de actualización no invasivo
   * Solo muestra modal para actualizaciones MAJOR
   * @public
   * @param {Object} updateInfo - Información de actualización
   */
  function showUpdateBanner(updateInfo) {
    // Determinar tipo de actualización
    const updateType = determineUpdateType(
      updateInfo.currentVersion,
      updateInfo.latestVersion
    );

    // Siempre mostrar el indicador no invasivo primero
    showUpdateIndicator(updateInfo, updateType);

    // Solo mostrar modal invasivo para actualizaciones MAJOR
    if (updateType === UPDATE_TYPES.MAJOR) {
      showUpdateModal(updateInfo, updateType);
    }

    activeBanner = updateInfo;
    window.Logger?.debug(`📢 [NotificationManager] Actualización ${updateType} detectada: v${updateInfo.latestVersion}`);
  }

  /**
   * Mostrar indicador de actualización no invasivo en el header
   * @private
   * @param {Object} updateInfo - Información de actualización
   * @param {string} updateType - Tipo de actualización (MAJOR, MINOR, PATCH)
   */
  function showUpdateIndicator(updateInfo, updateType) {
    const versionIndicator = document.getElementById('version-indicator');
    const updateBadge = document.getElementById('update-badge');

    if (!versionIndicator) {
      console.warn('⚠️ [NotificationManager] Indicador de versión no encontrado');
      return;
    }

    // Agregar clase para estilo visual
    versionIndicator.classList.add('has-update');

    // Mostrar badge de actualización
    if (updateBadge) {
      updateBadge.style.display = 'flex';
    }

    // Crear tooltip con información de la actualización
    const typeLabels = {
      [UPDATE_TYPES.MAJOR]: '🚀 ¡Actualización importante!',
      [UPDATE_TYPES.MINOR]: '✨ Nueva versión disponible',
      [UPDATE_TYPES.PATCH]: '🔧 Correcciones disponibles'
    };

    const tooltipText = `${typeLabels[updateType] || 'Nueva versión'}\nv${updateInfo.latestVersion}\nClick para descargar`;
    versionIndicator.setAttribute('data-update-tooltip', tooltipText.replace(/\n/g, ' • '));
    versionIndicator.setAttribute('aria-label', `Actualización disponible: v${updateInfo.latestVersion}. Click para descargar.`);

    // Configurar click para descargar
    versionIndicator.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      downloadUpdate(updateInfo);
    };

    window.Logger?.debug(`🔔 [NotificationManager] Indicador de actualización mostrado: ${updateType}`);
  }

  /**
   * Descargar actualización (abrir repositorio de GitHub)
   * @private
   * @param {Object} updateInfo - Información de actualización
   */
  function downloadUpdate(updateInfo) {
    // URL del repositorio de GitHub (releases)
    const repoUrl = 'https://github.com/nomdedev/ArbitrageAR-USDT/releases/latest';

    // Usar URL específica si está disponible
    const downloadUrl = updateInfo?.downloadUrl || updateInfo?.url || repoUrl;

    window.Logger?.debug(`⬇️ [NotificationManager] Descargando actualización desde: ${downloadUrl}`);

    // Abrir en nueva pestaña
    chrome.tabs.create({ url: downloadUrl });

    // Mostrar toast de confirmación
    showToast('Abriendo página de descarga...', TOAST_TYPES.INFO, TOAST_DURATION.SHORT);
  }

  /**
   * Ocultar indicador de actualización
   * @public
   */
  function hideUpdateIndicator() {
    const versionIndicator = document.getElementById('version-indicator');
    const updateBadge = document.getElementById('update-badge');

    if (versionIndicator) {
      versionIndicator.classList.remove('has-update');
      versionIndicator.removeAttribute('data-update-tooltip');
      versionIndicator.onclick = null;
    }

    if (updateBadge) {
      updateBadge.style.display = 'none';
    }

    window.Logger?.debug('🔕 [NotificationManager] Indicador de actualización oculto');
  }

  /**
   * Mostrar modal de actualización (solo para MAJOR updates)
   * @private
   * @param {Object} updateInfo - Información de actualización
   * @param {string} updateType - Tipo de actualización
   */
  function showUpdateModal(updateInfo, updateType) {
    const modal = document.getElementById('update-modal');
    if (!modal) {
      console.warn('⚠️ [NotificationManager] Modal #update-modal no encontrado');
      return;
    }

    const currentVersionEl = document.getElementById('current-version');
    const newVersionEl = document.getElementById('new-version');
    const messageEl = document.getElementById('update-message');
    const typeBadgeEl = document.getElementById('update-type');
    const featuresListEl = document.getElementById('update-features-list');

    if (currentVersionEl) currentVersionEl.textContent = `v${updateInfo.currentVersion}`;
    if (newVersionEl) newVersionEl.textContent = `v${updateInfo.latestVersion}`;
    if (messageEl) messageEl.textContent = updateInfo.message || 'Nueva versión con mejoras de rendimiento y nuevas funcionalidades.';

    if (typeBadgeEl) {
      typeBadgeEl.textContent = updateType;
    }

    // Actualizar características si están disponibles
    if (featuresListEl && updateInfo.features) {
      featuresListEl.innerHTML = updateInfo.features
        .map(feature => `<li>${feature}</li>`)
        .join('');
    }

    // Configurar clase de tipo
    modal.className = `update-modal-dialog type-${updateType.toLowerCase()}`;

    // Mostrar modal usando el API nativo de dialog
    modal.showModal();
    activeBanner = updateInfo;

    // Configurar botones
    setupUpdateBannerButtons(updateInfo);

    window.Logger?.debug(`📢 [NotificationManager] Modal de actualización mostrado: ${updateType}`);
  }

  /**
   * Configurar botones del modal de actualización
   * @private
   * @param {Object} updateInfo - Información de actualización
   */
  function setupUpdateBannerButtons(updateInfo) {
    const downloadBtn = document.getElementById('download-update');
    const viewBtn = document.getElementById('view-update');
    const dismissBtn = document.getElementById('dismiss-update');

    if (downloadBtn) {
      // Remover listener anterior si existe
      const newDownloadBtn = downloadBtn.cloneNode(true);
      downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);

      newDownloadBtn.addEventListener('click', () => {
        window.Logger?.debug('🖱️ [NotificationManager] Click en "Descargar actualización"');
        downloadUpdate(updateInfo);
        hideUpdateBanner();
      });
    }

    if (viewBtn) {
      // Remover listener anterior si existe
      const newViewBtn = viewBtn.cloneNode(true);
      viewBtn.parentNode.replaceChild(newViewBtn, viewBtn);

      newViewBtn.addEventListener('click', () => {
        window.Logger?.debug('🖱️ [NotificationManager] Click en "Ver más detalles"');
        // Abrir página de releases de GitHub
        const releasesUrl = 'https://github.com/nomdedev/ArbitrageAR-USDT/releases';
        chrome.tabs.create({ url: updateInfo?.url || releasesUrl });
      });
    }

    if (dismissBtn) {
      // Remover listener anterior si existe
      const newDismissBtn = dismissBtn.cloneNode(true);
      dismissBtn.parentNode.replaceChild(newDismissBtn, dismissBtn);

      newDismissBtn.addEventListener('click', async () => {
        window.Logger?.debug('🖱️ [NotificationManager] Click en "Cerrar"');

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
        window.Logger?.debug('💾 [NotificationManager] Actualización descartada');

        hideUpdateBanner();
      });
    }

    // Cerrar al hacer clic en el backdrop
    const modal = document.getElementById('update-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        const rect = modal.querySelector('.update-modal').getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
          hideUpdateBanner();
        }
      });
    }
  }

  /**
   * Ocultar modal de actualización
   * @public
   */
  function hideUpdateBanner() {
    const modal = document.getElementById('update-modal');
    if (!modal) {
      console.warn('⚠️ [NotificationManager] Modal #update-modal no encontrado para ocultar');
      return;
    }

    // Cerrar usando el API nativo de dialog
    if (modal.open) {
      modal.close();
    }

    activeBanner = null;

    window.Logger?.debug('🔽 [NotificationManager] Modal de actualización oculto');
  }

  /**
   * Verificar actualizaciones al cargar
   * @public
   * @async
   */
  async function checkForUpdates() {
    const updateData =
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local &&
      typeof chrome.storage.local.get === 'function'
        ? await chrome.storage.local.get('pendingUpdate')
        : {};
    const pendingUpdate = updateData?.pendingUpdate;

    if (!pendingUpdate) {
      window.Logger?.debug('✅ [NotificationManager] No hay actualizaciones pendientes');
      return;
    }

    // Verificar si fue descartada
    if (await isUpdateDismissed(pendingUpdate)) {
      window.Logger?.debug('✅ [NotificationManager] Actualización ya descartada');
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
    hideUpdateIndicator,
    downloadUpdate,
    checkForUpdates,
    getActiveBanner,
    hasActiveBanner
  };

  // Exportar para uso global
  window.NotificationManager = NotificationManager;

  window.Logger?.debug('✅ [NotificationManager] Módulo cargado correctamente');

})(window);
