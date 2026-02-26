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
  // PRESETS — estructura y contenido
  // ============================================================
  describe('getPresets', () => {
    it('retorna objeto con los 3 presets', () => {
      const presets = Sim.getPresets();
      expect(presets).toHaveProperty('conservative');
      expect(presets).toHaveProperty('moderate');
      expect(presets).toHaveProperty('aggressive');
    });

    it('cada preset tiene las propiedades requeridas', () => {
      const presets = Sim.getPresets();
      ['conservative', 'moderate', 'aggressive'].forEach(name => {
        const p = presets[name];
        expect(p).toHaveProperty('name');
        expect(p).toHaveProperty('description');
        expect(p).toHaveProperty('buyFee');
        expect(p).toHaveProperty('sellFee');
        expect(p).toHaveProperty('transferFee');
        expect(p).toHaveProperty('bankCommission');
        expect(p).toHaveProperty('spreadMultiplier');
      });
    });

    it('conservative tiene fees más altos que aggressive', () => {
      const p = Sim.getPresets();
      expect(p.conservative.buyFee).toBeGreaterThan(p.aggressive.buyFee);
      expect(p.conservative.sellFee).toBeGreaterThan(p.aggressive.sellFee);
    });

    it('spreadMultiplier > 1 en todos los presets', () => {
      const presets = Sim.getPresets();
      Object.values(presets).forEach(p => {
        expect(p.spreadMultiplier).toBeGreaterThan(1);
      });
    });

    it('moderate es del tipo Moderado', () => {
      expect(Sim.getPresets().moderate.name).toBe('Moderado');
    });
  });

  // ============================================================
  // applyPreset — sin DOM retorna false
  // ============================================================
  describe('applyPreset — sin elementos DOM', () => {
    it('retorna false para preset conocido pero sin elementos DOM', () => {
      const result = Sim.applyPreset('conservative');
      expect(result).toBe(false);
    });

    it('retorna false para preset conocido "aggressive"', () => {
      expect(Sim.applyPreset('aggressive')).toBe(false);
    });

    it('retorna false para preset desconocido', () => {
      expect(Sim.applyPreset('inexistente')).toBe(false);
    });
  });

  // ============================================================
  // applyPreset — con DOM completo retorna true
  // ============================================================
  describe('applyPreset — con elementos DOM', () => {
    beforeEach(() => {
      // Crear los elementos que applyPreset necesita
      document.body.innerHTML = `
        <input id="sim-usd-buy-price" />
        <input id="sim-usd-sell-price" />
        <input id="sim-buy-fee" />
        <input id="sim-sell-fee" />
        <input id="sim-transfer-fee-usd" />
        <input id="sim-bank-commission" />
      `;
    });

    it('retorna true para preset "moderate" con DOM completo', () => {
      Sim.updateData({ oficial: { compra: 1000 } });
      const result = Sim.applyPreset('moderate');
      expect(result).toBe(true);
    });

    it('aplica los valores del preset "conservative" al DOM', () => {
      Sim.updateData({ oficial: { compra: 1000 } });
      Sim.applyPreset('conservative');
      const buyFee = document.getElementById('sim-buy-fee').value;
      expect(Number.parseFloat(buyFee)).toBe(1.5); // conservative.buyFee = 1.5
    });

    it('aplica los valores del preset "aggressive" al DOM', () => {
      Sim.updateData({ oficial: { compra: 1000 } });
      Sim.applyPreset('aggressive');
      const sellFee = document.getElementById('sim-sell-fee').value;
      expect(Number.parseFloat(sellFee)).toBe(0.5); // aggressive.sellFee = 0.5
    });

    it('usd-sell-price = usdBuy * spreadMultiplier', () => {
      Sim.updateData({ oficial: { compra: 1000 } });
      Sim.applyPreset('conservative'); // spreadMultiplier = 1.03
      const buy = Number.parseFloat(document.getElementById('sim-usd-buy-price').value);
      const sell = Number.parseFloat(document.getElementById('sim-usd-sell-price').value);
      expect(sell).toBeCloseTo(buy * 1.03, 1);
    });
  });

  // ============================================================
  // updateData / updateSettings — no lanzan
  // ============================================================
  describe('updateData / updateSettings', () => {
    it('updateData acepta null sin lanzar', () => {
      expect(() => Sim.updateData(null)).not.toThrow();
    });

    it('updateData acepta objeto con campos de datos', () => {
      expect(() => Sim.updateData({ oficial: { compra: 1100 }, usdt: {} })).not.toThrow();
    });

    it('updateSettings acepta null sin lanzar', () => {
      expect(() => Sim.updateSettings(null)).not.toThrow();
    });

    it('updateSettings acepta objeto de configuración', () => {
      expect(() => Sim.updateSettings({ simulatorDefaultAmount: 500000 })).not.toThrow();
    });
  });

  // ============================================================
  // PRESETS — objeto expuesto (alias Simulator.PRESETS)
  // ============================================================
  describe('Simulator.PRESETS', () => {
    it('Simulator.PRESETS coincide con getPresets()', () => {
      expect(Sim.PRESETS).toEqual(Sim.getPresets());
    });
  });
});
