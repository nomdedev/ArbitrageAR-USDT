# 🔄 CAMBIO TEMPORAL PARA TESTING

Si el service worker con módulos NO funciona, puedes probar esta versión simplificada:

## PASO 1: Modificar manifest.json

Cambiar de:
```json
"background": {
  "service_worker": "src/background/main.js",
  "type": "module"
}
```

A:
```json
"background": {
  "service_worker": "src/background/main-simple.js"
}
```

## PASO 2: Recargar extensión

1. chrome://extensions/
2. Click en ⟳ Recargar
3. Click en "service worker"
4. Verificar logs

## LOGS ESPERADOS (versión simple):

```
🔧 [BACKGROUND-SIMPLE] main-simple.js cargando en: ...
🔧 [BACKGROUND-SIMPLE] Registrando listener...
✅ [BACKGROUND-SIMPLE] Listener registrado
🚀 [BACKGROUND-SIMPLE] Iniciando primera actualización...
🔄 Actualizando datos...
📊 Datos obtenidos: {oficial: true, usdt: true, usdtUsd: true}
✅ Calculadas XX rutas
✅ Datos actualizados: XX rutas
✅ [BACKGROUND-SIMPLE] Primera actualización completada
✅ [BACKGROUND-SIMPLE] Background completamente inicializado
```

Si ves estos logs, la versión simple funciona.

## PARA VOLVER A LA VERSIÓN CON MÓDULOS

Revertir el cambio en manifest.json
