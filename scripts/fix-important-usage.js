#!/usr/bin/env node

/**
 * Script para analizar y optimizar el uso de !important en CSS
 * Elimina !important innecesarios pero conserva los críticos para animaciones
 */

const fs = require('fs');
const path = require('path');

// Patrones que deben conservar !important
const CRITICAL_IMPORTANT_PATTERNS = [
  /animation:\s*none\s*!important/, // Detener animaciones
  /animation-duration:\s*0\.01ms\s*!important/, // Duraciones mínimas para accesibilidad
  /animation-iteration-count:\s*1\s*!important/, // Iteraciones controladas
  /transition-duration:\s*0\.01ms\s*!important/, // Transiciones mínimas
  /transform:\s*none\s*!important/, // Resetear transformaciones
  /scroll-behavior:\s*auto\s*!important/, // Comportamiento de scroll crítico
  /display:\s*flex\s*!important/, // Layout crítico en ciertos contextos
  /color:\s*#[0-9a-fA-F]{6}\s*!important/ // Colores específicos para estados
];

// Función para analizar y optimizar !important en un archivo
function optimizeImportantUsage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let modified = false;
  let removedCount = 0;
  let keptCount = 0;
  const newLines = [];
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    let newLine = line;
    
    // Si la línea contiene !important
    if (line.includes('!important')) {
      // Verificar si es un caso crítico que debe mantenerse
      let shouldKeep = false;
      
      for (const pattern of CRITICAL_IMPORTANT_PATTERNS) {
        if (pattern.test(line)) {
          shouldKeep = true;
          keptCount++;
          break;
        }
      }
      
      // Si no es crítico, eliminar !important
      if (!shouldKeep) {
        newLine = line.replace(/\s*!important\s*/g, '');
        removedCount++;
        modified = true;
        
        // Solo mostrar si realmente se eliminó algo
        if (newLine !== line) {
          console.log(`    [Línea ${lineNumber}] Eliminado !important: ${line.trim()}`);
          console.log(`    -> ${newLine.trim()}`);
        }
      } else {
        console.log(`    [Línea ${lineNumber}] Mantenido !important (crítico): ${line.trim()}`);
      }
    }
    
    newLines.push(newLine);
  });
  
  // Guardar el archivo si se modificó
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`  ✅ Modificado: ${removedCount} !important eliminados, ${keptCount} mantenidos`);
    return { modified: true, removed: removedCount, kept: keptCount };
  }
  
  return { modified: false, removed: 0, kept: keptCount };
}

// Función principal
function main() {
  console.log('🔧 Optimizando uso de !important en archivos CSS...\n');
  
  const cssFiles = [
    'src/popup.css',
    'src/options.css',
    'src/base.css',
    'src/ui-components/design-system.css',
    'src/ui-components/animations.css',
    'src/ui-components/arbitrage-panel.css',
    'src/ui-components/exchange-card.css',
    'src/ui-components/header.css',
    'src/ui-components/loading-states.css',
    'src/ui-components/states-feedback.css',
    'src/ui-components/tabs.css'
  ];
  
  let totalModified = 0;
  let totalRemoved = 0;
  let totalKept = 0;
  
  cssFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`📁 Procesando: ${file}`);
      const result = optimizeImportantUsage(file);
      
      if (result.modified) {
        totalModified++;
        totalRemoved += result.removed;
      }
      totalKept += result.kept;
      
      if (!result.modified && result.kept === 0) {
        console.log(`  ✅ Sin uso de !important encontrado`);
      } else if (!result.modified && result.kept > 0) {
        console.log(`  ✅ ${result.kept} !important críticos mantenidos (sin cambios necesarios)`);
      }
      console.log('');
    } else {
      console.log(`⚠️  Archivo no encontrado: ${file}\n`);
    }
  });
  
  console.log(`📊 RESUMEN:`);
  console.log(`Total de archivos procesados: ${cssFiles.length}`);
  console.log(`Archivos modificados: ${totalModified}`);
  console.log(`Total de !important eliminados: ${totalRemoved}`);
  console.log(`Total de !important críticos mantenidos: ${totalKept}`);
  console.log('\n✨ Optimización completada.');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { optimizeImportantUsage };