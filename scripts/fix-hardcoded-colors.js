#!/usr/bin/env node

/**
 * Script para corregir colores hardcodeados en archivos CSS
 * Reemplaza 'white' y 'black' por variables CSS del sistema de diseño
 */

const fs = require('fs');
const path = require('path');

// Función para corregir colores hardcodeados en un archivo
function fixHardcodedColors(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let newContent = content;
  
  // Reemplazar 'color: white;' por 'color: var(--color-text-inverse);'
  const whiteColorRegex = /color:\s*white\s*;/g;
  if (whiteColorRegex.test(content)) {
    newContent = newContent.replace(whiteColorRegex, 'color: var(--color-text-inverse);');
    modified = true;
    console.log(`  ✅ Corregidos colores 'white' en ${filePath}`);
  }
  
  // Reemplazar 'color: black;' por 'color: var(--color-text-primary);'
  const blackColorRegex = /color:\s*black\s*;/g;
  if (blackColorRegex.test(content)) {
    newContent = newContent.replace(blackColorRegex, 'color: var(--color-text-primary);');
    modified = true;
    console.log(`  ✅ Corregidos colores 'black' en ${filePath}`);
  }
  
  // Reemplazar 'background: white;' por 'background: var(--color-bg-primary);'
  const whiteBgRegex = /background:\s*white\s*;/g;
  if (whiteBgRegex.test(content)) {
    newContent = newContent.replace(whiteBgRegex, 'background: var(--color-bg-primary);');
    modified = true;
    console.log(`  ✅ Corregidos fondos 'white' en ${filePath}`);
  }
  
  // Reemplazar 'background: black;' por 'background: var(--color-bg-canvas);'
  const blackBgRegex = /background:\s*black\s*;/g;
  if (blackBgRegex.test(content)) {
    newContent = newContent.replace(blackBgRegex, 'background: var(--color-bg-canvas);');
    modified = true;
    console.log(`  ✅ Corregidos fondos 'black' en ${filePath}`);
  }
  
  // Guardar el archivo si se modificó
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  
  return false;
}

// Función principal
function main() {
  console.log('🔧 Corrigiendo colores hardcodeados en archivos CSS...\n');
  
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
  
  cssFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`📁 Procesando: ${file}`);
      const modified = fixHardcodedColors(file);
      if (modified) {
        totalModified++;
      } else {
        console.log(`  ✅ Sin colores hardcodeados encontrados`);
      }
      console.log('');
    } else {
      console.log(`⚠️  Archivo no encontrado: ${file}\n`);
    }
  });
  
  console.log(`📊 RESUMEN:`);
  console.log(`Total de archivos procesados: ${cssFiles.length}`);
  console.log(`Archivos modificados: ${totalModified}`);
  console.log('\n✨ Corrección completada.');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { fixHardcodedColors };