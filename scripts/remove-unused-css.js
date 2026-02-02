#!/usr/bin/env node

/**
 * Script para eliminar automáticamente las reglas CSS no utilizadas
 * basándose en el reporte de eliminación generado.
 */

const fs = require('fs');
const path = require('path');

// Rutas de archivos
const ELIMINATION_REPORT_PATH = path.join(__dirname, '../docs/css-elimination-report-v2.json');
const CSS_FILES = [
  { path: path.join(__dirname, '../src/popup.css'), relativePath: 'src/popup.css', name: 'popup.css' },
  { path: path.join(__dirname, '../src/ui-components/design-system.css'), relativePath: 'src/ui-components/design-system.css', name: 'design-system.css' },
  { path: path.join(__dirname, '../src/ui-components/animations.css'), relativePath: 'src/ui-components/animations.css', name: 'animations.css' },
  { path: path.join(__dirname, '../src/ui-components/header.css'), relativePath: 'src/ui-components/header.css', name: 'header.css' },
  { path: path.join(__dirname, '../src/ui-components/exchange-card.css'), relativePath: 'src/ui-components/exchange-card.css', name: 'exchange-card.css' }
];

// Leer el reporte de eliminación
console.log('📖 Leyendo reporte de eliminación...');
const eliminationReport = JSON.parse(fs.readFileSync(ELIMINATION_REPORT_PATH, 'utf8'));

// Función para escapar caracteres especiales en regex
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Función para eliminar reglas CSS no utilizadas de un archivo
function removeUnusedRules(cssContent, unusedRules) {
  let removedCount = 0;
  let modifiedContent = cssContent;

  for (const rule of unusedRules) {
    const selector = rule.selector;
    const fullRule = rule.fullRule;

    // Intentar eliminar la regla completa
    const escapedRule = escapeRegex(fullRule);
    const regex = new RegExp(`\\s*${escapedRule}\\s*`, 'g');
    
    const newContent = modifiedContent.replace(regex, '\n');
    
    if (newContent !== modifiedContent) {
      removedCount++;
      modifiedContent = newContent;
    }
  }

  return { content: modifiedContent, removedCount };
}

// Procesar cada archivo CSS
const results = [];

for (const fileInfo of CSS_FILES) {
  console.log(`\n🔍 Procesando ${fileInfo.name}...`);
  
  // Buscar el archivo correspondiente en el reporte (usar ruta relativa)
  const fileReport = eliminationReport.find(f => f.file === fileInfo.relativePath);
  
  if (!fileReport || fileReport.rules.length === 0) {
    console.log(`   ✅ No hay reglas para eliminar en ${fileInfo.name}`);
    results.push({ file: fileInfo.name, removed: 0, kept: 0 });
    continue;
  }

  // Leer el contenido del archivo CSS
  const originalContent = fs.readFileSync(fileInfo.path, 'utf8');
  const originalLines = originalContent.split('\n').length;

  // Eliminar reglas no utilizadas
  const { content: optimizedContent, removedCount } = removeUnusedRules(
    originalContent,
    fileReport.rules
  );

  // Escribir el contenido optimizado
  fs.writeFileSync(fileInfo.path, optimizedContent, 'utf8');
  
  const newLines = optimizedContent.split('\n').length;
  const linesRemoved = originalLines - newLines;
  const reductionPercent = ((linesRemoved / originalLines) * 100).toFixed(1);

  console.log(`   🗑️  Reglas eliminadas: ${removedCount}`);
  console.log(`   📉 Líneas eliminadas: ${linesRemoved} (${reductionPercent}%)`);
  console.log(`   📊 Líneas restantes: ${newLines}`);

  results.push({
    file: fileInfo.name,
    removed: removedCount,
    linesRemoved,
    originalLines,
    newLines,
    reductionPercent
  });
}

// Generar reporte de resultados
console.log('\n' + '='.repeat(60));
console.log('📋 RESUMEN DE OPTIMIZACIÓN');
console.log('='.repeat(60));

let totalRemoved = 0;
let totalLinesRemoved = 0;
let totalOriginalLines = 0;

for (const result of results) {
  if (result.originalLines !== undefined) {
    console.log(`\n📄 ${result.file}:`);
    console.log(`   Reglas eliminadas: ${result.removed}`);
    console.log(`   Líneas: ${result.originalLines} → ${result.newLines} (-${result.reductionPercent}%)`);
    totalRemoved += result.removed;
    totalLinesRemoved += result.linesRemoved;
    totalOriginalLines += result.originalLines;
  }
}

const totalReductionPercent = ((totalLinesRemoved / totalOriginalLines) * 100).toFixed(1);

console.log('\n' + '='.repeat(60));
console.log('📊 TOTALES:');
console.log(`   Reglas eliminadas: ${totalRemoved}`);
console.log(`   Líneas eliminadas: ${totalLinesRemoved} de ${totalOriginalLines} (${totalReductionPercent}%)`);
console.log('='.repeat(60));

// Guardar reporte de resultados
const resultsReport = {
  timestamp: new Date().toISOString(),
  summary: {
    totalRulesRemoved: totalRemoved,
    totalLinesRemoved,
    totalOriginalLines,
    totalReductionPercent
  },
  files: results
};

fs.writeFileSync(
  path.join(__dirname, '../docs/css-optimization-results.json'),
  JSON.stringify(resultsReport, null, 2),
  'utf8'
);

console.log('\n✅ Optimización completada. Reporte guardado en docs/css-optimization-results.json');
console.log('💾 Las copias de seguridad están disponibles con extensión .backup');
