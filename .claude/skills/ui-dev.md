---
skillName: ui-dev
description: Agente especializado en desarrollo de UI del popup
tags: [ui, popup, css, html, frontend]
---

# UI Development Skill

## Descripción
Agente especializado en desarrollo de la interfaz de usuario del popup.

## Capacidades

### Componentes UI
- Popup principal (350px width)
- Tarjetas de rutas
- Modales de detalles
- Sistema de tabs
- Filtros interactivos

### Componentes Clave
- `src/popup.html`: HTML principal
- `src/popup.css`: Estilos
- `src/ui-components/*`: Componentes reutilizables
- `src/ui/routeRenderer.js`: Renderizador

### Design System
```css
/* Variables globales */
:root {
  --primary-color: #1a73e8;
  --success-color: #34a853;
  --warning-color: #fbbc04;
  --danger-color: #ea4335;
  --text-primary: #202124;
  --text-secondary: #5f6368;
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --border-radius: 8px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
  --shadow-md: 0 2px 4px rgba(0,0,0,0.15);
}
```

### Card Component
```html
<div class="route-card" data-route-id="{id}">
  <div class="route-header">
    <span class="exchange-name">{exchange}</span>
    <span class="profit-badge {profitClass}">{profit}%</span>
  </div>
  <div class="route-details">
    <div class="price-row">
      <span>Compra: {buyPrice}</span>
      <span>Venta: {sellPrice}</span>
    </div>
  </div>
</div>
```

### Tab System
```javascript
// Tabs navigation
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all
      tabs.forEach(t => t.classList.remove('active'));
      // Add active to clicked
      tab.classList.add('active');
      // Show corresponding content
      showTabContent(tab.dataset.tab);
    });
  });
}
```

### Responsive Constraints
- Max width: 350px
- Max height: 600px
- Scrollable content
- Compact cards (80px height)

### Animations
```css
/* Transitions */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

.slide-up {
  animation: slideUp 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); }
  to { transform: translateY(0); }
}
```

### Instrucciones de Uso

1. **Nuevo componente**: Crear en `ui-components/`
2. **Nuevo estilo**: Añadir a popup.css con variable
3. **Nueva animación**: Usar CSS animations
4. **Nuevo tab**: Añadir botón y contenido

### Performance Tips
- Virtual scrolling para listas > 20 items
- CSS containment para cards
- requestAnimationFrame para animaciones
- Debounce para scroll events

---

## Notas Importantes

- Width máximo 350px (constraint de Chrome)
- Usar CSS variables para consistencia
- Evitar innerHTML (XSS)
- Animaciones performantes