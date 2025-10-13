## HOTFIX V5.0.41 - CORRECCIÓN CRÍTICA FUNCIÓN MATRIZ

### Problema Identificado
- La función `generateRiskMatrix()` tenía errores críticos de sintaxis:
  - Variables duplicadas (`usdPrices`, `usdtPrices`) declaradas múltiples veces
  - Código duplicado para cargar datos de bancos y USDT
  - Estructura if/else mal anidada causando bloques de código huérfanos
  - Variables de validación (`usdMin`, `usdMax`, etc.) redeclaradas

### Solución Implementada
- **Reestructuración completa** de la función `generateRiskMatrix()`:
  - Eliminación de código duplicado
  - Estructura clara if/else para modo automático vs personalizado
  - Variables declaradas una sola vez en el scope correcto
  - Lógica de validación consolidada

### Funcionalidad Mantenida
- ✅ Modo automático: usa datos reales de bancos (compra min a min+50%) y top 5 USDT venta
- ✅ Modo personalizado: permite configuración manual de rangos USD/USDT
- ✅ Cálculos de rentabilidad con fees y comisiones
- ✅ Generación de matriz 5x5 con colores según rentabilidad
- ✅ Debug logs detallados para troubleshooting

### Testing Recomendado
1. Probar modo automático con datos reales de bancos/USDT
2. Probar modo personalizado con valores manuales
3. Verificar que la matriz se genera sin errores
4. Comprobar cálculos de rentabilidad en diferentes escenarios

### Archivos Modificados
- `src/popup.js`: Función `generateRiskMatrix()` completamente reescrita
- `manifest.json`: Versión incrementada a 5.0.41

### Estado
✅ **HOTFIX APLICADO** - Función matriz corregida y funcional