/**
 * Tests para el sistema de notificaciones
 * @jest-environment jsdom
 */

// Mock de chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  notifications: {
    create: jest.fn().mockResolvedValue('notification_123')
  }
};

// Variables del módulo
let lastNotificationTime = 0;
const notifiedArbitrages = new Set();

// Función shouldSendNotification simplificada para testing
async function shouldSendNotification(settings, arbitrage) {
  // 1. Verificar si las notificaciones están habilitadas
  if (!settings.notificationsEnabled) {
    return { allowed: false, reason: 'disabled' };
  }

  // 2. Verificar horario silencioso
  if (settings.quietHoursEnabled) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = settings.quietStart || '22:00';
    const end = settings.quietEnd || '08:00';

    if (start > end) {
      if (currentTime >= start || currentTime <= end) {
        return { allowed: false, reason: 'quiet_hours' };
      }
    } else {
      if (currentTime >= start && currentTime <= end) {
        return { allowed: false, reason: 'quiet_hours' };
      }
    }
  }

  // 3. Verificar frecuencia
  const now = Date.now();
  const frequencies = {
    always: 0,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    once: Infinity
  };

  const minInterval = frequencies[settings.notificationFrequency] || frequencies['15min'];
  if (now - lastNotificationTime < minInterval && lastNotificationTime > 0) {
    return { allowed: false, reason: 'frequency' };
  }

  // 4. Verificar umbral usando alertThreshold
  const threshold = settings.alertThreshold ?? 1.0;
  if (arbitrage.profitPercent < threshold) {
    return { allowed: false, reason: 'below_threshold', threshold, profit: arbitrage.profitPercent };
  }

  // 5. Verificar exchanges permitidos
  const allowedExchanges = settings.notificationExchanges || [];
  if (allowedExchanges.length > 0) {
    const exchangeName = (arbitrage.broker || '').toLowerCase();
    const isAllowed = allowedExchanges.some(allowed =>
      exchangeName.includes(allowed.toLowerCase())
    );
    if (!isAllowed) {
      return { allowed: false, reason: 'exchange_not_allowed', exchange: exchangeName };
    }
  }

  // 6. Verificar si ya fue notificado
  const arbKey = `${arbitrage.broker}_${Math.floor(arbitrage.profitPercent)}`;
  if (notifiedArbitrages.has(arbKey)) {
    return { allowed: false, reason: 'already_notified' };
  }

  return { allowed: true };
}

describe('Sistema de Notificaciones', () => {
  beforeEach(() => {
    lastNotificationTime = 0;
    notifiedArbitrages.clear();
    jest.clearAllMocks();
  });

  describe('shouldSendNotification', () => {
    const defaultSettings = {
      notificationsEnabled: true,
      alertThreshold: 1.0,
      notificationFrequency: '15min',
      soundEnabled: true,
      notificationExchanges: ['binance', 'buenbit', 'lemoncash'],
      quietHoursEnabled: false
    };

    const testArbitrage = {
      broker: 'Binance',
      profitPercent: 5.5,
      usdToUsdtRate: 0.98,
      usdtArsBid: 1250
    };

    it('debería permitir notificación cuando todo está configurado correctamente', async () => {
      const result = await shouldSendNotification(defaultSettings, testArbitrage);
      expect(result.allowed).toBe(true);
    });

    it('debería rechazar cuando las notificaciones están deshabilitadas', async () => {
      const settings = { ...defaultSettings, notificationsEnabled: false };
      const result = await shouldSendNotification(settings, testArbitrage);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('disabled');
    });

    it('debería rechazar cuando la ganancia está por debajo del umbral', async () => {
      const settings = { ...defaultSettings, alertThreshold: 10.0 };
      const result = await shouldSendNotification(settings, testArbitrage);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('below_threshold');
    });

    it('debería rechazar cuando el exchange no está en la lista', async () => {
      const arbitrage = { ...testArbitrage, broker: 'UnknownExchange' };
      const result = await shouldSendNotification(defaultSettings, arbitrage);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('exchange_not_allowed');
    });

    it('debería permitir cualquier exchange si la lista está vacía', async () => {
      const settings = { ...defaultSettings, notificationExchanges: [] };
      const arbitrage = { ...testArbitrage, broker: 'AnyExchange' };
      const result = await shouldSendNotification(settings, arbitrage);
      expect(result.allowed).toBe(true);
    });

    it('debería usar umbral de 1% por defecto si no está configurado', async () => {
      const settings = { ...defaultSettings, alertThreshold: undefined };
      const arbitrage = { ...testArbitrage, profitPercent: 0.5 };
      const result = await shouldSendNotification(settings, arbitrage);
      expect(result.allowed).toBe(false);
      expect(result.threshold).toBe(1.0);
    });

    it('debería permitir umbrales muy bajos (0.1%)', async () => {
      const settings = { ...defaultSettings, alertThreshold: 0.1 };
      const arbitrage = { ...testArbitrage, profitPercent: 0.2 };
      const result = await shouldSendNotification(settings, arbitrage);
      expect(result.allowed).toBe(true);
    });

    it('debería rechazar arbitrajes ya notificados', async () => {
      // Primera notificación
      const result1 = await shouldSendNotification(defaultSettings, testArbitrage);
      expect(result1.allowed).toBe(true);
      
      // Marcar como notificado
      const arbKey = `${testArbitrage.broker}_${Math.floor(testArbitrage.profitPercent)}`;
      notifiedArbitrages.add(arbKey);
      
      // Segunda notificación del mismo
      const result2 = await shouldSendNotification(defaultSettings, testArbitrage);
      expect(result2.allowed).toBe(false);
      expect(result2.reason).toBe('already_notified');
    });
  });

  describe('Matching de Exchanges', () => {
    const settings = {
      notificationsEnabled: true,
      alertThreshold: 1.0,
      notificationFrequency: 'always',
      notificationExchanges: ['binance', 'lemon', 'buenbit']
    };

    it('debería hacer match parcial de nombres', async () => {
      const arbitrage = { broker: 'Binance P2P', profitPercent: 5 };
      const result = await shouldSendNotification(settings, arbitrage);
      expect(result.allowed).toBe(true);
    });

    it('debería hacer match case-insensitive', async () => {
      const arbitrage = { broker: 'BINANCE', profitPercent: 5 };
      const result = await shouldSendNotification(settings, arbitrage);
      expect(result.allowed).toBe(true);
    });

    it('debería hacer match con variaciones del nombre', async () => {
      const arbitrage = { broker: 'LemonCash', profitPercent: 5 };
      const result = await shouldSendNotification(settings, arbitrage);
      expect(result.allowed).toBe(true);
    });
  });
});
