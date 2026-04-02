---
skillName: arbitrage-dev
description: Agente especializado en desarrollo del sistema de arbitraje
tags: [arbitrage, calculation, finance, core]
---

# Arbitrage Development Skill

## Descripción
Agente especializado en el desarrollo y mantenimiento del sistema de cálculo de arbitraje.

## Capacidades

### Motor de Cálculo
- Implementar nuevos algoritmos de arbitraje
- Optimizar cálculos existentes
- Añadir nuevas rutas de arbitraje
- Calcular fees y comisiones

### Componentes Clave
- `src/background/arbitrageCalculator.js`: Motor principal
- `src/modules/simulator.js`: Calculadora interactiva
- `src/modules/routeManager.js`: Gestión de rutas

### Patrones a Seguir

```javascript
// Patrón Strategy para cálculos
const ArbitrageCalculator = (() => {
  const strategies = {
    simple: (params) => calculateSimple(params),
    advanced: (params) => calculateAdvanced(params),
    withFees: (params) => calculateWithFees(params)
  };

  return {
    calculate: (type, params) => strategies[type](params)
  };
})();
```

### Ruta de Arbitraje Base
```
ARS → USD (banco oficial) → USDT → ARS (exchange)
```

### Fees a Considerar
- Trading fee: 0.1% default
- Withdrawal fee: 0.05% default
- Bank commission: configurable
- Transfer fee: configurable

### Instrucciones de Uso

1. **Nueva ruta**: Añadir al arbitrageCalculator con validación
2. **Nuevo fee**: Añadir parámetro y aplicar en cálculo
3. **Optimización**: Usar memoización para cálculos repetitivos
4. **Testing**: Jest con casos edge (montos extremos, fees 0)

### Ejemplos de Tareas

- "Añadir arbitraje con ETH"
- "Optimizar cálculo para montos grandes"
- "Implementar fee dinámico por exchange"
- "Añadir cálculo de tiempo estimado"

---

## Notas Importantes

- Siempre validar inputs antes de calcular
- Usar parseFloat con validación NaN
- Considerar límites de compra USD (200 USD/mes)
- Manejar casos de spread negativo