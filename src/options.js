// ============================================
// OPTIONS PAGE LOGIC - ArbitrageAR v3.0
// ============================================

// Debug inmediato - CSP compliant (movido desde inline script)
console.log('🚀 DEBUG: options.js cargado correctamente');

// Configuración por defecto
const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  alertThreshold: 1.0, // Umbral único de alerta (%)
  soundEnabled: true,
  notificationExchanges: [
    'binance',
    'buenbit',
    'lemoncash',
    'ripio',
    'fiwind',
    'letsbit',
    'belo',
    'tiendacrypto',
    'satoshitango'
  ],
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
  extraTradingFee: 0, // 0% - Usuario debe configurar según su exchange
  extraWithdrawalFee: 0, // $0 ARS - Usuario debe configurar si aplica
  extraTransferFee: 0, // $0 ARS - Usuario debe configurar si aplica
  bankCommissionFee: 0, // $0 ARS - Usuario debe configurar si aplica
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
  selectedBanks: undefined, // undefined = usar bancos por defecto (bna, galicia, santander, bbva, icbc)
  selectedP2PExchanges: undefined, // undefined = usar todos los exchanges P2P
  selectedTraditionalExchanges: undefined, // undefined = usar todos los exchanges tradicionales
  selectedUsdtBrokers: undefined, // undefined = usar TODOS los exchanges USDT disponibles
  filterP2POutliers: true // Filtrar precios anómalos por defecto
};

// Cargar configuración al iniciar
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
  initializeBrokerFeesImproved();
  setupMainEventListeners(); // NUEVO: Configurar event listeners principales
  setupCollapsibleSections(); // Configurar secciones colapsables
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
        const checkbox = document.querySelector(
          `input[name="notify-exchange"][value="${exchange}"]`
        );
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    } else {
      // Por defecto, marcar los principales exchanges argentinos
      const defaultExchanges = [
        'binance',
        'buenbit',
        'lemoncash',
        'ripio',
        'fiwind',
        'letsbit',
        'belo',
        'tiendacrypto',
        'satoshitango'
      ];
      defaultExchanges.forEach(exchange => {
        const checkbox = document.querySelector(
          `input[name="notify-exchange"][value="${exchange}"]`
        );
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
    if (confirmHighAmountEl) {
      confirmHighAmountEl.checked = settings.requireConfirmHighAmount ?? true;
    }

    const highThresholdEl = document.getElementById('high-threshold');
    if (highThresholdEl) highThresholdEl.value = settings.minProfitWarning ?? 500000;

    // NUEVO: Configuración de precio del dólar
    const dollarSourceRadio = document.querySelector(
      `input[name="dollar-price-source"][value="${settings.dollarPriceSource ?? 'auto'}"]`
    );
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
      if (
        selectedBanks === undefined ||
        (Array.isArray(selectedBanks) && selectedBanks.length === 0)
      ) {
        cb.checked = defaultSelectedBanks.includes(cb.value);
      } else {
        cb.checked = selectedBanks.includes(cb.value);
      }
    });

    // NUEVO v5.0.82: Configuración de exchanges P2P
    const selectedP2PExchanges = settings.selectedP2PExchanges;
    const defaultP2PExchanges = ['binancep2p', 'okexp2p', 'bybitp2p', 'bitgetp2p', 'kucoinp2p', 'bingxp2p'];

    document.querySelectorAll('input[name="p2p-exchange"]').forEach(cb => {
      // Si no hay configuración guardada o está vacía, usar exchanges por defecto
      if (selectedP2PExchanges === undefined || (Array.isArray(selectedP2PExchanges) && selectedP2PExchanges.length === 0)) {
        cb.checked = defaultP2PExchanges.includes(cb.value);
      } else {
        cb.checked = selectedP2PExchanges.includes(cb.value);
      }
    });

    // Filtro de outliers P2P
    const filterOutliersEl = document.getElementById('filter-p2p-outliers');
    if (filterOutliersEl) {
      filterOutliersEl.checked = settings.filterP2POutliers ?? true;
    }

    // NUEVO v5.0.85: Configuración de exchanges tradicionales
    const selectedTraditionalExchanges = settings.selectedTraditionalExchanges;
    // Por defecto, incluir TODOS los exchanges tradicionales disponibles
    const defaultTraditionalExchanges = [
      'binance', 'bybit', 'buenbit', 'ripio', 'satoshitango', 'tiendacrypto', 'belo', 'fiwind', 'letsbit', 'lemoncash',
      'ripioexchange', 'universalcoins', 'decrypto', 'vitawallet', 'saldo', 'astropay', 'pluscrypto', 'eluter', 'trubit', 'bitsoalpha',
      'cocoscrypto', 'cryptomktpro', 'wallbit'
    ];

    document.querySelectorAll('input[name="traditional-exchange"]').forEach(cb => {
      // Si no hay configuración guardada o está vacía, usar TODOS los exchanges por defecto
      if (selectedTraditionalExchanges === undefined || (Array.isArray(selectedTraditionalExchanges) && selectedTraditionalExchanges.length === 0)) {
        cb.checked = defaultTraditionalExchanges.includes(cb.value);
      } else {
        cb.checked = selectedTraditionalExchanges.includes(cb.value);
      }
    });

    // NUEVO: Configuración de exchanges USDT para rutas
    const selectedUsdtBrokers = settings.selectedUsdtBrokers;
    // Por defecto, incluir TODOS los exchanges USDT disponibles
    const defaultUsdtBrokers = [
      'binance', 'buenbit', 'lemoncash', 'ripio', 'fiwind', 'letsbit', 'belo', 'tiendacrypto', 'satoshitango',
      'ripioexchange', 'universalcoins', 'decrypto', 'vitawallet', 'saldo', 'astropay', 'pluscrypto', 'eluter', 'trubit', 'bitsoalpha',
      'cocoscrypto', 'cryptomktpro', 'wallbit'
    ];

    document.querySelectorAll('input[name="usdt-broker"]').forEach(cb => {
      // Si no hay configuración guardada o está vacía, usar TODOS los exchanges por defecto
      if (selectedUsdtBrokers === undefined || (Array.isArray(selectedUsdtBrokers) && selectedUsdtBrokers.length === 0)) {
        cb.checked = defaultUsdtBrokers.includes(cb.value);
      } else {
        cb.checked = selectedUsdtBrokers.includes(cb.value);
      }
    });

    // NUEVO v5.0.53: URLs de APIs
    document.getElementById('dolarapi-url').value =
      settings.dolarApiUrl ?? 'https://dolarapi.com/v1/dolares/oficial';
    document.getElementById('criptoya-ars-url').value =
      settings.criptoyaUsdtArsUrl ?? 'https://criptoya.com/api/usdt/ars/1';
    document.getElementById('criptoya-usd-url').value =
      settings.criptoyaUsdtUsdUrl ?? 'https://criptoya.com/api/usdt/usd/1';
    document.getElementById('criptoya-banks-url').value =
      settings.criptoyaBanksUrl ?? 'https://criptoya.com/api/bancostodos';

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

  // NUEVO: Event listeners para seleccionar/deseleccionar todos los brokers USDT
  const selectAllUsdtBrokersBtn = document.getElementById('select-all-usdt-brokers');
  const deselectAllUsdtBrokersBtn = document.getElementById('deselect-all-usdt-brokers');

  if (selectAllUsdtBrokersBtn) {
    selectAllUsdtBrokersBtn.addEventListener('click', () => {
      document.querySelectorAll('input[name="usdt-broker"]').forEach(cb => {
        cb.checked = true;
      });
    });
  }

  if (deselectAllUsdtBrokersBtn) {
    deselectAllUsdtBrokersBtn.addEventListener('click', () => {
      document.querySelectorAll('input[name="usdt-broker"]').forEach(cb => {
        cb.checked = false;
      });
    });
  }
}

// Inicializar nueva interfaz mejorada de fees por broker
function initializeBrokerFeesImproved() {
  console.log('🔧 Inicializando Broker Fees UI...');

  const brokerSelect = document.getElementById('broker-select');
  const customBrokerField = document.getElementById('custom-broker-field');
  const customBrokerName = document.getElementById('custom-broker-name');
  const buyFeeInput = document.getElementById('broker-buy-fee');
  const sellFeeInput = document.getElementById('broker-sell-fee');
  const addButton = document.getElementById('add-broker-improved');
  const feesList = document.getElementById('broker-fees-list');

  if (!brokerSelect || !addButton || !feesList) {
    console.warn('⚠️ Elementos de Broker Fees no encontrados');
    return;
  }

  // Cargar fees guardados
  loadBrokerFees();

  // Mostrar/ocultar campo de broker personalizado
  brokerSelect.addEventListener('change', () => {
    if (brokerSelect.value === 'other') {
      customBrokerField.style.display = 'block';
    } else {
      customBrokerField.style.display = 'none';
    }
    updateAddButtonState();
  });

  // Actualizar estado del botón cuando cambian los inputs
  [buyFeeInput, sellFeeInput, customBrokerName].forEach(input => {
    if (input) {
      input.addEventListener('input', updateAddButtonState);
    }
  });

  // Agregar broker
  addButton.addEventListener('click', () => {
    const brokerValue = brokerSelect.value;
    let brokerName = '';
    let brokerLabel = '';

    if (brokerValue === 'other') {
      brokerName = customBrokerName.value.trim().toLowerCase().replace(/\s+/g, '-');
      brokerLabel = customBrokerName.value.trim();
    } else {
      brokerName = brokerValue;
      brokerLabel = brokerSelect.options[brokerSelect.selectedIndex].text.replace(/^[^\s]+\s/, ''); // Quitar emoji
    }

    const buyFee = parseFloat(buyFeeInput.value) || 0;
    const sellFee = parseFloat(sellFeeInput.value) || 0;

    if (!brokerName) {
      showNotification('Selecciona un broker', 'error');
      return;
    }

    // Agregar o actualizar en la lista
    addOrUpdateBrokerFee(brokerName, brokerLabel, buyFee, sellFee);

    // Limpiar formulario
    brokerSelect.value = '';
    customBrokerField.style.display = 'none';
    customBrokerName.value = '';
    buyFeeInput.value = '';
    sellFeeInput.value = '';
    updateAddButtonState();

    // Guardar en storage
    saveBrokerFees();
  });

  function updateAddButtonState() {
    const hasValidBroker = brokerSelect.value && (brokerSelect.value !== 'other' || customBrokerName.value.trim());
    const hasValidFees = buyFeeInput.value || sellFeeInput.value;
    addButton.disabled = !(hasValidBroker && hasValidFees);
  }

  function loadBrokerFees() {
    chrome.storage.local.get('notificationSettings', (result) => {
      const settings = result.notificationSettings || {};
      const brokerFees = settings.brokerFees || [];

      feesList.innerHTML = '';

      if (brokerFees.length === 0) {
        feesList.innerHTML = `
          <div class="empty-state">
            <p>🎯 No hay brokers configurados</p>
            <p class="text-muted">Agrega brokers arriba para personalizar sus fees</p>
          </div>
        `;
        return;
      }

      brokerFees.forEach(fee => {
        addBrokerFeeToList(fee.broker, fee.label || fee.broker, fee.buyFee, fee.sellFee);
      });
    });
  }

  function addOrUpdateBrokerFee(broker, label, buyFee, sellFee) {
    // Remover empty state si existe
    const emptyState = feesList.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    // Verificar si ya existe
    const existingItem = feesList.querySelector(`[data-broker="${broker}"]`);
    if (existingItem) {
      existingItem.querySelector('.fee-number.buy').textContent = `${buyFee}%`;
      existingItem.querySelector('.fee-number.sell').textContent = `${sellFee}%`;
      existingItem.dataset.buyFee = buyFee;
      existingItem.dataset.sellFee = sellFee;
      showNotification(`${label} actualizado`, 'success');
    } else {
      addBrokerFeeToList(broker, label, buyFee, sellFee);
      showNotification(`${label} agregado`, 'success');
    }
  }

  function addBrokerFeeToList(broker, label, buyFee, sellFee) {
    const item = document.createElement('div');
    item.className = 'broker-fee-item';
    item.dataset.broker = broker;
    item.dataset.buyFee = buyFee;
    item.dataset.sellFee = sellFee;

    item.innerHTML = `
      <div class="broker-fee-info">
        <span class="broker-fee-name">${escapeHtml(label)}</span>
        <div class="broker-fee-values">
          <div class="fee-value">
            <span class="fee-label">Compra:</span>
            <span class="fee-number buy">${buyFee}%</span>
          </div>
          <div class="fee-value">
            <span class="fee-label">Venta:</span>
            <span class="fee-number sell">${sellFee}%</span>
          </div>
        </div>
      </div>
      <div class="broker-fee-actions">
        <button class="btn-edit" title="Editar">✏️</button>
        <button class="btn-remove" title="Eliminar">🗑️</button>
      </div>
    `;

    // Event listeners para editar y eliminar
    item.querySelector('.btn-edit').addEventListener('click', () => {
      brokerSelect.value = broker;
      if (brokerSelect.value !== broker) {
        // Es un broker personalizado
        brokerSelect.value = 'other';
        customBrokerField.style.display = 'block';
        customBrokerName.value = label;
      }
      buyFeeInput.value = buyFee;
      sellFeeInput.value = sellFee;
      updateAddButtonState();
    });

    item.querySelector('.btn-remove').addEventListener('click', () => {
      if (confirm(`¿Eliminar ${label}?`)) {
        item.remove();
        saveBrokerFees();
        showNotification(`${label} eliminado`, 'success');

        // Mostrar empty state si no quedan items
        if (feesList.children.length === 0) {
          feesList.innerHTML = `
            <div class="empty-state">
              <p>🎯 No hay brokers configurados</p>
              <p class="text-muted">Agrega brokers arriba para personalizar sus fees</p>
            </div>
          `;
        }
      }
    });

    feesList.appendChild(item);
  }

  function saveBrokerFees() {
    const items = feesList.querySelectorAll('.broker-fee-item');
    const brokerFees = Array.from(items).map(item => ({
      broker: item.dataset.broker,
      label: item.querySelector('.broker-fee-name').textContent,
      buyFee: parseFloat(item.dataset.buyFee) || 0,
      sellFee: parseFloat(item.dataset.sellFee) || 0
    }));

    chrome.storage.local.get('notificationSettings', (result) => {
      const settings = result.notificationSettings || DEFAULT_SETTINGS;
      settings.brokerFees = brokerFees;
      chrome.storage.local.set({ notificationSettings: settings }, () => {
        console.log('✅ Broker fees guardados:', brokerFees);
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
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
      console.log(
        '📤 [OPTIONS] Configuración a enviar:',
        JSON.stringify(
          {
            dollarPriceSource: settingsToSave.dollarPriceSource,
            manualDollarPrice: settingsToSave.manualDollarPrice,
            preferredBank: settingsToSave.preferredBank
          },
          null,
          2
        )
      );

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
  const notifyExchangeCheckboxes = document.querySelectorAll(
    'input[name="notify-exchange"]:checked'
  );
  settings.notificationExchanges = Array.from(notifyExchangeCheckboxes).map(cb => cb.value);

  // Simulador
  settings.defaultSimAmount =
    parseInt(document.getElementById('simulator-amount')?.value) || 1000000;
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
  settings.manualDollarPrice =
    parseFloat(document.getElementById('manual-dollar-price')?.value) || 1400;
  settings.preferredBank = document.getElementById('dollar-method')?.value || 'consenso';

  // Bancos seleccionados
  const selectedBankCheckboxes = document.querySelectorAll('input[name="bank"]:checked');
  settings.selectedBanks = Array.from(selectedBankCheckboxes).map(cb => cb.value);

  // NUEVO v5.0.82: Exchanges P2P seleccionados
  const selectedP2PCheckboxes = document.querySelectorAll('input[name="p2p-exchange"]:checked');
  settings.selectedP2PExchanges = Array.from(selectedP2PCheckboxes).map(cb => cb.value);
  settings.filterP2POutliers = document.getElementById('filter-p2p-outliers')?.checked ?? true;

  // NUEVO v5.0.85: Exchanges tradicionales seleccionados
  const selectedTraditionalCheckboxes = document.querySelectorAll('input[name="traditional-exchange"]:checked');
  settings.selectedTraditionalExchanges = Array.from(selectedTraditionalCheckboxes).map(cb => cb.value);

  // NUEVO: Exchanges USDT seleccionados para rutas
  const selectedUsdtBrokerCheckboxes = document.querySelectorAll('input[name="usdt-broker"]:checked');
  settings.selectedUsdtBrokers = Array.from(selectedUsdtBrokerCheckboxes).map(cb => cb.value);

  // APIs
  settings.dolarApiUrl =
    document.getElementById('dolarapi-url')?.value || 'https://dolarapi.com/v1/dolares/oficial';
  settings.criptoyaUsdtArsUrl =
    document.getElementById('criptoya-ars-url')?.value || 'https://criptoya.com/api/usdt/ars/1';
  settings.criptoyaUsdtUsdUrl =
    document.getElementById('criptoya-usd-url')?.value || 'https://criptoya.com/api/usdt/usd/1';
  settings.criptoyaBanksUrl =
    document.getElementById('criptoya-banks-url')?.value || 'https://criptoya.com/api/bancostodos';

  // Actualización
  settings.updateIntervalMinutes = parseInt(document.getElementById('update-interval')?.value) || 5;
  settings.requestTimeoutSeconds =
    parseInt(document.getElementById('request-timeout')?.value) || 10;

  // Seguridad
  settings.dataFreshnessWarning = document.getElementById('freshness-warning')?.checked ?? true;
  settings.riskAlertsEnabled = document.getElementById('risk-alerts')?.checked ?? true;
  settings.requireConfirmHighAmount =
    document.getElementById('confirm-high-amount')?.checked ?? true;
  settings.minProfitWarning =
    parseFloat(document.getElementById('high-threshold')?.value) || 500000;

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

// Configurar secciones colapsables
function setupCollapsibleSections() {
  const cardHeaders = document.querySelectorAll('.card-header[data-action="toggle-section"]');
  
  cardHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isCollapsed = content.classList.contains('collapsed');
      
      if (isCollapsed) {
        // Expandir
        content.classList.remove('collapsed');
        header.classList.remove('collapsed');
      } else {
        // Colapsar
        content.classList.add('collapsed');
        header.classList.add('collapsed');
      }
    });
  });
}

// Actualizar estado de UI según configuración de notificaciones
function updateUIState() {
  const notifyEnabled = document.getElementById('notify-enabled')?.checked ?? true;

  // Deshabilitar elementos relacionados con notificaciones si están desactivadas
  const notificationElements = ['alert-threshold', 'notify-frequency', 'sound-enabled'];

  notificationElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = !notifyEnabled;
    }
  });
}
