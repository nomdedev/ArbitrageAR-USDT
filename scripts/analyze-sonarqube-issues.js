#!/usr/bin/env node

/**
 * Analizador de problemas de SonarQube para CSS
 * Detecta problemas comunes que SonarQube suele reportar
 */

const fs = require('fs');
const path = require('path');

// Función para calcular el contraste entre dos colores
function calculateContrast(color1, color2) {
  // Convertir hex a RGB
  const hex2rgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb1 = hex2rgb(color1);
  const rgb2 = hex2rgb(color2);

  if (!rgb1 || !rgb2) return null;

  // Calcular luminancia relativa
  const getLuminance = (rgb) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

// Función para analizar un archivo CSS
function analyzeCSSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const issues = [];
  const colorDeclarations = [];
  
  // Patrones para buscar colores y fondos
  const colorPattern = /color:\s*(#[0-9a-fA-F]{3,6}|white|black|\w+)/g;
  const backgroundPattern = /background(?:-color)?:\s*(#[0-9a-fA-F]{3,6}|white|black|\w+|linear-gradient\([^)]+\))/g;
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Buscar declaraciones de color
    let colorMatch;
    while ((colorMatch = colorPattern.exec(line)) !== null) {
      const color = colorMatch[1];
      colorDeclarations.push({
        line: lineNumber,
        color: color,
        fullLine: line.trim()
      });
      
      // Verificar si es un color hardcodeado que podría ser problema
      if (color === 'white' || color === 'black') {
        issues.push({
          type: 'Hardcoded color',
          line: lineNumber,
          message: `Color hardcodeado "${color}" detectado. Considerar usar variables CSS.`,
          code: line.trim()
        });
      }
    }
    
    // Buscar fondos que podrían tener problemas de contraste
    let bgMatch;
    while ((bgMatch = backgroundPattern.exec(line)) !== null) {
      const background = bgMatch[1];
      
      // Si hay un color hardcodeado en el fondo
      if (background === 'white' || background === 'black') {
        issues.push({
          type: 'Hardcoded background',
          line: lineNumber,
          message: `Background hardcodeado "${background}" detectado. Considerar usar variables CSS.`,
          code: line.trim()
        });
      }
    }
    
    // Buscar !important que podría ser problema
    if (line.includes('!important')) {
      issues.push({
        type: 'CSS !important usage',
        line: lineNumber,
        message: 'Uso de !important detectado. Considerar refactorizar la especificidad CSS.',
        code: line.trim()
      });
    }
    
    // Buscar selectores muy específicos
    const selectorSpecificity = line.match(/([.#][\w-]+){3,}/);
    if (selectorSpecificity) {
      issues.push({
        type: 'High selector specificity',
        line: lineNumber,
        message: 'Selector con alta especificidad detectado. Considerar simplificar.',
        code: line.trim()
      });
    }
    
    // Buscar propiedades duplicadas
    const duplicateProps = line.match(/(\w+):\s*[^;]+;\s*\1:\s*[^;]+/);
    if (duplicateProps) {
      issues.push({
        type: 'Duplicate CSS property',
        line: lineNumber,
        message: `Propiedad CSS duplicada: ${duplicateProps[1]}`,
        code: line.trim()
      });
    }
  });
  
  // Analizar contraste de color (simplificado)
  colorDeclarations.forEach((decl, index) => {
    // Buscar si hay un fondo en la misma regla
    const ruleStart = Math.max(0, index - 5);
    const ruleEnd = Math.min(lines.length - 1, index + 5);
    
    for (let i = ruleStart; i <= ruleEnd; i++) {
      if (i === index) continue;
      
      const bgMatch = backgroundPattern.exec(lines[i]);
      if (bgMatch) {
        const background = bgMatch[1];
        
        // Si ambos son colores hex, verificar contraste
        if (decl.color.startsWith('#') && background.startsWith('#')) {
          const contrast = calculateContrast(decl.color, background);
          
          if (contrast !== null && contrast < 4.5) {
            issues.push({
              type: 'Low contrast (css:S7924)',
              line: decl.line,
              message: `Contraste bajo (${contrast.toFixed(2)}) entre color ${decl.color} y fondo ${background}. WCAG requiere mínimo 4.5:1.`,
              code: `${lines[decl.line - 1].trim()} / ${lines[i].trim()}`
            });
          }
        }
      }
    }
  });
  
  return issues;
}

// Función principal
function main() {
  console.log('🔍 Analizando problemas de SonarQube en CSS...\n');
  
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
  
  const allIssues = [];
  
  cssFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`📁 Analizando: ${file}`);
      const issues = analyzeCSSFile(file);
      
      if (issues.length > 0) {
        console.log(`   ⚠️  ${issues.length} problemas encontrados:`);
        issues.forEach(issue => {
          console.log(`      [Línea ${issue.line}] ${issue.type}: ${issue.message}`);
          console.log(`         Código: ${issue.code}`);
        });
        allIssues.push({ file, issues });
      } else {
        console.log(`   ✅ Sin problemas detectados`);
      }
      console.log('');
    }
  });
  
  // Resumen
  console.log('📊 RESUMEN DE PROBLEMAS:');
  console.log(`Total de archivos analizados: ${cssFiles.length}`);
  console.log(`Total de problemas encontrados: ${allIssues.reduce((sum, f) => sum + f.issues.length, 0)}`);
  
  if (allIssues.length > 0) {
    console.log('\n🔧 TIPOS DE PROBLEMAS:');
    const issueTypes = {};
    allIssues.forEach(file => {
      file.issues.forEach(issue => {
        issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
      });
    });
    
    Object.entries(issueTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  }
  
  console.log('\n✨ Análisis completado.');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { analyzeCSSFile };