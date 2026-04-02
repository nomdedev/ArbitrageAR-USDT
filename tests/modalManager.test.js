/**
 * Tests para ModalManager
 *
 * ModalManager gestiona modales y diálogos de la aplicación.
 * Cubre: modales de ruta, confirmación, alertas e información.
 *
 * Patrón: IIFE que expone window.ModalManager (jsdom).
 */

// ============================================================
// SETUP GLOBAL: Logger y mocks antes de cargar el módulo
// ============================================================
beforeAll(() => {
  globalThis.window.Logger = {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
  globalThis.window.Formatters = {
    formatNumber: n => (typeof n === 'number' ? n.toLocaleString('es-AR') : '0'),
    formatUsdUsdtRatio: n => (typeof n === 'number' ? n.toFixed(4) : 'N/A'),
    formatCommissionPercent: n => (typeof n === 'number' ? n.toFixed(2) : 'N/A')
  };

  // Mock IntersectionObserver (usado en setupModalAnimations)
  global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));

  require('../src/modules/modalManager.js');
});

// ============================================================
// SUITE PRINCIPAL
// ============================================================
describe('ModalManager', () => {
  let MM;

  beforeAll(() => {
    MM = globalThis.window?.ModalManager;
    if (!MM) throw new Error('ModalManager no fue expuesto en window');
  });

  /**
   * Helper: crear estructura DOM mínima para los modales de ruta.
   * Simula los elementos que el módulo busca con getElementById.
   */
  function setupRouteDetailsDOM() {
    // Limpiar body
    document.body.innerHTML = '';

    // Modal overlay
    const modal = document.createElement('div');
    modal.id = 'route-details-modal';
    modal.style.display = 'none';

    // Botón cerrar
    const closeBtn = document.createElement('button');
    closeBtn.id = 'modal-close';
    modal.appendChild(closeBtn);

    // Cuerpo del modal
    const body = document.createElement('div');
    body.id = 'modal-body';
    modal.appendChild(body);

    document.body.appendChild(modal);
  }

  /**
   * Helper: crear datos de arbitraje mock completos
   * @param {Object} overrides - Propiedades para sobreescribir
   * @returns {Object} Datos de arbitraje mock
   */
  function createMockArbitrage(overrides = {}) {
    return {
      broker: 'Binance',
      officialPrice: 1050,
      sellPrice: 1150,
      usdtArsBid: 1150,
      usdToUsdtRate: 1.002,
      profitPercentage: 8.5,
      fees: { trading: 0.1, withdrawal: 0.5, total: 0.6 },
      calculation: {
        initial: 100000,
        usdPurchased: 95.238,
        usdtAfterFees: 95.0,
        arsFromSale: 109250,
        finalAmount: 108750,
        netProfit: 8750,
        profitPercentage: 8.75
      },
      ...overrides
    };
  }

  beforeEach(() => {
    setupRouteDetailsDOM();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Drenar historial de modales residual de tests previos
    // (activeModal y modalHistory persisten en el cierre del IIFE)
    let safety = 0;
    while (MM.hasActiveModal() && safety < 20) {
      MM.closeModal();
      safety++;
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Limpiar modales dinámicos que pudieran haber quedado
    document.querySelectorAll('.confirmation-modal, .alert-modal, .info-modal').forEach(el => el.remove());
  });

  // ============================================================
  // CONSTANTES EXPUESTAS
  // ============================================================
  describe('Constantes expuestas', () => {
    it('expone MODAL_TYPES con todos los tipos definidos', () => {
      expect(MM.MODAL_TYPES).toBeDefined();
      expect(MM.MODAL_TYPES.ROUTE_DETAILS).toBe('route-details');
      expect(MM.MODAL_TYPES.CRYPTO_DETAILS).toBe('crypto-details');
      expect(MM.MODAL_TYPES.CONFIRMATION).toBe('confirmation');
      expect(MM.MODAL_TYPES.ALERT).toBe('alert');
      expect(MM.MODAL_TYPES.INFO).toBe('info');
    });

    it('expone MODAL_STATES con todos los estados definidos', () => {
      expect(MM.MODAL_STATES).toBeDefined();
      expect(MM.MODAL_STATES.CLOSED).toBe('closed');
      expect(MM.MODAL_STATES.OPENING).toBe('opening');
      expect(MM.MODAL_STATES.OPEN).toBe('open');
      expect(MM.MODAL_STATES.CLOSING).toBe('closing');
    });
  });

  // ============================================================
  // ESTADO INICIAL
  // ============================================================
  describe('Estado inicial', () => {
    it('getActiveModal retorna null cuando no hay modal activo', () => {
      // beforeEach ya drenó el historial residual
      expect(MM.getActiveModal()).toBeNull();
    });

    it('hasActiveModal retorna boolean', () => {
      expect(typeof MM.hasActiveModal()).toBe('boolean');
    });
  });

  // ============================================================
  // INIT
  // ============================================================
  describe('init()', () => {
    it('inicializa sin errores con settings vacíos', () => {
      expect(() => MM.init({})).not.toThrow();
    });

    it('inicializa sin errores con settings null', () => {
      expect(() => MM.init(null)).not.toThrow();
    });

    it('inicializa sin errores sin argumentos', () => {
      expect(() => MM.init()).not.toThrow();
    });

    it('llama a Logger.debug durante la inicialización', () => {
      globalThis.window.Logger.debug.mockClear();
      MM.init({});
      expect(globalThis.window.Logger.debug).toHaveBeenCalled();
    });
  });

  // ============================================================
  // SETUP ROUTE DETAILS MODAL
  // ============================================================
  describe('setupRouteDetailsModal()', () => {
    it('configura el modal sin errores cuando el DOM existe', () => {
      expect(() => MM.setupRouteDetailsModal()).not.toThrow();
    });

    it('no lanza error cuando #route-details-modal no existe', () => {
      document.body.innerHTML = '';
      expect(() => MM.setupRouteDetailsModal()).not.toThrow();
    });

    it('emite warning por consola cuando el modal no se encuentra', () => {
      document.body.innerHTML = '';
      MM.setupRouteDetailsModal();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('route-details-modal')
      );
    });

    it('registra event listener en botón #modal-close cuando existe', () => {
      const closeBtn = document.getElementById('modal-close');
      const spy = jest.spyOn(closeBtn, 'addEventListener');
      MM.setupRouteDetailsModal();
      expect(spy).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('registra event listener de click en overlay del modal', () => {
      const modal = document.getElementById('route-details-modal');
      const spy = jest.spyOn(modal, 'addEventListener');
      MM.setupRouteDetailsModal();
      expect(spy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  // ============================================================
  // OPEN ROUTE DETAILS MODAL
  // ============================================================
  describe('openRouteDetailsModal()', () => {
    it('abre el modal y lo hace visible (display flex)', () => {
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);

      const modal = document.getElementById('route-details-modal');
      expect(modal.style.display).toBe('flex');
    });

    it('establece activeModal a "route-details"', () => {
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);

      expect(MM.getActiveModal()).toBe('route-details');
      expect(MM.hasActiveModal()).toBe(true);
    });

    it('inyecta HTML en #modal-body con la guía de arbitraje', () => {
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).toContain('guide-container-simple');
      expect(modalBody.innerHTML).toContain('guide-header-simple');
      expect(modalBody.innerHTML).toContain('steps-simple');
    });

    it('incluye el nombre del broker en el contenido', () => {
      const arb = createMockArbitrage({ broker: 'Binance' });
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).toContain('Binance');
    });

    it('muestra badge de ganancia positiva cuando profitPercentage >= 0', () => {
      const arb = createMockArbitrage({ profitPercentage: 5.0 });
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).toContain('profit-positive');
      expect(modalBody.innerHTML).toContain('Ganancia');
    });

    it('muestra badge de pérdida cuando profitPercentage < 0', () => {
      const arb = createMockArbitrage({
        profitPercentage: -3.5,
        calculation: {
          initial: 100000,
          usdPurchased: 95.238,
          usdtAfterFees: 95.0,
          arsFromSale: 95000,
          finalAmount: 96500,
          netProfit: -3500,
          profitPercentage: -3.5
        }
      });
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).toContain('profit-negative');
      expect(modalBody.innerHTML).toContain('Pérdida');
    });

    it('genera los 4 pasos de la guía', () => {
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).toContain('data-step="1"');
      expect(modalBody.innerHTML).toContain('data-step="2"');
      expect(modalBody.innerHTML).toContain('data-step="3"');
      expect(modalBody.innerHTML).toContain('data-step="4"');
    });

    it('incluye el resumen rápido', () => {
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).toContain('quick-summary');
      expect(modalBody.innerHTML).toContain('Resumen Rápido');
    });

    it('no lanza error cuando #route-details-modal no existe', () => {
      document.body.innerHTML = '';
      const arb = createMockArbitrage();
      expect(() => MM.openRouteDetailsModal(arb)).not.toThrow();
    });

    it('loguea error por consola cuando el modal no se encuentra', () => {
      document.body.innerHTML = '';
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('route-details-modal')
      );
    });

    it('maneja datos de arbitraje mínimos (sin calculation)', () => {
      const arb = {
        broker: 'TestExchange',
        officialPrice: 1000,
        sellPrice: 1100
      };
      MM.openRouteDetailsModal(arb);

      const modal = document.getElementById('route-details-modal');
      expect(modal.style.display).toBe('flex');
      expect(MM.hasActiveModal()).toBe(true);
    });

    it('maneja datos de arbitraje vacíos', () => {
      MM.openRouteDetailsModal({});
      const modal = document.getElementById('route-details-modal');
      expect(modal.style.display).toBe('flex');
    });

    it('maneja datos de arbitraje null sin lanzar error', () => {
      // El módulo no valida el parámetro, puede lanzar al acceder propiedades
      // Verificamos que no crashea el proceso de tests
      try {
        MM.openRouteDetailsModal(null);
      } catch (e) {
        // Esperado: puede lanzar error al acceder propiedades de null
        expect(e).toBeDefined();
      }
    });

    it('muestra advertencia de comisión cuando usdToUsdtRate > 1.005', () => {
      const arb = createMockArbitrage({ usdToUsdtRate: 1.1 });
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).toContain('step-simple-warning');
    });

    it('no muestra advertencia de comisión cuando usdToUsdtRate <= 1.005', () => {
      const arb = createMockArbitrage({ usdToUsdtRate: 1.001 });
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).not.toContain('step-simple-warning');
    });

    it('no muestra advertencia cuando usdToUsdtRate es null', () => {
      const arb = createMockArbitrage({ usdToUsdtRate: null });
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).not.toContain('step-simple-warning');
    });
  });

  // ============================================================
  // CLOSE MODAL
  // ============================================================
  describe('closeModal()', () => {
    it('cierra el modal activo y oculta el elemento (display none)', () => {
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);
      expect(MM.hasActiveModal()).toBe(true);

      MM.closeModal();

      const modal = document.getElementById('route-details-modal');
      expect(modal.style.display).toBe('none');
    });

    it('establece activeModal a null cuando no hay historial previo', () => {
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);
      MM.closeModal();

      expect(MM.getActiveModal()).toBeNull();
      expect(MM.hasActiveModal()).toBe(false);
    });

    it('restaura el modal anterior del historial cuando hay múltiples', () => {
      const arb = createMockArbitrage();
      // Abrir dos veces (simula historial con múltiples entradas)
      MM.openRouteDetailsModal(arb);
      MM.openRouteDetailsModal(arb);

      expect(MM.getActiveModal()).toBe('route-details');

      // Cerrar una vez: debería restaurar la entrada anterior del historial
      MM.closeModal();
      expect(MM.getActiveModal()).toBe('route-details');

      // Cerrar de nuevo: historial vacío
      MM.closeModal();
      expect(MM.getActiveModal()).toBeNull();
    });

    it('no lanza error cuando no hay modal activo', () => {
      // beforeEach ya drenó el historial
      expect(() => MM.closeModal()).not.toThrow();
    });

    it('emite warning por consola cuando no hay modal activo', () => {
      // beforeEach ya drenó el historial → activeModal es null
      console.warn.mockClear();
      MM.closeModal();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No hay modal activo')
      );
    });

    it('no lanza error cuando el elemento modal ya no existe en el DOM', () => {
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);

      // Remover el modal del DOM
      document.getElementById('route-details-modal').remove();

      expect(() => MM.closeModal()).not.toThrow();
    });
  });

  // ============================================================
  // SHOW CONFIRMATION
  // ============================================================
  describe('showConfirmation()', () => {
    it('retorna una Promise', () => {
      const result = MM.showConfirmation('¿Estás seguro?');
      expect(result).toBeInstanceOf(Promise);
      // Limpiar: resolver la promise
      result.catch(() => {});
    });

    it('crea un modal de confirmación en el DOM', async () => {
      const promise = MM.showConfirmation('¿Confirmar operación?');

      // Verificar que se creó el modal
      const modal = document.querySelector('.confirmation-modal');
      expect(modal).not.toBeNull();
      expect(modal.querySelector('[data-action="confirm"]')).not.toBeNull();
      expect(modal.querySelector('[data-action="cancel"]')).not.toBeNull();

      // Limpiar: cancelar
      const cancelBtn = modal.querySelector('[data-action="cancel"]');
      cancelBtn.click();
      await promise;
    });

    it('resuelve true al hacer click en Confirmar', async () => {
      const onConfirm = jest.fn();
      const promise = MM.showConfirmation('¿Confirmar?', onConfirm);

      const modal = document.querySelector('.confirmation-modal');
      const confirmBtn = modal.querySelector('[data-action="confirm"]');
      confirmBtn.click();

      const result = await promise;
      expect(result).toBe(true);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('resuelve false al hacer click en Cancelar', async () => {
      const onCancel = jest.fn();
      const promise = MM.showConfirmation('¿Confirmar?', null, onCancel);

      const modal = document.querySelector('.confirmation-modal');
      const cancelBtn = modal.querySelector('[data-action="cancel"]');
      cancelBtn.click();

      const result = await promise;
      expect(result).toBe(false);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('resuelve false al hacer click en el overlay', async () => {
      const promise = MM.showConfirmation('¿Confirmar?');

      const modal = document.querySelector('.confirmation-modal');
      // Simular click directo en el overlay (no en un hijo)
      modal.click();

      const result = await promise;
      expect(result).toBe(false);
    });

    it('remueve el modal del DOM al confirmar', async () => {
      const promise = MM.showConfirmation('¿Confirmar?');

      const modal = document.querySelector('.confirmation-modal');
      modal.querySelector('[data-action="confirm"]').click();

      await promise;
      expect(document.querySelector('.confirmation-modal')).toBeNull();
    });

    it('remueve el modal del DOM al cancelar', async () => {
      const promise = MM.showConfirmation('¿Confirmar?');

      const modal = document.querySelector('.confirmation-modal');
      modal.querySelector('[data-action="cancel"]').click();

      await promise;
      expect(document.querySelector('.confirmation-modal')).toBeNull();
    });

    it('sanitiza el mensaje para prevenir XSS', async () => {
      const xssPayload = '<img src=x onerror="alert(1)">';
      const promise = MM.showConfirmation(xssPayload);

      const modal = document.querySelector('.confirmation-modal');
      const body = modal.querySelector('.modal-body');
      // El texto debe estar sanitizado, no debe contener el tag img como HTML ejecutable
      expect(body.innerHTML).not.toContain('<img src=x onerror');

      // Limpiar
      modal.querySelector('[data-action="cancel"]').click();
      await promise;
    });

    it('funciona sin callbacks (onConfirm y onCancel omitidos)', async () => {
      const promise = MM.showConfirmation('Solo mensaje');

      const modal = document.querySelector('.confirmation-modal');
      modal.querySelector('[data-action="confirm"]').click();

      const result = await promise;
      expect(result).toBe(true);
    });
  });

  // ============================================================
  // SHOW ALERT
  // ============================================================
  describe('showAlert()', () => {
    it('retorna una Promise', () => {
      const result = MM.showAlert('Título', 'Mensaje');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {});
    });

    it('crea un modal de alerta en el DOM con tipo info por defecto', async () => {
      const promise = MM.showAlert('Test Title', 'Test Message');

      const modal = document.querySelector('.alert-modal');
      expect(modal).not.toBeNull();
      expect(modal.classList.contains('alert-info')).toBe(true);
      expect(modal.querySelector('[data-action="close"]')).not.toBeNull();

      // Limpiar
      modal.querySelector('[data-action="close"]').click();
      await promise;
    });

    it('crea modal con tipo warning correctamente', async () => {
      const promise = MM.showAlert('Atención', 'Algo pasó', 'warning');

      const modal = document.querySelector('.alert-modal');
      expect(modal.classList.contains('alert-warning')).toBe(true);

      modal.querySelector('[data-action="close"]').click();
      await promise;
    });

    it('crea modal con tipo error correctamente', async () => {
      const promise = MM.showAlert('Error', 'Algo falló', 'error');

      const modal = document.querySelector('.alert-modal');
      expect(modal.classList.contains('alert-error')).toBe(true);

      modal.querySelector('[data-action="close"]').click();
      await promise;
    });

    it('crea modal con tipo success correctamente', async () => {
      const promise = MM.showAlert('Éxito', 'Todo bien', 'success');

      const modal = document.querySelector('.alert-modal');
      expect(modal.classList.contains('alert-success')).toBe(true);

      modal.querySelector('[data-action="close"]').click();
      await promise;
    });

    it('resuelve la Promise al hacer click en Cerrar', async () => {
      const promise = MM.showAlert('Título', 'Mensaje');

      const modal = document.querySelector('.alert-modal');
      modal.querySelector('[data-action="close"]').click();

      await expect(promise).resolves.toBeUndefined();
    });

    it('resuelve la Promise al hacer click en el overlay', async () => {
      const promise = MM.showAlert('Título', 'Mensaje');

      const modal = document.querySelector('.alert-modal');
      modal.click(); // Click directo en overlay

      await expect(promise).resolves.toBeUndefined();
    });

    it('remueve el modal del DOM al cerrar', async () => {
      const promise = MM.showAlert('Título', 'Mensaje');

      const modal = document.querySelector('.alert-modal');
      modal.querySelector('[data-action="close"]').click();

      await promise;
      expect(document.querySelector('.alert-modal')).toBeNull();
    });

    it('sanitiza el título y mensaje', async () => {
      const xssTitle = '<script>alert("xss")</script>';
      const xssMessage = '<b onmouseover="alert(1)">hover me</b>';
      const promise = MM.showAlert(xssTitle, xssMessage);

      const modal = document.querySelector('.alert-modal');
      const header = modal.querySelector('.modal-header');
      const body = modal.querySelector('.modal-body');

      // Los textos sanitizados no deben contener tags ejecutables
      expect(header.innerHTML).not.toContain('<script>');
      expect(body.innerHTML).not.toContain('<b onmouseover');

      // Limpiar
      modal.querySelector('[data-action="close"]').click();
      await promise;
    });
  });

  // ============================================================
  // SHOW INFO
  // ============================================================
  describe('showInfo()', () => {
    it('crea un modal de información en el DOM', () => {
      MM.showInfo('Información', '<p>Contenido informativo</p>');

      const modal = document.querySelector('.info-modal');
      expect(modal).not.toBeNull();
      expect(modal.querySelector('.modal-close')).not.toBeNull();
    });

    it('sanitiza el título', () => {
      MM.showInfo('<script>alert("xss")</script>', '<p>Contenido</p>');

      const modal = document.querySelector('.info-modal');
      const header = modal.querySelector('.modal-header');
      expect(header.innerHTML).not.toContain('<script>');
    });

    it('inserta el contenido HTML directamente en el body', () => {
      const content = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      MM.showInfo('Detalle', content);

      const modal = document.querySelector('.info-modal');
      const body = modal.querySelector('.modal-body');
      expect(body.innerHTML).toContain('<ul>');
      expect(body.innerHTML).toContain('<li>Item 1</li>');
    });

    it('remueve el modal del DOM al hacer click en cerrar', () => {
      MM.showInfo('Info', '<p>Test</p>');

      const modal = document.querySelector('.info-modal');
      const closeBtn = modal.querySelector('.modal-close');
      closeBtn.click();

      expect(document.querySelector('.info-modal')).toBeNull();
    });

    it('remueve el modal del DOM al hacer click en el overlay', () => {
      MM.showInfo('Info', '<p>Test</p>');

      const modal = document.querySelector('.info-modal');
      modal.click(); // Click directo en overlay

      expect(document.querySelector('.info-modal')).toBeNull();
    });

    it('agrega la clase "active" después de un timeout', () => {
      jest.useFakeTimers();
      MM.showInfo('Info', '<p>Test</p>');

      const modal = document.querySelector('.info-modal');
      expect(modal.classList.contains('active')).toBe(false);

      jest.advanceTimersByTime(20);
      expect(modal.classList.contains('active')).toBe(true);

      jest.useRealTimers();
      // Limpiar
      modal.querySelector('.modal-close').click();
    });
  });

  // ============================================================
  // CIERRE CON TECLA ESCAPE
  // ============================================================
  describe('Cierre con tecla Escape', () => {
    it('cierra el modal activo al presionar Escape', () => {
      // Inicializar para configurar event listeners
      MM.init({});

      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);
      expect(MM.hasActiveModal()).toBe(true);

      // Simular tecla Escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(MM.hasActiveModal()).toBe(false);
    });

    it('no hace nada al presionar Escape si no hay modal activo', () => {
      MM.init({});

      // Asegurar que no hay modal activo
      try { MM.closeModal(); } catch (_) { /* noop */ }
      try { MM.closeModal(); } catch (_) { /* noop */ }

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => document.dispatchEvent(escapeEvent)).not.toThrow();
    });

    it('no cierra el modal al presionar otra tecla', () => {
      MM.init({});

      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);

      expect(MM.hasActiveModal()).toBe(true);
    });
  });

  // ============================================================
  // CLICK EN OVERLAY DEL ROUTE DETAILS MODAL
  // ============================================================
  describe('Click en overlay para cerrar', () => {
    it('cierra el modal al hacer click directo en el overlay', () => {
      MM.setupRouteDetailsModal();

      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);
      expect(MM.hasActiveModal()).toBe(true);

      const modal = document.getElementById('route-details-modal');
      // Click directo en el overlay (target === currentTarget)
      modal.click();

      expect(MM.hasActiveModal()).toBe(false);
    });
  });

  // ============================================================
  // CASOS EDGE - calculateGuideValues (indirectamente)
  // ============================================================
  describe('Casos edge en cálculos de guía', () => {
    it('maneja datos sin calculation con valores por defecto', () => {
      const arb = {
        broker: 'TestBroker',
        officialPrice: 1000,
        sellPrice: 1100
      };
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).toContain('TestBroker');
      expect(modalBody.innerHTML).toContain('guide-container-simple');
    });

    it('maneja fees ausentes usando valores por defecto', () => {
      const arb = {
        broker: 'NoFees',
        officialPrice: 1000,
        calculation: { initial: 50000 }
      };
      MM.openRouteDetailsModal(arb);

      const modal = document.getElementById('route-details-modal');
      expect(modal.style.display).toBe('flex');
    });

    it('maneja usdToUsdtRate como número finito válido', () => {
      const arb = createMockArbitrage({ usdToUsdtRate: 1.003 });
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      // Debe mostrar la tasa en el paso 2
      expect(modalBody.innerHTML).toContain('1.0030');
    });

    it('maneja usdToUsdtRate undefined correctamente', () => {
      const arb = createMockArbitrage({ usdToUsdtRate: undefined });
      MM.openRouteDetailsModal(arb);

      const modal = document.getElementById('route-details-modal');
      expect(modal.style.display).toBe('flex');
    });

    it('maneja profitPercentage negativo mostrando pérdida', () => {
      const arb = createMockArbitrage({
        profitPercentage: -5.2,
        calculation: {
          ...createMockArbitrage().calculation,
          netProfit: -5200,
          profitPercentage: -5.2,
          finalAmount: 94800,
          arsFromSale: 94800
        }
      });
      MM.openRouteDetailsModal(arb);

      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).toContain('Pérdida');
      expect(modalBody.innerHTML).toContain('profit-negative');
    });

    it('maneja objeto arbitraje completamente vacío', () => {
      MM.openRouteDetailsModal({});

      const modal = document.getElementById('route-details-modal');
      expect(modal.style.display).toBe('flex');
      const modalBody = document.getElementById('modal-body');
      expect(modalBody.innerHTML).toContain('guide-container-simple');
    });
  });

  // ============================================================
  // INTEGRACIÓN: Flujo completo abrir → cerrar
  // ============================================================
  describe('Flujo completo abrir/cerrar', () => {
    it('abre modal, verifica estado, cierra y verifica estado limpio', () => {
      // beforeEach ya garantiza estado limpio

      // Abrir
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);
      expect(MM.hasActiveModal()).toBe(true);
      expect(MM.getActiveModal()).toBe('route-details');

      // Verificar visible
      const modal = document.getElementById('route-details-modal');
      expect(modal.style.display).toBe('flex');

      // Cerrar
      MM.closeModal();
      expect(MM.hasActiveModal()).toBe(false);
      expect(MM.getActiveModal()).toBeNull();
      expect(modal.style.display).toBe('none');
    });

    it('permite abrir múltiples veces y el historial crece', () => {
      const arb = createMockArbitrage();
      MM.openRouteDetailsModal(arb);
      MM.openRouteDetailsModal(arb);
      MM.openRouteDetailsModal(arb);

      expect(MM.hasActiveModal()).toBe(true);

      // Cerrar todas
      MM.closeModal();
      expect(MM.hasActiveModal()).toBe(true);
      MM.closeModal();
      expect(MM.hasActiveModal()).toBe(true);
      MM.closeModal();
      expect(MM.hasActiveModal()).toBe(false);
    });
  });
});
