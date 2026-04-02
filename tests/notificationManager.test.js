/**
 * Tests para NotificationManager
 * Tests consolidados: de 35 tests a 8 tests
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

// ─── TESTS CONSOLIDADOS ──────────────────────────────────────────────────────

describe('NotificationManager', () => {
  describe('showToast', () => {
    test('crea elemento con tipo correcto y se autoelimina', () => {
      // Test para cada tipo de toast
      const types = [
        { type: NM.TOAST_TYPES.INFO, class: 'toast-info' },
        { type: NM.TOAST_TYPES.SUCCESS, class: 'toast-success' },
        { type: NM.TOAST_TYPES.WARNING, class: 'toast-warning' },
        { type: NM.TOAST_TYPES.ERROR, class: 'toast-error' }
      ];

      types.forEach(({ type, class: expectedClass }) => {
        const el = NM.showToast(`Mensaje ${type}`, type, 100);
        expect(el).toBeInstanceOf(HTMLElement);
        expect(document.body.contains(el)).toBe(true);
        expect(el.classList.contains('toast-notification')).toBe(true);
        expect(el.classList.contains(expectedClass)).toBe(true);
        expect(el.textContent).toBe(`Mensaje ${type}`);
      });

      // Test de autoeliminación
      const autoToast = NM.showToast('Auto toast', NM.TOAST_TYPES.INFO, 1000);
      expect(document.body.contains(autoToast)).toBe(true);
      jest.advanceTimersByTime(1000);
      jest.advanceTimersByTime(400); // Animación de salida de 300ms
      expect(document.body.contains(autoToast)).toBe(false);
    });

    test('maneja múltiples toasts simultáneos', () => {
      const el1 = NM.showToast('Toast 1', NM.TOAST_TYPES.INFO);
      const el2 = NM.showToast('Toast 2', NM.TOAST_TYPES.SUCCESS);

      expect(NM.getActiveToasts()).toHaveLength(2);
      expect(NM.hasActiveToasts()).toBe(true);
      expect(document.body.contains(el1)).toBe(true);
      expect(document.body.contains(el2)).toBe(true);

      // Verificar que getActiveToasts retorna una copia
      const copy = NM.getActiveToasts();
      copy.push('extra');
      expect(NM.getActiveToasts()).toHaveLength(2); // No mutó el interno
    });
  });

  describe('Helpers', () => {
    test('showSuccess, showError, showInfo, showWarning crean toasts correctos', () => {
      const helpers = [
        { fn: NM.showSuccess, expectedClass: 'toast-success' },
        { fn: NM.showError, expectedClass: 'toast-error' },
        { fn: NM.showInfo, expectedClass: 'toast-info' },
        { fn: NM.showWarning, expectedClass: 'toast-warning' }
      ];

      helpers.forEach(({ fn, expectedClass }) => {
        const el = fn('Mensaje de prueba');
        expect(el).toBeInstanceOf(HTMLElement);
        expect(el.classList.contains(expectedClass)).toBe(true);
        expect(el.classList.contains('toast-notification')).toBe(true);
      });

      expect(NM.getActiveToasts()).toHaveLength(4);
    });
  });

  describe('closeAllToasts', () => {
    test('vacía activeToasts y remueve elementos del DOM', () => {
      // Sin toasts inicialmente
      expect(NM.getActiveToasts()).toEqual([]);
      expect(NM.hasActiveToasts()).toBe(false);

      // Agregar varios toasts
      const el1 = NM.showToast('A', NM.TOAST_TYPES.INFO);
      const el2 = NM.showToast('B', NM.TOAST_TYPES.SUCCESS);

      expect(NM.hasActiveToasts()).toBe(true);
      expect(document.body.contains(el1)).toBe(true);
      expect(document.body.contains(el2)).toBe(true);

      // Cerrar todos
      NM.closeAllToasts();

      expect(NM.getActiveToasts()).toHaveLength(0);
      expect(NM.hasActiveToasts()).toBe(false);
      expect(document.body.contains(el1)).toBe(false);
      expect(document.body.contains(el2)).toBe(false);

      // No lanza cuando no hay toasts
      expect(() => NM.closeAllToasts()).not.toThrow();
    });
  });

  describe('Banner actualización', () => {
    test('showUpdateBanner, hideUpdateBanner, hideUpdateIndicator funcionan correctamente', () => {
      // Sin banner inicialmente
      expect(NM.getActiveBanner()).toBeNull();
      expect(NM.hasActiveBanner()).toBe(false);

      // hideUpdateIndicator no lanza sin elementos
      document.body.innerHTML = '';
      expect(() => NM.hideUpdateIndicator()).not.toThrow();

      // Configurar DOM y mostrar banner
      setupUpdateIndicatorDOM();
      const info = {
        currentVersion: '1.0.0',
        latestVersion: '1.1.0',
        message: 'Mejoras menores'
      };
      NM.showUpdateBanner(info);

      expect(NM.hasActiveBanner()).toBe(true);
      expect(NM.getActiveBanner()).toMatchObject({ latestVersion: '1.1.0' });

      // Ocultar banner
      NM.hideUpdateBanner();
      expect(NM.getActiveBanner()).toBeNull();
      expect(NM.hasActiveBanner()).toBe(false);

      // Test hideUpdateIndicator con elementos
      document.body.innerHTML =
        '<div id="version-indicator" class="has-update"></div>' +
        '<div id="update-badge" style="display:flex"></div>';
      NM.hideUpdateIndicator();

      const indicator = document.getElementById('version-indicator');
      const badge = document.getElementById('update-badge');
      expect(indicator.classList.contains('has-update')).toBe(false);
      expect(badge.style.display).toBe('none');
    });
  });

  describe('checkForUpdates', () => {
    test('maneja diferentes escenarios de actualización pendiente', async () => {
      // Sin pendingUpdate
      globalThis.chrome.storage.local.get.mockResolvedValueOnce({});
      await expect(NM.checkForUpdates()).resolves.not.toThrow();

      // Con pendingUpdate null
      setupUpdateIndicatorDOM();
      globalThis.chrome.storage.local.get.mockResolvedValueOnce({ pendingUpdate: null });
      await NM.checkForUpdates();
      expect(NM.hasActiveBanner()).toBe(false);
    });
  });

  describe('updateSettings', () => {
    test('no lanza para diferentes tipos de entrada', () => {
      expect(() => NM.updateSettings(null)).not.toThrow();
      expect(() => NM.updateSettings({ theme: 'dark' })).not.toThrow();
      expect(() => NM.updateSettings()).not.toThrow();
      expect(() => NM.updateSettings(undefined)).not.toThrow();
    });
  });

  describe('Constantes', () => {
    test('TOAST_TYPES, TOAST_DURATION y UPDATE_TYPES tienen valores correctos', () => {
      // TOAST_TYPES
      expect(NM.TOAST_TYPES.INFO).toBe('info');
      expect(NM.TOAST_TYPES.SUCCESS).toBe('success');
      expect(NM.TOAST_TYPES.WARNING).toBe('warning');
      expect(NM.TOAST_TYPES.ERROR).toBe('error');

      // TOAST_DURATION
      expect(NM.TOAST_DURATION.SHORT).toBe(2000);
      expect(NM.TOAST_DURATION.MEDIUM).toBe(3000);
      expect(NM.TOAST_DURATION.LONG).toBe(5000);

      // UPDATE_TYPES
      expect(NM.UPDATE_TYPES.MAJOR).toBe('MAJOR');
      expect(NM.UPDATE_TYPES.MINOR).toBe('MINOR');
      expect(NM.UPDATE_TYPES.PATCH).toBe('PATCH');
    });
  });

  describe('Edge cases', () => {
    test('getActiveToasts y hasActiveToasts retornan valores correctos sin toasts', () => {
      expect(NM.getActiveToasts()).toEqual([]);
      expect(NM.hasActiveToasts()).toBe(false);
      expect(NM.getActiveBanner()).toBeNull();
      expect(NM.hasActiveBanner()).toBe(false);
    });
  });
});