# 🔧 Scripts de Diagnóstico y Prueba

Estos scripts te permiten verificar que el sistema de configuración funcione correctamente después de los cambios implementados.

## � Problemas Resueltos

- ✅ **Selección de bancos por defecto**: Solo 5 bancos específicos (Nación, Galicia, Santander, BBVA, ICBC) quedan seleccionados
- ✅ **Mensaje de guardado**: Debugging agregado para verificar por qué no se mostraba el mensaje de éxito
- ✅ **Nombre de atributo corregido**: Los checkboxes usan `name="bank"` en lugar de `name="bank-selection"`

## ⚠️ Problema Crítico Corregido

**Antes:** Todos los bancos estaban seleccionados por defecto porque el código JavaScript buscaba checkboxes con `name="bank-selection"` pero el HTML tenía `name="bank"`.

**Después:** Ahora el código busca correctamente `name="bank"` y solo marca los 5 bancos principales por defecto.

## 🛠️ Scripts Disponibles

### 1. `diagnostico_mensaje_guardado.js`
Verifica específicamente el sistema de mensajes de guardado.

**Uso:**
```javascript
// En la consola del navegador (F12 > Console), ejecuta:
verificarMensajeGuardado()  // Verifica elementos y funciones
simularGuardadoCompleto()   // Simula un guardado completo
```

### 2. `prueba_bancos_corregida.js` (CORREGIDO)
Verifica que la selección de bancos por defecto funcione correctamente con los nombres correctos.

**Uso:**
```javascript
// En la consola del navegador (F12 > Console), ejecuta:
verificarSeleccionBancosCorregida()     // Verificar estado actual
verificarFuncionLoadSettingsCorregida() // Verificar funciones
probarSeleccionManual()                 // Aplicar corrección manual si falla
```

### 4. `verificacion_rapida.js` (RECOMENDADO)
Verificación ultra-rápida para confirmar que todo funciona.

**Uso:**
```javascript
// En la consola del navegador (F12 > Console), ejecuta:
verificarRapido()  // Verificación completa en segundos
```

## 🚀 Cómo Usar

1. **Carga la extensión** en Chrome (si no está cargada)
2. **Abre la página de opciones**: Clic derecho en el ícono > Opciones
3. **Abre la consola**: F12 > Console
4. **Carga el script**: Copia y pega el contenido del script correspondiente
5. **Ejecuta las funciones** según necesites

## 📊 Qué Verificar

### Selección de Bancos
- Solo estos 5 bancos deben estar seleccionados por defecto:
  - Nación
  - Galicia
  - Santander
  - BBVA
  - ICBC
- Todos los demás deben estar deseleccionados

### Mensaje de Guardado
- Al guardar configuración debe aparecer un mensaje verde de éxito
- El mensaje debe ser visible por al menos 3 segundos
- Debe decir algo como "✅ Configuración guardada correctamente"

## 🔍 Resultados Esperados

Si todo funciona correctamente, deberías ver:
```
🎉 ¡TODAS LAS PRUEBAS PASARON! (3/3)
Funciones críticas: ✅
Selección de bancos: ✅
Mensaje de guardado: ✅
```

## 🐛 Si Hay Problemas

Si alguna prueba falla:

1. **Funciones críticas faltan**: Verifica que `options.js` se cargó correctamente
2. **Bancos mal seleccionados**: Revisa la lógica en `loadSettings()`
3. **Mensaje no visible**: Verifica que el elemento `#save-status` existe en `options.html`

## 📝 Notas Técnicas

- Los scripts usan la consola del navegador para mostrar resultados
- Se puede ejecutar múltiples veces sin problemas
- Las pruebas avanzadas modifican temporalmente la configuración
- Los cambios se revierten automáticamente al recargar la página