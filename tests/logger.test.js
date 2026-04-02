/**
 * Tests para Logger y LogLevel
 *
 * El logger controla toda la visibilidad de diagnóstico.
 * Si el nivel de log es incorrecto, errores críticos pasan
 * sin registrarse. Cada método debe llamar a console.X adecuado.
 *
 * Patrón de exportación: module.exports = { Logger, LogLevel }
 */

const { Logger, LogLevel } = require('../src/utils/logger.js');

describe('Logger', () => {
  beforeEach(() => {
    // Silenciar salida real durante tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'group').mockImplementation(() => {});
    jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
    jest.spyOn(console, 'time').mockImplementation(() => {});
    jest.spyOn(console, 'timeEnd').mockImplementation(() => {});

    // Siempre empezar en nivel DEBUG para que todos los métodos sean activos
    Logger.setLevel(LogLevel.DEBUG);
    Logger.clearHistory();
    Logger.setPrefix('[Test]');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Logger.setLevel(LogLevel.WARN);
    Logger.setPrefix('[ArbitrageAR]');
    Logger.clearHistory();
  });

  // ============================================================
  // Niveles de log — comportamiento por nivel
  // ============================================================
  describe('Niveles de log', () => {
    it('ERROR solo muestra errors', () => {
      Logger.setLevel(LogLevel.ERROR);

      Logger.error('error crítico');
      Logger.warn('advertencia');
      Logger.info('información');
      Logger.debug('detalles');

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });

    it('WARN muestra warn + error', () => {
      Logger.setLevel(LogLevel.WARN);

      Logger.error('error crítico');
      Logger.warn('advertencia');
      Logger.info('información');
      Logger.debug('detalles');

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.log).not.toHaveBeenCalled();
    });

    it('INFO muestra info + warn + error', () => {
      Logger.setLevel(LogLevel.INFO);

      Logger.error('error crítico');
      Logger.warn('advertencia');
      Logger.info('información');
      Logger.debug('detalles');
      Logger.success('operación exitosa');

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledTimes(2); // info + success
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅')
      );
    });

    it('DEBUG muestra todo', () => {
      Logger.setLevel(LogLevel.DEBUG);

      Logger.error('error crítico');
      Logger.warn('advertencia');
      Logger.info('información');
      Logger.debug('detalles');
      Logger.success('operación exitosa');

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledTimes(3); // info + debug + success
    });
  });

  // ============================================================
  // Historial — registro, límite y limpieza
  // ============================================================
  describe('Historial', () => {
    it('registra entradas con timestamp, level y message; respeta MAX_HISTORY y permite clearHistory', () => {
      // Verificar estructura de entrada
      Logger.error('entrada de prueba');
      const history = Logger.getHistory();

      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(1);

      const entry = history[0];
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('level', 'ERROR');
      expect(entry).toHaveProperty('message', 'entrada de prueba');

      // Agregar más entradas y verificar clearHistory
      Logger.warn('advertencia');
      Logger.info('información');
      expect(Logger.getHistory()).toHaveLength(3);

      Logger.clearHistory();
      expect(Logger.getHistory()).toHaveLength(0);

      // Verificar límite MAX_HISTORY (100)
      for (let i = 0; i < 110; i++) {
        Logger.error(`error ${i}`);
      }
      expect(Logger.getHistory().length).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================
  // Helpers de consola — group, groupEnd, time, timeEnd
  // ============================================================
  describe('Helpers de consola', () => {
    it('group, groupEnd, time y timeEnd funcionan solo en nivel DEBUG', () => {
      // En nivel INFO no deben funcionar
      Logger.setLevel(LogLevel.INFO);
      Logger.group('mi grupo');
      Logger.groupEnd();
      Logger.time('operacion');
      Logger.timeEnd('operacion');

      expect(console.group).not.toHaveBeenCalled();
      expect(console.groupEnd).not.toHaveBeenCalled();
      expect(console.time).not.toHaveBeenCalled();
      expect(console.timeEnd).not.toHaveBeenCalled();

      // En nivel DEBUG sí deben funcionar
      Logger.setLevel(LogLevel.DEBUG);
      Logger.group('mi grupo');
      Logger.groupEnd();
      Logger.time('operacion');
      Logger.timeEnd('operacion');

      expect(console.group).toHaveBeenCalledTimes(1);
      expect(console.groupEnd).toHaveBeenCalledTimes(1);
      expect(console.time).toHaveBeenCalledTimes(1);
      expect(console.timeEnd).toHaveBeenCalledTimes(1);
    });
  });
});