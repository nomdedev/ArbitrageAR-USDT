/**
 * Tests para Formatters
 *
 * Las funciones de formateo afectan todo lo que ve el usuario:
 * precios, porcentajes, timestamps, nombres de exchanges.
 * Bugs aqui son errores visuales directos en la UI.
 *
 * formatters.js exporta via module.exports cuando module !== undefined,
 * por lo que se puede importar directamente con require().
 */

const Formatters = require('../src/utils/formatters.js');

describe('formatters', () => {

  // ============================================================
  // formatNumber — numero generico con 2 decimales
  // ============================================================
  describe('formatNumber', () => {
    it('formatea valores validos (enteros, decimales, negativos, grandes)', () => {
      // Entero con separador de miles
      const entero = Formatters.formatNumber(1000);
      expect(entero).toMatch(/1[.,]000[.,]00/);

      // Decimal
      const decimal = Formatters.formatNumber(1234.56);
      expect(decimal).toContain('1.234');
      expect(decimal).toContain('56');

      // Negativo
      const negativo = Formatters.formatNumber(-500);
      expect(negativo).toContain('500');
      expect(negativo).toContain('-');

      // Numero grande con separadores de miles
      const grande = Formatters.formatNumber(1500000);
      expect(grande.length).toBeGreaterThan(7); // "1500000" -> "1.500.000,00"
    });

    it('retorna "0.00" para valores invalidos (null, undefined, NaN)', () => {
      expect(Formatters.formatNumber(null)).toBe('0.00');
      expect(Formatters.formatNumber(undefined)).toBe('0.00');
      expect(Formatters.formatNumber(NaN)).toBe('0.00');
    });
  });

  // ============================================================
  // formatARS — monto en pesos argentinos con simbolo $
  // ============================================================
  describe('formatARS', () => {
    it('formatea montos en ARS con simbolo $ y maneja valores invalidos', () => {
      // Monto valido
      const valido = Formatters.formatARS(1050.50);
      expect(valido).toMatch(/^\$/);
      expect(valido).toContain('1');

      // Valores invalidos retornan "$0.00"
      expect(Formatters.formatARS(null)).toBe('$0.00');
      expect(Formatters.formatARS(undefined)).toBe('$0.00');
      expect(Formatters.formatARS(NaN)).toBe('$0.00');
    });
  });

  // ============================================================
  // formatUSD — monto en dolares con simbolo U$D
  // ============================================================
  describe('formatUSD', () => {
    it('formatea montos en USD con simbolo U$D y maneja valores invalidos', () => {
      // Monto valido
      expect(Formatters.formatUSD(100)).toMatch(/^U\$D/);

      // Valores invalidos retornan "U$D 0.00"
      expect(Formatters.formatUSD(null)).toBe('U$D 0.00');
      expect(Formatters.formatUSD(undefined)).toBe('U$D 0.00');
    });
  });

  // ============================================================
  // formatProfitPercent — porcentaje de ganancia con signo
  // ============================================================
  describe('formatProfitPercent', () => {
    it('agrega signo + a ganancias, mantiene signo - en perdidas, maneja invalidos', () => {
      // Ganancia positiva
      const positivo = Formatters.formatProfitPercent(3.5);
      expect(positivo).toMatch(/^\+/);
      expect(positivo).toContain('%');

      // Perdida negativa
      const negativo = Formatters.formatProfitPercent(-2.5);
      expect(negativo).toContain('-');
      expect(negativo).toContain('%');
      expect(negativo).not.toMatch(/^\+/);

      // Cero
      const cero = Formatters.formatProfitPercent(0);
      expect(cero).toContain('%');

      // Valores invalidos retornan "0.00%"
      expect(Formatters.formatProfitPercent(null)).toBe('0.00%');
      expect(Formatters.formatProfitPercent(undefined)).toBe('0.00%');
      expect(Formatters.formatProfitPercent(NaN)).toBe('0.00%');
    });
  });

  // ============================================================
  // formatPercent — porcentaje generico (sin signo automatico)
  // ============================================================
  describe('formatPercent', () => {
    it('formatea porcentaje generico y maneja valores invalidos', () => {
      // Valor valido
      const resultado = Formatters.formatPercent(5);
      expect(resultado).toMatch(/5[.,]00/);

      // Valor invalido
      expect(Formatters.formatPercent(null)).toBe('0.00');
    });
  });

  // ============================================================
  // formatUsdUsdtRatio — ratio con 3 decimales
  // ============================================================
  describe('formatUsdUsdtRatio', () => {
    it('formatea ratio con 3 decimales y maneja valores invalidos', () => {
      // Valor valido
      const resultado = Formatters.formatUsdUsdtRatio(1.0234);
      expect(resultado).toMatch(/[.,]\d{3}$/);

      // Valor invalido
      expect(Formatters.formatUsdUsdtRatio(null)).toBe('N/D');
    });
  });

  // ============================================================
  // getDollarSourceDisplay — descripcion legible de la fuente
  // ============================================================
  describe('getDollarSourceDisplay', () => {
    it('retorna descripcion correcta para cada tipo de fuente', () => {
      // Sin fuente (null, undefined, objeto vacio)
      expect(Formatters.getDollarSourceDisplay(null)).toBe('N/A');
      expect(Formatters.getDollarSourceDisplay(undefined)).toBe('N/A');
      expect(Formatters.getDollarSourceDisplay({})).toBe('N/A');

      // Fuente manual
      expect(Formatters.getDollarSourceDisplay({ source: 'manual' })).toContain('Manual');

      // DolarAPI
      expect(Formatters.getDollarSourceDisplay({ source: 'dolarapi_oficial' })).toContain('DolarAPI');

      // CriptoYa banks con banksCount
      const banksResult = Formatters.getDollarSourceDisplay({
        source: 'criptoya_banks',
        method: 'consenso',
        banksCount: 5
      });
      expect(banksResult).toContain('Bancos');
      expect(banksResult).toContain('consenso');

      // Fallback hardcoded
      expect(Formatters.getDollarSourceDisplay({ source: 'hardcoded_fallback' })).toContain('Fallback');

      // Fuente no mapeada
      expect(Formatters.getDollarSourceDisplay({ source: 'fuente_desconocida' })).toBe('fuente_desconocida');
    });
  });

  // ============================================================
  // formatTimeAgo — tiempo relativo en espanol
  // ============================================================
  describe('formatTimeAgo', () => {
    it('formatea tiempo relativo correctamente para todos los rangos', () => {
      const now = Date.now();

      // Sin datos
      expect(Formatters.formatTimeAgo(null)).toBe('Sin datos');
      expect(Formatters.formatTimeAgo(undefined)).toBe('Sin datos');

      // Muy reciente (< 1 min)
      expect(Formatters.formatTimeAgo(now - 30000)).toBe('Hace un momento');

      // 1 minuto
      expect(Formatters.formatTimeAgo(now - 65000)).toBe('Hace 1 minuto');

      // N minutos
      expect(Formatters.formatTimeAgo(now - (3 * 60 * 1000 + 5000))).toContain('3 minutos');

      // 1 hora
      expect(Formatters.formatTimeAgo(now - (61 * 60 * 1000))).toBe('Hace 1 hora');

      // N horas
      expect(Formatters.formatTimeAgo(now - (2 * 60 * 60 * 1000 + 5000))).toContain('2 horas');

      // Mas de un dia
      expect(Formatters.formatTimeAgo(now - (25 * 60 * 60 * 1000))).toBe('Hace más de un día');
    });
  });

  // ============================================================
  // formatExchangeName — nombres amigables de exchanges
  // ============================================================
  describe('formatExchangeName', () => {
    it('formatea nombres de exchanges conocidos y maneja invalidos', () => {
      // Valores invalidos
      expect(Formatters.formatExchangeName(null)).toBe('Desconocido');
      expect(Formatters.formatExchangeName(undefined)).toBe('Desconocido');
      expect(Formatters.formatExchangeName('')).toBe('Desconocido');

      // Exchanges conocidos
      expect(Formatters.formatExchangeName('binance')).toBe('Binance');
      expect(Formatters.formatExchangeName('binancep2p')).toBe('Binance P2P');
      expect(Formatters.formatExchangeName('buenbit')).toBe('Buenbit');

      // Case-insensitive
      expect(Formatters.formatExchangeName('BINANCE')).toBe('Binance');

      // Exchange no mapeado
      expect(Formatters.formatExchangeName('exchange_nuevo')).toBe('exchange_nuevo');
    });
  });

  // ============================================================
  // createFormatter — factory de formateadores personalizados
  // ============================================================
  describe('createFormatter', () => {
    it('crea formateador con opciones personalizadas y fallback', () => {
      // Formateador con 3 decimales
      const formato3dec = Formatters.createFormatter({ minDecimals: 3, maxDecimals: 3, fallback: 'N/A' });
      expect(formato3dec(1.23456)).toMatch(/[.,]\d{3}$/);

      // Fallback personalizado
      const conFallback = Formatters.createFormatter({ fallback: 'NO DATA' });
      expect(conFallback(null)).toBe('NO DATA');

      // Fallback por defecto
      const porDefecto = Formatters.createFormatter();
      expect(porDefecto(null)).toBe('0.00');
    });
  });
});