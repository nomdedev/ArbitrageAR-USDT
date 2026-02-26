/**
 * Jest Setup File - MEJORADO
 * Configura el entorno de pruebas con mocks realistas que reflejan el comportamiento real
 * Corrige los problemas de falsos positivos
 */

// Mock de Chrome Extension API - más completo y realista
global.chrome = {
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      // Simular comportamiento real: a veces hay errores
      if (message.action === 'error_simulation') {
        if (callback) callback({ error: 'Simulated error' });
        return Promise.reject(new Error('Simulated runtime error'));
      }
      
      const response = {
        success: true,
        data: message.type === 'GET_DATA' ? { mock: 'data' } : null
      };
      
      if (callback) {
        // Callback asíncrono como en la realidad
        setTimeout(() => callback(response), 10);
      }
      return Promise.resolve(response);
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn(path => `chrome-extension://mock-extension-id/${path}`),
    lastError: null,
    id: 'mock-extension-id'
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        // Simular diferentes escenarios de storage
        const mockData = {
          'userSettings': {
            notificationsEnabled: true,
            alertThreshold: 1.0,
            notificationFrequency: '15min'
          },
          'arbitrageCache': {
            timestamp: Date.now() - 60000, // 1 minuto atrás
            data: { mock: 'cached_data' }
          }
        };
        
        // Si keys es array, filtrar respuesta
        let result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (mockData[key]) result[key] = mockData[key];
          });
        } else if (typeof keys === 'string') {
          result = mockData[keys] || {};
        } else {
          result = mockData;
        }
        
        if (callback) {
          setTimeout(() => callback(result), 5);
        }
        return Promise.resolve(result);
      }),
      set: jest.fn((data, callback) => {
        // Simular posible error de storage
        if (data.triggerError) {
          const error = new Error('Storage quota exceeded');
          if (callback) setTimeout(() => callback(), 5);
          return Promise.reject(error);
        }
        
        if (callback) {
          setTimeout(() => callback(), 5);
        }
        return Promise.resolve();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) {
          setTimeout(() => callback(), 5);
        }
        return Promise.resolve();
      }),
      clear: jest.fn((callback) => {
        if (callback) {
          setTimeout(() => callback(), 5);
        }
        return Promise.resolve();
      })
    },
    sync: {
      get: jest.fn((keys, callback) => {
        // Storage sync puede fallar o estar vacío
        const result = {};
        if (callback) {
          setTimeout(() => callback(result), 10);
        }
        return Promise.resolve(result);
      }),
      set: jest.fn((data, callback) => {
        // Sync puede tener delay
        if (callback) {
          setTimeout(() => callback(), 50);
        }
        return Promise.resolve();
      })
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  alarms: {
    create: jest.fn((name, alarmInfo) => {
      // Validar parámetros como lo haría Chrome
      if (!name || !alarmInfo) {
        throw new Error('Invalid alarm parameters');
      }
      return Promise.resolve();
    }),
    clear: jest.fn((name, callback) => {
      const cleared = Math.random() > 0.1; // 90% de éxito
      if (callback) {
        setTimeout(() => callback(cleared), 5);
      }
      return Promise.resolve(cleared);
    }),
    get: jest.fn((name, callback) => {
      // Simular alarma existente o no
      const alarm = name === 'existing_alarm' ? {
        name: 'existing_alarm',
        scheduledTime: Date.now() + 60000
      } : null;
      
      if (callback) {
        setTimeout(() => callback(alarm), 5);
      }
      return Promise.resolve(alarm);
    }),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  notifications: {
    create: jest.fn((id, options, callback) => {
      // Validar opciones de notificación
      if (!options || !options.title) {
        throw new Error('Invalid notification options');
      }
      
      const notificationId = id || `notification_${Date.now()}`;
      
      if (callback) {
        setTimeout(() => callback(notificationId), 10);
      }
      return Promise.resolve(notificationId);
    }),
    clear: jest.fn((id, callback) => {
      const cleared = Math.random() > 0.2; // 80% de éxito
      if (callback) {
        setTimeout(() => callback(cleared), 5);
      }
      return Promise.resolve(cleared);
    }),
    getAll: jest.fn((callback) => {
      const notifications = {
        'notification_1': { title: 'Test 1' },
        'notification_2': { title: 'Test 2' }
      };
      
      if (callback) {
        setTimeout(() => callback(notifications), 5);
      }
      return Promise.resolve(notifications);
    })
  },
  action: {
    setBadgeText: jest.fn((details, callback) => {
      if (callback) setTimeout(() => callback(), 5);
      return Promise.resolve();
    }),
    setBadgeBackgroundColor: jest.fn((details, callback) => {
      if (callback) setTimeout(() => callback(), 5);
      return Promise.resolve();
    }),
    getBadgeText: jest.fn((details, callback) => {
      const result = { text: '123' };
      if (callback) setTimeout(() => callback(result), 5);
      return Promise.resolve(result);
    })
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      const tabs = [{
        id: 1,
        url: 'https://example.com',
        title: 'Example Page'
      }];
      
      if (callback) {
        setTimeout(() => callback(tabs), 10);
      }
      return Promise.resolve(tabs);
    }),
    sendMessage: jest.fn((tabId, message, callback) => {
      if (callback) {
        setTimeout(() => callback({ success: true }), 10);
      }
      return Promise.resolve({ success: true });
    })
  }
};

// Mock de fetch global - más realista y basado en URLs
global.fetch = jest.fn((url, options = {}) => {
  // Simular diferentes comportamientos según URL
  const urlStr = typeof url === 'string' ? url : url.toString();
  
  // Simular delay de red realista
  const networkDelay = Math.random() * 100 + 50; // 50-150ms
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Casos de error específicos
      if (urlStr.includes('invalid-domain') || urlStr.includes('network-error')) {
        reject(new Error('Network error: Failed to fetch'));
        return;
      }
      
      if (urlStr.includes('timeout-test')) {
        reject(new DOMException('Request timeout', 'TimeoutError'));
        return;
      }
      
      // Casos de respuesta HTTP específicas
      if (urlStr.includes('http-500')) {
        resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Map(),
          json: () => Promise.reject(new Error('Not JSON')),
          text: () => Promise.resolve('Internal Server Error')
        });
        return;
      }
      
      if (urlStr.includes('http-404')) {
        resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Map(),
          json: () => Promise.reject(new Error('Not JSON')),
          text: () => Promise.resolve('Not Found')
        });
        return;
      }
      
      // Respuestas exitosas según endpoint
      let responseData = {};
      
      if (urlStr.includes('criptoya.com/api/dolar')) {
        responseData = {
          oficial: {
            ask: 1050.5,
            bid: 1000.25,
            fecha: new Date().toISOString()
          },
          blue: {
            ask: 1200,
            bid: 1180,
            fecha: new Date().toISOString()
          }
        };
      } else if (urlStr.includes('criptoya.com/api/usdt/ars/1')) {
        responseData = {
          binance: {
            ask: 1100.5,
            bid: 1095.25,
            time: Math.floor(Date.now() / 1000)
          },
          buenbit: {
            ask: 1105.75,
            bid: 1090.5,
            time: Math.floor(Date.now() / 1000)
          },
          lemoncash: {
            ask: 1098.0,
            bid: 1092.0,
            time: Math.floor(Date.now() / 1000)
          }
        };
      } else if (urlStr.includes('criptoya.com/api/bancostodos')) {
        responseData = {
          bna: { ask: 1020, bid: 980 },
          galicia: { ask: 1025, bid: 985 },
          santander: { ask: 1030, bid: 990 }
        };
      } else if (urlStr.includes('dolarapi.com')) {
        // API diferente - estructura distinta
        responseData = {
          compra: 1000,
          venta: 1050,
          fecha: new Date().toISOString()
        };
      } else if (urlStr.includes('empty-response')) {
        responseData = {};
      } else if (urlStr.includes('invalid-json')) {
        resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map(),
          json: () => Promise.reject(new SyntaxError('Unexpected token')),
          text: () => Promise.resolve('<html>Not JSON</html>')
        });
        return;
      } else {
        // Default response
        responseData = { message: 'Mock response' };
      }
      
      resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(responseData),
        text: () => Promise.resolve(JSON.stringify(responseData)),
        blob: () => Promise.resolve(new Blob([JSON.stringify(responseData)]))
      });
    }, networkDelay);
  });
});

// Helpers mejorados para tests
global.createMockDollarData = (overrides = {}) => ({
  compra: 1000,
  venta: 1050,
  fecha: new Date().toISOString(),
  source: 'test',
  ...overrides
});

global.createMockUSDTData = (overrides = {}) => ({
  binance: {
    ask: 1100,
    bid: 1095,
    time: Math.floor(Date.now() / 1000)
  },
  buenbit: {
    ask: 1105,
    bid: 1090,
    time: Math.floor(Date.now() / 1000)
  },
  ...overrides
});

global.createMockArbitrageData = (overrides = {}) => ({
  broker: 'Binance',
  profitPercent: 5.5,
  usdToUsdtRate: 0.98,
  usdtArsBid: 1250,
  route: {
    isSingleExchange: true,
    isP2P: false
  },
  ...overrides
});

// Helper para simular diferentes condiciones de red
global.simulateNetworkCondition = (condition) => {
  switch (condition) {
    case 'slow':
      global.fetch.mockImplementation((url) => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ delayed: true })
          }), 2000); // 2 segundos de delay
        })
      );
      break;
    case 'unstable':
      global.fetch.mockImplementation((url) => {
        if (Math.random() > 0.7) {
          return Promise.reject(new Error('Network unstable'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ unstable: true })
        });
      });
      break;
    case 'offline':
      global.fetch.mockRejectedValue(new Error('Offline'));
      break;
    default:
      // Reset to default behavior
      global.fetch.mockRestore();
  }
};

// Helper para crear mocks de Chrome API específicos
global.createChromeMock = (api, method, implementation) => {
  if (chrome[api] && chrome[api][method]) {
    chrome[api][method] = jest.fn(implementation);
  }
};

// Helper para esperar en tests (mejor que setTimeout)
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para crear spies en console
global.spyOnConsole = (method = 'log') => {
  const spy = jest.spyOn(console, method).mockImplementation(() => {});
  return spy;
};

// Limpiar mocks después de cada test con más limpieza
afterEach(() => {
  jest.clearAllMocks();
  
  // Resetear implementaciones específicas
  if (global.fetch.mockRestore) {
    global.fetch.mockRestore();
  }
  
  // Limpiar timers
  jest.clearAllTimers();
  
  // Resetear estado de Chrome mocks
  Object.values(chrome).forEach(api => {
    if (api && typeof api === 'object') {
      Object.values(api).forEach(method => {
        if (method && typeof method.mockClear === 'function') {
          method.mockClear();
        }
      });
    }
  });
});

// Configuración de timeouts para tests asíncronos
jest.setTimeout(15000); // 15 segundos por defecto

// Suprimir console.log en tests (excepto errores) pero con opción de override
if (process.env.SUPPRESS_LOGS !== 'false') {
  const originalConsole = { ...console };
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Mantener error para debugging
    error: originalConsole.error,
    // Permitir acceso a los métodos originales si se necesitan
    original: originalConsole
  };
}

// Exportar helpers para usar en otros archivos de test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createMockDollarData: global.createMockDollarData,
    createMockUSDTData: global.createMockUSDTData,
    createMockArbitrageData: global.createMockArbitrageData,
    simulateNetworkCondition: global.simulateNetworkCondition,
    createChromeMock: global.createChromeMock,
    waitFor: global.waitFor,
    spyOnConsole: global.spyOnConsole
  };
}