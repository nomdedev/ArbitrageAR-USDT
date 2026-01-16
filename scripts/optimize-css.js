/**
 * CSS Optimizer - Genera versión optimizada del CSS
 * Elimina selectores duplicados y consolida estilos
 */

const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../src/popup.css');
const outputPath = path.join(__dirname, '../src/popup.optimized.css');

function optimizeCSS() {
  let css = fs.readFileSync(cssPath, 'utf8');
  const originalLines = css.split('\n').length;
  
  console.log(`\n🔧 OPTIMIZACIÓN DE CSS`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📄 Líneas originales: ${originalLines}`);
  
  // 1. Eliminar comentarios multilínea vacíos
  css = css.replace(/\/\*\s*\*\//g, '');
  
  // 2. Eliminar líneas vacías múltiples (más de 2 seguidas)
  css = css.replace(/\n{3,}/g, '\n\n');
  
  // 3. Eliminar espacios al final de línea
  css = css.replace(/[ \t]+$/gm, '');
  
  // 4. Consolidar declaraciones duplicadas (encontrar y reportar)
  const rules = new Map();
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match;
  const duplicates = [];
  
  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();
    
    if (rules.has(selector)) {
      duplicates.push(selector);
    } else {
      rules.set(selector, body);
    }
  }
  
  // 5. Eliminar reglas @keyframes duplicadas
  const keyframesCounts = {};
  const keyframesRegex = /@keyframes\s+([\w-]+)/g;
  while ((match = keyframesRegex.exec(css)) !== null) {
    const name = match[1];
    keyframesCounts[name] = (keyframesCounts[name] || 0) + 1;
  }
  
  const duplicateKeyframes = Object.entries(keyframesCounts)
    .filter(([_, count]) => count > 1);
  
  // Eliminar keyframes duplicados (mantener solo el primero)
  duplicateKeyframes.forEach(([name]) => {
    const regex = new RegExp(`(@keyframes\\s+${name}\\s*\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\})`, 'g');
    let count = 0;
    css = css.replace(regex, (match) => {
      count++;
      return count === 1 ? match : '/* Duplicado eliminado */';
    });
  });
  
  // 6. Eliminar comentarios de duplicados eliminados
  css = css.replace(/\/\* Duplicado eliminado \*\/\s*/g, '');
  
  // 7. Comprimir valores repetidos que usan variables
  // Reemplazar colores hardcodeados por variables existentes
  const colorReplacements = [
    { color: '#3b82f6', variable: 'var(--primary-blue)' },
    { color: '#10b981', variable: 'var(--profit-green)' },
    { color: '#ef4444', variable: 'var(--loss-red)' },
    { color: '#e1e8ed', variable: 'var(--text-primary)' },
    { color: '#94a3b8', variable: 'var(--text-secondary)' },
    { color: '#60a5fa', variable: 'var(--primary-blue-light)' },
    { color: '#059669', variable: 'var(--profit-green-dark)' },
    { color: '#fbbf24', variable: 'var(--warning)' },
    { color: '#f59e0b', variable: 'var(--warning)' },
    { color: '#cbd5e1', variable: 'var(--text-secondary)' },
  ];
  
  // Solo reemplazar fuera de :root
  const rootEnd = css.indexOf('}', css.indexOf(':root'));
  const beforeRoot = css.substring(0, rootEnd + 1);
  let afterRoot = css.substring(rootEnd + 1);
  
  colorReplacements.forEach(({ color, variable }) => {
    // Solo reemplazar en propiedades (no en comentarios ni variables)
    const regex = new RegExp(`:\\s*${color}(?![0-9a-f])`, 'gi');
    afterRoot = afterRoot.replace(regex, `: ${variable}`);
  });
  
  css = beforeRoot + afterRoot;
  
  // Contar líneas finales
  const optimizedLines = css.split('\n').length;
  const reduction = originalLines - optimizedLines;
  const percentage = ((reduction / originalLines) * 100).toFixed(1);
  
  console.log(`\n📊 RESULTADOS:`);
  console.log(`   Líneas optimizadas: ${optimizedLines}`);
  console.log(`   Reducción: ${reduction} líneas (${percentage}%)`);
  console.log(`   Selectores duplicados encontrados: ${duplicates.length}`);
  console.log(`   Keyframes duplicados eliminados: ${duplicateKeyframes.length}`);
  
  // Guardar versión optimizada
  fs.writeFileSync(outputPath, css);
  console.log(`\n✅ Guardado en: src/popup.optimized.css`);
  
  // Mostrar top selectores duplicados
  if (duplicates.length > 0) {
    console.log(`\n⚠️ TOP 10 SELECTORES DUPLICADOS (revisar manualmente):`);
    const uniqueDuplicates = [...new Set(duplicates)];
    uniqueDuplicates.slice(0, 10).forEach(s => console.log(`   - ${s}`));
  }
  
  return { originalLines, optimizedLines, reduction, percentage };
}

optimizeCSS();
