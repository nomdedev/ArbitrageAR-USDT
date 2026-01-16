/**
 * Jest Setup File
 * Configura el entorno de pruebas
 */

// Mock de Chrome Extension API
global.chrome = {
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback({});
    }),
    onMessage: {
      addListener: jest.fn()
    },
    getURL: jest.fn(path => `chrome-extension://mock-id/${path}`),
    lastError: null
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        callback({});
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback();
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) callback();
      })
    },
    sync: {
      get: jest.fn((keys, callback) => {
        callback({});
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback();
      })
    },
    onChanged: {
      addListener: jest.fn()
    }
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    get: jest.fn((name, callback) => callback(null)),
    onAlarm: {
      addListener: jest.fn()
    }
  },
  notifications: {
    create: jest.fn((id, options, callback) => {
      if (callback) callback(id);
    }),
    clear: jest.fn()
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn()
  }
};

// Mock de fetch global
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// Helpers para tests
global.createMockDollarData = () => ({
  compra: 1000,
  venta: 1050,
  fecha: new Date().toISOString()
});

global.createMockUSDTData = () => ({
  binance: {
    ask: 1100,
    bid: 1095,
    time: Date.now() / 1000
  },
  buenbit: {
    ask: 1105,
    bid: 1090,
    time: Date.now() / 1000
  }
});

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Suprimir console.log en tests (excepto errores)
if (process.env.SUPPRESS_LOGS !== 'false') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
    // Mantener error para debugging
  };
}
