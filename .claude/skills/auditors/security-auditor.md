# Security Auditor Skill

## Responsabilidad
Auditar la seguridad del proyecto y detectar vulnerabilidades potenciales.

## Archivos Bajo Auditoría
- Todos los archivos `.js`
- `manifest.json`
- `package.json` (dependencias)

## Checklist de Auditoría

### 1. Content Security Policy
- [ ] Verificar CSP en manifest.json
- [ ] Comprobar que no permite inline scripts
- [ ] Validar que solo permite 'self'

### 2. Permisos
- [ ] Verificar permisos mínimos necesarios
- [ ] Comprobar host_permissions específicas
- [ ] Validar sin permisos peligrosos

### 3. XSS Prevention
- [ ] Buscar innerHTML sin sanitizar
- [ ] Buscar document.write
- [ ] Buscar eval()
- [ ] Revisar uso de textContent vs innerHTML

### 4. Validación de Inputs
- [ ] Verificar validación de URLs
- [ ] Comprobar validación de números
- [ ] Validar strings de usuario

### 5. Storage
- [ ] Verificar datos sensibles en storage
- [ ] Comprobar si hay cifrado
- [ ] Validar datos de configuración

### 6. Mensajería
- [ ] Verificar validación de origen
- [ ] Comprobar estructura de mensajes
- [ ] Validar sender.id

## Vulnerabilidades Conocidas

### VULN-001: XSS en innerHTML (Media)
**Archivo:** `src/popup.js`
**CVSS:** 6.1
**Fix:** Sanitizar HTML antes de insertar

### VULN-002: Validación de URLs insuficiente (Media)
**Archivo:** `src/options.js`
**CVSS:** 5.9
**Fix:** Validar con whitelist de dominios

### VULN-003: Almacenamiento sin cifrar (Baja)
**Archivo:** `src/options.js`
**CVSS:** 5.3
**Fix:** Cifrar datos sensibles

## Scripts de Detección

```bash
# Buscar innerHTML
grep -rn "innerHTML" src/ --include="*.js"

# Buscar eval
grep -rn "eval(" src/ --include="*.js"

# Buscar console.log
grep -rn "console\." src/ --include="*.js"

# Verificar dependencias vulnerables
npm audit --audit-level=moderate
```

## Puntuación Objetivo
- Actual: 8.0/10
- Con fixes: 9.2/10

## Output de Auditoría
```
📊 AUDITORÍA SEGURIDAD
=====================
✅/⚠️ CSP configurado correctamente
✅/⚠️ Permisos mínimos
✅/⚠️ Sin XSS potencial
✅/⚠️ URLs validadas con whitelist
✅/⚠️ Storage seguro
✅/⚠️ Sin eval()
```