---
skillName: testing-guide
description: Agente especializado en testing del proyecto
tags: [testing, jest, playwright, e2e]
---

# Testing Guide Skill

## Descripción
Agente especializado en testing del proyecto ArbitrageAR-USDT.

## Capacidades

### Jest - Tests Unitarios
- Tests de módulos individuales
- Mocks de Chrome APIs
- Coverage reports
- Watch mode para desarrollo

### Playwright - Tests E2E
- Tests de extensión cargada
- Interacción con popup
- Tests de UI completa
- Screenshots y videos

### Componentes a Testear
- `src/background/arbitrageCalculator.js`
- `src/modules/*` (todos los módulos)
- `src/utils/*` (utilidades)
- `src/background/apiClient.js`

### Setup Jest
```javascript
// jest.setup.js
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  alarms: {
    create: jest.fn(),
    onAlarm: {
      addListener: jest.fn()
    }
  }
};
```

### Ejemplo Test Unitario
```javascript
// tests/arbitrageCalculator.test.js
describe('ArbitrageCalculator', () => {
  test('should calculate simple arbitrage', () => {
    const result = calculateArbitrage({
      initialAmount: 1000000,
      dollarBuyPrice: 1050,
      usdtSellPrice: 1200
    });

    expect(result.profitPercentage).toBeGreaterThan(0);
    expect(result.profit).toBeGreaterThan(0);
  });

  test('should handle zero fees', () => {
    const result = calculateArbitrage({
      initialAmount: 1000,
      fees: { trading: 0, bank: 0 }
    });

    expect(result.finalAmount).toBeDefined();
  });
});
```

### Ejemplo Test E2E (Playwright)
```javascript
// tests/e2e/popup.spec.js
test('popup displays routes', async ({ page, extensionId }) => {
  // Abrir popup
  await page.goto(`chrome-extension://${extensionId}/src/popup.html`);

  // Verificar que hay rutas
  await expect(page.locator('.route-card')).toHaveCountGreaterThan(0);

  // Click en una ruta
  await page.click('.route-card:first-child');

  // Verificar modal abierto
  await expect(page.locator('.modal')).toBeVisible();
});
```

### Comandos de Testing
```bash
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage
npm run test:e2e          # E2E tests
npm run test:e2e:ui       # E2E con UI
```

### Coverage Targets
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

### Instrucciones de Uso

1. **Nuevo test unitario**: Crear en `tests/` con `.test.js`
2. **Nuevo test E2E**: Crear en `tests/e2e/` con `.spec.js`
3. **Mock Chrome API**: Usar jest.setup.js global
4. **Debug test**: Usar `test:watch` o Playwright UI

---

## Notas Importantes

- Mock todas las Chrome APIs antes de testear
- No depender de APIs externas en tests
- Usar datos mockeados consistentes
- Coverage mínimo 80%