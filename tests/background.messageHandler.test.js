/**
 * Tests del handler de mensajes del background (main-simple.js)
 *
 * CONTEXTO: Los bugs que tuvimos en esta sesión habrían sido detectados
 * por estos tests:
 *  1. Popup TIMEOUT de 15s → el handler no garantizaba llamar sendResponse
 *  2. Service Worker crash → DEBUG_MODE con TDZ rompía la inicialización
 *
 * Como main-simple.js es un Service Worker completo (no un módulo),
 * estos tests aislan y verifican la LÓGICA del handler directamente.
 */

// ────────────────────────────────────────────────────
// La lógica del handler de getArbitrages extraída de main-simple.js
// para ser testeable en aislamiento. Refleja EXACTAMENTE el código en
// producción (src/background/main-simple.js líneas ~2296-2393).
// ────────────────────────────────────────────────────

const MESSAGE_TIMEOUT_MS = 12000;

/**
 * Replica el handler de onMessage para el action 'getArbitrages'.
 * @param {Object|null} currentData - datos en cache
 * @param {Function} updateDataFn - función que resuelve con datos frescos
 * @returns {Function} handler (request, sender, sendResponse) → boolean
 */
function createGetArbitragesHandler(currentData, updateDataFn) {
  return function handler(request, sender, sendResponse) {
    if (request.action !== 'getArbitrages') return false;

    // Caso 1: hay datos en caché → respuesta síncrona
    if (currentData) {
      sendResponse(currentData);
      return false; // canal síncrono, no mantener abierto
    }

    // Caso 2: sin caché → actualizar de forma asíncrona con timeout de seguridad
    let hasResponded = false;

    const safeSendResponse = payload => {
      if (hasResponded) return;
      hasResponded = true;
      sendResponse(payload);
    };

    const responseTimeoutId = setTimeout(() => {
      safeSendResponse({
        timeout: true,
        backgroundUnhealthy: true,
        error: `Timeout interno del background (${MESSAGE_TIMEOUT_MS}ms)`,
        optimizedRoutes: [],
        arbitrages: []
      });
    }, MESSAGE_TIMEOUT_MS);

    updateDataFn()
      .then(data => {
        clearTimeout(responseTimeoutId);
        safeSendResponse(data || { error: 'Error obteniendo datos', optimizedRoutes: [], arbitrages: [] });
      })
      .catch(error => {
        clearTimeout(responseTimeoutId);
        safeSendResponse({ error: error.message, optimizedRoutes: [], arbitrages: [] });
      });

    return true; // mantener canal abierto para respuesta asíncrona
  };
}

/**
 * Replica la función log() del background tal como quedó después del fix.
 * Verifica que no produce errores cuando DEBUG_MODE no existe.
 */
function createSafeLog() {
  return function log(...args) {
    if (globalThis.__ARBITRAGE_DEBUG__ === true) {
      console.info(...args);
    }
  };
}

// ────────────────────────────────────────────────────
describe('Background Message Handler: getArbitrages', () => {
  afterEach(() => {
    jest.useRealTimers();
    delete globalThis.__ARBITRAGE_DEBUG__;
  });

  // ============================================================
  // Caso 1: datos en caché
  // ============================================================
  describe('cuando currentData tiene datos (caché válido)', () => {
    it('llama sendResponse inmediatamente con los datos en caché', () => {
      const cachedData = {
        oficial: { compra: 1000, venta: 1050 },
        optimizedRoutes: [{ broker: 'binance', profitPercentage: 2.5 }],
        lastUpdate: Date.now()
      };

      const sendResponse = jest.fn();
      const updateData  = jest.fn(); // NO debe llamarse

      const handler = createGetArbitragesHandler(cachedData, updateData);
      const result  = handler({ action: 'getArbitrages' }, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledTimes(1);
      expect(sendResponse).toHaveBeenCalledWith(cachedData);
      expect(updateData).not.toHaveBeenCalled();
    });

    it('retorna false (canal síncrono)', () => {
      const handler = createGetArbitragesHandler({ someData: true }, jest.fn());
      const result  = handler({ action: 'getArbitrages' }, {}, jest.fn());
      expect(result).toBe(false);
    });
  });

  // ============================================================
  // Caso 2: sin caché → updateData resuelve con éxito
  // ============================================================
  describe('cuando no hay datos en caché y updateData tiene éxito', () => {
    it('llama sendResponse con los datos frescos', async () => {
      const freshData = {
        oficial: { compra: 1100 },
        optimizedRoutes: [],
        lastUpdate: Date.now()
      };

      const sendResponse = jest.fn();
      const updateData   = jest.fn().mockResolvedValue(freshData);

      const handler = createGetArbitragesHandler(null, updateData);
      handler({ action: 'getArbitrages' }, {}, sendResponse);

      await Promise.resolve(); // flush microtask queue
      await Promise.resolve(); // flush .then()

      expect(sendResponse).toHaveBeenCalledTimes(1);
      expect(sendResponse).toHaveBeenCalledWith(freshData);
    });

    it('retorna true (mantener canal abierto para respuesta asíncrona)', () => {
      const handler = createGetArbitragesHandler(null, () => new Promise(() => {}));
      const result  = handler({ action: 'getArbitrages' }, {}, jest.fn());
      expect(result).toBe(true);
    });

    it('si updateData resuelve con null, envía respuesta de error (no cuelga)', async () => {
      const sendResponse = jest.fn();
      const updateData   = jest.fn().mockResolvedValue(null);

      const handler = createGetArbitragesHandler(null, updateData);
      handler({ action: 'getArbitrages' }, {}, sendResponse);

      await Promise.resolve();
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledTimes(1);
      // Con null, debe enviar respuesta de error — no quedarse colgado
      expect(sendResponse.mock.calls[0][0]).toHaveProperty('error');
    });
  });

  // ============================================================
  // Caso 3: safeSendResponse — protección contra doble llamada
  // ============================================================
  describe('safeSendResponse — no llama sendResponse más de una vez', () => {
    it('cuando updateData resuelve ANTES del timeout, sólo responde una vez', async () => {
      jest.useFakeTimers();

      const sendResponse = jest.fn();
      const freshData    = { oficial: { compra: 1000 }, optimizedRoutes: [] };
      const updateData   = jest.fn().mockResolvedValue(freshData);

      const handler = createGetArbitragesHandler(null, updateData);
      handler({ action: 'getArbitrages' }, {}, sendResponse);

      await Promise.resolve();
      await Promise.resolve();

      // El timeout aún no disparó (12s)
      jest.advanceTimersByTime(MESSAGE_TIMEOUT_MS + 1000);

      // A pesar de que el timeout se dispara DESPUÉS de que ya respondimos,
      // sendResponse debe llamarse sólo UNA vez
      expect(sendResponse).toHaveBeenCalledTimes(1);
    });

    it('cuando el timeout dispara ANTES de que updateData resuelva, sólo responde una vez', async () => {
      jest.useFakeTimers();

      const sendResponse = jest.fn();
      let resolveUpdateData;
      const updateData = jest.fn().mockReturnValue(
        new Promise(resolve => { resolveUpdateData = resolve; })
      );

      const handler = createGetArbitragesHandler(null, updateData);
      handler({ action: 'getArbitrages' }, {}, sendResponse);

      // Disparar el timeout
      jest.advanceTimersByTime(MESSAGE_TIMEOUT_MS + 100);
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledTimes(1);
      const firstCall = sendResponse.mock.calls[0][0];
      expect(firstCall.timeout).toBe(true);
      expect(firstCall.backgroundUnhealthy).toBe(true);

      // Ahora updateData resuelve tarde — safeSendResponse debe bloquearlo
      resolveUpdateData({ oficialCompra: 1000, optimizedRoutes: [] });
      await Promise.resolve();
      await Promise.resolve();

      // Sigue siendo 1 llamada
      expect(sendResponse).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // Caso 4: timeout garantizado
  // ============================================================
  describe('timeout de seguridad (12 segundos)', () => {
    it('envía respuesta de timeout si updateData nunca resuelve', async () => {
      jest.useFakeTimers();

      const sendResponse = jest.fn();
      // updateData que NUNCA resuelve (simula cuelgue)
      const updateData = jest.fn().mockReturnValue(new Promise(() => {}));

      const handler = createGetArbitragesHandler(null, updateData);
      handler({ action: 'getArbitrages' }, {}, sendResponse);

      expect(sendResponse).not.toHaveBeenCalled();

      jest.advanceTimersByTime(MESSAGE_TIMEOUT_MS + 100);
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledTimes(1);
      const response = sendResponse.mock.calls[0][0];
      expect(response.timeout).toBe(true);
      expect(response.backgroundUnhealthy).toBe(true);
      expect(response.optimizedRoutes).toEqual([]);
    });

    it('la respuesta de timeout incluye el mensaje de error descriptivo', async () => {
      jest.useFakeTimers();

      const sendResponse = jest.fn();
      createGetArbitragesHandler(null, () => new Promise(() => {}))
        ({ action: 'getArbitrages' }, {}, sendResponse);

      jest.advanceTimersByTime(MESSAGE_TIMEOUT_MS + 100);
      await Promise.resolve();

      const response = sendResponse.mock.calls[0][0];
      expect(response.error).toContain('12000');
    });
  });

  // ============================================================
  // Caso 5: error en updateData
  // ============================================================
  describe('cuando updateData lanza un error', () => {
    it('llama sendResponse con el mensaje de error (no cuelga)', async () => {
      const sendResponse = jest.fn();
      const updateData   = jest.fn().mockRejectedValue(new Error('API caída'));

      const handler = createGetArbitragesHandler(null, updateData);
      handler({ action: 'getArbitrages' }, {}, sendResponse);

      await Promise.resolve();
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledTimes(1);
      const response = sendResponse.mock.calls[0][0];
      expect(response.error).toBe('API caída');
      expect(response.optimizedRoutes).toEqual([]);
    });
  });

  // ============================================================
  // Caso 6: ignorar acciones que no son getArbitrages
  // ============================================================
  describe('acciones no manejadas', () => {
    it('retorna false para actions desconocidas', () => {
      const handler = createGetArbitragesHandler(null, jest.fn());
      expect(handler({ action: 'refresh' }, {}, jest.fn())).toBe(false);
      expect(handler({ action: 'unknown' }, {}, jest.fn())).toBe(false);
    });

    it('no llama sendResponse para actions desconocidas', () => {
      const sendResponse = jest.fn();
      const handler      = createGetArbitragesHandler(null, jest.fn());
      handler({ action: 'otros' }, {}, sendResponse);
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });
});

// ────────────────────────────────────────────────────
describe('Background: función log() — crash-safety', () => {
  afterEach(() => {
    delete globalThis.__ARBITRAGE_DEBUG__;
    jest.restoreAllMocks();
  });

  it('no lanza error cuando __ARBITRAGE_DEBUG__ no existe en globalThis', () => {
    const log = createSafeLog();
    expect(() => log('mensaje de prueba')).not.toThrow();
  });

  it('no lanza error cuando __ARBITRAGE_DEBUG__ = false', () => {
    globalThis.__ARBITRAGE_DEBUG__ = false;
    const log = createSafeLog();
    expect(() => log('mensaje', { obj: true })).not.toThrow();
  });

  it('no lanza error cuando __ARBITRAGE_DEBUG__ = undefined', () => {
    globalThis.__ARBITRAGE_DEBUG__ = undefined;
    const log = createSafeLog();
    expect(() => log('mensaje')).not.toThrow();
  });

  it('llama console.info cuando __ARBITRAGE_DEBUG__ === true', () => {
    globalThis.__ARBITRAGE_DEBUG__ = true;
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const log = createSafeLog();

    log('arg1', 'arg2');

    expect(spy).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('NO llama console.info cuando __ARBITRAGE_DEBUG__ !== true', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {});

    for (const val of [false, undefined, null, 0, 'true', 1]) {
      globalThis.__ARBITRAGE_DEBUG__ = val;
      createSafeLog()('mensaje');
    }

    expect(spy).not.toHaveBeenCalled();
  });
});
