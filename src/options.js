// ============================================
// OPTIONS PAGE LOGIC - ArbitrageAR v3.0
// ============================================

// Configuración por defecto
const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  alertThreshold: 1.0, // Umbral único de alerta (%)
  soundEnabled: true,
  notificationExchanges: ['binance', 'buenbit', 'lemoncash', 'ripio', 'fiwind', 'letsbit'],
  preferredExchanges: [],
  dataFreshnessWarning: true, // Alertar si datos tienen más de 5 min
  riskAlertsEnabled: true, // Mostrar semáforo de riesgo
  requireConfirmHighAmount: true, // Confirmar simulaciones > $500k
  minProfitWarning: 0.5, // Alertar si ganancia < 0.5%
  preferSingleExchange: false,
  defaultSimAmount: 1000000,
  maxRoutesDisplay: 20,
  filterMinProfit: -10.0, // Umbral mínimo de ganancia para MOSTRAR rutas (%) - por defecto -10% (mostrar casi todo)
  sortByProfit: true, // Ordenar rutas por ganancia descendente
  extraTradingFee: 0,        // 0% - Usuario debe configurar según su exchange
  extraWithdrawalFee: 0,     // $0 ARS - Usuario debe configurar si aplica
  extraTransferFee: 0,       // $0 ARS - Usuario debe configurar si aplica
  bankCommissionFee: 0,      // $0 ARS - Usuario debe configurar si aplica
  fallbackUsdToUsdtRate: 1.0, // Tasa de fallback si API USDT/USD falla (paridad 1:1)
  applyFeesInCalculation: false, // CORREGIDO: false por defecto = sin fees
  brokerFees: [], // Array de {broker: string, buyFee: number, sellFee: number}
  dolarApiUrl: 'https://dolarapi.com/v1/dolares/oficial',
  criptoyaUsdtArsUrl: 'https://criptoya.com/api/usdt/ars/1',
  criptoyaUsdtUsdUrl: 'https://criptoya.com/api/usdt/usd/1',
  criptoyaBanksUrl: 'https://criptoya.com/api/bancostodos',
  updateIntervalMinutes: 5, // Intervalo de actualización en minutos
  requestTimeoutSeconds: 10, // Timeout de requests en segundos
  dollarPriceSource: 'auto', // 'auto' o 'manual' - por defecto automático con bancos
  manualDollarPrice: 1400,
  preferredBank: 'consenso', // Método por defecto: consenso de bancos
  showBestBankPrice: false,
  selectedBanks: undefined // undefined = usar bancos por defecto (bna, galicia, santander, bbva, icbc)
};

// Cargar configuración al iniciar
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
  initializeBrokerFeesImproved();
  setupMainEventListeners(); // NUEVO: Configurar event listeners principales
});

// Cargar configuración guardada
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('notificationSettings');
    const settings = result.notificationSettings || DEFAULT_SETTINGS;

    // Aplicar configuración a los elementos
    const notifEnabledEl = document.getElementById('notify-enabled');
    if (notifEnabledEl) {
      notifEnabledEl.checked = settings.notificationsEnabled;
    }

    // Umbral único de alerta
    document.getElementById('alert-threshold').value = settings.alertThreshold ?? 1.0;

    // Frecuencia
    document.getElementById('notify-frequency').value = settings.notificationFrequency;

    // Sonido
    document.getElementById('sound-enabled').checked = settings.soundEnabled;

    // Exchanges preferidos
    if (settings.preferredExchanges && settings.preferredExchanges.length > 0) {
      settings.preferredExchanges.forEach(exchange => {
        const checkbox = document.querySelector(`input[name="exchange"][value="${exchange}"]`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    }

    // NUEVO: Exchanges para notificaciones
    if (settings.notificationExchanges && settings.notificationExchanges.length > 0) {
      settings.notificationExchanges.forEach(exchange => {
        const checkbox = document.querySelector(`input[name="notify-exchange"][value="${exchange}"]`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    } else {
      // Por defecto, marcar los principales exchanges
      const defaultExchanges = ['binance', 'buenbit', 'lemoncash', 'ripio', 'fiwind', 'letsbit'];
      defaultExchanges.forEach(exchange => {
        const checkbox = document.querySelector(`input[name="notify-exchange"][value="${exchange}"]`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    }

    // Horario silencioso
    document.getElementById('quiet-hours').checked = settings.quietHoursEnabled;
    document.getElementById('quiet-start').value = settings.quietStart;
    document.getElementById('quiet-end').value = settings.quietEnd;

    document.getElementById('simulator-amount').value = settings.defaultSimAmount ?? 1000000;
    document.getElementById('max-routes').value = settings.maxRoutesDisplay ?? 20;
    document.getElementById('min-profit').value = settings.filterMinProfit ?? -10.0;
    document.getElementById('sort-profit').checked = settings.sortByProfit ?? true;

    // NUEVO v5.0.4: Fees personalizados
    document.getElementById('trading-fee').value = settings.extraTradingFee ?? 0;
    document.getElementById('withdrawal-fee').value = settings.extraWithdrawalFee ?? 0;
    document.getElementById('transfer-fee').value = settings.extraTransferFee ?? 0;
    document.getElementById('bank-fee').value = settings.bankCommissionFee ?? 0;

    // NUEVO v5.0.28: Opciones de seguridad y validación
    const freshnessWarningEl = document.getElementById('freshness-warning');
    if (freshnessWarningEl) freshnessWarningEl.checked = settings.dataFreshnessWarning ?? true;

    const riskAlertsEl = document.getElementById('risk-alerts');
    if (riskAlertsEl) riskAlertsEl.checked = settings.riskAlertsEnabled ?? true;

    const confirmHighAmountEl = document.getElementById('confirm-high-amount');
    if (confirmHighAmountEl) confirmHighAmountEl.checked = settings.requireConfirmHighAmount ?? true;

    const highThresholdEl = document.getElementById('high-threshold');
    if (highThresholdEl) highThresholdEl.value = settings.minProfitWarning ?? 500000;

    // NUEVO: Configuración de precio del dólar
    const dollarSourceRadio = document.querySelector(`input[name="dollar-price-source"][value="${settings.dollarPriceSource ?? 'auto'}"]`);
    if (dollarSourceRadio) {
      dollarSourceRadio.checked = true;
    }
    document.getElementById('manual-dollar-price').value = settings.manualDollarPrice;
    document.getElementById('dollar-method').value = settings.preferredBank ?? 'consenso';

    // NUEVO v5.0.23: Configuración de bancos
    const selectedBanks = settings.selectedBanks;
    const defaultSelectedBanks = ['bna', 'galicia', 'santander', 'bbva', 'icbc'];

    document.querySelectorAll('input[name="bank"]').forEach(cb => {
      // Si no hay configuración guardada o está vacía, usar bancos por defecto
      // Si hay configuración guardada con bancos, usar esa configuración
      if (selectedBanks === undefined || (Array.isArray(selectedBanks) && selectedBanks.length === 0)) {
        cb.checked = defaultSelectedBanks.includes(cb.value);
      } else {
        cb.checked = selectedBanks.includes(cb.value);
      }
    });

    // NUEVO v5.0.53: URLs de APIs
    document.getElementById('dolarapi-url').value = settings.dolarApiUrl ?? 'https://dolarapi.com/v1/dolares/oficial';
    document.getElementById('criptoya-ars-url').value = settings.criptoyaUsdtArsUrl ?? 'https://criptoya.com/api/usdt/ars/1';
    document.getElementById('criptoya-usd-url').value = settings.criptoyaUsdtUsdUrl ?? 'https://criptoya.com/api/usdt/usd/1';
    document.getElementById('criptoya-banks-url').value = settings.criptoyaBanksUrl ?? 'https://criptoya.com/api/bancostodos';

    // NUEVO v5.0.54: Intervalos de actualización
    document.getElementById('update-interval').value = settings.updateIntervalMinutes ?? 5;
    document.getElementById('request-timeout').value = settings.requestTimeoutSeconds ?? 10;

    // NUEVO v5.0.28: Opciones de seguridad y validación
    document.getElementById('freshness-warning').checked = settings.dataFreshnessWarning ?? true;
    document.getElementById('risk-alerts').checked = settings.riskAlertsEnabled ?? true;

    // Mostrar/ocultar sección de precio manual
    updateDollarPriceUI();

    // Actualizar UI según estado de notificaciones
    updateUIState();

    console.log('✅ Configuración cargada correctamente');
  } catch (error) {
    console.error('Error cargando configuración:', error);
  }
}

// Configurar event listeners
function setupEventListeners() {
  console.log('Configurando event listeners...');
}

// Configurar event listeners principales
function setupMainEventListeners() {
  // Botón guardar
  const saveButton = document.getElementById('save-settings');
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      console.log('💾 Guardando configuración...');
      const success = await saveSettings();
      if (success) {
        // Recargar configuración para verificar que se guardó
        await loadSettings();
      }
    });
  }

  // Botón reset
  const resetButton = document.getElementById('reset-settings');
  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
        console.log('🔄 Reseteando configuración...');
        await saveSettings(DEFAULT_SETTINGS);
        await loadSettings();
        showNotification('Configuración restaurada', 'success');
      }
    });
  }

  // Event listeners para actualizar UI dinámicamente
  const dollarSourceRadios = document.querySelectorAll('input[name="dollar-price-source"]');
  dollarSourceRadios.forEach(radio => {
    radio.addEventListener('change', updateDollarPriceUI);
  });
}

// Inicializar nueva interfaz mejorada de fees por broker
function initializeBrokerFeesImproved() {
  // Stub function
  console.log('initializeBrokerFeesImproved called');
}

// Guardar configuración
async function saveSettings(settings = null) {
  try {
    const settingsToSave = settings || getCurrentSettings();

    await chrome.storage.local.set({ notificationSettings: settingsToSave });

    console.log('✅ Configuración guardada:', settingsToSave);
    showNotification('Configuración guardada correctamente', 'success');

    // NUEVO: Notificar al background script que la configuración cambió
    try {
      console.log('📤 [OPTIONS] Enviando settingsUpdated al background...');
      console.log('📤 [OPTIONS] Configuración a enviar:', JSON.stringify({
        dollarPriceSource: settingsToSave.dollarPriceSource,
        manualDollarPrice: settingsToSave.manualDollarPrice,
        preferredBank: settingsToSave.preferredBank
      }, null, 2));

      const response = await chrome.runtime.sendMessage({
        action: 'settingsUpdated',
        settings: settingsToSave
      });

      console.log('📥 [OPTIONS] Respuesta del background:', response);

      if (response?.success) {
        console.log('✅ [OPTIONS] Background confirmó actualización exitosa');
        console.log('📊 [OPTIONS] Nuevos datos del background:', {
          oficialCompra: response.data?.oficial?.compra,
          oficialSource: response.data?.oficial?.source
        });
      } else {
        console.warn('⚠️ [OPTIONS] Background respondió con error:', response?.error);
      }

    } catch (error) {
      console.warn('⚠️ [OPTIONS] Error enviando mensaje al background:', error);
      // No es crítico, el background se actualizará en la próxima carga
    }

    return true;
  } catch (error) {
    console.error('❌ Error guardando configuración:', error);
    showNotification('Error al guardar configuración', 'error');
    return false;
  }
}

// Obtener configuración actual de la UI
function getCurrentSettings() {
  const settings = { ...DEFAULT_SETTINGS };

  // Notificaciones
  settings.notificationsEnabled = document.getElementById('notify-enabled')?.checked ?? true;
  settings.alertThreshold = parseFloat(document.getElementById('alert-threshold')?.value) || 1.0;
  settings.soundEnabled = document.getElementById('sound-enabled')?.checked ?? true;

  // Exchanges para notificaciones
  const notifyExchangeCheckboxes = document.querySelectorAll('input[name="notify-exchange"]:checked');
  settings.notificationExchanges = Array.from(notifyExchangeCheckboxes).map(cb => cb.value);

  // Simulador
  settings.defaultSimAmount = parseInt(document.getElementById('simulator-amount')?.value) || 1000000;
  settings.maxRoutesDisplay = parseInt(document.getElementById('max-routes')?.value) || 20;
  settings.filterMinProfit = parseFloat(document.getElementById('min-profit')?.value) || -10.0;
  settings.sortByProfit = document.getElementById('sort-profit')?.checked ?? true;

  // Fees
  settings.extraTradingFee = parseFloat(document.getElementById('trading-fee')?.value) || 0;
  settings.extraWithdrawalFee = parseFloat(document.getElementById('withdrawal-fee')?.value) || 0;
  settings.extraTransferFee = parseFloat(document.getElementById('transfer-fee')?.value) || 0;
  settings.bankCommissionFee = parseFloat(document.getElementById('bank-fee')?.value) || 0;

  // Configuración del dólar
  const dollarSourceRadio = document.querySelector('input[name="dollar-price-source"]:checked');
  settings.dollarPriceSource = dollarSourceRadio?.value || 'auto';
  settings.manualDollarPrice = parseFloat(document.getElementById('manual-dollar-price')?.value) || 1400;
  settings.preferredBank = document.getElementById('dollar-method')?.value || 'consenso';

  // Bancos seleccionados
  const selectedBankCheckboxes = document.querySelectorAll('input[name="bank"]:checked');
  settings.selectedBanks = Array.from(selectedBankCheckboxes).map(cb => cb.value);

  // APIs
  settings.dolarApiUrl = document.getElementById('dolarapi-url')?.value || 'https://dolarapi.com/v1/dolares/oficial';
  settings.criptoyaUsdtArsUrl = document.getElementById('criptoya-ars-url')?.value || 'https://criptoya.com/api/usdt/ars/1';
  settings.criptoyaUsdtUsdUrl = document.getElementById('criptoya-usd-url')?.value || 'https://criptoya.com/api/usdt/usd/1';
  settings.criptoyaBanksUrl = document.getElementById('criptoya-banks-url')?.value || 'https://criptoya.com/api/bancostodos';

  // Actualización
  settings.updateIntervalMinutes = parseInt(document.getElementById('update-interval')?.value) || 5;
  settings.requestTimeoutSeconds = parseInt(document.getElementById('request-timeout')?.value) || 10;

  // Seguridad
  settings.dataFreshnessWarning = document.getElementById('freshness-warning')?.checked ?? true;
  settings.riskAlertsEnabled = document.getElementById('risk-alerts')?.checked ?? true;
  settings.requireConfirmHighAmount = document.getElementById('confirm-high-amount')?.checked ?? true;
  settings.minProfitWarning = parseFloat(document.getElementById('high-threshold')?.value) || 500000;

  return settings;
}

// Mostrar notificación
function showNotification(message, type = 'info') {
  const statusEl = document.getElementById('save-status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;

    // Limpiar después de 3 segundos
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'status';
    }, 3000);
  }
}

// Actualizar UI según configuración del dólar
function updateDollarPriceUI() {
  const manualSection = document.getElementById('manual-price-section');
  const dollarSourceRadio = document.querySelector('input[name="dollar-price-source"]:checked');

  if (manualSection && dollarSourceRadio) {
    manualSection.style.display = dollarSourceRadio.value === 'manual' ? 'block' : 'none';
  }
}

// Actualizar estado de UI según configuración de notificaciones
function updateUIState() {
  const notifyEnabled = document.getElementById('notify-enabled')?.checked ?? true;

  // Deshabilitar elementos relacionados con notificaciones si están desactivadas
  const notificationElements = [
    'alert-threshold',
    'notify-frequency',
    'sound-enabled'
  ];

  notificationElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = !notifyEnabled;
    }
  });
}