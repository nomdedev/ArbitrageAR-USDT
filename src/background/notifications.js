// ============================================
// NOTIFICATIONS MODULE - ArbitrageAR Background
// ============================================

import { log } from './config.js';

// Estado para controlar notificaciones
let lastNotificationTime = 0;
const notifiedArbitrages = new Set();

// Función para determinar si se debe enviar una notificación
async function shouldSendNotification(settings, arbitrage) {
  // 1. Verificar si las notificaciones están habilitadas
  if (!settings.notificationsEnabled) {
    return false;
  }

  // 2. Verificar horario silencioso
  if (settings.quietHoursEnabled) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = settings.quietStart;
    const end = settings.quietEnd;

    // Si el horario atraviesa medianoche (ej: 22:00 - 08:00)
    if (start > end) {
      if (currentTime >= start || currentTime <= end) {
        return false; // Está en horario silencioso
      }
    } else {
      if (currentTime >= start && currentTime <= end) {
        return false; // Está en horario silencioso
      }
    }
  }

  // 3. Verificar frecuencia de notificaciones
  const now = Date.now();
  const frequencies = {
    'always': 0,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    'once': Infinity
  };

  const minInterval = frequencies[settings.notificationFrequency] || frequencies['15min'];
  if (now - lastNotificationTime < minInterval) {
    return false;
  }

  // 4. Verificar umbral mínimo de 1% para notificaciones (mostrar todos en popup)
  if (arbitrage.profitPercent < 1.0) {
    return false; // No notificar arbitrajes menores a 1%
  }

  // 5. Verificar umbral según tipo de alerta configurado
  const thresholds = {
    'all': 1.0, // Notificar desde 1%
    'moderate': 5,
    'high': 10,
    'extreme': 15,
    'custom': settings.customThreshold || 5
  };

  const threshold = thresholds[settings.alertType] || 1.0;
  if (arbitrage.profitPercent < threshold) {
    return false;
  }

  // 6. Verificar si es un exchange preferido (si hay filtros)
  if (settings.preferredExchanges && settings.preferredExchanges.length > 0) {
    const exchangeName = arbitrage.broker.toLowerCase();
    const isPreferred = settings.preferredExchanges.some(pref =>
      exchangeName.includes(pref.toLowerCase())
    );
    if (!isPreferred) {
      return false;
    }
  }

  // 7. Verificar si ya notificamos este arbitraje recientemente
  const arbKey = `${arbitrage.broker}_${arbitrage.profitPercent.toFixed(2)}`;
  if (notifiedArbitrages.has(arbKey)) {
    return false;
  }

  return true;
}

// Función para enviar notificación del navegador
async function sendNotification(arbitrage, settings) {
  try {
    const profitSymbol = arbitrage.profitPercent >= 0 ? '+' : '';
    const title = `🎯 Arbitraje Detectado: ${profitSymbol}${arbitrage.profitPercent.toFixed(2)}%`;
    const message = `${arbitrage.broker}\nGanancia: ${profitSymbol}$${Math.abs(arbitrage.calculation?.netProfit || 0).toLocaleString()} ARS`;

    const notificationOptions = {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message,
      requireInteraction: true,
      silent: !settings.soundEnabled
    };

    await chrome.notifications.create(`arbitrage_${Date.now()}`, notificationOptions);

    // Actualizar timestamp de última notificación
    lastNotificationTime = Date.now();

    // Marcar este arbitraje como notificado
    const arbKey = `${arbitrage.broker}_${arbitrage.profitPercent.toFixed(2)}`;
    notifiedArbitrages.add(arbKey);

    // Limpiar notificaciones antiguas después de 1 hora
    setTimeout(() => {
      notifiedArbitrages.delete(arbKey);
    }, 60 * 60 * 1000);

    log(`🔔 Notificación enviada: ${arbitrage.broker} (${arbitrage.profitPercent.toFixed(2)}%)`);

  } catch (error) {
    log('❌ Error enviando notificación:', error);
  }
}

// Función para verificar y notificar arbitrajes
async function checkAndNotify(arbitrages) {
  try {
    // Cargar configuración de notificaciones
    const result = await chrome.storage.local.get('notificationSettings');
    const settings = result.notificationSettings || {};

    // Aplicar configuración por defecto si faltan valores
    const defaultSettings = {
      notificationsEnabled: true,
      alertType: 'all',
      customThreshold: 5,
      notificationFrequency: '15min',
      soundEnabled: true,
      preferredExchanges: [],
      quietHoursEnabled: false,
      quietStart: '22:00',
      quietEnd: '08:00'
    };

    const finalSettings = { ...defaultSettings, ...settings };

    // Verificar cada arbitraje
    for (const arbitrage of arbitrages) {
      if (await shouldSendNotification(finalSettings, arbitrage)) {
        await sendNotification(arbitrage, finalSettings);

        // Pequeño delay entre notificaciones para evitar spam
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

  } catch (error) {
    log('❌ Error en checkAndNotify:', error);
  }
}

export {
  shouldSendNotification,
  sendNotification,
  checkAndNotify,
  lastNotificationTime,
  notifiedArbitrages
};