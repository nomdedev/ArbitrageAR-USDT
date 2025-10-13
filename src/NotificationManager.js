// ============================================
// GESTOR DE NOTIFICACIONES - NotificationManager.js
// Responsabilidad: Manejar notificaciones del usuario
// ============================================

class NotificationManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.lastNotificationTime = 0;
    this.notifiedArbitrages = new Set();
  }

  async shouldSendNotification(arbitrage) {
    const settings = await this.storageManager.getSettings();

    // Verificar si las notificaciones están habilitadas
    if (!settings.notificationsEnabled) {
      return false;
    }

    // Verificar horario silencioso
    if (settings.quietHoursEnabled && !this._isWithinAllowedHours(settings)) {
      return false;
    }

    // Verificar umbral de ganancia
    if (arbitrage.profitPercentage < (settings.minProfitThreshold || 1)) {
      return false;
    }

    // Evitar notificar el mismo arbitraje repetidamente
    const arbitrageKey = `${arbitrage.buyExchange}-${arbitrage.sellExchange}-${arbitrage.profitPercentage.toFixed(2)}`;
    if (this.notifiedArbitrages.has(arbitrageKey)) {
      return false;
    }

    // Verificar rate limiting (máximo 1 notificación por minuto)
    const now = Date.now();
    if (now - this.lastNotificationTime < 60000) {
      return false;
    }

    return true;
  }

  async sendNotification(arbitrage) {
    if (!await this.shouldSendNotification(arbitrage)) {
      return;
    }

    const profitFormatted = arbitrage.profitPercentage.toFixed(2);
    const routeDesc = arbitrage.isSingleExchange
      ? arbitrage.buyExchange
      : `${arbitrage.buyExchange} → ${arbitrage.sellExchange}`;

    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `¡Oportunidad de Arbitraje! +${profitFormatted}%`,
        message: `Ruta: ${routeDesc}\nGanancia: $${arbitrage.calculation.netProfit.toLocaleString()} ARS`,
        priority: arbitrage.profitPercentage >= 5 ? 2 : 1
      });

      // Marcar como notificado
      const arbitrageKey = `${arbitrage.buyExchange}-${arbitrage.sellExchange}-${profitFormatted}`;
      this.notifiedArbitrages.add(arbitrageKey);
      this.lastNotificationTime = Date.now();

      // Limpiar notificaciones antiguas (mantener solo últimas 50)
      if (this.notifiedArbitrages.size > 50) {
        const oldest = this.notifiedArbitrages.values().next().value;
        this.notifiedArbitrages.delete(oldest);
      }

      console.log(`🔔 Notificación enviada: ${routeDesc} (+${profitFormatted}%)`);

    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  }

  _isWithinAllowedHours(settings) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = settings.quietStart || '22:00';
    const end = settings.quietEnd || '08:00';

    // Si el horario de silencio cruza la medianoche
    if (start > end) {
      return currentTime >= end && currentTime <= start;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  clearNotificationHistory() {
    this.notifiedArbitrages.clear();
    this.lastNotificationTime = 0;
  }
}

// Exportar clase
// Exportar clase (compatible con service workers)
if (typeof self !== 'undefined') {
  self.NotificationManager = NotificationManager;
}