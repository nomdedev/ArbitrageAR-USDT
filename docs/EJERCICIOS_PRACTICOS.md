# 🧪 EJERCICIOS PRÁCTICOS - Aprendizaje con ArbitrageAR-USDT

**Fecha:** 25 de Febrero de 2026  
**Nivel:** Intermedio  
**Objetivo:** Aprender programación modificando la extensión ArbitrageAR

---

## 🎯 PLAN DE EJERCICIOS

Vamos a crear ejercicios progresivos que te enseñen a programar mientras modificas una extensión real. Cada ejercicio se basa en el código existente de ArbitrageAR.

---

## 📋 EJERCICIO 1: MI PRIMERA EXTENSIÓN MEJORADA

**Objetivo:** Modificar el popup para agregar una nueva funcionalidad.

### Paso 1: Analizar el Código Existente

Primero, vamos a examinar cómo está estructurado el popup actual:

```javascript
// En popup.js - Buscar dónde se muestran las rutas
function encontrarContenedorRutas() {
  // Buscar diferentes selectores posibles
  const selectores = [
    '#optimized-routes',
    '.route-card',
    '[data-exchange]'
  ];
  
  for (const selector of selectores) {
    const elemento = document.querySelector(selector);
    if (elemento) {
      console.log(`✅ Encontrado contenedor con selector: ${selector}`);
      return elemento;
    }
  }
  
  console.warn('⚠️ Contenedor de rutas no encontrado');
  return null;
}
```

### Paso 2: Agregar Nueva Funcionalidad

Vamos a agregar un botón que muestre estadísticas simples de las rutas:

```javascript
// Agregar al final de displayOptimizedRoutes en popup.js
function mostrarEstadisticas(rutas) {
  if (!rutas || rutas.length === 0) {
    return '<p>No hay rutas para mostrar estadísticas</p>';
  }
  
  const totalRutas = rutas.length;
  const rutasRentables = rutas.filter(r => r.profitPercentage > 0).length;
  const rutasConPerdida = totalRutas - rutasRentables;
  const gananciaPromedio = rutas
    .filter(r => r.profitPercentage > 0)
    .reduce((sum, r) => sum + r.profitPercentage, 0) / rutasRentables, 0);
  
  const mejorRuta = rutas.reduce((mejor, actual) => 
    actual.profitPercentage > mejor.profitPercentage ? actual : mejor
  );
  
  return `
    <div class="estadisticas-panel">
      <h3>📊 Estadísticas de Rutas</h3>
      <div class="estadistica-item">
        <span class="label">Total de rutas:</span>
        <span class="valor">${totalRutas}</span>
      </div>
      <div class="estadistica-item">
        <span class="label">Rentables:</span>
        <span class="valor rentable">${rutasRentables}</span>
      </div>
      <div class="estadistica-item">
        <span class="label">Con pérdida:</span>
        <span class="valor loss">${rutasConPerdida}</span>
      </div>
      <div class="estadistica-item">
        <span class="label">Ganancia promedio:</span>
        <span class="valor">${gananciaPromedio.toFixed(2)}%</span>
      </div>
      <div class="estadistica-item">
        <span class="label">Mejor oportunidad:</span>
        <span class="valor">${mejorRuta.exchange} (${mejorRuta.profitPercentage.toFixed(2)}%)</span>
      </div>
      <button class="btn-estadisticas" onclick="this.toggleEstadisticas()">
        ${mostrarEstadisticas ? 'Ocultar' : 'Mostrar'} Estadísticas
      </button>
    </div>
  `;
}

// Modificar displayOptimizedRoutes para incluir estadísticas
function displayOptimizedRoutesConEstadisticas(routes) {
  const routesHTML = routes.map(route => createRouteCard(route)).join('');
  const estadisticasHTML = mostrarEstadisticas(routes);
  
  const container = document.getElementById('optimized-routes');
  container.innerHTML = `
    <div class="routes-with-stats">
      <div class="stats-section">
        ${estadisticasHTML}
      </div>
      <div class="routes-section">
        ${routesHTML}
      </div>
    </div>
  `;
}

// Variable global para controlar visibilidad
let mostrarEstadisticas = false;

// Función para alternar estadísticas
function toggleEstadisticas() {
  mostrarEstadisticas = !mostrarEstadisticas;
  
  // Actualizar el texto del botón
  const btnEstadisticas = document.querySelector('.btn-estadisticas');
  btnEstadisticas.textContent = mostrarEstadisticas ? 'Ocultar' : 'Mostrar';
  
  // Refrescar la vista
  const container = document.getElementById('optimized-routes');
  if (container) {
    displayOptimizedRoutesConEstadisticas(currentData.optimizedRoutes);
  }
}
```

### Paso 3: Implementar en el Código Real

**Instrucciones:**
1. Abre `src/popup.js`
2. Busca la función `displayOptimizedRoutes`
3. Reemplaza el contenido existente con la nueva versión que incluye estadísticas
4. Agrega el manejador de eventos para el botón de estadísticas
5. Prueba la funcionalidad

### Código para Modificar:

```javascript
// Reemplazar la función existente en popup.js
const displayOptimizedRoutesOriginal = displayOptimizedRoutes;

// Nueva función con estadísticas
function displayOptimizedRoutes(routes, _official) {
  // Código existente para mostrar rutas...
  const container = document.getElementById('optimized-routes');
  
  if (!routes || routes.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <h3>📊 Estado del Mercado</h3>
        <p>No se encontraron oportunidades rentables en este momento.</p>
        <div class="reasons-list">
          <div class="reason-item">
            <span>🎯</span>
            <span>Umbral muy alto</span>
          </div>
          <div class="reason-item">
            <span>🏦</span>
            <span>Exchanges limitados</span>
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  // Generar HTML de estadísticas
  const statsHTML = generarEstadisticasHTML(routes);
  
  // Combinar rutas y estadísticas
  container.innerHTML = `
    <div class="routes-with-stats">
      <div class="stats-section">
        ${statsHTML}
      </div>
      <div class="routes-section">
        ${routes.map(route => createRouteCard(route)).join('')}
      </div>
    </div>
  `;
  
  // Agregar evento al botón de estadísticas
  const btnEstadisticas = document.querySelector('.btn-estadisticas');
  if (btnEstadisticas) {
    btnEstadisticas.addEventListener('click', toggleEstadisticas);
  }
}

// Función auxiliar para generar estadísticas
function generarEstadisticasHTML(routes) {
  const total = routes.length;
  const rentables = routes.filter(r => r.profitPercentage > 0).length;
  const perdidas = total - rentables;
  
  if (total === 0) return '';
  
  const gananciaPromedio = routes
    .filter(r => r.profitPercentage > 0)
    .reduce((sum, r) => sum + r.profitPercentage, 0) / rentables, 0);
  
  const mejorRuta = routes.reduce((mejor, actual) => 
    actual.profitPercentage > mejor.profitPercentage ? actual : mejor
  );
  
  return `
    <div class="estadisticas-panel">
      <h3>📊 Estadísticas de Rutas</h3>
      <div class="estadistica-item">
        <span class="label">Total:</span>
        <span class="valor">${total}</span>
      </div>
      <div class="estadistica-item">
        <span class="label">Rentables:</span>
        <span class="valor rentable">${rentables}</span>
      </div>
      <div class="estadistica-item">
        <span class="label">Con pérdida:</span>
        <span class="valor loss">${perdidas}</span>
      </div>
      <div class="estadistica-item">
        <span class="label">Ganancia promedio:</span>
        <span class="valor">${gananciaPromedio.toFixed(2)}%</span>
      </div>
      <div class="estadistica-item">
        <span class="label">Mejor:</span>
        <span class="valor">${mejorRuta.exchange} (${mejorRuta.profitPercentage.toFixed(2)}%)</span>
      </div>
    </div>
  `;
}
```

---

## 🧪 EJERCICIO 2: MEJORAR EL SISTEMA DE FILTROS

**Objetivo:** Implementar un nuevo filtro en el sistema de filtros existente.

### Paso 1: Analizar el Sistema de Filtros Actual

```javascript
// En filterManager.js - Analizar cómo funcionan los filtros existentes
function analizarFiltrosExistentes() {
  console.log('🔍 Analizando sistema de filtros existente...');
  
  // Buscar funciones de filtrado
  const filterFunctions = [
    'applyMinProfitFilter',
    'applyPreferredExchangesFilter',
    'applySorting',
    'applyLimit'
  ];
  
  filterFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
      console.log(`✅ Función encontrada: ${funcName}`);
    } else {
      console.warn(`⚠️ Función no encontrada: ${funcName}`);
    }
  });
}
```

### Paso 2: Diseñar Nuevo Filtro

Vamos a agregar un filtro por rango de montos:

```javascript
// Nuevo filtro en filterManager.js
function applyAmountRangeFilter(routes, minAmount, maxAmount) {
  console.log(`💰 Aplicando filtro por monto: ${minAmount} - ${maxAmount}`);
  
  return routes.filter(route => {
    const monto = route.initialAmount || 1000000; // Monto por defecto
    
    // Validar que el monto sea válido
    if (typeof monto !== 'number' || monto <= 0) {
      console.warn('⚠️ Monto inválido en ruta:', route.exchange);
      return false;
    }
    
    return monto >= minAmount && monto <= maxAmount;
  });
}

// Integrar el nuevo filtro en el sistema existente
function integrateAmountFilter() {
  // Agregar al objeto de configuración
  const filterConfig = {
    amountRange: {
      min: 100000,
      max: 5000000,
      enabled: false
    }
  };
  
  // Guardar configuración
  chrome.storage.local.set({ filterConfig }, () => {
    console.log('✅ Configuración de filtro por monto guardada');
  });
  
  return filterConfig;
}
```

### Paso 3: Agregar UI para el Filtro

```javascript
// Agregar controles en el popup.html
function addAmountFilterUI() {
  const container = document.querySelector('.filters-section');
  if (!container) {
    console.warn('⚠️ Contenedor de filtros no encontrado');
    return;
  }
  
  const filterHTML = `
    <div class="filter-control">
      <h4>💰 Filtro por Monto</h4>
      <div class="range-inputs">
        <label>
          Monto mínimo:
          <input type="number" id="minAmount" value="100000" min="1000" step="10000">
        </label>
        <label>
          Monto máximo:
          <input type="number" id="maxAmount" value="5000000" min="1000" step="100000">
        </label>
      </div>
      <div class="range-actions">
        <button id="applyAmountFilter" class="btn-primary">Aplicar Filtro</button>
        <button id="resetAmountFilter" class="btn-secondary">Restablecer</button>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', filterHTML);
  
  // Agregar event listeners
  document.getElementById('applyAmountFilter').addEventListener('click', applyAmountRangeFilter);
  document.getElementById('resetAmountFilter').addEventListener('click', resetAmountFilter);
  
  // Cargar configuración guardada
  loadAmountFilterConfig();
}

function loadAmountFilterConfig() {
  chrome.storage.local.get(['filterConfig'], (result) => {
    const config = result.filterConfig || { amountRange: { min: 100000, max: 5000000, enabled: false } };
    
    document.getElementById('minAmount').value = config.amountRange.min;
    document.getElementById('maxAmount').value = config.amountRange.max;
    
    const enableCheckbox = document.getElementById('enableAmountFilter');
    if (enableCheckbox) {
      enableCheckbox.checked = config.amountRange.enabled;
    }
  });
}

function applyAmountRangeFilter() {
  const minAmount = parseInt(document.getElementById('minAmount').value);
  const maxAmount = parseInt(document.getElementById('maxAmount').value);
  const enabled = document.getElementById('enableAmountFilter').checked;
  
  // Actualizar configuración
  chrome.storage.local.set({
    filterConfig: {
      amountRange: { min: minAmount, max: maxAmount, enabled }
    }
  }, () => {
    console.log('✅ Filtro por monto actualizado');
    
    // Notificar al sistema de filtros
    if (window.FilterManager && typeof window.FilterManager.applyFilters === 'function') {
      window.FilterManager.applyFilters(currentData.optimizedRoutes);
    }
  });
}

function resetAmountFilter() {
  // Restablecer a valores por defecto
  document.getElementById('minAmount').value = 100000;
  document.getElementById('maxAmount').value = 5000000;
  document.getElementById('enableAmountFilter').checked = false;
  
  // Actualizar configuración
  chrome.storage.local.set({
    filterConfig: {
      amountRange: { min: 100000, max: 5000000, enabled: false }
    }
  }, () => {
    console.log('🔄 Filtro por monto restablecido');
    
    // Limpiar filtro
    if (window.FilterManager && typeof window.FilterManager.applyFilters === 'function') {
      window.FilterManager.applyFilters(currentData.optimizedRoutes);
    }
  });
}
```

---

## 🧪 EJERCICIO 3: OPTIMIZACIÓN DE RENDIMIENTO

**Objetivo:** Mejorar el rendimiento del renderizado de rutas.

### Paso 1: Medir Rendimiento Actual

```javascript
// Añadir medición de rendimiento
function medirRendimiento() {
  const startTime = performance.now();
  
  // Simular renderizado de 100 rutas
  const mockRoutes = Array(100).fill(null).map((_, index) => ({
    exchange: `Exchange ${index}`,
    profitPercentage: Math.random() * 5 - 2,
    buyPrice: 1000 + Math.random() * 100,
    sellPrice: 1100 + Math.random() * 100,
    initialAmount: 1000000
  }));
  
  displayOptimizedRoutes(mockRoutes);
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`📊 Rendimiento: ${duration.toFixed(2)}ms para 100 rutas`);
  
  return duration;
}
```

### Paso 2: Implementar Virtual Scrolling

```javascript
// Mejorar renderizado para listas grandes
class VirtualScrollManager {
  constructor(container, itemHeight = 80) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.visibleItems = 10; // Cantidad de elementos visibles
    this.items = [];
    this.scrollTop = 0;
  }
  
  render(items) {
    this.items = items;
    this.renderVisibleItems();
  }
  
  renderVisibleItems() {
    const container = this.container;
    container.innerHTML = '';
    
    // Calcular rango visible
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleItems, this.items.length);
    
    // Renderizar solo elementos visibles
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.items[i];
      const element = this.createItemElement(item);
      container.appendChild(element);
    }
  }
  
  createItemElement(item) {
    const element = document.createElement('div');
    element.className = 'virtual-item';
    element.style.height = `${this.itemHeight}px`;
    element.innerHTML = `
      <h4>${item.exchange}</h4>
      <div class="profit">${item.profitPercentage.toFixed(2)}%</div>
    `;
    return element;
  }
  
  updateScrollPosition() {
    this.scrollTop = Math.floor(this.scrollTop / this.itemHeight) * this.itemHeight;
  }
}

// Uso en displayOptimizedRoutes
const scrollManager = new VirtualScrollManager(document.getElementById('routes-container'));

scrollManager.render(rutas);

// Agregar scroll event
document.getElementById('routes-container').addEventListener('scroll', () => {
  scrollManager.updateScrollPosition();
});
```

---

## 📋 RESUMEN DE EJERCICIOS

### ✅ Habilidades Practicadas

1. **Modificación de código existente**: Leer, entender y modificar
2. **Análisis de arquitectura**: Identificar patrones y estructuras
3. **Creación de nuevas funcionalidades**: Implementar características adicionales
4. **Optimización de rendimiento**: Mejorar velocidad de renderizado
5. **Integración de componentes**: Conectar nuevas funcionalidades con el sistema existente

### 🎯 Próximos Pasos Sugeridos

1. **Crear un filtro por tipo de exchange**
2. **Implementar un sistema de notificaciones mejorado**
3. **Agregar animaciones más avanzadas**
4. **Crear un modo oscuro/claro**
5. **Implementar búsqueda de rutas**
6. **Agregar persistencia de configuraciones personalizadas**

---

**¡Estos ejercicios te darán una base sólida para programar extensiones mientras mejoras ArbitrageAR!**

**¿Quieres empezar con el Ejercicio 1 o prefieres ver todos los ejercicios primero antes de elegir?**