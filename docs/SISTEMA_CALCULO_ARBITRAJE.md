# 💰 SISTEMA DE CÁLCULO DE ARBITRAJE - ArbitrageAR-USDT

**Fecha:** 25 de Febrero de 2026  
**Nivel:** Intermedio  
**Objetivo:** Entender las matemáticas y lógica del cálculo de arbitraje

---

## 🎯 ¿QUÉ ES EL ARBITRAJE FINANCIERO?

El arbitraje financiero es una **estrategia de inversión** que busca obtener ganancias comprando y vendiendo el mismo activo en diferentes mercados donde los precios no están alineados.

**Concepto clave:** **Aprovechar ineficiencias del mercado**

**Analogía:** Piensa en un mercado de frutas:
- **Mercado A**: Manzanas a $10/kg
- **Mercado B**: Manzanas a $12/kg
- **Arbitraje**: Comprar en A ($10) y vender en B ($12) = $2 de ganancia por kg

---

## 📊 FUNDAMENTOS MATEMÁTICOS

### 1. **Porcentajes y Proporciones**

```javascript
// Cálculo de porcentaje de cambio
const calcularPorcentaje = (valorInicial, valorFinal) => {
  if (valorInicial === 0) return 0;
  
  const cambio = ((valorFinal - valorInicial) / valorInicial) * 100;
  return Number(cambio.toFixed(2));
};

// Cálculo de proporción
const calcularProporcion = (parte, total) => {
  if (total === 0) return 0;
  return parte / total;
};

// Ejemplos
console.log(calcularPorcentaje(100, 105)); // 5%
console.log(calcularProporcion(25, 100)); // 0.25 (25%)
```

### 2. **Interés Simple y Compuesto**

```javascript
// Interés simple (no capitalizado)
const calcularInteresSimple = (capital, tasa, tiempo) => {
  return capital * (tasa / 100) * tiempo;
};

// Interés compuesto
const calcularInteresCompuesto = (capital, tasa, tiempo, periodosPorAnio) => {
  const tasaPeriodica = tasa / 100 / periodosPorAnio;
  const montoFinal = capital * Math.pow(1 + tasaPeriodica, tiempo);
  return montoFinal - capital;
};

// Ejemplos
const capital = 1000;
const tasaAnual = 12; // 12% anual
const tiempo = 1; // 1 año

console.log(calcularInteresSimple(capital, tasaAnual, tiempo)); // 120
console.log(calcularInteresCompuesto(capital, tasaAnual, tiempo, 1)); // 120 (igual en este caso)
```

### 3. **Redondeo y Precisión**

```javascript
// Redondeo financiero (siempre hacia abajo)
const redondearFinanciero = (valor, decimales = 2) => {
  const factor = Math.pow(10, decimales);
  return Math.floor(valor * factor) / factor;
};

// Truncamiento vs redondeo
const truncar = (valor, decimales = 2) => {
  const factor = Math.pow(10, decimales);
  return Math.trunc(valor * factor) / factor;
};

// Ejemplos
const precio = 1050.6789;
console.log(redondearFinanciero(precio)); // 1050.67
console.log(truncar(precio)); // 1050.67
console.log(precio.toFixed(2)); // 1050.68 (redondeo estándar)
```

---

## 🧮 MOTOR DE CÁLCULO DE ARBITRAJE

### 1. **Estructura Básica del Cálculo**

```javascript
// Parámetros del cálculo
const parametrosArbitraje = {
  montoInicial: 1000000,        // $1,000,000 ARS
  precioCompra: 1050,           // $1,050 por USD
  precioVenta: 1080,            // $1,080 por USDT
  comisionTrading: 0.001,        // 0.1% por operación
  comisionBancaria: 0,           // 0% (configurable)
  comisionRetiro: 0.0005         // 0.05% por retiro
};

// Cálculo paso a paso
const calcularArbitrajeSimple = (params) => {
  const {
    montoInicial,
    precioCompra,
    precioVenta,
    comisionTrading,
    comisionBancaria,
    comisionRetiro
  } = params;
  
  // Paso 1: Comprar USD con ARS
  const usdObtenidos = montoInicial / precioCompra;
  console.log(`📈 Paso 1: ${montoInicial} ARS / ${precioCompra} = ${usdObtenidos} USD`);
  
  // Paso 2: Aplicar comisión bancaria
  const usdDespuesBanco = usdObtenidos * (1 - comisionBancaria);
  console.log(`🏦 Paso 2: ${usdObtenidos} USD * (1 - ${comisionBancaria}) = ${usdDespuesBanco} USD`);
  
  // Paso 3: Comprar USDT con USD
  const usdtComprados = usdDespuesBanco * (1 - comisionTrading);
  console.log(`💰 Paso 3: ${usdDespuesBanco} USD * (1 - ${comisionTrading}) = ${usdtComprados} USDT`);
  
  // Paso 4: Vender USDT por ARS
  const arsAntesRetiro = usdtComprados * precioVenta;
  console.log(`💵 Paso 4: ${usdtComprados} USDT * ${precioVenta} = ${arsAntesRetiro} ARS`);
  
  // Paso 5: Aplicar comisión de trading (venta)
  const arsDespuesTrading = arsAntesRetiro * (1 - comisionTrading);
  console.log(`📉 Paso 5: ${arsAntesRetiro} ARS * (1 - ${comisionTrading}) = ${arsDespuesTrading} ARS`);
  
  // Paso 6: Aplicar comisión de retiro
  const montoFinal = arsDespuesTrading * (1 - comisionRetiro);
  console.log(`🏧 Paso 6: ${arsDespuesTrading} ARS * (1 - ${comisionRetiro}) = ${montoFinal} ARS`);
  
  // Cálculo de resultados
  const gananciaBruta = montoFinal - montoInicial;
  const porcentajeGanancia = (gananciaBruta / montoInicial) * 100;
  const comisionTotal = montoInicial * (comisionTrading * 2 + comisionBancaria + comisionRetiro);
  
  return {
    montoInicial,
    montoFinal,
    gananciaBruta,
    porcentajeGanancia,
    comisionTotal,
    detallePasos: {
      usdObtenidos,
      usdDespuesBanco,
      usdtComprados,
      arsAntesRetiro,
      arsDespuesTrading,
      montoFinal
    }
  };
};

// Ejemplo de uso
const resultado = calcularArbitrajeSimple(parametrosArbitraje);
console.log('Resultado:', resultado);
/*
{
  montoInicial: 1000000,
  montoFinal: 1026416,
  gananciaBruta: 26416,
  porcentajeGanancia: 2.6416,
  comisionTotal: 2000,
  detallePasos: {
    usdObtenidos: 952.38,
    usdDespuesBanco: 952.38,
    usdtComprados: 951.43,
    arsAntesRetiro: 1027544,
    arsDespuesTrading: 1026416,
    montoFinal: 1026416
  }
}
*/
```

### 2. **Clase de Cálculo de Arbitraje**

```javascript
class ArbitrageCalculator {
  constructor(config = {}) {
    this.config = {
      comisionTradingPorDefecto: 0.001,    // 0.1%
      comisionBancariaPorDefecto: 0,    // 0%
      comisionRetiroPorDefecto: 0.0005,  // 0.05%
      minGananciaPorDefecto: -10,        // -10%
      ...config
    };
  }
  
  // Validar parámetros de entrada
  validarParametros(parametros) {
    const errores = [];
    
    if (!parametros.montoInicial || parametros.montoInicial <= 0) {
      errores.push('Monto inicial inválido');
    }
    
    if (!parametros.precioCompra || parametros.precioCompra <= 0) {
      errores.push('Precio de compra inválido');
    }
    
    if (!parametros.precioVenta || parametros.precioVenta <= 0) {
      errores.push('Precio de venta inválido');
    }
    
    if (parametros.precioVenta <= parametros.precioCompra) {
      errores.push('Precio de venta debe ser mayor al de compra');
    }
    
    return {
      isValid: errores.length === 0,
      errores
    };
  }
  
  // Calcular comisiones personalizadas
  calcularComisiones(monto, comisiones = {}) {
    const trading = comisiones.trading ?? this.config.comisionTradingPorDefecto;
    const bancaria = comisiones.bancaria ?? this.config.comisionBancariaPorDefecto;
    const retiro = comisiones.retiro ?? this.config.comisionRetiroPorDefecto;
    
    return {
      trading: monto * trading,
      bancaria: monto * bancaria,
      retiro: monto * retiro,
      total: monto * (trading + bancaria + retiro)
    };
  }
  
  // Cálculo principal de arbitraje
  calcular(parametros) {
    const validacion = this.validarParametros(parametros);
    if (!validacion.isValid) {
      throw new Error(`Parámetros inválidos: ${validacion.errores.join(', ')}`);
    }
    
    const comisiones = this.calcularComisiones(
      parametros.montoInicial,
      parametros.comisiones
    );
    
    // Cálculo de la ruta completa
    const ruta = this.calcularRutaCompleta(parametros, comisiones);
    
    // Validar rentabilidad
    const esRentable = ruta.porcentajeGanancia >= this.config.minGananciaPorDefecto;
    
    return {
      ...ruta,
      esRentable,
      comisiones,
      parametros
    };
  }
  
  // Cálculo detallado de la ruta
  calcularRutaCompleta(parametros, comisiones) {
    const { montoInicial, precioCompra, precioVenta } = parametros;
    
    // Paso 1: Compra de USD
    const usdObtenidos = montoInicial / precioCompra;
    
    // Paso 2: Aplicar comisión bancaria
    const usdDespuesBanco = usdObtenidos * (1 - comisiones.bancaria);
    
    // Paso 3: Compra de USDT
    const usdtComprados = usdDespuesBanco * (1 - comisiones.trading);
    
    // Paso 4: Venta de USDT
    const arsBrutos = usdtComprados * precioVenta;
    
    // Paso 5: Aplicar comision de trading
    const arsDespuesTrading = arsBrutos * (1 - comisiones.trading);
    
    // Paso 6: Aplicar comisión de retiro
    const montoFinal = arsDespuesTrading * (1 - comisiones.retiro);
    
    // Cálculos finales
    const gananciaNeta = montoFinal - montoInicial;
    const porcentajeGanancia = (gananciaNeta / montoInicial) * 100;
    
    return {
      montoInicial,
      montoFinal,
      gananciaNeta,
      porcentajeGanancia,
      comisiones,
      detalle: {
        usdObtenidos: usdObtenidos,
        usdDespuesBanco: usdDespuesBanco,
        usdtComprados: usdtComprados,
        arsBrutos,
        arsDespuesTrading,
        montoFinal
      }
    };
  }
}
```

---

## 🔄 CÁLCULOS AVANZADOS

### 1. **Arbitraje Multi-Exchange**

```javascript
// Comparar múltiples exchanges para encontrar la mejor oportunidad
const encontrarMejorOportunidad = (exchanges, montoInicial) => {
  const oportunidades = exchanges.map(exchange => {
    const resultado = calcularArbitrajeSimple({
      montoInicial,
      precioCompra: exchange.ask,    // Precio de compra USD
      precioVenta: exchange.bid,    // Precio de venta USDT
      comisiones: exchange.comisiones
    });
    
    return {
      exchange: exchange.exchange,
      ...resultado,
      spread: exchange.bid - exchange.ask
    };
  });
  
  // Filtrar solo oportunidades rentables
  const rentables = oportunidades.filter(opp => opp.porcentajeGanancia > 0);
  
  if (rentables.length === 0) {
    return null;
  }
  
  // Ordenar por mayor ganancia porcentual
  rentables.sort((a, b) => b.porcentajeGanancia - a.porcentajeGanancia);
  
  return rentables[0]; // La mejor oportunidad
};

// Uso
const exchanges = [
  {
    exchange: 'Buenbit',
    ask: 1050,    // Compra USD a $1,050
    bid: 1085,    // Venta USDT a $1,085
    comisiones: { trading: 0.001, bancaria: 0, retiro: 0.0005 }
  },
  {
    exchange: 'Lemon Cash',
    ask: 1052,    // Compra USD a $1,052
    bid: 1082,    // Venta USDT a $1,082
    comisiones: { trading: 0.0015, bancaria: 0, retiro: 0.001 }
  }
];

const mejorOportunidad = encontrarMejorOportunidad(exchanges, 1000000);
console.log('Mejor oportunidad:', mejorOportunidad);
```

### 2. **Cálculo de Punto de Equilibrio**

```javascript
// Calcular el punto donde no hay ganancia ni pérdida
const calcularPuntoEquilibrio = (precioCompra, comisiones) => {
  const comisionTotal = comisiones.trading + comisiones.bancaria + comisiones.retiro;
  
  // Precio de venta mínimo para no perder dinero
  const precioVentaMinimo = precioCompra * (1 + comisionTotal);
  
  return {
    precioVentaMinimo,
    comisionTotal,
    explicacion: `Para no perder dinero, el USDT debe venderse a mínimo $${precioVentaMinimo.toFixed(2)}`
  };
};

// Ejemplo
const puntoEquilibrio = calcularPuntoEquilibrio(1050, {
  trading: 0.001,
  bancaria: 0,
  retiro: 0.0005
});

console.log('Punto de equilibrio:', puntoEquilibrio);
/*
{
  precioVentaMinimo: 1051.58,
  comisionTotal: 0.0015,
  explicacion: "Para no perder dinero, el USDT debe venderse a mínimo $1051.58"
}
*/
```

### 3. **Sensibilidad a Precios**

```javascript
// Análisis de sensibilidad: cómo cambia la ganancia con pequeños cambios en precios
const analizarSensibilidad = (precioCompra, precioVenta, comisiones) => {
  const analisis = [];
  
  // Variar precio de compra en ±5%
  for (let delta = -0.05; delta <= 0.05; delta += 0.01) {
    const nuevoPrecioCompra = precioCompra * (1 + delta);
    const resultado = calcularArbitrajeSimple({
      montoInicial: 1000000,
      precioCompra: nuevoPrecioCompra,
      precioVenta,
      comisiones
    });
    
    analisis.push({
      variacionPrecio: `${(delta * 100).toFixed(1)}%`,
      precioCompra: nuevoPrecioCompra,
      ganancia: resultado.porcentajeGanancia,
      gananciaAbsoluta: resultado.gananciaNeta
    });
  }
  
  // Variar precio de venta en ±5%
  for (let delta = -0.05; delta <= 0.05; delta += 0.01) {
    const nuevoPrecioVenta = precioVenta * (1 + delta);
    const resultado = calcularArbitrajeSimple({
      montoInicial: 1000000,
      precioCompra,
      precioVenta: nuevoPrecioVenta,
      comisiones
    });
    
    analisis.push({
      variacionPrecio: `${(delta * 100).toFixed(1)}%`,
      precioVenta: nuevoPrecioVenta,
      ganancia: resultado.porcentajeGanancia,
      gananciaAbsoluta: resultado.gananciaNeta
    });
  }
  
  return analisis;
};

// Uso
const sensibilidad = analizarSensibilidad(1050, 1080, {
  trading: 0.001,
  bancaria: 0,
  retiro: 0.0005
});

console.table(sensibilidad);
```

---

## 📊 OPTIMIZACIÓN DE CÁLCULOS

### 1. **Memoización de Cálculos**

```javascript
// Cache para cálculos repetitivos
class CalculadoraCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  // Generar clave para el cache
  generarClave(parametros) {
    return JSON.stringify({
      montoInicial: parametros.montoInicial,
      precioCompra: parametros.precioCompra,
      precioVenta: parametros.precioVenta,
      comisiones: parametros.comisiones
    });
  }
  
  // Obtener del cache o calcular
  calcular(parametros) {
    const clave = this.generarClave(parametros);
    
    if (this.cache.has(clave)) {
      console.log('📦 Usando cálculo cacheado');
      return this.cache.get(clave);
    }
    
    // Calcular y guardar en cache
    const resultado = this.calcularInterno(parametros);
    this.guardarEnCache(clave, resultado);
    
    return resultado;
  }
  
  calcularInterno(parametros) {
    // Implementación del cálculo real
    return calcularArbitrajeSimple(parametros);
  }
  
  guardarEnCache(clave, resultado) {
    if (this.cache.size >= this.maxSize) {
      // Eliminar entrada más antigua
      const primeraClave = this.cache.keys().next().value;
      this.cache.delete(primeraClave);
    }
    
    this.cache.set(clave, resultado);
  }
}

// Uso
const calculadora = new CalculadoraCache();

// Primer cálculo (se calcula y guarda)
const resultado1 = calculadora.calcular({
  montoInicial: 1000000,
  precioCompra: 1050,
  precioVenta: 1080
});

// Segundo cálculo (usa cache)
const resultado2 = calculadora.calcular({
  montoInicial: 1000000,
  precioCompra: 1050,
  precioVenta: 1080
});
```

### 2. **Cálculo en Lote (Batch Processing)**

```javascript
// Procesar múltiples cálculos en paralelo
class BatchCalculator {
  constructor(maxConcurrente = 10) {
    this.maxConcurrente = maxConcurrente;
    this.cola = [];
    this.procesando = false;
  }
  
  async agregarCalculo(parametros) {
    return new Promise((resolve, reject) => {
      this.cola.push({ parametros, resolve, reject });
      
      if (!this.procesando) {
        this.procesarCola();
      }
    });
  }
  
  async procesarCola() {
    if (this.procesando || this.cola.length === 0) {
      return;
    }
    
    this.procesando = true;
    
    // Procesar en lotes
    while (this.cola.length > 0) {
      const lote = this.cola.splice(0, this.maxConcurrente);
      
      try {
        const resultados = await Promise.all(
          lote.map(item => 
            this.calcularInterno(item.parametros)
          )
        );
        
        // Resolver promesas del lote
        lote.forEach(item => item.resolve(resultados.shift()));
        
      } catch (error) {
        // Rechazar todas las promesas del lote
        lote.forEach(item => item.reject(error));
      }
    }
    
    this.procesando = false;
  }
  
  calcularInterno(parametros) {
    return calcularArbitrajeSimple(parametros);
  }
}

// Uso
const batchCalc = new BatchCalculator();

// Agregar múltiples cálculos
const promesas = [
  batchCalc.agregarCalculo({ montoInicial: 1000000, precioCompra: 1050, precioVenta: 1080 }),
  batchCalc.agregarCalculo({ montoInicial: 2000000, precioCompra: 1050, precioVenta: 1080 }),
  batchCalc.agregarCalculo({ montoInicial: 500000, precioCompra: 1050, precioVenta: 1080 })
];

// Esperar todos los resultados
const resultados = await Promise.all(promesas);
```

---

## 🧪 EJERCICIOS PRÁCTICOS

### Ejercicio 1: Calculadora de Arbitraje Básica

**Objetivo:** Implementar una calculadora simple de arbitraje.

```javascript
// calculadora-ejercicio.js
class CalculadoraArbitraje {
  constructor() {
    this.comisionesPorDefecto = {
      trading: 0.001,    // 0.1%
      bancaria: 0,       // 0%
      retiro: 0.0005      // 0.05%
    };
  }
  
  // Método principal
  calcular(montoInicial, precioCompra, precioVenta, comisionesPersonalizadas = {}) {
    // Combinar comisiones por defecto con personalizadas
    const comisiones = {
      trading: comisionesPersonalizadas.trading ?? this.comisionesPorDefecto.trading,
      bancaria: comisionesPersonalizadas.bancaria ?? this.comisionesPorDefecto.bancaria,
      retiro: comisionesPersonalizadas.retiro ?? this.comisionesPorDefecto.retiro
    };
    
    // Validar parámetros
    if (montoInicial <= 0 || precioCompra <= 0 || precioVenta <= 0) {
      throw new Error('Parámetros inválidos');
    }
    
    if (precioVenta <= precioCompra) {
      throw new Error('Precio de venta debe ser mayor al de compra');
    }
    
    // Implementar el cálculo
    const usdObtenidos = montoInicial / precioCompra;
    const usdDespuesBanco = usdObtenidos * (1 - comisiones.bancaria);
    const usdtComprados = usdDespuesBanco * (1 - comisiones.trading);
    const arsBrutos = usdtComprados * precioVenta;
    const arsDespuesTrading = arsBrutos * (1 - comisiones.trading);
    const montoFinal = arsDespuesTrading * (1 - comisiones.retiro);
    
    const gananciaNeta = montoFinal - montoInicial;
    const porcentajeGanancia = (gananciaNeta / montoInicial) * 100;
    
    return {
      montoInicial,
      montoFinal,
      gananciaNeta,
      porcentajeGanancia,
      comisiones,
      detalle: {
        usdObtenidos: usdObtenidos,
        usdtComprados: usdtComprados,
        arsBrutos: arsBrutos,
        arsDespuesTrading: arsDespuesTrading,
        montoFinal
      }
    };
  }
}

// Uso
const calculadora = new CalculadoraArbitraje();

try {
  const resultado = calculadora.calcular(
    1000000,  // $1,000,000 ARS
    1050,      // $1,050 por USD
    1080,      // $1,080 por USDT
    { trading: 0.0015 } // 0.15% trading
  );
  
  console.log('✅ Resultado del arbitraje:');
  console.log(`Monto inicial: $${resultado.montoInicial.toLocaleString()}`);
  console.log(`Monto final: $${resultado.montoFinal.toLocaleString()}`);
  console.log(`Ganancia neta: $${resultado.gananciaNeta.toLocaleString()} (${resultado.porcentajeGanancia.toFixed(2)}%)`);
  console.log(`Comisiones totales: $${resultado.comisiones.total.toLocaleString()}`);
  
} catch (error) {
  console.error('❌ Error en cálculo:', error.message);
}
```

### Ejercicio 2: Comparador de Oportunidades

**Objetivo:** Crear un sistema que compare múltiples oportunidades.

```javascript
// comparador-oportunidades.js
class ComparadorOportunidades {
  constructor() {
    this.oportunidades = [];
  }
  
  agregarOportunidad(exchange, datos) {
    this.oportunidades.push({
      exchange,
      ...datos,
      timestamp: Date.now()
    });
  }
  
  encontrarMejores(criterio = 'ganancia') {
    let oportunidadesOrdenadas = [...this.oportunidades];
    
    switch (criterio) {
      case 'ganancia':
        oportunidadesOrdenadas.sort((a, b) => b.porcentajeGanancia - a.porcentajeGanancia);
        break;
        
      case 'spread':
        oportunidadesOrdenadas.sort((a, b) => b.spread - a.spread);
        break;
        
      case 'rentabilidad':
        oportunidadesOrdenadas.sort((a, b) => {
          // Priorizar por ganancia, luego por monto mínimo
          if (b.porcentajeGanancia !== a.porcentajeGanancia) {
            return b.porcentajeGanancia - a.porcentajeGanancia;
          }
          return b.montoInicial - a.montoInicial;
        });
        break;
        
      default:
        return this.oportunidades;
    }
    
    return oportunidadesOrdenadas.slice(0, 5); // Top 5
  }
  
  analizarSensibilidad() {
    const analisis = {
      preciosCompra: [],
      preciosVenta: [],
      ganancias: []
    };
    
    this.oportunidades.forEach(opp => {
      analisis.preciosCompra.push(opp.precioCompra);
      analisis.preciosVenta.push(opp.precioVenta);
      analisis.ganancias.push(opp.porcentajeGanancia);
    });
    
    return {
      precioCompraPromedio: analisis.preciosCompra.reduce((a, b) => a + b, 0) / analisis.preciosCompra.length,
      precioVentaPromedio: analisis.preciosVenta.reduce((a, b) => a + b, 0) / analisis.preciosVenta.length,
      gananciaPromedio: analisis.ganancias.reduce((a, b) => a + b, 0) / analisis.ganancias.length,
      gananciaMaxima: Math.max(...analisis.ganancias),
      gananciaMinima: Math.min(...analisis.ganancias)
    };
  }
}

// Uso
const comparador = new ComparadorOportunidades();

// Agregar oportunidades de ejemplo
comparador.agregarOportunidad('Buenbit', {
  precioCompra: 1050,
  precioVenta: 1085,
  porcentajeGanancia: 2.8,
  montoInicial: 1000000
});

comparador.agregarOportunidad('Lemon', {
  precioCompra: 1052,
  precioVenta: 1082,
  porcentajeGanancia: 2.3,
  montoInicial: 1000000
});

comparador.agregarOportunidad('Ripio', {
  precioCompra: 1051,
  precioVenta: 1083,
  porcentajeGanancia: 2.6,
  montoInicial: 1000000
});

console.log('Mejores por ganancia:', comparador.encontrarMejores('ganancia'));
console.log('Análisis de sensibilidad:', comparador.analizarSensibilidad());
```

---

## 📋 RESUMEN DEL MÓDULO

### ✅ Conceptos Aprendidos

1. **Matemáticas Financieras**: Porcentajes, interés, redondeo
2. **Motor de Cálculo**: Clase reutilizable con validación
3. **Arbitraje Multi-Exchange**: Comparación de múltiples oportunidades
4. **Punto de Equilibrio**: Cálculo del umbral de rentabilidad
5. **Sensibilidad**: Análisis de variaciones de precios
6. **Optimización**: Memoización y procesamiento en lote

### 🎯 Próximos Pasos

En el siguiente módulo vamos a ver:
- **Interfaz de Usuario**: Manipulación avanzada del DOM
- **Estado y Almacenamiento**: Chrome Storage y state management
- **Buenas Prácticas**: Patrones de diseño y arquitectura

---

**¿Listo para continuar con la interfaz de usuario y manipulación del DOM?**