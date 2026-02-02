/**
 * Script para consolidar reglas duplicadas - FASE 3
 * Detecta y consolida reglas CSS duplicadas o redundantes
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

/**
 * Parsea una regla CSS individual
 */
function parseCSSRule(ruleText) {
  // Extraer selector y propiedades
  const firstBrace = ruleText.indexOf('{');
  if (firstBrace === -1) return null;

  const selector = ruleText.substring(0, firstBrace).trim();
  const propertiesText = ruleText.substring(firstBrace + 1, ruleText.lastIndexOf('}')).trim();

  // Extraer propiedades individuales
  const properties = {};
  const propertyRegex = /([a-z-]+)\s*:\s*([^;]+);/gi;
  let match;

  while ((match = propertyRegex.exec(propertiesText)) !== null) {
    const property = match[1].trim();
    const value = match[2].trim();
    properties[property] = value;
  }

  return {
    selector,
    properties,
    propertyCount: Object.keys(properties).length,
    fullRule: ruleText.trim()
  };
}

/**
 * Normaliza un selector para comparación
 */
function normalizeSelector(selector) {
  return selector
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compara dos conjuntos de propiedades
 */
function compareProperties(props1, props2) {
  const keys1 = Object.keys(props1);
  const keys2 = Object.keys(props2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (props1[key] !== props2[key]) return false;
  }

  return true;
}

/**
 * Encuentra propiedades duplicadas entre selectores
 */
function findDuplicateProperties(rules) {
  const duplicates = [];
  const propertyMap = new Map();

  // Agrupar selectores por sus propiedades
  for (const rule of rules) {
    if (!rule.selector || rule.propertyCount === 0) continue;

    // Crear una clave única basada en las propiedades ordenadas
    const propsKey = Object.entries(rule.properties)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');

    if (!propertyMap.has(propsKey)) {
      propertyMap.set(propsKey, []);
    }
    propertyMap.get(propsKey).push(rule);
  }

  // Encontrar duplicados
  for (const [propsKey, ruleList] of propertyMap) {
    if (ruleList.length > 1) {
      duplicates.push({
        properties: ruleList[0].properties,
        selectors: ruleList.map(r => r.selector),
        count: ruleList.length,
        canMerge: true
      });
    }
  }

  return duplicates;
}

/**
 * Encuentra selectores con propiedades superpuestas
 */
function findOverlappingProperties(rules) {
  const overlaps = [];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const rule1 = rules[i];
      const rule2 = rules[j];

      if (!rule1.selector || !rule2.selector) continue;
      if (rule1.selector === rule2.selector) continue;

      // Encontrar propiedades comunes
      const commonProps = {};
      for (const [key, value] of Object.entries(rule1.properties)) {
        if (rule2.properties[key] === value) {
          commonProps[key] = value;
        }
      }

      if (Object.keys(commonProps).length > 0) {
        const overlapPercent = (Object.keys(commonProps).length / 
          Math.max(rule1.propertyCount, rule2.propertyCount)) * 100;

        if (overlapPercent >= 30) { // Al menos 30% de superposición
          overlaps.push({
            selector1: rule1.selector,
            selector2: rule2.selector,
            commonProperties: commonProps,
            overlapPercent: overlapPercent.toFixed(1),
            recommendation: overlapPercent > 70 ? 'merge' : 'extract_common'
          });
        }
      }
    }
  }

  return overlaps;
}

/**
 * Analiza un archivo CSS
 */
function analyzeCSSFile(filePath) {
  const cssContent = fs.readFileSync(filePath, 'utf-8');

  // Eliminar comentarios para mejor análisis
  const cssWithoutComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');

  // Extraer reglas CSS
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  const rules = [];
  let match;

  while ((match = ruleRegex.exec(cssWithoutComments)) !== null) {
    const ruleText = match[0];
    const parsed = parseCSSRule(ruleText);
    if (parsed && parsed.selector && !parsed.selector.startsWith('@')) {
      rules.push(parsed);
    }
  }

  // Encontrar duplicados y superposiciones
  const duplicates = findDuplicateProperties(rules);
  const overlaps = findOverlappingProperties(rules);

  return {
    filePath,
    totalRules: rules.length,
    duplicates,
    overlaps,
    consolidationOpportunities: duplicates.length + overlaps.length
  };
}

/**
 * Genera sugerencias de consolidación
 */
function generateConsolidationSuggestions(analysis) {
  const suggestions = [];

  // Sugerencias para duplicados exactos
  for (const dup of analysis.duplicates) {
    suggestions.push({
      type: 'exact_duplicate',
      severity: 'high',
      description: `Selector duplicado: ${dup.selectors[0]}`,
      selectors: dup.selectors,
      suggestion: `Combinar selectores: ${dup.selectors.join(', ')}`,
      properties: dup.properties
    });
  }

  // Sugerencias para superposiciones
  for (const overlap of analysis.overlaps) {
    if (overlap.recommendation === 'merge') {
      suggestions.push({
        type: 'high_overlap',
        severity: 'medium',
        description: `Alta superposición (${overlap.overlapPercent}%) entre selectores`,
        selectors: [overlap.selector1, overlap.selector2],
        suggestion: `Considerar fusionar ${overlap.selector1} y ${overlap.selector2}`,
        commonProperties: overlap.commonProperties
      });
    } else {
      suggestions.push({
        type: 'partial_overlap',
        severity: 'low',
        description: `Superposición parcial (${overlap.overlapPercent}%)`,
        selectors: [overlap.selector1, overlap.selector2],
        suggestion: `Extraer propiedades comunes a una clase compartida`,
        commonProperties: overlap.commonProperties
      });
    }
  }

  return suggestions;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Analizando reglas duplicadas en CSS...\n');

  const analyses = [];
  let totalDuplicates = 0;
  let totalOverlaps = 0;

  for (const file of CSS_FILES) {
    if (fs.existsSync(file.path)) {
      console.log(`📄 Analizando: ${file.path}`);
      const analysis = analyzeCSSFile(file.path);
      analyses.push(analysis);

      console.log(`   - ${analysis.totalRules} reglas`);
      console.log(`   - ${analysis.duplicates.length} grupos de duplicados`);
      console.log(`   - ${analysis.overlaps.length} superposiciones\n`);

      totalDuplicates += analysis.duplicates.length;
      totalOverlaps += analysis.overlaps.length;
    } else {
      console.warn(`⚠️  Archivo no encontrado: ${file.path}`);
    }
  }

  // Generar reporte
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: analyses.length,
      totalDuplicates,
      totalOverlaps,
      totalOpportunities: totalDuplicates + totalOverlaps
    },
    files: analyses.map(a => ({
      filePath: a.filePath,
      totalRules: a.totalRules,
      duplicates: a.duplicates.map(d => ({
        selectors: d.selectors,
        count: d.count
      })),
      overlaps: a.overlaps.map(o => ({
        selectors: [o.selector1, o.selector2],
        overlapPercent: o.overlapPercent,
        commonPropertyCount: Object.keys(o.commonProperties).length
      })),
      suggestions: generateConsolidationSuggestions(a)
    }))
  };

  // Guardar reporte JSON
  const reportPath = 'docs/css-consolidation-report-phase3.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Reporte guardado en: ${reportPath}`);

  // Generar reporte Markdown
  const mdReport = generateMarkdownReport(report);
  const mdPath = 'docs/css-consolidation-report-phase3.md';
  fs.writeFileSync(mdPath, mdReport);
  console.log(`✅ Reporte Markdown guardado en: ${mdPath}`);

  console.log('\n📊 Resumen:');
  console.log(`   - Total grupos de duplicados: ${totalDuplicates}`);
  console.log(`   - Total superposiciones: ${totalOverlaps}`);
  console.log(`   - Total oportunidades de consolidación: ${totalDuplicates + totalOverlaps}`);
}

/**
 * Genera un reporte en formato Markdown
 */
function generateMarkdownReport(report) {
  let md = `# Reporte de Consolidación de Reglas CSS - FASE 3\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-AR')}\n\n`;
  md += `## Resumen\n\n`;
  md += `- **Archivos analizados:** ${report.summary.totalFiles}\n`;
  md += `- **Grupos de duplicados:** ${report.summary.totalDuplicates}\n`;
  md += `- **Superposiciones:** ${report.summary.totalOverlaps}\n`;
  md += `- **Total oportunidades:** ${report.summary.totalOpportunities}\n\n`;

  for (const file of report.files) {
    md += `## ${file.filePath}\n\n`;
    md += `### Estadísticas\n\n`;
    md += `- **Total reglas:** ${file.totalRules}\n`;
    md += `- **Duplicados:** ${file.duplicates.length}\n`;
    md += `- **Superposiciones:** ${file.overlaps.length}\n\n`;

    if (file.duplicates.length > 0) {
      md += `### Duplicados Exactos\n\n`;
      for (const dup of file.duplicates) {
        md += `#### Grupo de ${dup.count} selectores\n\n`;
        md += `**Selectores:**\n\n`;
        for (const selector of dup.selectors) {
          md += `- \`${selector}\`\n`;
        }
        md += `\n**Sugerencia:** Combinar en un solo selector separado por comas\n\n`;
      }
    }

    if (file.overlaps.length > 0) {
      md += `### Superposiciones de Propiedades\n\n`;
      for (const overlap of file.overlaps) {
        md += `#### ${overlap.selectors[0]} ↔ ${overlap.selectors[1]}\n\n`;
        md += `- **Superposición:** ${overlap.overlapPercent}%\n`;
        md += `- **Propiedades comunes:** ${overlap.commonPropertyCount}\n\n`;
      }
    }

    if (file.suggestions.length > 0) {
      md += `### Sugerencias de Optimización\n\n`;
      for (const suggestion of file.suggestions) {
        md += `#### [${suggestion.severity.toUpperCase()}] ${suggestion.type}\n\n`;
        md += `${suggestion.description}\n\n`;
        md += `**Sugerencia:** ${suggestion.suggestion}\n\n`;
      }
    }
  }

  return md;
}

// Ejecutar
main();
