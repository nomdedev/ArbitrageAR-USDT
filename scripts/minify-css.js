/**
 * Script para minificar CSS - FASE 5
 * Comprime CSS eliminando espacios, comentarios, y optimizando la sintaxis
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
 * Minifica contenido CSS
 */
function minifyCSS(css) {
  let minified = css;

  // 1. Eliminar comentarios
  minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

  // 2. Eliminar espacios extra alrededor de selectores y propiedades
  minified = minified.replace(/\s*{\s*/g, '{');
  minified = minified.replace(/\s*}\s*/g, '}');
  minified = minified.replace(/\s*;\s*/g, ';');
  minified = minified.replace(/\s*:\s*/g, ':');
  minified = minified.replace(/\s*,\s*/g, ',');

  // 3. Eliminar espacios en blanco y nuevas líneas
  minified = minified.replace(/\s+/g, ' ');

  // 4. Eliminar espacios al inicio y final
  minified = minified.trim();

  // 5. Eliminar último punto y coma antes de cerrar llave
  minified = minified.replace(/;}/g, '}');

  // 6. Optimizar ceros
  minified = minified.replace(/: 0px/g, ': 0');
  minified = minified.replace(/: 0em/g, ': 0');
  minified = minified.replace(/: 0rem/g, ': 0');
  minified = minified.replace(/: 0%/g, ': 0');

  // 7. Optimizar colores hexadecimales
  minified = minified.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');

  // 8. Eliminar comillas en URLs cuando sea seguro
  minified = minified.replace(/url\("([^"]+)"\)/gi, 'url($1)');
  minified = minified.replace(/url\('([^']+)'\)/gi, 'url($1)');

  return minified;
}

/**
 * Calcula estadísticas de compresión
 */
function calculateCompressionStats(original, minified) {
  const originalSize = Buffer.byteLength(original, 'utf8');
  const minifiedSize = Buffer.byteLength(minified, 'utf8');
  const reduction = originalSize - minifiedSize;
  const reductionPercent = ((reduction / originalSize) * 100).toFixed(2);

  return {
    originalSize,
    minifiedSize,
    reduction,
    reductionPercent
  };
}

/**
 * Main function
 */
function main() {
  console.log('🗜️  Minificando archivos CSS...\n');

  const results = [];
  let totalOriginalSize = 0;
  let totalMinifiedSize = 0;
  let totalReduction = 0;

  // Crear directorio de salida
  const outputDir = 'dist/css';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const file of CSS_FILES) {
    if (fs.existsSync(file.path)) {
      console.log(`📄 Procesando: ${file.path}`);

      const originalContent = fs.readFileSync(file.path, 'utf8');
      const minifiedContent = minifyCSS(originalContent);
      const stats = calculateCompressionStats(originalContent, minifiedContent);

      // Guardar versión minificada
      const outputPath = path.join(outputDir, path.basename(file.path));
      fs.writeFileSync(outputPath, minifiedContent);

      console.log(`   Original: ${formatBytes(stats.originalSize)}`);
      console.log(`   Minificado: ${formatBytes(stats.minifiedSize)}`);
      console.log(`   Reducción: ${formatBytes(stats.reduction)} (${stats.reductionPercent}%)\n`);

      totalOriginalSize += stats.originalSize;
      totalMinifiedSize += stats.minifiedSize;
      totalReduction += stats.reduction;

      results.push({
        filePath: file.path,
        outputPath,
        stats
      });
    } else {
      console.warn(`⚠️  Archivo no encontrado: ${file.path}`);
    }
  }

  // Generar reporte
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      totalOriginalSize,
      totalMinifiedSize,
      totalReduction,
      totalReductionPercent: ((totalReduction / totalOriginalSize) * 100).toFixed(2)
    },
    files: results
  };

  // Guardar reporte JSON
  const reportPath = 'docs/css-minification-report-phase5.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Reporte guardado en: ${reportPath}`);

  // Generar reporte Markdown
  const mdReport = generateMarkdownReport(report);
  const mdPath = 'docs/css-minification-report-phase5.md';
  fs.writeFileSync(mdPath, mdReport);
  console.log(`✅ Reporte Markdown guardado en: ${mdPath}`);

  console.log('\n📊 Resumen Total:');
  console.log(`   - Tamaño original: ${formatBytes(totalOriginalSize)}`);
  console.log(`   - Tamaño minificado: ${formatBytes(totalMinifiedSize)}`);
  console.log(`   - Reducción total: ${formatBytes(totalReduction)} (${report.summary.totalReductionPercent}%)\n`);
  console.log(`✅ Archivos minificados guardados en: ${outputDir}/`);
}

/**
 * Formatea bytes a formato legible
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Genera un reporte en formato Markdown
 */
function generateMarkdownReport(report) {
  let md = `# Reporte de Minificación de CSS - FASE 5\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-AR')}\n\n`;
  md += `## Resumen\n\n`;
  md += `- **Archivos procesados:** ${report.summary.totalFiles}\n`;
  md += `- **Tamaño original:** ${formatBytes(report.summary.totalOriginalSize)}\n`;
  md += `- **Tamaño minificado:** ${formatBytes(report.summary.totalMinifiedSize)}\n`;
  md += `- **Reducción:** ${formatBytes(report.summary.totalReduction)} (${report.summary.totalReductionPercent}%)\n\n`;

  md += `## Archivos Minificados\n\n`;
  md += `| Archivo | Original | Minificado | Reducción | % |\n`;
  md += `|---------|----------|------------|-----------|---|\n`;

  for (const file of report.files) {
    md += `| ${file.filePath} | ${formatBytes(file.stats.originalSize)} | ${formatBytes(file.stats.minifiedSize)} | ${formatBytes(file.stats.reduction)} | ${file.stats.reductionPercent}% |\n`;
  }

  md += `\n## Optimizaciones Aplicadas\n\n`;
  md += `1. **Eliminación de comentarios** - Todos los comentarios CSS fueron eliminados\n`;
  md += `2. **Eliminación de espacios en blanco** - Espacios, tabs y nuevas líneas fueron removidos\n`;
  md += `3. **Optimización de ceros** - \`0px\` → \`0\`, \`0em\` → \`0\`, \`0rem\` → \`0\`\n`;
  md += `4. **Optimización de colores** - \`#ffffff\` → \`#fff\`, \`#000000\` → \`#000\`\n`;
  md += `5. **Eliminación de comillas en URLs** - \`url("image.png")\` → \`url(image.png)\`\n`;
  md += `6. **Eliminación de punto y coma final** - \`}\` en lugar de \`}\`\n\n`;

  md += `## Uso en Producción\n\n`;
  md += `Los archivos minificados están disponibles en \`dist/css/\` y pueden ser usados directamente en producción.\n\n`;
  md += `Para usar los archivos minificados, actualiza las referencias en tu HTML:\n\n`;
  md += `\`\`\`html\n`;
  md += `<!-- Antes -->\n`;
  md += `<link rel="stylesheet" href="src/popup.css">\n\n`;
  md += `<!-- Después -->\n`;
  md += `<link rel="stylesheet" href="dist/css/popup.css">\n`;
  md += `\`\`\`\n`;

  return md;
}

// Ejecutar
main();
