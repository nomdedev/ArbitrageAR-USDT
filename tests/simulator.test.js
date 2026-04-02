/**
 * Tests para Simulator
 *
 * El Simulator calcula escenarios de ganancia.
 * Los presets deben tener valores consistentes entre sí.
 * Las funciones DOM-heavy (loadDefaultValues, generateRiskMatrix)
 * fallan grácilmente cuando los elementos no existen.
 *
 * Patrón: IIFE que expone window.Simulator (jsdom).
 */

beforeAll(() => {
  globalThis.window.Logger = { debug: () => {} };
  require('../src/modules/simulator.js');
});

describe('Simulator', () => {
  let Sim;

  beforeAll(() => {
    Sim = globalThis.window?.Simulator;
    if (!Sim) throw new Error('Simulator no fue expuesto en window');
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Limpiar cualquier DOM insertado
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // PRESETS — estructura, contenido y valores
  // ============================================================
  describe('Presets', () => {
    it('retorna los 3 presets con estructura y valores correctos', () => {
      const presets = Sim.getPresets();

      // Estructura: existen los 3 presets
      expect(presets).toHaveProperty('conservative');
      expect(presets).toHaveProperty('moderate');
      expect(presets).toHaveProperty('aggressive');

      // Cada preset tiene todas las propiedades requeridas
      const requiredProps = ['name', 'description', 'buyFee', 'sellFee', 'transferFee', 'bankCommission', 'spreadMultiplier'];
      ['conservative', 'moderate', 'aggressive'].forEach(name => {
        const p = presets[name];
        requiredProps.forEach(prop => {
          expect(p).toHaveProperty(prop);
        });
      });

      // Valores: conservative tiene fees más altos que aggressive
      expect(presets.conservative.buyFee).toBeGreaterThan(presets.aggressive.buyFee);
      expect(presets.conservative.sellFee).toBeGreaterThan(presets.aggressive.sellFee);

      // Valores: spreadMultiplier > 1 en todos los presets
      Object.values(presets).forEach(p => {
        expect(p.spreadMultiplier).toBeGreaterThan(1);
      });

      // Nombre del preset moderate
      expect(presets.moderate.name).toBe('Moderado');

      // Alias Simulator.PRESETS coincide con getPresets()
      expect(Sim.PRESETS).toEqual(presets);
    });
  });

  // ============================================================
  // CALCULATE — applyPreset con y sin DOM
  // ============================================================
  describe('Calculate', () => {
    it('retorna false cuando no hay elementos DOM (sin calcular)', () => {
      // Sin DOM, cualquier preset retorna false
      expect(Sim.applyPreset('conservative')).toBe(false);
      expect(Sim.applyPreset('aggressive')).toBe(false);
      expect(Sim.applyPreset('inexistente')).toBe(false);
    });

    it('aplica preset correctamente cuando existe el DOM', () => {
      // Crear los elementos que applyPreset necesita
      document.body.innerHTML = `
        <input id="sim-usd-buy-price" />
        <input id="sim-usd-sell-price" />
        <input id="sim-buy-fee" />
        <input id="sim-sell-fee" />
        <input id="sim-transfer-fee-usd" />
        <input id="sim-bank-commission" />
      `;

      Sim.updateData({ oficial: { compra: 1000 } });

      // Aplicar preset moderate retorna true
      const resultModerate = Sim.applyPreset('moderate');
      expect(resultModerate).toBe(true);

      // Aplicar preset conservative y verificar valores
      Sim.applyPreset('conservative');
      const buyFee = document.getElementById('sim-buy-fee').value;
      expect(Number.parseFloat(buyFee)).toBe(1.5); // conservative.buyFee = 1.5

      // Aplicar preset aggressive y verificar valores
      Sim.applyPreset('aggressive');
      const sellFee = document.getElementById('sim-sell-fee').value;
      expect(Number.parseFloat(sellFee)).toBe(0.5); // aggressive.sellFee = 0.5

      // Verificar usd-sell-price = usdBuy * spreadMultiplier
      Sim.applyPreset('conservative'); // spreadMultiplier = 1.03
      const buy = Number.parseFloat(document.getElementById('sim-usd-buy-price').value);
      const sell = Number.parseFloat(document.getElementById('sim-usd-sell-price').value);
      expect(sell).toBeCloseTo(buy * 1.03, 1);
    });
  });

  // ============================================================
  // VALIDATE — updateData y updateSettings
  // ============================================================
  describe('Validate', () => {
    it('updateData y updateSettings aceptan null y objetos válidos sin lanzar errores', () => {
      // updateData con null
      expect(() => Sim.updateData(null)).not.toThrow();

      // updateData con objeto válido
      expect(() => Sim.updateData({ oficial: { compra: 1100 }, usdt: {} })).not.toThrow();

      // updateSettings con null
      expect(() => Sim.updateSettings(null)).not.toThrow();

      // updateSettings con objeto válido
      expect(() => Sim.updateSettings({ simulatorDefaultAmount: 500000 })).not.toThrow();
    });
  });

  // ============================================================
  // EDGE CASES — comportamiento con datos límite
  // ============================================================
  describe('Edge cases', () => {
    it('maneja preset inexistente sin lanzar errores', () => {
      // Sin DOM
      expect(Sim.applyPreset('inexistente')).toBe(false);

      // Con DOM
      document.body.innerHTML = `
        <input id="sim-usd-buy-price" />
        <input id="sim-usd-sell-price" />
        <input id="sim-buy-fee" />
        <input id="sim-sell-fee" />
        <input id="sim-transfer-fee-usd" />
        <input id="sim-bank-commission" />
      `;
      Sim.updateData({ oficial: { compra: 1000 } });
      expect(Sim.applyPreset('inexistente')).toBe(false);
    });

    it('maneja datos nulos o indefinidos sin lanzar errores', () => {
      // updateData con undefined
      expect(() => Sim.updateData(undefined)).not.toThrow();

      // updateSettings con undefined
      expect(() => Sim.updateSettings(undefined)).not.toThrow();

      // updateData con objeto vacío
      expect(() => Sim.updateData({})).not.toThrow();

      // updateSettings con objeto vacío
      expect(() => Sim.updateSettings({})).not.toThrow();
    });
  });
});