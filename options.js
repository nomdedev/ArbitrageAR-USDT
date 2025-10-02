// ============================================
// OPTIONS PAGE LOGIC - ArbitrageAR v3.0
// ============================================

// Configuración por defecto
const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  alertType: 'all',
  customThreshold: 5,
  notificationFrequency: '15min',
  soundEnabled: true,
  preferredExchanges: [],
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '08:00',
  // NUEVO v5.0: Preferencias de rutas
  showNegativeRoutes: true,
  preferSingleExchange: false,
  defaultSimAmount: 100000,
  maxRoutesDisplay: 20,
  // NUEVO v5.0.4: Fees personalizados
  extraTradingFee: 0,
  extraWithdrawalFee: 0,
  extraTransferFee: 0,
  bankCommissionFee: 0
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
    
    // NUEVO v5.0: Preferencias de rutas
    document.getElementById('show-negative-routes').checked = settings.showNegativeRoutes ?? true;
    document.getElementById('prefer-single-exchange').checked = settings.preferSingleExchange ?? false;
    document.getElementById('default-sim-amount').value = settings.defaultSimAmount ?? 100000;
    document.getElementById('max-routes-display').value = settings.maxRoutesDisplay ?? 20;
    
    // NUEVO v5.0.4: Fees personalizados
    document.getElementById('extra-trading-fee').value = settings.extraTradingFee ?? 0;
    document.getElementById('extra-withdrawal-fee').value = settings.extraWithdrawalFee ?? 0;
    document.getElementById('extra-transfer-fee').value = settings.extraTransferFee ?? 0;
    document.getElementById('bank-commission-fee').value = settings.bankCommissionFee ?? 0;
    
    // Actualizar UI según estado de notificaciones
    updateUIState();
    
  } catch (error) {
    console.error('Error cargando configuración:', error);
  }
}

// Configurar event listeners
function setupEventListeners() {
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
  
  // Guardar configuración
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  
  // Restaurar valores por defecto
  document.getElementById('reset-settings').addEventListener('click', resetSettings);
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
      // NUEVO v5.0: Preferencias de rutas
      showNegativeRoutes: document.getElementById('show-negative-routes').checked,
      preferSingleExchange: document.getElementById('prefer-single-exchange').checked,
      defaultSimAmount: parseInt(document.getElementById('default-sim-amount').value),
      maxRoutesDisplay: parseInt(document.getElementById('max-routes-display').value),
      // NUEVO v5.0.4: Fees personalizados
      extraTradingFee: parseFloat(document.getElementById('extra-trading-fee').value) || 0,
      extraWithdrawalFee: parseFloat(document.getElementById('extra-withdrawal-fee').value) || 0,
      extraTransferFee: parseFloat(document.getElementById('extra-transfer-fee').value) || 0,
      bankCommissionFee: parseFloat(document.getElementById('bank-commission-fee').value) || 0
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
  statusDiv.className = `save-status show ${type}`;
  
  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 3000);
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
