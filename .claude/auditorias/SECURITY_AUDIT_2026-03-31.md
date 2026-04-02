# 🔒 AUDITORÍA DE SEGURIDAD - ArbitrageAR-USDT

**Fecha:** 31 de Marzo de 2026
**Auditor:** security-auditor
**Versión:** v6.0.0
**Estado:** ⚠️ REQUIERE ATENCIÓN

---

## 📋 RESUMEN EJECUTIVO

| Categoría | Puntuación | Estado |
|-----------|------------|--------|
| **Content Security Policy** | 9/10 | ✅ Excelente |
| **Permisos Mínimos** | 9/10 | ✅ Excelente |
| **XSS Prevention** | 5/10 | ⚠️ Crítico |
| **Validación de URLs** | 4/10 | ❌ Inadecuado |
| **Validación de Inputs** | 6/10 | ⚠️ Mejorable |
| **Mensajería Segura** | 6/10 | ⚠️ Mejorable |
| **Dependencias** | 7/10 | ⚠️ Vulnerabilidades menores |

### Puntuación General: 6.5/10

### Nivel de Riesgo: 🟡 MEDIO-ALTO

---

## 🚨 VULNERABILIDADES CRÍTICAS

### VULN-001: XSS Potencial en innerHTML (ALTA)

**Severidad:** Alta
**CVSS:** 7.5
**CWE:** CWE-79 (Cross-site Scripting)

**Descripción:** Se encontraron **64 instancias de innerHTML** en el código fuente. Muchas de ellas insertan datos provenientes de APIs externas sin sanitización.

**Archivos afectados:**
| Archivo | Instancias |
|---------|------------|
| `src/popup.js` | 38 |
| `src/modules/routeManager.js` | 6 |
| `src/modules/modalManager.js` | 5 |
| `src/modules/simulator.js` | 2 |
| `src/options.js` | 5 |
| `src/modules/filterManager.js` | 1 |
| `src/modules/notificationManager.js` | 1 |
| `src/ui/routeRenderer.js` | 4 |
| `src/ui/tooltipSystem.js` | 1 |
| `src/utils/commonUtils.js` | 2 |
| `src/ui-components/arbitrage-panel.js` | 1 |

**Ejemplos vulnerables:**

```javascript
// popup.js:3870 - Inserta route.crypto sin sanitizar
card.innerHTML = `
  <div class="crypto-card-header">
    <span class="crypto-name">${route.crypto}</span>  // ❌ VULNERABLE
  </div>
`;

// modules/routeManager.js:368 - Inserta datos de ruta
card.innerHTML = `
  <span class="fiat-name">${getRouteTypeName(routeType)}</span>
`;
```

**Impacto:**
- Si las APIs externas (CriptoYa, DolarAPI) son comprometidas, pueden inyectar código malicioso
- Ejecución de JavaScript arbitrario en el contexto de la extensión
- Robo de datos del usuario o manipulación de la UI

**Remediación:**
```javascript
// Opción 1: Usar textContent en lugar de innerHTML
card.querySelector('.crypto-name').textContent = route.crypto;

// Opción 2: Sanitizar HTML antes de insertar
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

card.innerHTML = `
  <span class="crypto-name">${escapeHtml(route.crypto)}</span>
`;

// Opción 3: Usar DOMPurify (recomendado)
import DOMPurify from 'dompurify';
card.innerHTML = DOMPurify.sanitize(htmlContent);
```

---

### VULN-002: Validación de URLs Insuficiente (MEDIA)

**Severidad:** Media
**CVSS:** 6.5
**CWE:** CWE-918 (Server-Side Request Forgery)

**Descripción:** Las URLs de API en options.js no son validadas. Se aceptan sin verificar:
- Protocolo (debería ser solo HTTPS)
- Dominio (debería estar en whitelist)

**Archivo afectado:** `src/options.js`

```javascript
// options.js:863-868 - Sin validación
settings.dolarApiUrl = document.getElementById('dolarapi-url')?.value || 'https://dolarapi.com/v1/dolares/oficial';
settings.criptoyaUsdtArsUrl = document.getElementById('criptoya-ars-url')?.value || '...';
// ❌ Se acepta CUALQUIER URL sin validar
```

**Impacto:**
- Un usuario podría configurar URLs maliciosas
- Posible SSRF si se permite acceso a redes internas
- Exposición de datos a servidores no autorizados

**Remediación:**
```javascript
const ALLOWED_DOMAINS = [
  'dolarapi.com',
  'criptoya.com',
  'dolarito.ar'
];

function validateApiUrl(url) {
  try {
    const parsed = new URL(url);

    // Solo HTTPS permitido
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Solo se permiten URLs HTTPS' };
    }

    // Verificar dominio permitido
    const isAllowed = ALLOWED_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      return { valid: false, error: 'Dominio no permitido' };
    }

    return { valid: true, url };
  } catch (e) {
    return { valid: false, error: 'URL inválida' };
  }
}

// Uso al guardar configuración
const urlResult = validateApiUrl(dolarApiUrlInput);
if (!urlResult.valid) {
  showError(urlResult.error);
  return;
}
settings.dolarApiUrl = urlResult.url;
```

---

### VULN-003: Mensajería sin Validación de Origen (MEDIA)

**Severidad:** Media
**CVSS:** 5.5
**CWE:** CWE-346 (Origin Validation Error)

**Descripción:** El handler de mensajes en `main-simple.js` no valida el origen del mensaje.

**Archivo afectado:** `src/background/main-simple.js:2136-2145`

```javascript
// Código actual - SIN validación de origen
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('[BACKGROUND] Mensaje recibido:', request.action);
  const action = request.type || request.action;
  const handler = MESSAGE_HANDLERS[action];
  if (!handler) {
    return false;
  }
  return handler(request, sendResponse);
});
// ❌ No valida sender.id ni sender.tab
```

**Impacto:**
- Mensajes de extensiones maliciosas podrían ser procesados
- No hay verificación de que el mensaje venga del popup/options

**Remediación:**
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Validar que el mensaje viene de nuestra extensión
  if (sender.id !== chrome.runtime.id) {
    console.warn('[BACKGROUND] Mensaje de extensión desconocida:', sender.id);
    return false;
  }

  // Validar estructura del mensaje
  if (!request || typeof request !== 'object') {
    console.warn('[BACKGROUND] Mensaje con estructura inválida');
    return false;
  }

  // Validar action es un string permitido
  const action = request.type || request.action;
  const ALLOWED_ACTIONS = [
    'getArbitrages', 'refresh', 'settingsUpdated',
    'getBanksData', 'GET_CRYPTO_ARBITRAGE'
  ];

  if (typeof action !== 'string' || !ALLOWED_ACTIONS.includes(action)) {
    console.warn('[BACKGROUND] Action no permitido:', action);
    return false;
  }

  const handler = MESSAGE_HANDLERS[action];
  if (!handler) {
    return false;
  }
  return handler(request, sendResponse);
});
```

---

## ⚠️ VULNERABILIDADES MENORES

### VULN-004: Console.log en Producción (BAJA)

**Severidad:** Baja
**CVSS:** 3.5

**Descripción:** Se encontraron múltiples console.log/warn/error en código de producción.

**Archivos afectados:**
- `src/background/main-simple.js` - 30+ instancias
- `src/background/apiClient.js` - 6 instancias

**Impacto:**
- Exposición de información interna
- Posible fuga de datos sensibles en logs
- Ligero impacto en rendimiento

**Remediación:**
```javascript
// Crear utilidad de logging condicional
const DEBUG_MODE = false; // Desactivar en producción

const logger = {
  log: (...args) => DEBUG_MODE && console.log(...args),
  warn: (...args) => DEBUG_MODE && console.warn(...args),
  error: (...args) => console.error(...args), // Siempre loguear errores
  info: (...args) => DEBUG_MODE && console.info(...args)
};

// Uso
logger.log('[BACKGROUND] Mensaje:', request.action);
```

---

### VULN-005: Dependencias con Vulnerabilidades (BAJA)

**Severidad:** Baja
**CVSS:** 4.0

**Descripción:** npm audit detectó vulnerabilidades en dependencias de desarrollo.

**Dependencias afectadas:**
| Dependencia | Severidad | Problema |
|-------------|-----------|----------|
| `@tootallnate/once` | Moderada | Incorrect Control Flow Scoping |
| `ajv` | Moderada | ReDoS con `$data` option |
| `brace-expansion` | Moderada | Process hang con zero-step sequence |

**Nota:** Estas son dependencias de desarrollo (jest, jsdom), no afectan la extensión en producción.

**Remediación:**
```bash
npm audit fix
# o actualizar jest a versión más reciente
npm update jest-environment-jsdom
```

---

## ✅ FORTALEZAS DE SEGURIDAD

### 1. Content Security Policy (CSP) ✅

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  }
}
```

**Evaluación:**
- ✅ No permite inline scripts
- ✅ No permite eval() estándar (solo wasm-unsafe-eval justificado)
- ✅ object-src restringido a 'self'
- ✅ Solo scripts del mismo origen

### 2. Permisos Mínimos ✅

```json
{
  "permissions": [
    "storage",
    "alarms",
    "notifications",
    "activeTab"
  ],
  "host_permissions": [
    "https://*.dolarapi.com/*",
    "https://*.criptoya.com/*",
    "https://*.dolarito.ar/*"
  ]
}
```

**Evaluación:**
- ✅ Solo permisos esenciales
- ✅ Sin permisos peligrosos (tabs, history, bookmarks)
- ✅ Host permissions específicas y limitadas
- ✅ Solo HTTPS en host_permissions

### 3. Sin Código Peligroso ✅

- ✅ No se encontró `eval()` en el código
- ✅ No se encontró `document.write()`
- ✅ No se encontran funciones peligrosas

---

## 📊 CHECKLIST DE SEGURIDAD

### Crítico
- [ ] **XSS:** Sanitizar todos los innerHTML
- [ ] **URLs:** Validar URLs con whitelist de dominios
- [ ] **Mensajería:** Validar origen de mensajes runtime

### Importante
- [ ] **Inputs:** Añadir validación completa en options.js
- [ ] **Logs:** Implementar logger condicional para producción
- [ ] **Dependencias:** Ejecutar `npm audit fix`

### Recomendado
- [ ] Considerar usar DOMPurify para sanitización
- [ ] Implementar Content Security Policy más estricta
- [ ] Añadir tests de seguridad

---

## 🛠️ PLAN DE REMEDIACIÓN

### Fase 1: Crítico (1 semana)

| Tarea | Estimación | Prioridad |
|-------|------------|-----------|
| Crear utilidad escapeHtml() | 1h | CRÍTICA |
| Sanitizar innerHTML en popup.js | 4h | CRÍTICA |
| Sanitizar innerHTML en módulos | 2h | CRÍTICA |
| Implementar validación de URLs | 2h | CRÍTICA |
| Validar origen en mensajes | 1h | ALTA |

### Fase 2: Importante (1 semana)

| Tarea | Estimación | Prioridad |
|-------|------------|-----------|
| Implementar logger condicional | 2h | MEDIA |
| Ejecutar npm audit fix | 0.5h | MEDIA |
| Añadir validación de inputs | 2h | MEDIA |

### Fase 3: Mejora Continua

| Tarea | Estimación | Prioridad |
|-------|------------|-----------|
| Integrar DOMPurify | 2h | BAJA |
| Tests de seguridad | 4h | BAJA |
| CSP más estricto | 1h | BAJA |

---

## 📈 MÉTRICAS

### Antes de Remediar

| Métrica | Valor |
|---------|-------|
| innerHTML sin sanitizar | 64 |
| URLs sin validar | 4 |
| Mensajes sin validar origen | 1 |
| console.log en producción | 36+ |
| Vulnerabilidades npm | 3 |

### Objetivo Después de Remediar

| Métrica | Valor |
|---------|-------|
| innerHTML sin sanitizar | 0 |
| URLs sin validar | 0 |
| Mensajes sin validar origen | 0 |
| console.log en producción | 0 (solo errores) |
| Vulnerabilidades npm | 0 |

---

## 📝 CONCLUSIÓN

**Puntuación Actual:** 6.5/10

El proyecto tiene una buena base de seguridad con CSP correcto y permisos mínimos. Sin embargo, existen vulnerabilidades significativas relacionadas con XSS que deben ser corregidas urgentemente.

### Prioridad de Acción

1. 🔴 **CRÍTICO:** Sanitizar innerHTML (XSS)
2. 🟠 **ALTO:** Validar URLs con whitelist
3. 🟡 **MEDIO:** Validar origen de mensajes
4. 🟢 **BAJO:** Limpiar console.log y actualizar dependencias

### Riesgo Aceptable

Con las correcciones propuestas, la extensión alcanzaría un nivel de seguridad **9.0/10**, adecuado para producción.

---

**Auditoría completada:** 31 de Marzo de 2026
**Próxima revisión:** Tras aplicar fixes de Fase 1