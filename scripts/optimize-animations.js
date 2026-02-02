/**
 * Script para optimizar animaciones CSS - FASE 4
 * Analiza y sugiere optimizaciones para animaciones usando propiedades aceleradas por GPU
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

// Propiedades que causan reflow (malas para animaciones)
const REFLOW_PROPERTIES = [
  'width', 'height', 'top', 'right', 'bottom', 'left',
  'margin', 'padding', 'border-width', 'font-size',
  'line-height', 'letter-spacing', 'word-spacing'
];

// Propiedades que causan repaint (mejor pero no óptimo)
const REPAINT_PROPERTIES = [
  'color', 'background-color', 'border-color',
  'box-shadow', 'background-image', 'background-position'
];

// Propiedades aceleradas por GPU (óptimas)
const GPU_PROPERTIES = [
  'transform', 'opacity', 'filter', 'will-change'
];

/**
 * Extrae keyframes de un archivo CSS
 */
function extractKeyframes(cssContent) {
  const keyframes = [];
  const keyframeRegex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([\s\S]*?)\n\}/g;
  let match;

  while ((match = keyframeRegex.exec(cssContent)) !== null) {
    const name = match[1];
    const content = match[2];

    // Extraer selectores de porcentaje
    const stepRegex = /(\d+%|from|to)\s*\{([^}]+)\}/g;
    const steps = [];
    let stepMatch;

    while ((stepMatch = stepRegex.exec(content)) !== null) {
      const percentage = stepMatch[1];
      const properties = stepMatch[2];

      const propertiesList = extractProperties(properties);
      steps.push({
        percentage,
        properties: propertiesList
      });
    }

    keyframes.push({
      name,
      steps,
      hasReflow: steps.some(s => s.properties.some(p => REFLOW_PROPERTIES.includes(p.property))),
      hasRepaint: steps.some(s => s.properties.some(p => REPAINT_PROPERTIES.includes(p.property))),
      hasGPU: steps.some(s => s.properties.some(p => GPU_PROPERTIES.includes(p.property)))
    });
  }

  return keyframes;
}

/**
 * Extrae propiedades de una declaración CSS
 */
function extractProperties(declaration) {
  const properties = [];
  const propertyRegex = /([a-z-]+)\s*:\s*([^;]+);/gi;
  let match;

  while ((match = propertyRegex.exec(declaration)) !== null) {
    properties.push({
      property: match[1].trim(),
      value: match[2].trim()
    });
  }

  return properties;
}

/**
 * Analiza transiciones y animaciones en reglas CSS
 */
function analyzeTransitionsAndAnimations(cssContent) {
  const transitions = [];
  const animations = [];
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cssContent)) !== null) {
    const selector = match[1].trim();
    const properties = match[2];

    // Buscar transition
    const transitionRegex = /transition\s*:\s*([^;]+);/gi;
    let transMatch;
    while ((transMatch = transitionRegex.exec(properties)) !== null) {
      const transitionValue = transMatch[1];
      const props = transitionValue.split(',').map(t => t.trim().split(/\s+/)[0]);

      transitions.push({
        selector,
        properties: props,
        hasReflow: props.some(p => REFLOW_PROPERTIES.includes(p)),
        hasRepaint: props.some(p => REPAINT_PROPERTIES.includes(p)),
        hasGPU: props.some(p => GPU_PROPERTIES.includes(p))
      });
    }

    // Buscar animation
    const animationRegex = /animation\s*:\s*([^;]+);/gi;
    let animMatch;
    while ((animMatch = animationRegex.exec(properties)) !== null) {
      animations.push({
        selector,
        value: animMatch[1]
      });
    }
  }

  return { transitions, animations };
}

/**
 * Genera sugerencias de optimización para keyframes
 */
function generateKeyframeSuggestions(keyframes) {
  const suggestions = [];

  for (const kf of keyframes) {
    if (kf.hasReflow) {
      suggestions.push({
        type: 'keyframe_reflow',
        severity: 'high',
        keyframe: kf.name,
        description: `La animación @keyframes ${kf.name} usa propiedades que causan reflow`,
        suggestion: 'Reemplazar width/height/top/left con transform: translate/scale',
        gpuAlternatives: ['transform: translate()', 'transform: scale()', 'transform: rotate()']
      });
    }

    if (kf.hasRepaint && !kf.hasGPU) {
      suggestions.push({
        type: 'keyframe_repaint',
        severity: 'medium',
        keyframe: kf.name,
        description: `La animación @keyframes ${kf.name} usa propiedades que causan repaint`,
        suggestion: 'Considerar usar opacity o filter para mejor rendimiento',
        gpuAlternatives: ['opacity', 'filter: blur()', 'filter: brightness()']
      });
    }

    if (!kf.hasGPU) {
      suggestions.push({
        type: 'keyframe_no_gpu',
        severity: 'low',
        keyframe: kf.name,
        description: `La animación @keyframes ${kf.name} no usa propiedades aceleradas por GPU`,
        suggestion: 'Agregar will-change: transform, opacity antes de la animación',
        gpuAlternatives: ['will-change: transform, opacity']
      });
    }
  }

  return suggestions;
}

/**
 * Genera sugerencias de optimización para transiciones
 */
function generateTransitionSuggestions(transitions) {
  const suggestions = [];

  for (const trans of transitions) {
    if (trans.hasReflow) {
      const reflowProps = trans.properties.filter(p => REFLOW_PROPERTIES.includes(p));
      suggestions.push({
        type: 'transition_reflow',
        severity: 'high',
        selector: trans.selector,
        properties: reflowProps,
        description: `Transición usa propiedades que causan reflow: ${reflowProps.join(', ')}`,
        suggestion: 'Reemplazar con transform para mejor rendimiento',
        gpuAlternatives: ['transform: translate()', 'transform: scale()']
      });
    }

    if (trans.hasRepaint && !trans.hasGPU) {
      suggestions.push({
        type: 'transition_repaint',
        severity: 'medium',
        selector: trans.selector,
        description: 'Transición usa propiedades que causan repaint',
        suggestion: 'Considerar usar opacity para mejor rendimiento',
        gpuAlternatives: ['opacity']
      });
    }
  }

  return suggestions;
}

/**
 * Analiza un archivo CSS
 */
function analyzeCSSFile(filePath) {
  const cssContent = fs.readFileSync(filePath, 'utf-8');

  const keyframes = extractKeyframes(cssContent);
  const { transitions, animations } = analyzeTransitionsAndAnimations(cssContent);

  const keyframeSuggestions = generateKeyframeSuggestions(keyframes);
  const transitionSuggestions = generateTransitionSuggestions(transitions);

  return {
    filePath,
    keyframes: {
      total: keyframes.length,
      withReflow: keyframes.filter(k => k.hasReflow).length,
      withRepaint: keyframes.filter(k => k.hasRepaint).length,
      withGPU: keyframes.filter(k => k.hasGPU).length,
      list: keyframes
    },
    transitions: {
      total: transitions.length,
      withReflow: transitions.filter(t => t.hasReflow).length,
      withRepaint: transitions.filter(t => t.hasRepaint).length,
      withGPU: transitions.filter(t => t.hasGPU).length
    },
    animations: {
      total: animations.length
    },
    suggestions: {
      keyframes: keyframeSuggestions,
      transitions: transitionSuggestions
    },
    totalOptimizations: keyframeSuggestions.length + transitionSuggestions.length
  };
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Analizando animaciones CSS para optimización...\n');

  const analyses = [];
  let totalKeyframes = 0;
  let totalTransitions = 0;
  let totalOptimizations = 0;

  for (const file of CSS_FILES) {
    if (fs.existsSync(file.path)) {
      console.log(`📄 Analizando: ${file.path}`);
      const analysis = analyzeCSSFile(file.path);
      analyses.push(analysis);

      console.log(`   - ${analysis.keyframes.total} keyframes`);
      console.log(`   - ${analysis.transitions.total} transiciones`);
      console.log(`   - ${analysis.totalOptimizations} optimizaciones sugeridas\n`);

      totalKeyframes += analysis.keyframes.total;
      totalTransitions += analysis.transitions.total;
      totalOptimizations += analysis.totalOptimizations;
    } else {
      console.warn(`⚠️  Archivo no encontrado: ${file.path}`);
    }
  }

  // Generar reporte
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: analyses.length,
      totalKeyframes,
      totalTransitions,
      totalOptimizations
    },
    files: analyses
  };

  // Guardar reporte JSON
  const reportPath = 'docs/css-animation-optimization-phase4.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Reporte guardado en: ${reportPath}`);

  // Generar reporte Markdown
  const mdReport = generateMarkdownReport(report);
  const mdPath = 'docs/css-animation-optimization-phase4.md';
  fs.writeFileSync(mdPath, mdReport);
  console.log(`✅ Reporte Markdown guardado en: ${mdPath}`);

  console.log('\n📊 Resumen:');
  console.log(`   - Total keyframes: ${totalKeyframes}`);
  console.log(`   - Total transiciones: ${totalTransitions}`);
  console.log(`   - Total optimizaciones sugeridas: ${totalOptimizations}`);
}

/**
 * Genera un reporte en formato Markdown
 */
function generateMarkdownReport(report) {
  let md = `# Reporte de Optimización de Animaciones CSS - FASE 4\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-AR')}\n\n`;
  md += `## Resumen\n\n`;
  md += `- **Archivos analizados:** ${report.summary.totalFiles}\n`;
  md += `- **Total keyframes:** ${report.summary.totalKeyframes}\n`;
  md += `- **Total transiciones:** ${report.summary.totalTransitions}\n`;
  md += `- **Optimizaciones sugeridas:** ${report.summary.totalOptimizations}\n\n`;

  md += `## Guía de Optimización\n\n`;
  md += `### Propiedades Aceleradas por GPU (✅ Recomendado)\n\n`;
  md += `- \`transform\` - translate(), scale(), rotate(), skew()\n`;
  md += `- \`opacity\` - Transparencia\n`;
  md += `- \`filter\` - blur(), brightness(), contrast()\n`;
  md += `- \`will-change\` - Hint para el navegador\n\n`;

  md += `### Propiedades que Causan Reflow (❌ Evitar)\n\n`;
  md += `- \`width\`, \`height\` - Usar \`transform: scale()\`\n`;
  md += `- \`top\`, \`left\`, \`right\`, \`bottom\` - Usar \`transform: translate()\`\n`;
  md += `- \`margin\`, \`padding\` - Reestructurar con transform\n\n`;

  for (const file of report.files) {
    md += `## ${file.filePath}\n\n`;
    md += `### Estadísticas\n\n`;
    md += `- **Keyframes:** ${file.keyframes.total}\n`;
    md += `  - Con reflow: ${file.keyframes.withReflow}\n`;
    md += `  - Con repaint: ${file.keyframes.withRepaint}\n`;
    md += `  - Con GPU: ${file.keyframes.withGPU}\n\n`;
    md += `- **Transiciones:** ${file.transitions.total}\n`;
    md += `  - Con reflow: ${file.transitions.withReflow}\n`;
    md += `  - Con repaint: ${file.transitions.withRepaint}\n`;
    md += `  - Con GPU: ${file.transitions.withGPU}\n\n`;

    if (file.suggestions.keyframes.length > 0) {
      md += `### Sugerencias para Keyframes\n\n`;
      for (const suggestion of file.suggestions.keyframes) {
        md += `#### [${suggestion.severity.toUpperCase()}] ${suggestion.keyframe}\n\n`;
        md += `${suggestion.description}\n\n`;
        md += `**Sugerencia:** ${suggestion.suggestion}\n\n`;
        if (suggestion.gpuAlternatives) {
          md += `**Alternativas GPU:**\n`;
          for (const alt of suggestion.gpuAlternatives) {
            md += `- \`${alt}\`\n`;
          }
          md += `\n`;
        }
      }
    }

    if (file.suggestions.transitions.length > 0) {
      md += `### Sugerencias para Transiciones\n\n`;
      for (const suggestion of file.suggestions.transitions) {
        md += `#### [${suggestion.severity.toUpperCase()}] ${suggestion.selector}\n\n`;
        md += `${suggestion.description}\n\n`;
        md += `**Sugerencia:** ${suggestion.suggestion}\n\n`;
        if (suggestion.gpuAlternatives) {
          md += `**Alternativas GPU:**\n`;
          for (const alt of suggestion.gpuAlternatives) {
            md += `- \`${alt}\`\n`;
          }
          md += `\n`;
        }
      }
    }
  }

  return md;
}

// Ejecutar
main();
