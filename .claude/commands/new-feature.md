---
commandName: /new-feature
description: Template para crear una nueva feature
---

# Comando: /new-feature

## Template para nueva feature

### 1. Crear archivo en módulo apropiado
```
src/
├── modules/nuevoManager.js     # Si es un módulo
├── ui/nuevoComponente.js       # Si es UI
├── utils/nuevaUtilidad.js      # Si es utilidad
└── background/nuevoHandler.js  # Si es background
```

### 2. Template de módulo
```javascript
/**
 * NuevoManager - Descripción
 * @module modules/nuevoManager
 */
const NuevoManager = (() => {
  // Estado privado
  let initialized = false;
  let settings = null;

  // Métodos privados
  const privateMethod = () => {
    // Implementación
  };

  // Interfaz pública
  return {
    init: (data, userSettings) => {
      settings = userSettings;
      initialized = true;
      console.log('✅ NuevoManager inicializado');
    },

    doSomething: (param) => {
      if (!initialized) {
        console.warn('⚠️ NuevoManager no inicializado');
        return null;
      }
      return privateMethod(param);
    },

    destroy: () => {
      initialized = false;
      settings = null;
    }
  };
})();

// Exponer globalmente
window.NuevoManager = NuevoManager;
```

### 3. Añadir tests
```javascript
// tests/nuevoManager.test.js
describe('NuevoManager', () => {
  beforeEach(() => {
    NuevoManager.init({}, {});
  });

  test('should initialize correctly', () => {
    expect(NuevoManager).toBeDefined();
  });

  test('should do something', () => {
    const result = NuevoManager.doSomething('test');
    expect(result).toBeDefined();
  });
});
```

### 4. Actualizar documentación
- Añadir a ARQUITECTURA_PROYECTO.md
- Documentar API en docs/
- Actualizar README.md si es necesario