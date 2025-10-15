// ============================================
// OPTIONS PAGE LOGIC - ArbitrageAR v3.0
// ============================================

// Configuración por defecto
const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  alertType: 'all',
  customThreshold: 5,
  soundEnabled: true,
  preferredExchanges: [],
  // Validación y seguridad (NUEVO v5.0.28)
  dataFreshnessWarning: true, // Alertar si datos tienen más de 5 min
  riskAlertsEnabled: true, // Mostrar semáforo de riesgo
  requireConfirmHighAmount: true, // Confirmar simulaciones > $500k
  minProfitWarning: 0.5, // Alertar si ganancia < 0.5%
  // NUEVO v5.0: Preferencias de rutas
  preferSingleExchange: false,
  defaultSimAmount: 1000000,
  maxRoutesDisplay: 20,
  // MEJORADO v5.0.64: Filtro unificado de visualización (separado de notificaciones)
  filterMinProfit: -10.0, // Umbral mínimo de ganancia para MOSTRAR rutas (%) - por defecto -10% (mostrar casi todo)
  // NUEVO v5.0.56: Modos de display adicionales
  sortByProfit: true, // Ordenar rutas por ganancia descendente
  // NUEVO v5.0.4: Fees personalizados (por defecto 0 = sin fees)
  extraTradingFee: 0,        // 0% - Usuario debe configurar según su exchange
  extraWithdrawalFee: 0,     // $0 ARS - Usuario debe configurar si aplica
  extraTransferFee: 0,       // $0 ARS - Usuario debe configurar si aplica
  bankCommissionFee: 0,      // $0 ARS - Usuario debe configurar si aplica
  // NUEVO v5.0.50: Configuración avanzada de cálculos
  fallbackUsdToUsdtRate: 1.0, // Tasa de fallback si API USDT/USD falla (paridad 1:1)
  applyFeesInCalculation: false, // CORREGIDO: false por defecto = sin fees
  // NUEVO v5.0.52: Fees específicos por broker
  brokerFees: [], // Array de {broker: string, buyFee: number, sellFee: number}
  // NUEVO v5.0.53: URLs de APIs configurables
  dolarApiUrl: 'https://dolarapi.com/v1/dolares/oficial',
  criptoyaUsdtArsUrl: 'https://criptoya.com/api/usdt/ars/1',
  criptoyaUsdtUsdUrl: 'https://criptoya.com/api/usdt/usd/1',
  // NUEVO v5.0.54: Intervalos de actualización
  updateIntervalMinutes: 5, // Intervalo de actualización en minutos
  requestTimeoutSeconds: 10, // Timeout de requests en segundos
  // NUEVO: Configuración de precio del dólar
  dollarPriceSource: 'auto', // 'auto' o 'manual'
  manualDollarPrice: 950,
  preferredBank: 'mediana', // MEJORADO v5.0.29: Mediana es más robusta que promedio
  // NUEVO v5.0.23: Configuración de bancos
  showBestBankPrice: false,
  selectedBanks: [] // vacío = todos los bancos
};

// Cargar configuración al iniciar
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

// Cargar configuración guardada
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('notificationSettings');
    const settings = result.notificationSettings || DEFAULT_SETTINGS;
    
    // Aplicar configuración a los elementos
    document.getElementById('notifications-enabled').checked = settings.notificationsEnabled;
    
    // Tipo de alerta
    const alertTypeRadio = document.querySelector(`input[name="alert-type"][value="${settings.alertType}"]`);
    if (alertTypeRadio) {
      alertTypeRadio.checked = true;
    }
    
    // Umbral personalizado
    document.getElementById('custom-threshold').value = settings.customThreshold;
    document.getElementById('threshold-value').textContent = settings.customThreshold;
    
    // Frecuencia
    document.getElementById('notification-frequency').value = settings.notificationFrequency;
    
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
    
    // Horario silencioso
    document.getElementById('quiet-hours-enabled').checked = settings.quietHoursEnabled;
    document.getElementById('quiet-start').value = settings.quietStart;
    document.getElementById('quiet-end').value = settings.quietEnd;
    
    // MEJORADO v5.0.64: Preferencias de visualización de rutas
    document.getElementById('prefer-single-exchange').checked = settings.preferSingleExchange ?? false;
    document.getElementById('default-sim-amount').value = settings.defaultSimAmount ?? 1000000;
    document.getElementById('max-routes-display').value = settings.maxRoutesDisplay ?? 20;
    document.getElementById('filter-min-profit').value = settings.filterMinProfit ?? -10.0;
    document.getElementById('sort-by-profit').checked = settings.sortByProfit ?? true;
    // NUEVO v5.0.75: Tipo de rutas a calcular
    document.getElementById('route-type').value = settings.routeType ?? 'arbitrage';
    
    // NUEVO v5.0.4: Fees personalizados
    document.getElementById('extra-trading-fee').value = settings.extraTradingFee ?? 0;
    document.getElementById('extra-withdrawal-fee').value = settings.extraWithdrawalFee ?? 0;
    document.getElementById('extra-transfer-fee').value = settings.extraTransferFee ?? 0;
    document.getElementById('bank-commission-fee').value = settings.bankCommissionFee ?? 0;
    
    // NUEVO v5.0.28: Opciones de seguridad y validación
    document.getElementById('data-freshness-warning').checked = settings.dataFreshnessWarning ?? true;
    document.getElementById('risk-alerts-enabled').checked = settings.riskAlertsEnabled ?? true;
    document.getElementById('require-confirm-high-amount').checked = settings.requireConfirmHighAmount ?? true;
    document.getElementById('min-profit-warning').value = settings.minProfitWarning ?? 0.5;
    
    // NUEVO: Configuración de precio del dólar
    const dollarSourceRadio = document.querySelector(`input[name="dollar-price-source"][value="${settings.dollarPriceSource ?? 'auto'}"]`);
    if (dollarSourceRadio) {
      dollarSourceRadio.checked = true;
    }
    document.getElementById('manual-dollar-price').value = settings.manualDollarPrice ?? 950;
    document.getElementById('preferred-bank').value = settings.preferredBank ?? 'mediana';
    
    // NUEVO v5.0.23: Configuración de bancos
    document.getElementById('show-best-bank-price').checked = settings.showBestBankPrice ?? false;
    const selectedBanks = settings.selectedBanks ?? [];
    document.querySelectorAll('input[name="bank-selection"]').forEach(cb => {
      cb.checked = selectedBanks.length === 0 || selectedBanks.includes(cb.value);
    });
    
    // NUEVO v5.0.53: URLs de APIs
    document.getElementById('dolarapi-url').value = settings.dolarApiUrl ?? 'https://dolarapi.com/v1/dolares/oficial';
    document.getElementById('criptoya-usdt-ars-url').value = settings.criptoyaUsdtArsUrl ?? 'https://criptoya.com/api/usdt/ars/1';
    document.getElementById('criptoya-usdt-usd-url').value = settings.criptoyaUsdtUsdUrl ?? 'https://criptoya.com/api/usdt/usd/1';
    
    // NUEVO v5.0.54: Intervalos de actualización
    document.getElementById('update-interval').value = settings.updateIntervalMinutes ?? 5;
    document.getElementById('request-timeout').value = settings.requestTimeoutSeconds ?? 10;
    
    // Mostrar/ocultar sección de precio manual
    updateDollarPriceUI();
    
    // Actualizar UI según estado de notificaciones
    updateUIState();
    
  } catch (error) {
    console.error('Error cargando configuración:', error);
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Navegación por pestañas
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      
      // Remover clase active de todos los botones y contenidos
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      // Agregar clase active al botón y contenido seleccionado
      button.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
  
  // Toggle principal de notificaciones
  document.getElementById('notifications-enabled').addEventListener('change', updateUIState);
  
  // Tipo de alerta
  document.querySelectorAll('input[name="alert-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const customThreshold = document.getElementById('custom-threshold');
      if (e.target.value === 'custom') {
        customThreshold.disabled = false;
      } else {
        customThreshold.disabled = true;
      }
    });
  });
  
  // Umbral personalizado
  document.getElementById('custom-threshold').addEventListener('input', (e) => {
    document.getElementById('threshold-value').textContent = e.target.value;
  });
  
  // Horario silencioso
  document.getElementById('quiet-hours-enabled').addEventListener('change', (e) => {
    const quietConfig = document.getElementById('quiet-hours-config');
    quietConfig.style.display = e.target.checked ? 'block' : 'none';
  });
  
  // Test de notificación
  document.getElementById('test-notification').addEventListener('click', sendTestNotification);
  
  // NUEVO: Configuración de precio del dólar
  document.querySelectorAll('input[name="dollar-price-source"]').forEach(radio => {
    radio.addEventListener('change', updateDollarPriceUI);
  });
  
  // NUEVO v5.0.31: Selección de bancos
  document.getElementById('select-all-banks')?.addEventListener('click', () => {
    document.querySelectorAll('input[name="bank-selection"]').forEach(cb => cb.checked = true);
    updateBanksCounter();
  });
  
  document.getElementById('deselect-all-banks')?.addEventListener('click', () => {
    document.querySelectorAll('input[name="bank-selection"]').forEach(cb => cb.checked = false);
    updateBanksCounter();
  });
  
  document.querySelectorAll('input[name="bank-selection"]').forEach(cb => {
    cb.addEventListener('change', updateBanksCounter);
  });
  
  // Actualizar contador al inicio
  updateBanksCounter();
  
  // Detectar cambios en todos los inputs para mostrar indicador
  document.querySelectorAll('input, select, textarea').forEach(element => {
    element.addEventListener('change', showUnsavedIndicator);
    element.addEventListener('input', showUnsavedIndicator);
  });
  
  // NUEVO v5.0.52: Inicializar tabla de fees por broker
  initializeBrokerFeesTable();
  setupBrokerFeesListeners();
  
  // Guardar configuración
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  
  // Restaurar valores por defecto
  document.getElementById('reset-settings').addEventListener('click', resetSettings);
}

// Estado de cambios
let hasUnsavedChanges = false;

// Mostrar indicador de cambios no guardados
function showUnsavedIndicator() {
  if (!hasUnsavedChanges) {
    hasUnsavedChanges = true;
    const indicator = document.createElement('div');
    indicator.id = 'unsaved-indicator';
    indicator.className = 'unsaved-changes';
    indicator.innerHTML = '⚠️ Tienes cambios sin guardar';
    document.body.appendChild(indicator);
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 3000);
  }
}

// Ocultar indicador de cambios
function hideUnsavedIndicator() {
  hasUnsavedChanges = false;
  const indicator = document.getElementById('unsaved-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// Actualizar estado de la UI según notificaciones habilitadas/deshabilitadas
function updateUIState() {
  const enabled = document.getElementById('notifications-enabled').checked;
  
  // Deshabilitar/habilitar secciones
  const sections = [
    'alert-types-section',
    'frequency-section'
  ];
  
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      if (enabled) {
        section.classList.remove('disabled');
      } else {
        section.classList.add('disabled');
      }
    }
  });
  
  // Actualizar visibilidad de quiet hours
  const quietEnabled = document.getElementById('quiet-hours-enabled').checked;
  const quietConfig = document.getElementById('quiet-hours-config');
  if (quietConfig) {
    quietConfig.style.display = enabled && quietEnabled ? 'block' : 'none';
  }
}

// Guardar configuración
async function saveSettings() {
  try {
    // Recopilar configuración
    const settings = {
      notificationsEnabled: document.getElementById('notifications-enabled').checked,
      alertType: document.querySelector('input[name="alert-type"]:checked').value,
      customThreshold: parseFloat(document.getElementById('custom-threshold').value),
      notificationFrequency: document.getElementById('notification-frequency').value,
      soundEnabled: document.getElementById('sound-enabled').checked,
      preferredExchanges: Array.from(document.querySelectorAll('input[name="exchange"]:checked'))
        .map(cb => cb.value),
      quietHoursEnabled: document.getElementById('quiet-hours-enabled').checked,
      quietStart: document.getElementById('quiet-start').value,
      quietEnd: document.getElementById('quiet-end').value,
      // MEJORADO v5.0.64: Preferencias de visualización de rutas
      preferSingleExchange: document.getElementById('prefer-single-exchange').checked,
      defaultSimAmount: parseInt(document.getElementById('default-sim-amount').value),
      maxRoutesDisplay: parseInt(document.getElementById('max-routes-display').value),
      filterMinProfit: parseFloat(document.getElementById('filter-min-profit').value) ?? -10.0,
      sortByProfit: document.getElementById('sort-by-profit').checked,
      // NUEVO v5.0.75: Tipo de rutas a calcular
      routeType: document.getElementById('route-type').value,
      // NUEVO v5.0.4: Fees personalizados
      extraTradingFee: parseFloat(document.getElementById('extra-trading-fee').value) || 0,
      extraWithdrawalFee: parseFloat(document.getElementById('extra-withdrawal-fee').value) || 0,
      extraTransferFee: parseFloat(document.getElementById('extra-transfer-fee').value) || 0,
      bankCommissionFee: parseFloat(document.getElementById('bank-commission-fee').value) || 0,
      // NUEVO v5.0.28: Opciones de seguridad y validación
      dataFreshnessWarning: document.getElementById('data-freshness-warning').checked,
      riskAlertsEnabled: document.getElementById('risk-alerts-enabled').checked,
      requireConfirmHighAmount: document.getElementById('require-confirm-high-amount').checked,
      minProfitWarning: parseFloat(document.getElementById('min-profit-warning').value) || 0.5,
      // NUEVO: Configuración de precio del dólar
      dollarPriceSource: document.querySelector('input[name="dollar-price-source"]:checked')?.value || 'auto',
      manualDollarPrice: parseFloat(document.getElementById('manual-dollar-price').value) || 950,
      preferredBank: document.getElementById('preferred-bank').value || 'mediana',
      // NUEVO v5.0.23: Configuración de bancos
      showBestBankPrice: document.getElementById('show-best-bank-price').checked,
      selectedBanks: Array.from(document.querySelectorAll('input[name="bank-selection"]:checked'))
        .map(cb => cb.value),
      // NUEVO v5.0.53: URLs de APIs
      dolarApiUrl: document.getElementById('dolarapi-url').value.trim(),
      criptoyaUsdtArsUrl: document.getElementById('criptoya-usdt-ars-url').value.trim(),
      criptoyaUsdtUsdUrl: document.getElementById('criptoya-usdt-usd-url').value.trim(),
      // NUEVO v5.0.54: Intervalos de actualización
      updateIntervalMinutes: parseInt(document.getElementById('update-interval').value) || 5,
      requestTimeoutSeconds: parseInt(document.getElementById('request-timeout').value) || 10
    };
    
    // Guardar en storage
    await chrome.storage.local.set({ notificationSettings: settings });
    
    // Mostrar mensaje de éxito
    showSaveStatus('success', '✅ Configuración guardada correctamente');
    
    // Notificar al background script que la configuración cambió
    chrome.runtime.sendMessage({ 
      action: 'settingsUpdated',
      settings: settings 
    });
    
  } catch (error) {
    console.error('Error guardando configuración:', error);
    showSaveStatus('error', '❌ Error al guardar la configuración');
  }
}

// Restaurar valores por defecto
async function resetSettings() {
  if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
    try {
      await chrome.storage.local.set({ notificationSettings: DEFAULT_SETTINGS });
      await loadSettings();
      showSaveStatus('success', '🔄 Configuración restaurada a valores por defecto');
    } catch (error) {
      console.error('Error restaurando configuración:', error);
      showSaveStatus('error', '❌ Error al restaurar la configuración');
    }
  }
}

// Mostrar estado de guardado
function showSaveStatus(type, message) {
  const statusDiv = document.getElementById('save-status');
  statusDiv.textContent = message;
  statusDiv.className = `save-status ${type}`;
  
  // Ocultar indicador de cambios no guardados si se guardó exitosamente
  if (type === 'success') {
    hideUnsavedIndicator();
  }
  
  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'save-status';
  }, 5000);
}

// Enviar notificación de prueba
async function sendTestNotification() {
  try {
    const settings = await chrome.storage.local.get('notificationSettings');
    const config = settings.notificationSettings || DEFAULT_SETTINGS;
    
    if (!config.notificationsEnabled) {
      alert('⚠️ Las notificaciones están desactivadas. Actívalas para recibir alertas.');
      return;
    }
    
    // Solicitar permiso si no lo tenemos
    const permission = await chrome.permissions.contains({ permissions: ['notifications'] });
    if (!permission) {
      const granted = await chrome.permissions.request({ permissions: ['notifications'] });
      if (!granted) {
        alert('❌ Debes otorgar permiso de notificaciones para recibir alertas.');
        return;
      }
    }
    
    // Enviar notificación de prueba
    chrome.runtime.sendMessage({
      action: 'sendTestNotification',
      settings: config
    }, (response) => {
      if (response && response.success) {
        showSaveStatus('success', '🔔 Notificación de prueba enviada');
      } else {
        showSaveStatus('error', '❌ Error al enviar notificación de prueba');
      }
    });
    
  } catch (error) {
    console.error('Error enviando notificación de prueba:', error);
    showSaveStatus('error', '❌ Error al enviar notificación de prueba');
  }
}

// Obtener umbral según tipo de alerta
function getThresholdFromAlertType(alertType, customValue) {
  const thresholds = {
    'all': 1.5,
    'moderate': 5,
    'high': 10,
    'extreme': 15,
    'custom': customValue
  };
  return thresholds[alertType] || 1.5;
}

// NUEVO: Actualizar UI de configuración de precio del dólar
function updateDollarPriceUI() {
  const manualPriceSection = document.getElementById('manual-price-section');
  const bankSelectionSection = document.getElementById('bank-selection-section');
  const selectedSource = document.querySelector('input[name="dollar-price-source"]:checked')?.value;
  
  if (selectedSource === 'manual') {
    manualPriceSection.style.display = 'block';
    bankSelectionSection.style.display = 'none';
  } else {
    manualPriceSection.style.display = 'none';
    bankSelectionSection.style.display = 'block';
  }
}

// NUEVO v5.0.31: Actualizar contador de bancos seleccionados
function updateBanksCounter() {
  const selectedCount = document.querySelectorAll('input[name="bank-selection"]:checked').length;
  const totalCount = document.querySelectorAll('input[name="bank-selection"]').length;
  const counter = document.getElementById('banks-counter');
  
  if (counter) {
    if (selectedCount === 0) {
      counter.textContent = 'Todos los bancos (ninguno seleccionado)';
      counter.style.color = '#94a3b8';
    } else if (selectedCount === totalCount) {
      counter.textContent = `Todos seleccionados (${selectedCount})`;
      counter.style.color = '#22c55e';
    } else {
      counter.textContent = `${selectedCount} de ${totalCount} bancos seleccionados`;
      counter.style.color = '#667eea';
    }
  }
}

// ============================================
// BROKER FEES MANAGEMENT - NUEVO v5.0.52
// ============================================

// Inicializar tabla de fees por broker
function initializeBrokerFeesTable() {
  const tableBody = document.getElementById('broker-fees-body');
  const addButton = document.getElementById('add-broker-fee');
  
  // Event listener para agregar broker
  addButton.addEventListener('click', () => {
    addBrokerFeeRow();
  });
  
  // Cargar fees existentes
  loadBrokerFees();
}

// Agregar nueva fila de fee por broker
function addBrokerFeeRow(broker = '', buyFee = 0, sellFee = 0) {
  const tableBody = document.getElementById('broker-fees-body');
  const row = document.createElement('tr');
  
  row.innerHTML = `
    <td>
      <input type="text" class="broker-name" placeholder="Ej: Lemon Cash" value="${broker}" required>
    </td>
    <td>
      <input type="number" class="buy-fee" min="0" max="10" step="0.01" value="${buyFee}" placeholder="0.00"> %
    </td>
    <td>
      <input type="number" class="sell-fee" min="0" max="10" step="0.01" value="${sellFee}" placeholder="0.00"> %
    </td>
    <td>
      <button type="button" class="remove-broker-btn" onclick="removeBrokerFeeRow(this)">🗑️</button>
    </td>
  `;
  
  tableBody.appendChild(row);
}

// Remover fila de fee por broker
function removeBrokerFeeRow(button) {
  const row = button.closest('tr');
  row.remove();
  saveBrokerFees(); // Guardar automáticamente al remover
}

// Cargar fees por broker desde settings
function loadBrokerFees() {
  chrome.storage.local.get('notificationSettings', (result) => {
    const settings = result.notificationSettings || DEFAULT_SETTINGS;
    const brokerFees = settings.brokerFees || [];
    
    // Limpiar tabla
    const tableBody = document.getElementById('broker-fees-body');
    tableBody.innerHTML = '';
    
    // Agregar filas existentes
    if (brokerFees.length === 0) {
      // Agregar fila vacía por defecto
      addBrokerFeeRow();
    } else {
      brokerFees.forEach(fee => {
        addBrokerFeeRow(fee.broker, fee.buyFee, fee.sellFee);
      });
    }
  });
}

// Guardar fees por broker a settings
function saveBrokerFees() {
  const rows = document.querySelectorAll('#broker-fees-body tr');
  const brokerFees = [];
  
  rows.forEach(row => {
    const brokerInput = row.querySelector('.broker-name');
    const buyFeeInput = row.querySelector('.buy-fee');
    const sellFeeInput = row.querySelector('.sell-fee');
    
    const broker = brokerInput.value.trim();
    const buyFee = parseFloat(buyFeeInput.value) || 0;
    const sellFee = parseFloat(sellFeeInput.value) || 0;
    
    // Solo guardar si el broker tiene nombre
    if (broker) {
      brokerFees.push({ broker, buyFee, sellFee });
    }
  });
  
  // Actualizar settings
  chrome.storage.local.get('notificationSettings', (result) => {
    const settings = result.notificationSettings || DEFAULT_SETTINGS;
    settings.brokerFees = brokerFees;
    
    chrome.storage.local.set({ notificationSettings: settings }, () => {
      console.log('Broker fees saved:', brokerFees);
    });
  });
}

// Event listeners para guardar automáticamente al cambiar inputs
function setupBrokerFeesListeners() {
  document.getElementById('broker-fees-body').addEventListener('input', (e) => {
    if (e.target.classList.contains('broker-name') || 
        e.target.classList.contains('buy-fee') || 
        e.target.classList.contains('sell-fee')) {
      saveBrokerFees();
    }
  });
}

// Llamar a la inicialización de la tabla de fees al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
  initializeBrokerFeesTable();
  setupBrokerFeesListeners();
});
