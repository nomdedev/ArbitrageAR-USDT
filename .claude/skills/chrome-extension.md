---
skillName: chrome-extension
description: Agente especializado en extensiones Chrome Manifest V3
tags: [chrome, extension, manifest-v3, service-worker]
---

# Chrome Extension Development Skill

## Descripción
Agente especializado en desarrollo de extensiones Chrome con Manifest V3.

## Capacidades

### Service Worker
- Implementar background scripts
- Manejar alarms y actualizaciones
- Gestión de mensajes runtime
- Cache de datos en memoria

### Popup UI
- HTML/CSS para extension popup
- Comunicación con background
- Estado persistente con storage
- Responsive design 350px width

### Chrome APIs
- `chrome.runtime.sendMessage()`
- `chrome.runtime.onMessage.addListener()`
- `chrome.storage.local`
- `chrome.alarms`
- `chrome.notifications`

### Componentes Clave
- `manifest.json`: Configuración
- `src/background/main-simple.js`: Service Worker
- `src/popup.js`: UI principal
- `src/options.js`: Configuración usuario

### Patrones de Comunicación

```javascript
// Popup → Background
chrome.runtime.sendMessage({ action: 'getData' }, (response) => {
  if (chrome.runtime.lastError) {
    console.error('Error:', chrome.runtime.lastError);
    return;
  }
  handleResponse(response);
});

// Background → Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getData') {
    // Async operation
    getData().then(data => sendResponse(data));
    return true; // Keep channel open for async
  }
});
```

### CSP Policy
```json
{
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
}
```

### Permisos
- `storage`: Persistencia
- `alarms`: Actualizaciones periódicas
- `notifications`: Alertas
- `activeTab`: Tabs activos

### Host Permissions
```json
{
  "host_permissions": [
    "https://*.dolarapi.com/*",
    "https://*.criptoya.com/*",
    "https://*.dolarito.ar/*"
  ]
}
```

### Instrucciones de Uso

1. **Nuevo permiso**: Añadir a manifest.json con justificación
2. **Nuevo endpoint**: Añadir host_permissions específico
3. **Nuevo mensaje**: Definir action y respuesta esperada
4. **Nueva UI**: Crear en popup.html con CSS específico

### Limitaciones Manifest V3
- No inline scripts
- No eval() (except wasm-unsafe-eval)
- Service Worker puede terminar
- Background persistente limitado

---

## Notas Importantes

- Always return true for async message handlers
- Handle chrome.runtime.lastError
- Test service worker termination/restart
- Keep popup width <= 350px