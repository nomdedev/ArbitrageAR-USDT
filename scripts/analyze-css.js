/**
 * CSS Analyzer - Analiza y optimiza el archivo CSS
 * Encuentra duplicados, selectores no usados, y sugiere optimizaciones
 */

const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../src/popup.css');
const htmlPath = path.join(__dirname, '../src/popup.html');

function analyzeCSS() {
  const css = fs.readFileSync(cssPath, 'utf8');
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  const lines = css.split('\n');
  console.log(`\n📊 ANÁLISIS DE CSS - popup.css`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📄 Total de líneas: ${lines.length}`);
  
  // 1. Contar selectores
  const selectorRegex = /^([.#]?[\w-]+(?:\s*,\s*[.#]?[\w-]+)*)\s*\{/gm;
  const selectors = [];
  let match;
  while ((match = selectorRegex.exec(css)) !== null) {
    selectors.push(match[1].trim());
  }
  console.log(`🎯 Total de selectores: ${selectors.length}`);
  
  // 2. Encontrar selectores duplicados
  const selectorCounts = {};
  selectors.forEach(s => {
    selectorCounts[s] = (selectorCounts[s] || 0) + 1;
  });
  
  const duplicates = Object.entries(selectorCounts)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);
  
  console.log(`\n🔁 SELECTORES DUPLICADOS (${duplicates.length}):`);
  duplicates.slice(0, 20).forEach(([selector, count]) => {
    console.log(`   ${count}x - ${selector}`);
  });
  
  // 3. Encontrar clases no usadas en HTML
  const classRegex = /\.([a-zA-Z][\w-]*)/g;
  const cssClasses = new Set();
  while ((match = classRegex.exec(css)) !== null) {
    cssClasses.add(match[1]);
  }
  
  const unusedClasses = [];
  cssClasses.forEach(className => {
    // Buscar en HTML (class="..." o class='...')
    const inClass = html.includes(`class="${className}"`) || 
                    html.includes(`class='${className}'`) ||
                    html.includes(` ${className}"`) ||
                    html.includes(` ${className}'`) ||
                    html.includes(`"${className} `) ||
                    html.includes(`'${className} `);
    // Buscar uso dinámico en JS (classList.add, etc)
    const inDynamic = html.includes(`'${className}'`) || 
                      html.includes(`"${className}"`);
    
    if (!inClass && !inDynamic) {
      unusedClasses.push(className);
    }
  });
  
  console.log(`\n⚠️ CLASES POTENCIALMENTE NO USADAS (${unusedClasses.length}):`);
  unusedClasses.slice(0, 30).forEach(c => console.log(`   .${c}`));
  
  // 4. Analizar valores hardcodeados repetidos
  const colorRegex = /#[0-9a-fA-F]{3,8}\b/g;
  const colors = {};
  while ((match = colorRegex.exec(css)) !== null) {
    const color = match[0].toLowerCase();
    colors[color] = (colors[color] || 0) + 1;
  }
  
  const repeatedColors = Object.entries(colors)
    .filter(([_, count]) => count > 3)
    .sort((a, b) => b[1] - a[1]);
  
  console.log(`\n🎨 COLORES REPETIDOS (${repeatedColors.length} con >3 usos):`);
  repeatedColors.slice(0, 15).forEach(([color, count]) => {
    console.log(`   ${count}x - ${color}`);
  });
  
  // 5. Contar media queries
  const mediaQueries = (css.match(/@media/g) || []).length;
  console.log(`\n📱 Media queries: ${mediaQueries}`);
  
  // 6. Contar animaciones
  const animations = (css.match(/@keyframes/g) || []).length;
  console.log(`🎬 Keyframes: ${animations}`);
  
  // 7. Calcular estimación de reducción
  const potentialReduction = duplicates.reduce((acc, [_, count]) => acc + (count - 1) * 5, 0);
  console.log(`\n💡 ESTIMACIÓN DE OPTIMIZACIÓN:`);
  console.log(`   Líneas por duplicados: ~${potentialReduction}`);
  console.log(`   Clases no usadas: ~${unusedClasses.length * 10}`);
  console.log(`   Objetivo: <3000 líneas (reducir ${lines.length - 3000})`);
  
  // Guardar reporte
  const report = {
    totalLines: lines.length,
    totalSelectors: selectors.length,
    duplicateSelectors: duplicates,
    unusedClasses: unusedClasses,
    repeatedColors: repeatedColors,
    mediaQueries,
    animations
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../docs/css-analysis-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n✅ Reporte guardado en docs/css-analysis-report.json`);
}

analyzeCSS();
