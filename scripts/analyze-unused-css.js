#!/usr/bin/env node
/**
 * Script para analizar CSS no utilizado en el proyecto ArbitrageAR-USDT
 * Compara las clases utilizadas en popup.html con las definidas en los archivos CSS
 */

const fs = require('fs');
const path = require('path');

// Configuración
const HTML_FILE = 'src/popup.html';
const CSS_FILES = [
  'src/popup.css',
  'src/ui-components/design-system.css',
  'src/ui-components/animations.css',
  'src/ui-components/header.css',
  'src/ui-components/exchange-card.css',
  'src/ui-components/arbitrage-panel.css',
  'src/ui-components/tabs.css',
  'src/ui-components/loading-states.css'
];

/**
 * Extrae todas las clases CSS utilizadas en un archivo HTML
 */
function extractClassesFromHTML(html) {
  // Extraer clases de atributos class="..."
  const classRegex = /class=["']([^"']+)["']/g;
  const classes = new Set();
  let match;

  while ((match = classRegex.exec(html)) !== null) {
    const classList = match[1].split(/\s+/).filter(c => c.trim());
    classList.forEach(cls => classes.add(cls));
  }

  // Extraer IDs de atributos id="..."
  const idRegex = /id=["']([^"']+)["']/g;
  const ids = new Set();
  while ((match = idRegex.exec(html)) !== null) {
    ids.add(match[1]);
  }

  // Extraer selectores de elementos
  const elementRegex = /<([a-z][a-z0-9]*)/gi;
  const elements = new Set();
  while ((match = elementRegex.exec(html)) !== null) {
    elements.add(match[1].toLowerCase());
  }

  return { classes, ids, elements };
}

/**
 * Extrae todos los selectores CSS de un archivo CSS
 */
function extractSelectorsFromCSS(css) {
  const selectors = new Set();

  // Extraer selectores de clase .classname
  const classSelectorRegex = /\.([a-zA-Z_][\w-]*)/g;
  let match;
  while ((match = classSelectorRegex.exec(css)) !== null) {
    selectors.add('.' + match[1]);
  }

  // Extraer selectores de ID #idname
  const idSelectorRegex = /#([a-zA-Z_][\w-]*)/g;
  while ((match = idSelectorRegex.exec(css)) !== null) {
    selectors.add('#' + match[1]);
  }

  // Extraer selectores de elemento element
  const elementSelectorRegex = /([a-z][a-z0-9]*)\s*[{,]/gi;
  while ((match = elementSelectorRegex.exec(css)) !== null) {
    const element = match[1].toLowerCase();
    // Excluir palabras clave de CSS
    if (!['from', 'to', 'media', 'keyframes', 'webkit', 'moz', 'ms'].includes(element)) {
      selectors.add(element);
    }
  }

  // Extraer selectores de atributo [attr], [attr=value]
  const attrSelectorRegex = /\[([^\]]+)\]/g;
  while ((match = attrSelectorRegex.exec(css)) !== null) {
    selectors.add('[' + match[1] + ']');
  }

  // Extraer pseudo-clases y pseudo-elementos
  const pseudoRegex = /::?([a-z-]+)/gi;
  while ((match = pseudoRegex.exec(css)) !== null) {
    // No agregamos pseudo-clases como selectores separados
  }

  return selectors;
}

/**
 * Analiza un archivo CSS y encuentra reglas no utilizadas
 */
function analyzeCSS(cssFilePath, usedClasses, usedIds, usedElements) {
  const css = fs.readFileSync(cssFilePath, 'utf-8');
  const selectors = extractSelectorsFromCSS(css);
  const unusedSelectors = [];
  const usedSelectors = [];

  for (const selector of selectors) {
    let isUsed = false;

    // Verificar si es un selector de clase
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      isUsed = usedClasses.has(className);
    }
    // Verificar si es un selector de ID
    else if (selector.startsWith('#')) {
      const idName = selector.substring(1);
      isUsed = usedIds.has(idName);
    }
    // Verificar si es un selector de elemento
    else if (selector.startsWith('[')) {
      // Selectores de atributo - asumimos usados si tienen patrones comunes
      isUsed = true;
    }
    // Selector de elemento
    else {
      isUsed = usedElements.has(selector);
    }

    if (isUsed) {
      usedSelectors.push(selector);
    } else {
      unusedSelectors.push(selector);
    }
  }

  return {
    file: cssFilePath,
    total: selectors.size,
    used: usedSelectors.length,
    unused: unusedSelectors.length,
    unusedSelectors,
    usedSelectors
  };
}

/**
 * Busca reglas CSS completas que no se utilizan
 */
function findUnusedRules(cssFilePath, unusedSelectors) {
  const css = fs.readFileSync(cssFilePath, 'utf-8');
  const unusedRules = [];

  // Dividir el CSS en reglas
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = ruleRegex.exec(css)) !== null) {
    const selectorPart = match[1].trim();
    const declarationPart = match[2].trim();

    // Extraer selectores de esta regla
    const ruleSelectors = selectorPart.split(',').map(s => s.trim());

    // Verificar si algún selector de esta regla está en unusedSelectors
    const hasUnusedSelector = ruleSelectors.some(selector => {
      // Simplificar el selector para comparación
      const simpleSelector = selector
        .replace(/::[a-z-]+/gi, '') // Remover pseudo-elementos
        .replace(/:[a-z-]+(\([^)]*\))?/gi, '') // Remover pseudo-clases
        .replace(/\s*[>+~]\s*/g, ' ') // Simplificar combinadores
        .trim();

      // Verificar si el selector simplificado está en unusedSelectors
      return unusedSelectors.some(unused => {
        if (unused.startsWith('.')) {
          return simpleSelector.includes(unused);
        }
        if (unused.startsWith('#')) {
          return simpleSelector.includes(unused);
        }
        return simpleSelector === unused;
      });
    });

    if (hasUnusedSelector) {
      unusedRules.push({
        selector: selectorPart,
        declarations: declarationPart,
        fullRule: match[0]
      });
    }
  }

  return unusedRules;
}

/**
 * Función principal
 */
function main() {
  console.log('🔍 Analizando CSS no utilizado en ArbitrageAR-USDT\n');

  // Leer HTML
  console.log('📄 Leyendo popup.html...');
  const html = fs.readFileSync(HTML_FILE, 'utf-8');
  const { classes, ids, elements } = extractClassesFromHTML(html);

  console.log(`   ✓ ${classes.size} clases encontradas`);
  console.log(`   ✓ ${ids.size} IDs encontrados`);
  console.log(`   ✓ ${elements.size} elementos encontrados\n`);

  // Analizar cada archivo CSS
  const results = [];
  let totalSelectors = 0;
  let totalUnused = 0;

  for (const cssFile of CSS_FILES) {
    if (!fs.existsSync(cssFile)) {
      console.log(`⚠️  Archivo no encontrado: ${cssFile}`);
      continue;
    }

    console.log(`📊 Analizando ${cssFile}...`);
    const result = analyzeCSS(cssFile, classes, ids, elements);
    results.push(result);
    totalSelectors += result.total;
    totalUnused += result.unused;

    console.log(`   Total: ${result.total} | Usados: ${result.used} | No usados: ${result.unused}`);

    if (result.unused > 0 && result.unused <= 20) {
      console.log(`   Selectores no utilizados: ${result.unusedSelectors.slice(0, 10).join(', ')}${result.unusedSelectors.length > 10 ? '...' : ''}`);
    }
    console.log('');
  }

  // Resumen
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📈 RESUMEN');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total selectores CSS: ${totalSelectors}`);
  console.log(`Selectores usados: ${totalSelectors - totalUnused}`);
  console.log(`Selectores NO usados: ${totalUnused}`);
  console.log(`Porcentaje utilizado: ${((totalSelectors - totalUnused) / totalSelectors * 100).toFixed(1)}%`);
  console.log(`Porcentaje NO utilizado: ${(totalUnused / totalSelectors * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Guardar resultados detallados en JSON
  const outputPath = 'docs/css-unused-analysis.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    htmlAnalysis: {
      classes: Array.from(classes),
      ids: Array.from(ids),
      elements: Array.from(elements)
    },
    cssAnalysis: results.map(r => ({
      file: r.file,
      total: r.total,
      used: r.used,
      unused: r.unused,
      unusedSelectors: r.unusedSelectors,
      usedSelectors: r.usedSelectors
    }))
  }, null, 2));

  console.log(`✅ Análisis guardado en: ${outputPath}`);

  // Generar reporte de reglas a eliminar
  const eliminationReport = [];
  for (const result of results) {
    if (result.unused > 0) {
      const unusedRules = findUnusedRules(result.file, result.unusedSelectors);
      if (unusedRules.length > 0) {
        eliminationReport.push({
          file: result.file,
          rules: unusedRules
        });
      }
    }
  }

  if (eliminationReport.length > 0) {
    const reportPath = 'docs/css-elimination-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(eliminationReport, null, 2));
    console.log(`📝 Reporte de eliminación guardado en: ${reportPath}`);
  }

  console.log('\n✨ Análisis completado!\n');
}

// Ejecutar
main();
