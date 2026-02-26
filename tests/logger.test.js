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
  // LogLevel — constantes
  // ============================================================
  describe('LogLevel', () => {
    it('tiene los niveles numéricos esperados', () => {
      expect(LogLevel.ERROR).toBe(0);
      expect(LogLevel.WARN).toBe(1);
      expect(LogLevel.INFO).toBe(2);
      expect(LogLevel.DEBUG).toBe(3);
    });

    it('ERROR < WARN < INFO < DEBUG', () => {
      expect(LogLevel.ERROR).toBeLessThan(LogLevel.WARN);
      expect(LogLevel.WARN).toBeLessThan(LogLevel.INFO);
      expect(LogLevel.INFO).toBeLessThan(LogLevel.DEBUG);
    });
  });

  // ============================================================
  // error — siempre se emite (nivel ERROR = 0)
  // ============================================================
  describe('error', () => {
    it('llama a console.error siempre', () => {
      Logger.setLevel(LogLevel.ERROR);
      Logger.error('algo salió mal');
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('llama a console.error incluso con nivel WARN', () => {
      Logger.setLevel(LogLevel.WARN);
      Logger.error('error crítico');
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('agrega la entrada al historial', () => {
      Logger.error('fallo');
      const history = Logger.getHistory();
      expect(history.some(h => h.level === 'ERROR' && h.message === 'fallo')).toBe(true);
    });

    it('el mensaje contiene el prefijo', () => {
      Logger.error('test error');
      const [firstArg] = console.error.mock.calls[0];
      expect(firstArg).toContain('[Test]');
    });
  });

  // ============================================================
  // warn
  // ============================================================
  describe('warn', () => {
    it('llama a console.warn cuando nivel >= WARN', () => {
      Logger.setLevel(LogLevel.WARN);
      Logger.warn('advertencia');
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('NO llama a console.warn cuando nivel es ERROR', () => {
      Logger.setLevel(LogLevel.ERROR);
      Logger.warn('silenciado');
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // info
  // ============================================================
  describe('info', () => {
    it('llama a console.log cuando nivel >= INFO', () => {
      Logger.setLevel(LogLevel.INFO);
      Logger.info('información');
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it('NO llama a console.log cuando nivel es WARN', () => {
      Logger.setLevel(LogLevel.WARN);
      Logger.info('silenciada');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // debug
  // ============================================================
  describe('debug', () => {
    it('llama a console.log cuando nivel >= DEBUG', () => {
      Logger.setLevel(LogLevel.DEBUG);
      Logger.debug('detalles');
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it('NO llama a console.log cuando nivel es INFO', () => {
      Logger.setLevel(LogLevel.INFO);
      Logger.debug('silenciado');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // success
  // ============================================================
  describe('success', () => {
    it('llama a console.log cuando nivel >= INFO', () => {
      Logger.setLevel(LogLevel.INFO);
      Logger.success('operación exitosa');
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it('el mensaje contiene el emoji ✅', () => {
      Logger.setLevel(LogLevel.INFO);
      Logger.success('ok');
      const [firstArg] = console.log.mock.calls[0];
      expect(firstArg).toContain('✅');
    });
  });

  // ============================================================
  // historial
  // ============================================================
  describe('getHistory / clearHistory', () => {
    it('getHistory retorna un array', () => {
      expect(Array.isArray(Logger.getHistory())).toBe(true);
    });

    it('clearHistory vacía el historial', () => {
      Logger.error('un error');
      Logger.warn('una advertencia');
      expect(Logger.getHistory()).toHaveLength(2);

      Logger.clearHistory();
      expect(Logger.getHistory()).toHaveLength(0);
    });

    it('cada entrada tiene timestamp, level, message', () => {
      Logger.error('entrada de prueba');
      const entry = Logger.getHistory()[0];
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('level', 'ERROR');
      expect(entry).toHaveProperty('message', 'entrada de prueba');
    });

    it('el historial no excede MAX_HISTORY (100)', () => {
      // Llenar más de 100 entradas
      for (let i = 0; i < 110; i++) {
        Logger.error(`error ${i}`);
      }
      expect(Logger.getHistory().length).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================
  // setLevel / setPrefix
  // ============================================================
  describe('setLevel / setPrefix', () => {
    it('setLevel cambia lo que se registra', () => {
      Logger.setLevel(LogLevel.ERROR);
      Logger.info('debería ser ignorado');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('setPrefix cambia el prefijo en los mensajes', () => {
      Logger.setPrefix('[MiApp]');
      Logger.error('prueba');
      const [firstArg] = console.error.mock.calls[0];
      expect(firstArg).toContain('[MiApp]');
    });
  });

  // ============================================================
  // Logger.Level — alias expuesto
  // ============================================================
  describe('Logger.Level', () => {
    it('expone las constantes a través de Logger.Level', () => {
      expect(Logger.Level).toBeDefined();
      expect(Logger.Level.ERROR).toBe(0);
      expect(Logger.Level.DEBUG).toBe(3);
    });
  });

  // ============================================================
  // group / groupEnd / time / timeEnd
  // ============================================================
  describe('helpers de consola', () => {
    it('group llama a console.group en nivel DEBUG', () => {
      Logger.setLevel(LogLevel.DEBUG);
      Logger.group('mi grupo');
      expect(console.group).toHaveBeenCalledTimes(1);
    });

    it('groupEnd llama a console.groupEnd en nivel DEBUG', () => {
      Logger.setLevel(LogLevel.DEBUG);
      Logger.groupEnd();
      expect(console.groupEnd).toHaveBeenCalledTimes(1);
    });

    it('time llama a console.time en nivel DEBUG', () => {
      Logger.setLevel(LogLevel.DEBUG);
      Logger.time('operacion');
      expect(console.time).toHaveBeenCalledTimes(1);
    });

    it('timeEnd llama a console.timeEnd en nivel DEBUG', () => {
      Logger.setLevel(LogLevel.DEBUG);
      Logger.timeEnd('operacion');
      expect(console.timeEnd).toHaveBeenCalledTimes(1);
    });
  });
});
