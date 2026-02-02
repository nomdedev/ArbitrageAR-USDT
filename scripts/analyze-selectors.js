#!/usr/bin/env node

/**
 * Script para analizar y optimizar selectores CSS
 * FASE 2: Optimizar selectores y especificidad
 */

const fs = require('fs');
const path = require('path');

// Archivos CSS a analizar
const CSS_FILES = [
  { path: path.join(__dirname, '../src/popup.css'), name: 'popup.css' },
  { path: path.join(__dirname, '../src/ui-components/design-system.css'), name: 'design-system.css' },
  { path: path.join(__dirname, '../src/ui-components/animations.css'), name: 'animations.css' },
  { path: path.join(__dirname, '../src/ui-components/header.css'), name: 'header.css' },
  { path: path.join(__dirname, '../src/ui-components/exchange-card.css'), name: 'exchange-card.css' }
];

// Función para calcular especificidad de un selector
function calculateSpecificity(selector) {
  // Eliminar pseudo-clases y pseudo-elementos para el cálculo
  const cleanSelector = selector
    .replace(/::?[a-z-]+/gi, '')
    .replace(/\[.*?\]/g, '');
  
  let specificity = { a: 0, b: 0, c: 0 };
  
  // Contar IDs (a)
  const idMatches = cleanSelector.match(/#[a-zA-Z_][\w-]*/g);
  specificity.a = idMatches ? idMatches.length : 0;
  
  // Contar clases, atributos y pseudo-clases (b)
  const classMatches = cleanSelector.match(/\.[a-zA-Z_][\w-]*/g);
  const attrMatches = cleanSelector.match(/\[[^\]]+\]/g);
  specificity.b = (classMatches ? classMatches.length : 0) + (attrMatches ? attrMatches.length : 0);
  
  // Contar elementos (c)
  const elementMatches = cleanSelector.match(/^[a-z]+|\s+[a-z]+|\s*[>+~\s][a-z]+/gi);
  specificity.c = elementMatches ? elementMatches.length : 0;
  
  return specificity;
}

// Función para formatear especificidad
function formatSpecificity(spec) {
  return `(${spec.a},${spec.b},${spec.c})`;
}

// Función para analizar selectores CSS
function analyzeSelectors(cssContent, fileName) {
  const results = {
    fileName,
    totalSelectors: 0,
    highSpecificity: [],
    longSelectors: [],
    redundantCombinators: [],
    universalSelectors: [],
    recommendations: []
  };
  
  // Regex para encontrar selectores CSS
  const selectorRegex = /([^{]+)\s*\{/g;
  let match;
  
  while ((match = selectorRegex.exec(cssContent)) !== null) {
    const selector = match[1].trim();
    results.totalSelectors++;
    
    // Calcular especificidad
    const specificity = calculateSpecificity(selector);
    
    // Detectar selectores con alta especificidad
    if (specificity.a > 1 || specificity.b > 5 || specificity.c > 5) {
      results.highSpecificity.push({
        selector,
        specificity: formatSpecificity(specificity),
        score: specificity.a * 100 + specificity.b * 10 + specificity.c
      });
    }
    
    // Detectar selectores muy largos (> 100 caracteres)
    if (selector.length > 100) {
      results.longSelectors.push({
        selector,
        length: selector.length
      });
    }
    
    // Detectar selectores universales
    if (selector === '*') {
      results.universalSelectors.push({ selector });
    }
    
    // Detectar combinadores redundantes (ej: div div, div > div)
    const redundantPattern = /([a-z]+)\s+\1\s+/gi;
    const redundantMatch = redundantPattern.exec(selector);
    if (redundantMatch) {
      results.redundantCombinators.push({
        selector,
        pattern: redundantMatch[0]
      });
    }
  }
  
  return results;
}

// Analizar todos los archivos
console.log('🔍 Analizando selectores CSS...\n');

const allResults = [];
let totalHighSpecificity = 0;
let totalLongSelectors = 0;
let totalRedundantCombinators = 0;
let totalUniversalSelectors = 0;

for (const fileInfo of CSS_FILES) {
  const cssContent = fs.readFileSync(fileInfo.path, 'utf8');
  const results = analyzeSelectors(cssContent, fileInfo.name);
  
  totalHighSpecificity += results.highSpecificity.length;
  totalLongSelectors += results.longSelectors.length;
  totalRedundantCombinators += results.redundantCombinators.length;
  totalUniversalSelectors += results.universalSelectors.length;
  
  allResults.push(results);
  
  console.log(`📄 ${fileInfo.name}:`);
  console.log(`   Total selectores: ${results.totalSelectors}`);
  console.log(`   Alta especificidad: ${results.highSpecificity.length}`);
  console.log(`   Selectores largos: ${results.longSelectors.length}`);
  console.log(`   Combinadores redundantes: ${results.redundantCombinators.length}`);
  console.log(`   Selectores universales: ${results.universalSelectors.length}`);
  console.log('');
}

// Generar recomendaciones
console.log('='.repeat(60));
console.log('📋 RECOMENDACIONES DE OPTIMIZACIÓN');
console.log('='.repeat(60));

console.log(`\n🎯 Selectores con alta especificidad (score > 100): ${totalHighSpecificity}`);
console.log('⚠️  Considera simplificar estos selectores para mejor rendimiento.');

console.log(`\n📏 Selectores muy largos (>100 caracteres): ${totalLongSelectors}`);
console.log('⚠️  Los selectores largos son difíciles de mantener y pueden impactar rendimiento.');

console.log(`\n🔄 Combinadores redundantes: ${totalRedundantCombinators}`);
console.log('💡 Ejemplo: "div div" puede simplificarse a una sola clase.');

console.log(`\n⭐ Selectores universales (*): ${totalUniversalSelectors}`);
console.log('⚠️  Evita selectores universales, impactan rendimiento negativamente.');

// Guardar resultados detallados
const detailedResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalHighSpecificity,
    totalLongSelectors,
    totalRedundantCombinators,
    totalUniversalSelectors
  },
  files: allResults
};

fs.writeFileSync(
  path.join(__dirname, '../docs/css-selector-analysis.json'),
  JSON.stringify(detailedResults, null, 2),
  'utf8'
);

console.log('\n✅ Análisis completado. Resultados guardados en docs/css-selector-analysis.json');
