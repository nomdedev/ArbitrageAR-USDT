---
skillName: security-audit
description: Agente especializado en auditoría de seguridad
tags: [security, xss, csp, validation, sanitize]
---

# Security Audit Skill

## Descripción
Agente especializado en auditoría de seguridad del proyecto.

## Capacidades

### Vulnerabilidades a Detectar
- XSS (Cross-Site Scripting)
- Inyección de HTML
- SSRF (Server-Side Request Forgery)
- Manipulación de datos
- Exposición de información

### Componentes Clave
- `manifest.json`: CSP y permisos
- `src/popup.js`: Validación de inputs
- `src/options.js`: Configuración sensible
- `src/background/apiClient.js`: URLs externas

### Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  }
}
```

### Sanitización de HTML
```javascript
// Función de escape
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Uso seguro
element.textContent = userInput; // Preferred
element.innerHTML = escapeHtml(userInput); // If HTML needed
```

### Validación de URLs
```javascript
function validateApiUrl(url) {
  try {
    const parsed = new URL(url);
    const allowedDomains = ['dolarapi.com', 'criptoya.com', 'dolarito.ar'];

    // Solo HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Solo dominios permitidos
    if (!allowedDomains.some(d => parsed.hostname.includes(d))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
```

### Validación de Inputs
```javascript
function validateInput(value, type) {
  switch (type) {
    case 'amount':
      return typeof value === 'number' && value > 0 && isFinite(value);
    case 'percentage':
      return typeof value === 'number' && value >= 0 && value <= 100;
    case 'exchange':
      return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
    default:
      return false;
  }
}
```

### Validación de Mensajes
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validar origen
  if (!sender.id || sender.id !== chrome.runtime.id) {
    console.warn('Message from unknown sender');
    return false;
  }

  // Validar estructura
  if (!message.action || typeof message.action !== 'string') {
    console.warn('Invalid message structure');
    return false;
  }

  // Procesar mensaje seguro
  handleSecureMessage(message, sendResponse);
  return true;
});
```

### Permisos Mínimos
```json
{
  "permissions": [
    "storage",      // Solo persistencia
    "alarms",       // Solo actualizaciones
    "notifications", // Solo alertas
    "activeTab"     // Solo tab activo
  ],
  "host_permissions": [
    // Solo APIs necesarias
    "https://*.dolarapi.com/*",
    "https://*.criptoya.com/*"
  ]
}
```

### Checklist de Seguridad
- [ ] CSP configurado correctamente
- [ ] No innerHTML sin sanitizar
- [ ] URLs validadas antes de fetch
- [ ] Inputs validados antes de procesar
- [ ] Mensajes validados por origen
- [ ] Permisos mínimos necesarios
- [ ] No datos sensibles en storage sin cifrar
- [ ] Rate limiting implementado

### Instrucciones de Uso

1. **Nueva vulnerabilidad**: Identificar y documentar
2. **Nuevo fix**: Implementar sanitización/validación
3. **Auditoría**: Revisar todos los inputs
4. **Test seguridad**: Probar payloads maliciosos

---

## Notas Importantes

- XSS es el riesgo principal en extensions
- CSP previene muchos ataques
- Validar siempre origen de mensajes
- No confiar en datos de APIs externas