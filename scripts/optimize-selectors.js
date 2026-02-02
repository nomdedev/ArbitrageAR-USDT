/**
 * Script para optimizar selectores CSS - FASE 2
 * Optimiza selectores de alta especificidad y selectores largos
 */

const fs = require('fs');
const path = require('path');

// Archivos CSS a procesar
const CSS_FILES = [
  { path: 'src/popup.css', relativePath: 'src/popup.css' },
  { path: 'src/ui-components/design-system.css', relativePath: 'src/ui-components/design-system.css' },
  { path: 'src/ui-components/animations.css', relativePath: 'src/ui-components/animations.css' },
  { path: 'src/ui-components/header.css', relativePath: 'src/ui-components/header.css' },
  { path: 'src/ui-components/exchange-card.css', relativePath: 'src/ui-components/exchange-card.css' },
  { path: 'src/ui-components/loading-states.css', relativePath: 'src/ui-components/loading-states.css' },
  { path: 'src/ui-components/tabs.css', relativePath: 'src/ui-components/tabs.css' },
  { path: 'src/ui-components/arbitrage-panel.css', relativePath: 'src/ui-components/arbitrage-panel.css' }
];

// Umbrales para optimización
const HIGH_SPECIFICITY_THRESHOLD = 100;
const LONG_SELECTOR_THRESHOLD = 100;

/**
 * Calcula la especificidad de un selector
 */
function calculateSpecificity(selector) {
  // Eliminar pseudo-elementos y pseudo-clases
  const cleanSelector = selector
    .replace(/::?[a-z-]+/gi, '')
    .replace(/\[.*?\]/g, '');

  let specificity = { a: 0, b: 0, c: 0 };

  // Contar IDs
  const idMatches = cleanSelector.match(/#[a-zA-Z_][\w-]*/g);
  specificity.a = idMatches ? idMatches.length : 0;

  // Contar clases, atributos y pseudo-clases
  const classMatches = cleanSelector.match(/\.[a-zA-Z_][\w-]*/g);
  const attrMatches = cleanSelector.match(/\[[^\]]+\]/g);
  specificity.b = (classMatches ? classMatches.length : 0) + (attrMatches ? attrMatches.length : 0);

  // Contar elementos
  const elementMatches = cleanSelector.match(/^[a-z]+|\s+[a-z]+|\s*[>+~\s][a-z]+/gi);
  specificity.c = elementMatches ? elementMatches.length : 0;

  return specificity;
}

/**
 * Calcula el puntaje de especificidad
 */
function getSpecificityScore(specificity) {
  return specificity.a * 100 + specificity.b * 10 + specificity.c;
}

/**
 * Extrae selectores de una regla CSS
 */
function extractSelectors(cssContent) {
  const selectors = [];
  const ruleRegex = /([^{}]+)\{[^{}]*\}/g;
  let match;

  while ((match = ruleRegex.exec(cssContent)) !== null) {
    const selectorGroup = match[1].trim();
    const individualSelectors = selectorGroup.split(',').map(s => s.trim());

    for (const selector of individualSelectors) {
      if (selector && !selector.startsWith('@')) {
        selectors.push({
          selector,
          fullRule: match[0],
          specificity: calculateSpecificity(selector),
          length: selector.length
        });
      }
    }
  }

  return selectors;
}

/**
 * Genera una sugerencia de optimización para un selector
 */
function generateOptimizationSuggestion(selectorInfo) {
  const { selector, specificity } = selectorInfo;
  const suggestions = [];

  // Sugerencia 1: Reducir IDs en el selector
  if (specificity.a > 1) {
    suggestions.push({
      type: 'reduce_ids',
      description: `Reducir número de IDs (${specificity.a} IDs)`,
      suggestion: 'Considerar usar clases en lugar de múltiples IDs',
      priority: 'high'
    });
  }

  // Sugerencia 2: Simplificar cadenas de clases
  const classCount = (selector.match(/\.[a-zA-Z_][\w-]*/g) || []).length;
  if (classCount > 3) {
    suggestions.push({
      type: 'reduce_classes',
      description: `Reducir cadena de clases (${classCount} clases)`,
      suggestion: 'Crear una clase semántica que combine las clases necesarias',
      priority: 'medium'
    });
  }

  // Sugerencia 3: Eliminar selectores descendientes innecesarios
  const descendantCount = (selector.match(/\s+/g) || []).length;
  if (descendantCount > 3) {
    suggestions.push({
      type: 'reduce_descendants',
      description: `Reducir profundidad de descendientes (${descendantCount} niveles)`,
      suggestion: 'Aplanar la estructura HTML o usar clases más específicas',
      priority: 'medium'
    });
  }

  // Sugerencia 4: Selector muy largo
  if (selector.length > LONG_SELECTOR_THRESHOLD) {
    suggestions.push({
      type: 'shorten_selector',
      description: `Acortar selector (${selector.length} caracteres)`,
      suggestion: 'Crear una clase específica para este elemento',
      priority: 'high'
    });
  }

  return suggestions;
}

/**
 * Analiza un archivo CSS y genera sugerencias de optimización
 */
function analyzeCSSFile(filePath) {
  const cssContent = fs.readFileSync(filePath, 'utf-8');
  const selectors = extractSelectors(cssContent);

  const analysis = {
    filePath,
    totalSelectors: selectors.length,
    highSpecificity: [],
    longSelectors: [],
    optimizations: []
  };

  for (const selectorInfo of selectors) {
    const score = getSpecificityScore(selectorInfo.specificity);

    if (score > HIGH_SPECIFICITY_THRESHOLD) {
      analysis.highSpecificity.push({
        selector: selectorInfo.selector,
        specificity: selectorInfo.specificity,
        score,
        suggestions: generateOptimizationSuggestion(selectorInfo)
      });
    }

    if (selectorInfo.length > LONG_SELECTOR_THRESHOLD) {
      analysis.longSelectors.push({
        selector: selectorInfo.selector,
        length: selectorInfo.length,
        suggestions: generateOptimizationSuggestion(selectorInfo)
      });
    }
  }

  return analysis;
}

/**
 * Genera un reporte de optimización
 */
function generateOptimizationReport(analyses) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: analyses.length,
      totalHighSpecificity: 0,
      totalLongSelectors: 0,
      totalSuggestions: 0
    },
    files: []
  };

  for (const analysis of analyses) {
    const fileReport = {
      filePath: analysis.filePath,
      totalSelectors: analysis.totalSelectors,
      highSpecificityCount: analysis.highSpecificity.length,
      longSelectorsCount: analysis.longSelectors.length,
      highSpecificity: analysis.highSpecificity.slice(0, 10), // Primeros 10
      longSelectors: analysis.longSelectors.slice(0, 10), // Primeros 10
      topSuggestions: []
    };

    // Recopilar todas las sugerencias y ordenar por prioridad
    const allSuggestions = [];
    for (const item of [...analysis.highSpecificity, ...analysis.longSelectors]) {
      allSuggestions.push(...item.suggestions);
    }

    // Ordenar por prioridad
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    fileReport.topSuggestions = allSuggestions.slice(0, 5);

    report.summary.totalHighSpecificity += analysis.highSpecificity.length;
    report.summary.totalLongSelectors += analysis.longSelectors.length;
    report.summary.totalSuggestions += allSuggestions.length;

    report.files.push(fileReport);
  }

  return report;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Analizando selectores CSS para optimización...\n');

  const analyses = [];

  for (const file of CSS_FILES) {
    if (fs.existsSync(file.path)) {
      console.log(`📄 Analizando: ${file.path}`);
      const analysis = analyzeCSSFile(file.path);
      analyses.push(analysis);
      console.log(`   - ${analysis.totalSelectors} selectores`);
      console.log(`   - ${analysis.highSpecificity.length} alta especificidad`);
      console.log(`   - ${analysis.longSelectors.length} selectores largos\n`);
    } else {
      console.warn(`⚠️  Archivo no encontrado: ${file.path}`);
    }
  }

  // Generar reporte
  const report = generateOptimizationReport(analyses);

  // Guardar reporte JSON
  const reportPath = 'docs/css-optimization-suggestions-phase2.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Reporte guardado en: ${reportPath}`);

  // Generar reporte Markdown
  const mdReport = generateMarkdownReport(report);
  const mdPath = 'docs/css-optimization-suggestions-phase2.md';
  fs.writeFileSync(mdPath, mdReport);
  console.log(`✅ Reporte Markdown guardado en: ${mdPath}`);

  console.log('\n📊 Resumen:');
  console.log(`   - Total selectores de alta especificidad: ${report.summary.totalHighSpecificity}`);
  console.log(`   - Total selectores largos: ${report.summary.totalLongSelectors}`);
  console.log(`   - Total sugerencias de optimización: ${report.summary.totalSuggestions}`);
}

/**
 * Genera un reporte en formato Markdown
 */
function generateMarkdownReport(report) {
  let md = `# Reporte de Optimización de Selectores CSS - FASE 2\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-AR')}\n\n`;
  md += `## Resumen\n\n`;
  md += `- **Archivos analizados:** ${report.summary.totalFiles}\n`;
  md += `- **Selectores de alta especificidad:** ${report.summary.totalHighSpecificity}\n`;
  md += `- **Selectores largos:** ${report.summary.totalLongSelectors}\n`;
  md += `- **Total sugerencias:** ${report.summary.totalSuggestions}\n\n`;

  for (const file of report.files) {
    md += `## ${file.filePath}\n\n`;
    md += `### Estadísticas\n\n`;
    md += `- **Total selectores:** ${file.totalSelectors}\n`;
    md += `- **Alta especificidad:** ${file.highSpecificityCount}\n`;
    md += `- **Selectores largos:** ${file.longSelectorsCount}\n\n`;

    if (file.highSpecificity.length > 0) {
      md += `### Selectores de Alta Especificidad (Top 10)\n\n`;
      for (const item of file.highSpecificity) {
        md += `#### \`${item.selector}\`\n\n`;
        md += `- **Especificidad:** (${item.specificity.a}, ${item.specificity.b}, ${item.specificity.c})\n`;
        md += `- **Puntaje:** ${item.score}\n\n`;
        if (item.suggestions.length > 0) {
          md += `**Sugerencias:**\n\n`;
          for (const suggestion of item.suggestions) {
            md += `- **[${suggestion.priority.toUpperCase()}]** ${suggestion.description}\n`;
            md += `  - ${suggestion.suggestion}\n`;
          }
          md += `\n`;
        }
      }
    }

    if (file.longSelectors.length > 0) {
      md += `### Selectores Largos (Top 10)\n\n`;
      for (const item of file.longSelectors) {
        md += `#### \`${item.selector}\`\n\n`;
        md += `- **Longitud:** ${item.length} caracteres\n\n`;
        if (item.suggestions.length > 0) {
          md += `**Sugerencias:**\n\n`;
          for (const suggestion of item.suggestions) {
            md += `- **[${suggestion.priority.toUpperCase()}]** ${suggestion.description}\n`;
            md += `  - ${suggestion.suggestion}\n`;
          }
          md += `\n`;
        }
      }
    }

    if (file.topSuggestions.length > 0) {
      md += `### Principales Sugerencias de Optimización\n\n`;
      for (const suggestion of file.topSuggestions) {
        md += `- **[${suggestion.priority.toUpperCase()}]** ${suggestion.description}\n`;
        md += `  - ${suggestion.suggestion}\n`;
      }
      md += `\n`;
    }
  }

  return md;
}

// Ejecutar
main();
