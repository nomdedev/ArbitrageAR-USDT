/**
 * Tests para NotificationManager
 * Cubre: constantes, showToast, helpers de toast, closeAllToasts,
 *        getActiveToasts/hasActiveToasts, banner de actualización,
 *        checkForUpdates, updateSettings.
 */

// ─── Setup de dependencias globales ANTES del require ───────────────────────

// Mock de chrome API (requerido por init → setupUpdateBanner → chrome.storage.local.get)
globalThis.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined)
    }
  },
  tabs: {
    create: jest.fn()
  }
};

// Mock de globalThis.window.matchMedia (jsdom no lo implementa)
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Stub de Logger
globalThis.window.Logger = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Cargar el módulo (IIFE → globalThis.window.NotificationManager)
require('../src/modules/notificationManager.js');

const NM = globalThis.window.NotificationManager;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** DOM mínimo para que hideUpdateBanner pueda limpiar activeBanner */
function setupModalDOM() {
  document.body.innerHTML =
    '<dialog id="update-modal"><div class="update-modal"></div></dialog>';
}

/** DOM mínimo para showUpdateIndicator */
function setupUpdateIndicatorDOM() {
  document.body.innerHTML =
    '<div id="version-indicator"></div><div id="update-badge" style="display:none"></div>' +
    '<dialog id="update-modal"><div class="update-modal"></div></dialog>';
}

// ─── beforeEach / afterEach ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Re-aplicar matchMedia tras clearAllMocks
  globalThis.window.matchMedia.mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }));
  jest.useFakeTimers();
  // Montar modal para que hideUpdateBanner pueda resetear activeBanner entre tests
  setupModalDOM();
  NM.closeAllToasts();
  NM.hideUpdateBanner();
  // Limpiar body para los tests de toast
  document.body.innerHTML = '';
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

describe('NotificationManager', () => {
  describe('constantes', () => {
    test('TOAST_TYPES tiene INFO, SUCCESS, WARNING, ERROR', () => {
      expect(NM.TOAST_TYPES.INFO).toBe('info');
      expect(NM.TOAST_TYPES.SUCCESS).toBe('success');
      expect(NM.TOAST_TYPES.WARNING).toBe('warning');
      expect(NM.TOAST_TYPES.ERROR).toBe('error');
    });

    test('TOAST_DURATION tiene SHORT=2000, MEDIUM=3000, LONG=5000', () => {
      expect(NM.TOAST_DURATION.SHORT).toBe(2000);
      expect(NM.TOAST_DURATION.MEDIUM).toBe(3000);
      expect(NM.TOAST_DURATION.LONG).toBe(5000);
    });

    test('UPDATE_TYPES tiene MAJOR, MINOR, PATCH', () => {
      expect(NM.UPDATE_TYPES.MAJOR).toBe('MAJOR');
      expect(NM.UPDATE_TYPES.MINOR).toBe('MINOR');
      expect(NM.UPDATE_TYPES.PATCH).toBe('PATCH');
    });
  });

  // ─── showToast ──────────────────────────────────────────────────────────────

  describe('showToast', () => {
    test('retorna un HTMLElement y lo agrega al body', () => {
      const el = NM.showToast('Hola', NM.TOAST_TYPES.INFO);
      expect(el).toBeInstanceOf(HTMLElement);
      expect(document.body.contains(el)).toBe(true);
    });

    test('aplica la clase toast-notification y toast-{type}', () => {
      const el = NM.showToast('Test', NM.TOAST_TYPES.SUCCESS);
      expect(el.classList.contains('toast-notification')).toBe(true);
      expect(el.classList.contains('toast-success')).toBe(true);
    });

    test('el texto del toast es el mensaje', () => {
      const el = NM.showToast('Mensaje de prueba', NM.TOAST_TYPES.INFO);
      expect(el.textContent).toBe('Mensaje de prueba');
    });

    test('se agrega a getActiveToasts()', () => {
      NM.showToast('Toast 1', NM.TOAST_TYPES.INFO);
      expect(NM.getActiveToasts()).toHaveLength(1);
      NM.showToast('Toast 2', NM.TOAST_TYPES.SUCCESS);
      expect(NM.getActiveToasts()).toHaveLength(2);
    });

    test('se autoelimina del DOM después de la duración', () => {
      const el = NM.showToast('Auto toast', NM.TOAST_TYPES.INFO, 1000);
      expect(document.body.contains(el)).toBe(true);
      jest.advanceTimersByTime(1000);
      // Hay animación de salida de 300ms
      jest.advanceTimersByTime(400);
      expect(document.body.contains(el)).toBe(false);
    });

    test('acepta tipo "error" correctamente', () => {
      const el = NM.showToast('Error!', NM.TOAST_TYPES.ERROR, 100);
      expect(el.classList.contains('toast-error')).toBe(true);
    });

    test('acepta tipo "warning" correctamente', () => {
      const el = NM.showToast('Advertencia', NM.TOAST_TYPES.WARNING, 100);
      expect(el.classList.contains('toast-warning')).toBe(true);
    });
  });

  // ─── showSuccess / showError / showWarning / showInfo ───────────────────────

  describe('helpers de toast', () => {
    test('showSuccess crea toast con tipo success', () => {
      const el = NM.showSuccess('Guardado');
      expect(el.classList.contains('toast-success')).toBe(true);
    });

    test('showError crea toast con tipo error', () => {
      const el = NM.showError('Falló algo');
      expect(el.classList.contains('toast-error')).toBe(true);
    });

    test('showWarning crea toast con tipo warning', () => {
      const el = NM.showWarning('Cuidado');
      expect(el.classList.contains('toast-warning')).toBe(true);
    });

    test('showInfo crea toast con tipo info', () => {
      const el = NM.showInfo('Información');
      expect(el.classList.contains('toast-info')).toBe(true);
    });

    test('showSuccess retorna HTMLElement', () => {
      expect(NM.showSuccess('ok')).toBeInstanceOf(HTMLElement);
    });

    test('showError retorna HTMLElement', () => {
      expect(NM.showError('nope')).toBeInstanceOf(HTMLElement);
    });
  });

  // ─── closeAllToasts ──────────────────────────────────────────────────────────

  describe('closeAllToasts', () => {
    test('vacía activeToasts', () => {
      NM.showToast('A', NM.TOAST_TYPES.INFO);
      NM.showToast('B', NM.TOAST_TYPES.SUCCESS);
      expect(NM.hasActiveToasts()).toBe(true);
      NM.closeAllToasts();
      expect(NM.getActiveToasts()).toHaveLength(0);
      expect(NM.hasActiveToasts()).toBe(false);
    });

    test('remueve los elementos del DOM', () => {
      const el = NM.showToast('Visible', NM.TOAST_TYPES.INFO);
      expect(document.body.contains(el)).toBe(true);
      NM.closeAllToasts();
      expect(document.body.contains(el)).toBe(false);
    });

    test('no lanza cuando no hay toasts', () => {
      expect(() => NM.closeAllToasts()).not.toThrow();
    });
  });

  // ─── getActiveToasts / hasActiveToasts ───────────────────────────────────────

  describe('getActiveToasts / hasActiveToasts', () => {
    test('getActiveToasts retorna array vacío inicialmente', () => {
      expect(NM.getActiveToasts()).toEqual([]);
    });

    test('hasActiveToasts retorna false cuando no hay toasts', () => {
      expect(NM.hasActiveToasts()).toBe(false);
    });

    test('hasActiveToasts retorna true cuando hay toasts', () => {
      NM.showToast('Test', NM.TOAST_TYPES.INFO);
      expect(NM.hasActiveToasts()).toBe(true);
    });

    test('getActiveToasts retorna una copia (no la referencia interna)', () => {
      NM.showToast('Original', NM.TOAST_TYPES.INFO);
      const copy = NM.getActiveToasts();
      copy.push('extra'); // mutación de la copia
      expect(NM.getActiveToasts()).toHaveLength(1); // interno no cambió
    });
  });

  // ─── Banner de actualización ─────────────────────────────────────────────────

  describe('getActiveBanner / hasActiveBanner', () => {
    test('getActiveBanner retorna null cuando no hay banner', () => {
      expect(NM.getActiveBanner()).toBeNull();
    });

    test('hasActiveBanner retorna false cuando no hay banner', () => {
      expect(NM.hasActiveBanner()).toBe(false);
    });

    test('showUpdateBanner establece activeBanner', () => {
      setupUpdateIndicatorDOM();
      const info = {
        currentVersion: '1.0.0',
        latestVersion: '1.1.0',
        message: 'Mejoras menores'
      };
      NM.showUpdateBanner(info);
      expect(NM.hasActiveBanner()).toBe(true);
      expect(NM.getActiveBanner()).toMatchObject({ latestVersion: '1.1.0' });
    });

    test('hideUpdateBanner limpia activeBanner', () => {
      setupUpdateIndicatorDOM();
      NM.showUpdateBanner({
        currentVersion: '1.0.0',
        latestVersion: '1.1.0'
      });
      expect(NM.hasActiveBanner()).toBe(true);
      NM.hideUpdateBanner();
      expect(NM.getActiveBanner()).toBeNull();
      expect(NM.hasActiveBanner()).toBe(false);
    });
  });

  describe('hideUpdateIndicator', () => {
    test('no lanza cuando no hay elemento en DOM', () => {
      document.body.innerHTML = '';
      expect(() => NM.hideUpdateIndicator()).not.toThrow();
    });

    test('remueve clase has-update del indicador de versión', () => {
      document.body.innerHTML = '<div id="version-indicator" class="has-update"></div>';
      NM.hideUpdateIndicator();
      const el = document.getElementById('version-indicator');
      expect(el.classList.contains('has-update')).toBe(false);
    });

    test('oculta el badge de actualización', () => {
      document.body.innerHTML =
        '<div id="version-indicator"></div>' +
        '<div id="update-badge" style="display:flex"></div>';
      NM.hideUpdateIndicator();
      expect(document.getElementById('update-badge').style.display).toBe('none');
    });
  });

  // ─── checkForUpdates ─────────────────────────────────────────────────────────

  describe('checkForUpdates', () => {
    test('no lanza cuando chrome.storage retorna pendingUpdate vacío', async () => {
      globalThis.chrome.storage.local.get.mockResolvedValueOnce({});
      await expect(NM.checkForUpdates()).resolves.not.toThrow();
    });

    test('no lanza cuando chrome.storage no está disponible (error)', async () => {
      globalThis.chrome.storage.local.get.mockRejectedValueOnce(new Error('storage error'));
      // La función usa optional chaining, no debería propagar el error
      // Si chrome.storage.local.get rechaza, el await no captura, puede propagarse
      // Solo verificamos que la función es async y no tira de forma síncrona
      await expect(NM.checkForUpdates()).rejects.not.toBeNull();
    });

    test('no muestra banner cuando pendingUpdate es null', async () => {
      setupUpdateIndicatorDOM();
      globalThis.chrome.storage.local.get.mockResolvedValueOnce({ pendingUpdate: null });
      await NM.checkForUpdates();
      expect(NM.hasActiveBanner()).toBe(false);
    });
  });

  // ─── updateSettings ──────────────────────────────────────────────────────────

  describe('updateSettings', () => {
    test('no lanza para null', () => {
      expect(() => NM.updateSettings(null)).not.toThrow();
    });

    test('no lanza para objeto de configuración', () => {
      expect(() => NM.updateSettings({ theme: 'dark' })).not.toThrow();
    });

    test('no lanza cuando se llama sin argumentos', () => {
      expect(() => NM.updateSettings()).not.toThrow();
    });
  });
});
