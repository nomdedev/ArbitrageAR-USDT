/**
 * DIAGNÓSTICO DEL ERROR EN formatters.js
 * 
 * Este script ayuda a identificar la causa raíz del error:
 * "formatters.js:1 Uncaught SyntaxError: Identifier 'formatCurrency' has already been declared"
 * 
 * POSIBLES CAUSAS IDENTIFICADAS:
 * 
 * 1. CARGA MÚLTIPLE DEL ARCHIVO (MÁS PROBABLE):
 *    - Si formatters.js se carga dos veces, la segunda vez fallará al intentar declarar
 *      las variables const que ya existen en el scope global.
 *    - El error apunta a línea1:1 porque el parser falla al inicio del archivo.
 * 
 * 2. PROBLEMA DE CACHÉ DEL NAVEGADOR/EXTENSIÓN:
 *    - Chrome Extension Manager podría estar usando una versión antigua de popup.html
 *      que tenía múltiples <script> tags para formatters.js.
 * 
 * 3. PROBLEMA DE SCOPE GLOBAL:
 *    - Las declaraciones const en formatters.js están en el scope global.
 *    - Si el script se ejecuta dos veces, la segunda ejecución fallará.
 * 
 * 4. CONFLICTO CON window.Formatters:
 *    - Si el objeto window.Formatters ya existe cuando se ejecuta el script,
 *      podría causar un conflicto (aunque esto es menos probable).
 * 
 * 5. PROBLEMA DE MINIFICACIÓN/BUILD:
 *    - Si hubo un proceso de build que concatenó archivos mal,
 *    - podría haber creado una versión con declaraciones duplicadas.
 * 
 * ================================================================================
 * SOLUCIONES PROPUESTAS (EN ORDEN DE PRIORIDAD):
 * ================================================================================
 * 
 * SOLUCIÓN 1 - ENCAPSULAR EN IIFE (RECOMENDADA):
 * 
 * Cambiar formatters.js para encapsular todo el código en un IIFE:
 * 
 *   (function(window) {
 *     'use strict';
 *     
 *     // Todo el código actual de formatters.js aquí
 *     const createFormatter = (options = {}) => { ... };
 *     const formatNumber = createFormatter();
 *     const formatCurrency = createFormatter({ ... });
 *     // ... resto del código ...
 *     
 *     // Exportar solo al final
 *     window.Formatters = {
 *       createFormatter,
 *       formatNumber,
 *       formatCurrency,
 *       // ... etc
 *     };
 *     
 *     console.log('✅ [Formatters] Módulo cargado correctamente');
 *   })(window);
 * 
 * VENTAJAS:
 * - Previene conflictos de scope global
 * - Permite que el script se cargue múltiples veces sin errores
 * - Sigue el mismo patrón que commonUtils.js
 * - Es una solución defensiva que previene futuros problemas
 * 
 * SOLUCIÓN 2 - VERIFICAR ANTES DE DECLARAR:
 * 
 * Agregar una verificación al inicio de formatters.js:
 * 
 *   if (window.Formatters) {
 *     console.warn('⚠️ [Formatters] El módulo ya está cargado, omitiendo...');
 *   } else {
 *     // Todo el código actual
 *   }
 * 
 * SOLUCIÓN 3 - LIMPIAR CACHÉ DE EXTENSIÓN:
 * 
 * 1. Ir a chrome://extensions/
 * 2. Desinstalar completamente la extensión
 * 3. Cerrar y volver a abrir Chrome
 * 4. Volver a instalar la extensión desde cero
 * 
 * ================================================================================
 * PASOS PARA DIAGNÓSTICO:
 * ================================================================================
 * 
 * 1. Abrir la consola del navegador antes de cargar el popup
 * 2. Cargar el popup de la extensión
 * 3. Buscar mensajes de error en la consola
 * 4. Verificar si hay múltiples mensajes de "✅ [Formatters] Módulo cargado correctamente"
 * 5. Verificar el valor de window.Formatters antes y después de cargar el popup
 * 
 * EN LA CONSOLA DEL NAVEGADOR, EJECUTAR:
 * 
 *   // Antes de cargar el popup
 *   console.log('Antes:', window.Formatters);
 *   
 *   // Después de cargar el popup
 *   console.log('Después:', window.Formatters);
 *   
 *   // Verificar si hay propiedades duplicadas
 *   Object.keys(window).filter(k => k.includes('format') || k.includes('Format'));
 * 
 * ================================================================================
 * CONCLUSIÓN:
 * ================================================================================
 * 
 * La causa más probable es que formatters.js se está cargando dos veces en el
 * navegador, ya sea por un problema de caché o por algún comportamiento no
 * visible en el código fuente.
 * 
 * La solución recomendada es encapsular el código en un IIFE, lo que:
 * 1. Previene el error de "Identifier already declared"
 * 2. Hace el código más robusto y defensivo
 * 3. Sigue el mismo patrón que commonUtils.js
 * 4. Permite que el script se cargue múltiples veces sin errores
 */

console.log('📋 [DIAGNÓSTICO] Archivo de diagnóstico cargado');
console.log('ℹ️  Revisa las secciones arriba para posibles causas y soluciones');
