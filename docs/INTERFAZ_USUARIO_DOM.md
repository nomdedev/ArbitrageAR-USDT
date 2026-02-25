# 🎨 INTERFAZ DE USUARIO Y MANIPULACIÓN DEL DOM - ArbitrageAR-USDT

**Fecha:** 25 de Febrero de 2026  
**Nivel:** Intermedio  
**Objetivo:** Dominar la manipulación del DOM y creación de interfaces dinámicas

---

## 🎯 ¿QUÉ ES EL DOM?

El **DOM (Document Object Model)** es la representación estructurada de una página web. Es como el **esqueleto** de una página HTML que JavaScript puede manipular dinámicamente.

**Analogía:** Piensa en el DOM como un **árbol genealógico**:
- **HTML**: El ADN (estructura inicial)
- **CSS**: El fenotipo (apariencia)
- **JavaScript**: El cerebro que controla el comportamiento

---

## 🏗️ ESTRUCTURA BÁSICA DEL DOM

```html
<!-- Estructura HTML -->
<div id="app">
  <header class="header">
    <h1>ArbitrageAR</h1>
    <nav class="navigation">
      <button class="nav-btn active" data-tab="routes">Rutas</button>
      <button class="nav-btn" data-tab="crypto">Cripto</button>
      <button class="nav-btn" data-tab="simulator">Simular</button>
    </nav>
  </header>
  
  <main class="main-content">
    <section id="routes-tab" class="tab-content active">
      <div class="loading">Cargando...</div>
      <div id="routes-container"></div>
    </section>
    
    <section id="crypto-tab" class="tab-content">
      <div class="crypto-selector">
        <select id="crypto-filter">
          <option value="all">Todas</option>
          <option value="BTC">Bitcoin</option>
        </select>
      </div>
      <div id="crypto-container"></div>
    </section>
  </main>
</div>
```

---

## 🎨 MANIPULACIÓN BÁSICA DEL DOM

### 1. **Seleccionar Elementos**

```javascript
// Métodos fundamentales de selección
const elemento = document.getElementById('mi-elemento');
const elementosPorClase = document.getElementsByClassName('mi-clase');
const elementoPorSelector = document.querySelector('.mi-selector');

// Propiedades y atributos
console.log(elemento.textContent);        // Texto del elemento
console.log(elemento.innerHTML);          // HTML interno
console.log(elemento.value);             // Valor de inputs
console.log(elemento.checked);           // Estado de checkboxes
console.log(elemento.dataset.tab);        // Atributos data-*
console.log(elemento.classList);          // Clases CSS
```

### 2. **Crear y Modificar Elementos**

```javascript
// Crear nuevo elemento
const nuevoDiv = document.createElement('div');
nuevoDiv.className = 'route-card';
nuevoDiv.innerHTML = '<h3>Nueva Ruta</h3>';
document.body.appendChild(nuevoDiv);

// Modificar elemento existente
const elementoExistente = document.getElementById('routes-container');
elementoExistente.innerHTML = 'Contenido actualizado';
elementoExistente.style.backgroundColor = '#f0f0f0';
elementoExistente.setAttribute('data-exchange', 'buenbit');
```

### 3. **Eventos del DOM**

```javascript
// Eventos de usuario
const boton = document.getElementById('mi-boton');

boton.addEventListener('click', (event) => {
  console.log('Botón clickeado!');
  event.preventDefault(); // Prevenir comportamiento por defecto
});

// Eventos de formulario
const formulario = document.getElementById('mi-formulario');
formulario.addEventListener('submit', (event) => {
  event.preventDefault();
  
  const formData = new FormData(formulario);
  const datos = Object.fromEntries(formData.entries);
  
  console.log('Datos del formulario:', datos);
  procesarFormulario(datos);
});

// Eventos de teclado
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    cerrarModal();
  }
});
```

---

## 🔄 MANIPULACIÓN AVANZADA DEL DOM

### 1. **Event Delegation**

```javascript
// Delegación de eventos para mejor performance
class EventDelegationManager {
  constructor(container) {
    this.container = container;
    this.handlers = new Map();
    this.setupDelegation();
  }
  
  setupDelegation() {
    this.container.addEventListener('click', this.handleClick.bind(this), true);
    this.container.addEventListener('change', this.handleChange.bind(this), true);
    this.container.addEventListener('submit', this.handleSubmit.bind(this), true);
  }
  
  handleClick(event) {
    const target = event.target;
    const action = target.closest('[data-action]')?.dataset.action;
    
    if (action && this.handlers.has(action)) {
      const handler = this.handlers.get(action);
      handler(target, event);
    }
  }
  
  handleChange(event) {
    const target = event.target;
    const action = target.dataset.action;
    
    if (action && this.handlers.has(action)) {
      const handler = this.handlers.get(action);
      handler(target, event);
    }
  }
  
  registerHandler(action, handler) {
    this.handlers.set(action, handler);
  }
}

// Uso
const eventManager = new EventDelegationManager(document.getElementById('app'));

eventManager.registerHandler('refresh-data', (element, event) => {
  element.disabled = true;
  refreshData().finally(() => {
    element.disabled = false;
  });
});

eventManager.registerHandler('filter-routes', (element, event) => {
  const filterType = element.dataset.filterType;
  applyFilter(filterType);
});
```

### 2. **Template System**

```javascript
// Sistema de templates para UI dinámica
class TemplateManager {
  constructor() {
    this.templates = new Map();
    this.compileTemplates();
  }
  
  compileTemplates() {
    // Compilar templates una sola vez
    const templateElements = document.querySelectorAll('script[type="text/template"]');
    
    templateElements.forEach(template => {
      const id = template.id;
      const content = template.innerHTML;
      const compiled = this.compileTemplate(content);
      
      this.templates.set(id, compiled);
    });
  }
  
  compileTemplate(templateString) {
    // Compilar template a función
    return new Function('data', `
      return \`${templateString.replace(/\${([^}]+)}/g, '${1}')}';
    \`);
  }
  
  render(templateId, data) {
    const template = this.templates.get(templateId);
    if (!template) {
      console.error(`Template ${templateId} no encontrado`);
      return '';
    }
    
    return template(data);
  }
}

// Template en HTML
<template id="route-card-template" type="text/template">
  <div class="route-card ${data.profitable ? 'profitable' : 'loss'}">
    <h3>${data.exchange}</h3>
    <div class="profit">${data.profitPercentage}%</div>
    <div class="details">
      <span>Compra: $${data.buyPrice}</span>
      <span>Venta: $${data.sellPrice}</span>
    </div>
  </div>
</template>

// Uso en JavaScript
const templateManager = new TemplateManager();

const routeData = {
  exchange: 'Buenbit',
  profitPercentage: 2.5,
  buyPrice: 1050,
  sellPrice: 1080,
  profitable: true
};

const html = templateManager.render('route-card-template', routeData);
document.getElementById('routes-container').innerHTML = html;
```

### 3. **Componentes Reutilizables**

```javascript
// Crear componentes UI reutilizables
class RouteCard {
  constructor(container) {
    this.container = container;
    this.cards = [];
  }
  
  createCard(data) {
    const card = document.createElement('div');
    card.className = 'route-card';
    
    if (data.profitPercentage >= 0) {
      card.classList.add('profitable');
    } else {
      card.classList.add('loss');
    }
    
    card.innerHTML = `
      <h3>${data.exchange}</h3>
      <div class="profit">${data.profitPercentage.toFixed(2)}%</div>
      <div class="prices">
        <span>Compra: $${data.buyPrice}</span>
        <span>Venta: $${data.sellPrice}</span>
      </div>
      <button class="details-btn">Ver detalles</button>
    `;
    
    // Agregar evento al botón de detalles
    const detailsBtn = card.querySelector('.details-btn');
    detailsBtn.addEventListener('click', () => {
      this.showDetails(data);
    });
    
    return card;
  }
  
  showDetails(data) {
    // Crear modal con detalles
    const modal = this.createModal(data);
    document.body.appendChild(modal);
  }
  
  createModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Detalles de ${data.exchange}</h2>
        <p>Ganancia: ${data.profitPercentage.toFixed(2)}%</p>
        <p>Monto inicial: $${data.initialAmount}</p>
        <button class="close-modal">Cerrar</button>
      </div>
    `;
    
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    return modal;
  }
  
  render(routes) {
    // Limpiar contenedor
    this.container.innerHTML = '';
    
    // Crear y agregar tarjetas
    routes.forEach(route => {
      const card = this.createCard(route);
      this.container.appendChild(card);
      this.cards.push(card);
    });
  }
}

// Uso
const routeContainer = document.getElementById('routes-container');
const routeCard = new RouteCard(routeContainer);
routeCard.render(routeData);
```

---

## 🎨 ESTILOS Y ANIMACIONES

### 1. **CSS Avanzado para Componentes**

```css
/* Estilos para tarjetas de ruta */
.route-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin: 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.route-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.route-card.profitable {
  border-left: 4px solid #10b981;
}

.route-card.loss {
  border-left: 4px solid #ef4444;
}

.profit {
  color: #10b981;
  font-weight: bold;
  font-size: 1.2em;
}

.loss {
  color: #ef4444;
  font-weight: bold;
  font-size: 1.2em;
}

.details-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 12px;
}

.details-btn:hover {
  background: #0056b3;
}

/* Animaciones */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}
```

### 2. **Animaciones con JavaScript**

```javascript
// Sistema de animaciones
class AnimationManager {
  constructor() {
    this.animations = new Map();
  }
  
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    // Forzar reflow
    element.offsetHeight;
    
    element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  }
  
  slideIn(element, direction = 'left', duration = 300) {
    const startPos = direction === 'left' ? '-100%' : '100%';
    element.style.transform = `translateX(${startPos})`;
    element.style.opacity = '0';
    
    // Forzar reflow
    element.offsetHeight;
    
    element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
    });
  }
  
  animate(element, animationType, options = {}) {
    if (this.animations.has(animationType)) {
      const animation = this.animations.get(animationType);
      animation(element, options);
    } else {
      console.warn(`Animación ${animationType} no encontrada`);
    }
  }
  
  registerAnimation(name, animationFunction) {
    this.animations.set(name, animationFunction);
  }
}

// Uso
const animationManager = new AnimationManager();

// Registrar animaciones personalizadas
animationManager.registerAnimation('bounce', (element, options) => {
  element.style.transform = 'scale(0.8)';
  element.style.transition = 'transform 0.3s ease-out';
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 150);
});

// Aplicar animaciones
const card = document.querySelector('.route-card');
animationManager.animate(card, 'fadeIn');
```

---

## 🔄 MANEJO DE ESTADO EN LA UI

### 1. **State Management para Componentes**

```javascript
// Estado local del componente
class UIComponent {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.subscribers = [];
  }
  
  setState(newState) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    // Notificar a suscriptores
    this.notifySubscribers(prevState, this.state);
    
    // Actualizar UI
    this.render();
  }
  
  getState() {
    return { ...this.state };
  }
  
  subscribe(callback) {
    this.subscribers.push(callback);
  }
  
  notifySubscribers(prevState, currentState) {
    this.subscribers.forEach(callback => callback(currentState, prevState));
  }
  
  render() {
    // Implementar en subclases
    throw new Error('render() debe ser implementado en subclases');
  }
}

// Componente específico para rutas
class RoutesComponent extends UIComponent {
  constructor(container) {
    super({ routes: [], loading: false, filters: {} });
    this.container = container;
  }
  
  render() {
    const { routes, loading, filters } = this.state;
    
    if (loading) {
      this.container.innerHTML = '<div class="loading">Cargando...</div>';
      return;
    }
    
    const filteredRoutes = this.applyFilters(routes, filters);
    this.renderRoutes(filteredRoutes);
  }
  
  applyFilters(routes, filters) {
    return routes.filter(route => {
      if (filters.exchange && route.exchange !== filters.exchange) {
        return false;
      }
      if (filters.minProfit && route.profitPercentage < filters.minProfit) {
        return false;
      }
      return true;
    });
  }
  
  renderRoutes(routes) {
    this.container.innerHTML = '';
    
    if (routes.length === 0) {
      this.container.innerHTML = '<div class="no-routes">No hay rutas disponibles</div>';
      return;
    }
    
    routes.forEach(route => {
      const card = this.createRouteCard(route);
      this.container.appendChild(card);
    });
  }
  
  createRouteCard(route) {
    const card = document.createElement('div');
    card.className = 'route-card';
    card.innerHTML = `
      <h3>${route.exchange}</h3>
      <div class="profit">${route.profitPercentage.toFixed(2)}%</div>
      <button class="details-btn">Ver detalles</button>
    `;
    
    card.querySelector('.details-btn').addEventListener('click', () => {
      this.showRouteDetails(route);
    });
    
    return card;
  }
  
  showRouteDetails(route) {
    // Implementar modal de detalles
    console.log('Mostrando detalles de:', route);
  }
}

// Uso
const routesContainer = document.getElementById('routes-container');
const routesComponent = new RoutesComponent(routesContainer);

// Actualizar estado
routesComponent.setState({ loading: true });
routesComponent.setState({ loading: false, routes: routeData });
```

---

## 🛡️ SEGURIDAD EN LA UI

### 1. **Sanitización de Entrada**

```javascript
// Sanitizar datos antes de mostrar en UI
const sanitizeHTML = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

const sanitizeText = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.textContent;
};

// Uso seguro
const userInput = '<script>alert("xss")</script>';
const safeHTML = sanitizeHTML(userInput); // Elimina el script
const safeText = sanitizeText(userInput);     // Convierte a texto plano
```

### 2. **Validación de Entrada**

```javascript
// Validar diferentes tipos de datos
const validateNumber = (value, min = 0, max = Infinity) => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Debe ser un número' };
  }
  
  if (num < min || num > max) {
    return { valid: false, error: `Debe estar entre ${min} y ${max}` };
  }
  
  return { valid: true, value: num };
};

const validateExchange = (exchange) => {
  const exchangesValidos = ['buenbit', 'lemon', 'ripio', 'fiwind'];
  
  if (!exchange || typeof exchange !== 'string') {
    return { valid: false, error: 'Exchange inválido' };
  }
  
  if (!exchangesValidos.includes(exchange.toLowerCase())) {
    return { valid: false, error: 'Exchange no soportado' };
  }
  
  return { valid: true, value: exchange };
};

// Uso en formulario
const montoInput = document.getElementById('monto');
const validation = validateNumber(montoInput.value, 1000, 10000000);

if (!validation.valid) {
  showError(validation.error);
  montoInput.focus();
} else {
  procesarMonto(validation.value);
}
```

---

## 🧪 EJERCICIOS PRÁCTICOS

### Ejercicio 1: Crear una Interfaz Dinámica

**Objetivo:** Crear una interfaz de rutas de arbitraje con templates y eventos.

```javascript
// ui-ejercicio.js
class ArbitrageUI {
  constructor() {
    this.container = document.getElementById('app');
    this.templateManager = new TemplateManager();
    this.eventManager = new EventDelegationManager(this.container);
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.eventManager.registerHandler('refresh-routes', () => {
      this.refreshRoutes();
    });
    
    this.eventManager.registerHandler('filter-exchange', (element) => {
      this.filterByExchange(element.dataset.exchange);
    });
    
    this.eventManager.registerHandler('show-details', (element) => {
      const routeData = JSON.parse(element.dataset.route);
      this.showRouteDetails(routeData);
    });
  }
  
  async refreshRoutes() {
    this.showLoading();
    
    try {
      const routes = await this.fetchRoutes();
      this.renderRoutes(routes);
    } catch (error) {
      this.showError('Error obteniendo rutas:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  async fetchRoutes() {
    // Simular llamada a API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            exchange: 'Buenbit',
            profitPercentage: 2.5,
            buyPrice: 1050,
            sellPrice: 1080,
            profitable: true
          },
          {
            exchange: 'Lemon',
            profitPercentage: 2.3,
            buyPrice: 1052,
            sellPrice: 1082,
            profitable: true
          }
        ]);
      }, 1000);
    });
  }
  
  renderRoutes(routes) {
    const container = document.getElementById('routes-container');
    container.innerHTML = '';
    
    if (routes.length === 0) {
      container.innerHTML = '<div class="no-routes">No hay rutas disponibles</div>';
      return;
    }
    
    routes.forEach(route => {
      const html = this.templateManager.render('route-card-template', route);
      container.innerHTML += html;
    });
    
    // Agregar event listeners a los botones de detalles
    this.container.querySelectorAll('.details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = routes.find(r => r.exchange === btn.dataset.exchange);
        if (route) {
          this.showRouteDetails(route);
        }
      });
    });
  }
  
  showRouteDetails(route) {
    const modal = this.createDetailsModal(route);
    document.body.appendChild(modal);
  }
  
  createDetailsModal(route) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-content">
          <h2>Detalles de ${route.exchange}</h2>
          <p><strong>Ganancia:</strong> ${route.profitPercentage.toFixed(2)}%</p>
          <p><strong>Precio compra:</strong> $${route.buyPrice}</p>
          <p><strong>Precio venta:</strong> $${route.sellPrice}</p>
          <button class="close-modal">Cerrar</button>
        </div>
      </div>
    `;
    
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    return modal;
  }
  
  showLoading() {
    const container = document.getElementById('routes-container');
    container.innerHTML = '<div class="loading">Cargando rutas...</div>';
  }
  
  hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
      loading.remove();
    }
  }
  
  showError(message) {
    const container = document.getElementById('routes-container');
    container.innerHTML = `<div class="error">${message}</div>`;
  }
}

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
  const ui = new ArbitrageUI();
  console.log('UI de arbitraje inicializada');
});
```

### Ejercicio 2: Sistema de Tabs Dinámico

**Objetivo:** Implementar un sistema de pestañas con manejo de estado.

```javascript
// tabs-ejercicio.js
class TabManager {
  constructor(container) {
    this.container = container;
    this.tabs = [];
    this.panels = [];
    this.activeTab = null;
  }
  
  addTab(tabId, title, content) {
    const tab = document.createElement('button');
    tab.className = 'tab';
    tab.textContent = title;
    tab.dataset.tab = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    
    const panel = document.createElement('div');
    panel.className = 'tab-panel';
    panel.id = `panel-${tabId}`;
    panel.innerHTML = content;
    
    this.tabs.push(tab);
    this.panels.push(panel);
    
    this.container.querySelector('.tab-container').appendChild(tab);
    this.container.querySelector('.panel-container').appendChild(panel);
    
    // Agregar evento
    tab.addEventListener('click', () => this.showTab(tabId));
  }
  
  showTab(tabId) {
    // Actualizar estados visuales
    this.tabs.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });
    
    this.panels.forEach(panel => {
      if (panel.id === `panel-${tabId}`) {
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    });
    
    this.activeTab = tabId;
    
    // Disparar evento personalizado
    this.onTabChange(tabId);
  }
  
  onTabChange(tabId) {
    // Implementar en subclases
    console.log(`Tab cambiada a: ${tabId}`);
  }
}

// Uso
const tabManager = new TabManager(document.getElementById('app'));

// Agregar pestañas
tabManager.addTab('routes', 'Rutas', '<h2>Rutas de Arbitraje</h2>');
tabManager.addTab('crypto', 'Cripto', '<h2>Arbitraje Cripto</h2>');
tabManager.addTab('settings', 'Configuración', '<h2>Configuración</h2>');

// Mostrar primera pestaña
tabManager.showTab('routes');
```

---

## 📋 RESUMEN DEL MÓDULO

### ✅ Conceptos Aprendidos

1. **DOM API**: Métodos de selección y manipulación
2. **Event Delegation**: Patrón para manejo eficiente de eventos
3. **Template System**: Compilación y renderizado dinámico
4. **Componentes Reutilizables**: Clases para elementos UI
5. **Animaciones**: CSS y JavaScript para transiciones
6. **State Management**: Patrón Observer para componentes
7. **Seguridad**: Sanitización y validación de entrada

### 🎯 Próximos Pasos

En el siguiente módulo vamos a ver:
- **Estado y Almacenamiento**: Chrome Storage y persistencia
- **Buenas Prácticas**: Patrones de diseño y arquitectura
- **Proyecto Final**: Integrar todo lo aprendido

---

**¿Listo para continuar con el sistema de estado y almacenamiento?**