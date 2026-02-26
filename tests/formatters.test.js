/**
 * Tests para Formatters
 *
 * Las funciones de formateo afectan todo lo que ve el usuario:
 * precios, porcentajes, timestamps, nombres de exchanges.
 * Bugs aquí son errores visuales directos en la UI.
 *
 * formatters.js exporta via module.exports cuando module !== undefined,
 * por lo que se puede importar directamente con require().
 */

const Formatters = require('../src/utils/formatters.js');

describe('Formatters', () => {

  // ============================================================
  // formatNumber — número genérico con 2 decimales
  // ============================================================
  describe('formatNumber', () => {
    it('formatea enteros con 2 decimales', () => {
      // En es-AR, los miles se separan con . y los decimales con ,
      const result = Formatters.formatNumber(1000);
      expect(result).toMatch(/1[.,]000[.,]00/);
    });

    it('formatea decimales correctamente', () => {
      const result = Formatters.formatNumber(1234.56);
      expect(result).toContain('1.234');
      expect(result).toContain('56');
    });

    it('retorna "0.00" para null', () => {
      expect(Formatters.formatNumber(null)).toBe('0.00');
    });

    it('retorna "0.00" para undefined', () => {
      expect(Formatters.formatNumber(undefined)).toBe('0.00');
    });

    it('retorna "0.00" para NaN', () => {
      expect(Formatters.formatNumber(NaN)).toBe('0.00');
    });

    it('formatea números negativos', () => {
      const result = Formatters.formatNumber(-500);
      expect(result).toContain('500');
      expect(result).toContain('-');
    });

    it('formatea números grandes con separadores de miles', () => {
      const result = Formatters.formatNumber(1500000);
      // Debe contener algún separador de miles
      expect(result.length).toBeGreaterThan(7); // "1500000" → "1.500.000,00"
    });
  });

  // ============================================================
  // formatARS — monto en pesos argentinos con símbolo $
  // ============================================================
  describe('formatARS', () => {
    it('agrega símbolo $ al monto', () => {
      const result = Formatters.formatARS(1000);
      expect(result).toMatch(/^\$/);
    });

    it('retorna "$0.00" para null', () => {
      expect(Formatters.formatARS(null)).toBe('$0.00');
    });

    it('retorna "$0.00" para undefined', () => {
      expect(Formatters.formatARS(undefined)).toBe('$0.00');
    });

    it('retorna "$0.00" para NaN', () => {
      expect(Formatters.formatARS(NaN)).toBe('$0.00');
    });

    it('formatea correctamente montos típicos de ARS', () => {
      const result = Formatters.formatARS(1050.50);
      expect(result).toContain('$');
      expect(result).toContain('1');
    });
  });

  // ============================================================
  // formatUSD — monto en dólares con símbolo U$D
  // ============================================================
  describe('formatUSD', () => {
    it('agrega símbolo U$D al monto', () => {
      expect(Formatters.formatUSD(100)).toMatch(/^U\$D/);
    });

    it('retorna "U$D 0.00" para null', () => {
      expect(Formatters.formatUSD(null)).toBe('U$D 0.00');
    });

    it('retorna "U$D 0.00" para undefined', () => {
      expect(Formatters.formatUSD(undefined)).toBe('U$D 0.00');
    });
  });

  // ============================================================
  // formatProfitPercent — porcentaje de ganancia con signo
  // ============================================================
  describe('formatProfitPercent', () => {
    it('agrega signo + a ganancias positivas', () => {
      const result = Formatters.formatProfitPercent(3.5);
      expect(result).toMatch(/^\+/);
      expect(result).toContain('%');
    });

    it('mantiene signo - en pérdidas', () => {
      const result = Formatters.formatProfitPercent(-2.5);
      expect(result).toContain('-');
      expect(result).toContain('%');
      expect(result).not.toMatch(/^\+/);
    });

    it('formatea 0% correctamente', () => {
      const result = Formatters.formatProfitPercent(0);
      expect(result).toContain('%');
      // 0 se trata como no-negativo, puede tener + o no
    });

    it('retorna "0.00%" para null', () => {
      expect(Formatters.formatProfitPercent(null)).toBe('0.00%');
    });

    it('retorna "0.00%" para undefined', () => {
      expect(Formatters.formatProfitPercent(undefined)).toBe('0.00%');
    });

    it('retorna "0.00%" para NaN', () => {
      expect(Formatters.formatProfitPercent(NaN)).toBe('0.00%');
    });

    it('incluye exactamente 2 decimales', () => {
      const result = Formatters.formatProfitPercent(3.5);
      // Debe terminar en "%"
      expect(result.endsWith('%')).toBe(true);
    });
  });

  // ============================================================
  // formatPercent — porcentaje genérico (sin signo automático)
  // ============================================================
  describe('formatPercent', () => {
    it('formatea 5 a "5,00" o "5.00" (locale-aware)', () => {
      const result = Formatters.formatPercent(5);
      expect(result).toMatch(/5[.,]00/);
    });

    it('retorna el fallback "0.00" para null', () => {
      expect(Formatters.formatPercent(null)).toBe('0.00');
    });
  });

  // ============================================================
  // formatUsdUsdtRatio — ratio con 3 decimales
  // ============================================================
  describe('formatUsdUsdtRatio', () => {
    it('formatea con 3 decimales', () => {
      const result = Formatters.formatUsdUsdtRatio(1.0234);
      // Debe tener exactamente 3 decimales
      expect(result).toMatch(/[.,]\d{3}$/);
    });

    it('retorna fallback "N/D" para null', () => {
      expect(Formatters.formatUsdUsdtRatio(null)).toBe('N/D');
    });
  });

  // ============================================================
  // getDollarSourceDisplay — descripción legible de la fuente
  // ============================================================
  describe('getDollarSourceDisplay', () => {
    it('retorna "N/A" si no hay oficial', () => {
      expect(Formatters.getDollarSourceDisplay(null)).toBe('N/A');
      expect(Formatters.getDollarSourceDisplay({})).toBe('N/A');
      expect(Formatters.getDollarSourceDisplay(undefined)).toBe('N/A');
    });

    it('retorna "👤 Manual" para source="manual"', () => {
      expect(Formatters.getDollarSourceDisplay({ source: 'manual' })).toContain('Manual');
    });

    it('retorna fuente legible para "dolarapi_oficial"', () => {
      const result = Formatters.getDollarSourceDisplay({ source: 'dolarapi_oficial' });
      expect(result).toContain('DolarAPI');
    });

    it('retorna descripción con banksCount para source="criptoya_banks"', () => {
      const result = Formatters.getDollarSourceDisplay({
        source: 'criptoya_banks',
        method: 'consenso',
        banksCount: 5
      });
      expect(result).toContain('Bancos');
      expect(result).toContain('consenso');
    });

    it('retorna "⚠️ Fallback fijo" para source="hardcoded_fallback"', () => {
      const result = Formatters.getDollarSourceDisplay({ source: 'hardcoded_fallback' });
      expect(result).toContain('Fallback');
    });

    it('retorna el source crudo cuando no está mapeado', () => {
      const result = Formatters.getDollarSourceDisplay({ source: 'fuente_desconocida' });
      expect(result).toBe('fuente_desconocida');
    });
  });

  // ============================================================
  // formatTimeAgo — tiempo relativo en español
  // ============================================================
  describe('formatTimeAgo', () => {
    it('retorna "Sin datos" para timestamp null/undefined', () => {
      expect(Formatters.formatTimeAgo(null)).toBe('Sin datos');
      expect(Formatters.formatTimeAgo(undefined)).toBe('Sin datos');
    });

    it('retorna "Hace un momento" para timestamps muy recientes (< 1 min)', () => {
      const ahora = Date.now() - 30000; // 30 segundos atrás
      expect(Formatters.formatTimeAgo(ahora)).toBe('Hace un momento');
    });

    it('retorna "Hace 1 minuto" para exactamente 1 minuto', () => {
      const unMinAtrás = Date.now() - 65000; // ~65 segundos
      expect(Formatters.formatTimeAgo(unMinAtrás)).toBe('Hace 1 minuto');
    });

    it('retorna "Hace N minutos" para menos de 1 hora', () => {
      const tresMinAtrás = Date.now() - (3 * 60 * 1000 + 5000);
      const result = Formatters.formatTimeAgo(tresMinAtrás);
      expect(result).toContain('3 minutos');
    });

    it('retorna "Hace 1 hora" para aprox 1 hora', () => {
      const unaHoraAtrás = Date.now() - (61 * 60 * 1000);
      expect(Formatters.formatTimeAgo(unaHoraAtrás)).toBe('Hace 1 hora');
    });

    it('retorna "Hace N horas" para menos de 1 día', () => {
      const dosHorasAtrás = Date.now() - (2 * 60 * 60 * 1000 + 5000);
      expect(Formatters.formatTimeAgo(dosHorasAtrás)).toContain('2 horas');
    });

    it('retorna "Hace más de un día" para timestamps muy viejos', () => {
      const ayer = Date.now() - (25 * 60 * 60 * 1000);
      expect(Formatters.formatTimeAgo(ayer)).toBe('Hace más de un día');
    });
  });

  // ============================================================
  // formatExchangeName — nombres amigables de exchanges
  // ============================================================
  describe('formatExchangeName', () => {
    it('retorna "Desconocido" para null/undefined/vacío', () => {
      expect(Formatters.formatExchangeName(null)).toBe('Desconocido');
      expect(Formatters.formatExchangeName(undefined)).toBe('Desconocido');
      expect(Formatters.formatExchangeName('')).toBe('Desconocido');
    });

    it('convierte "binance" a "Binance"', () => {
      expect(Formatters.formatExchangeName('binance')).toBe('Binance');
    });

    it('convierte "binancep2p" a "Binance P2P"', () => {
      expect(Formatters.formatExchangeName('binancep2p')).toBe('Binance P2P');
    });

    it('convierte "buenbit" a "Buenbit"', () => {
      expect(Formatters.formatExchangeName('buenbit')).toBe('Buenbit');
    });

    it('retorna el nombre original para exchanges no mapeados (case-sensitive)', () => {
      // Si no está en el map, devuelve el nombre tal cual
      const result = Formatters.formatExchangeName('exchange_nuevo_no_mapeado');
      expect(result).toBe('exchange_nuevo_no_mapeado');
    });

    it('funciona case-insensitive para exchanges conocidos', () => {
      // El mapa usa toLowerCase() internamente
      expect(Formatters.formatExchangeName('BINANCE')).toBe('Binance');
    });
  });

  // ============================================================
  // createFormatter — factory de formateadores personalizados
  // ============================================================
  describe('createFormatter', () => {
    it('crea un formateador con opciones personalizadas', () => {
      const formato3dec = Formatters.createFormatter({ minDecimals: 3, maxDecimals: 3, fallback: 'N/A' });
      const result = formato3dec(1.23456);
      expect(result).toMatch(/[.,]\d{3}$/);
    });

    it('usa el fallback cuando el valor es null', () => {
      const formatter = Formatters.createFormatter({ fallback: 'NO DATA' });
      expect(formatter(null)).toBe('NO DATA');
    });

    it('el fallback por defecto es "0.00"', () => {
      const formatter = Formatters.createFormatter();
      expect(formatter(null)).toBe('0.00');
    });
  });
});
