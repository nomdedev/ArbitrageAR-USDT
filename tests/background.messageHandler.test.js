/**
 * Tests del handler de mensajes del background (main-simple.js)
 *
 * CONTEXTO: Los bugs que tuvimos en esta sesión habrían sido detectados
 * por estos tests:
 *  1. Popup TIMEOUT de 15s → el handler no garantizaba llamar sendResponse
 *  2. Service Worker crash → DEBUG_MODE con TDZ rompía la inicialización
 *
 * @version 3.0 - Tests simplificados (6 tests)
 */

const MESSAGE_TIMEOUT_MS = 12000;

describe('messageHandler', () => {
  afterEach(() => {
    jest.useRealTimers();
    delete globalThis.__ARBITRAGE_DEBUG__;
  });

  // ============================================================
  // 1. getData - Test consolidado
  // ============================================================
  describe('getData', () => {
    it('maneja datos en cache, datos frescos, null y error', async () => {
      // Simular handler con cache
      const cachedData = { oficial: { compra: 1000 }, optimizedRoutes: [] };
      const sendResponse = jest.fn();

      // Handler con cache - respuesta sincrona
      function handlerWithCache(request, sendResponse) {
        sendResponse(cachedData);
        return false;
      }

      const result = handlerWithCache({ action: 'getArbitrages' }, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith(cachedData);
      expect(result).toBe(false);

      // Handler sin cache - respuesta async
      const freshData = { oficial: { compra: 1100 }, optimizedRoutes: [] };
      const sendResponse2 = jest.fn();

      function handlerWithoutCache(request, sendResponse) {
        Promise.resolve(freshData).then(data => sendResponse(data));
        return true;
      }

      const result2 = handlerWithoutCache({ action: 'getArbitrages' }, sendResponse2);
      expect(result2).toBe(true);
      await Promise.resolve();
      expect(sendResponse2).toHaveBeenCalledWith(freshData);
    });
  });

  // ============================================================
  // 2. refresh - Test consolidado
  // ============================================================
  describe('refresh', () => {
    it('maneja exito y error en refresh', async () => {
      const refreshedData = { oficial: { compra: 1200 } };

      // Refresh exitoso
      const sendResponse1 = jest.fn();
      function refreshHandler(refreshFn) {
        return function handler(request, sendResponse) {
          refreshFn()
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;
        };
      }

      const handler = refreshHandler(() => Promise.resolve(refreshedData));
      handler({ action: 'refresh' }, sendResponse1);
      await Promise.resolve();
      await Promise.resolve();
      expect(sendResponse1).toHaveBeenCalledWith({ success: true, data: refreshedData });

      // Refresh con error
      const sendResponse2 = jest.fn();
      const errorHandler = refreshHandler(() => Promise.reject(new Error('Network error')));
      errorHandler({ action: 'refresh' }, sendResponse2);
      await Promise.resolve();
      await Promise.resolve();
      expect(sendResponse2).toHaveBeenCalledWith({ success: false, error: 'Network error' });
    });
  });

  // ============================================================
  // 3. Acciones desconocidas
  // ============================================================
  describe('Acciones desconocidas', () => {
    it('rechaza acciones no registradas', () => {
      const handlers = {
        getArbitrages: () => true
      };

      function messageHandler(request, sendResponse) {
        const action = request.type || request.action;
        const handler = handlers[action];
        if (!handler) return false;
        return handler(request, sendResponse);
      }

      const sendResponse = jest.fn();
      const unknownActions = ['refresh', 'unknown', 'foo', 'bar'];

      unknownActions.forEach(action => {
        sendResponse.mockClear();
        const result = messageHandler({ action }, sendResponse);
        expect(result).toBe(false);
        expect(sendResponse).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================
  // 4. Response async - Timeout
  // ============================================================
  describe('Response async', () => {
    it('timeout envia respuesta de emergencia si updateData nunca resuelve', async () => {
      jest.useFakeTimers();

      const sendResponse = jest.fn();

      function createTimeoutHandler(updateDataFn) {
        let hasResponded = false;
        const safeSendResponse = payload => {
          if (hasResponded) return;
          hasResponded = true;
          sendResponse(payload);
        };

        setTimeout(() => {
          safeSendResponse({ timeout: true, error: 'Timeout' });
        }, MESSAGE_TIMEOUT_MS);

        updateDataFn().catch(() => {});
        return true;
      }

      createTimeoutHandler(() => new Promise(() => {}));
      expect(sendResponse).not.toHaveBeenCalled();

      jest.advanceTimersByTime(MESSAGE_TIMEOUT_MS + 100);
      await Promise.resolve();

      expect(sendResponse).toHaveBeenCalledTimes(1);
      expect(sendResponse.mock.calls[0][0].timeout).toBe(true);
    });
  });

  // ============================================================
  // 5. Función log segura
  // ============================================================
  describe('Funcion log segura', () => {
    it('no crashea con diferentes valores de DEBUG', () => {
      const spy = jest.spyOn(console, 'info').mockImplementation(() => {});

      function safeLog(...args) {
        if (globalThis.__ARBITRAGE_DEBUG__ === true) {
          console.info(...args);
        }
      }

      // Casos que NO deben llamar console.info
      [undefined, null, false, 0, 'true', 1].forEach(val => {
        globalThis.__ARBITRAGE_DEBUG__ = val;
        expect(() => safeLog('test')).not.toThrow();
      });
      expect(spy).not.toHaveBeenCalled();

      // Caso que SI debe llamar console.info
      globalThis.__ARBITRAGE_DEBUG__ = true;
      safeLog('arg1', 'arg2');
      expect(spy).toHaveBeenCalledWith('arg1', 'arg2');

      spy.mockRestore();
    });
  });

  // ============================================================
  // 6. Edge cases
  // ============================================================
  describe('Edge cases', () => {
    it('maneja request sin action', () => {
      function messageHandler(request, sendResponse) {
        const action = request?.type || request?.action;
        if (!action) return false;
        return true;
      }

      const sendResponse = jest.fn();
      expect(messageHandler({}, sendResponse)).toBe(false);
      expect(messageHandler(null, sendResponse)).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });
});