/**
 * Script de verificación de sintaxis CSS y seguridad
 * Valida la sintaxis básica de archivos CSS y verifica problemas de seguridad
 */

const fs = require('fs');
const path = require('path');

// Archivos CSS a verificar
const cssFiles = [
  'src/ui-components/design-system.css',
  'src/ui-components/animations.css',
  'src/ui-components/exchange-card.css',
  'src/ui-components/header.css',
  'src/popup.css'
];

// Problemas encontrados
const issues = {
  syntax: [],
  security: [],
  warnings: []
};

/**
 * Verifica la sintaxis básica de CSS
 */
function verifyCSSSyntax(content, filename) {
  const lines = content.split('\n');
  let braceCount = 0;
  let inComment = false;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const prevChar = j > 0 ? line[j - 1] : '';
      
      // Manejar comentarios
      if (!inString && char === '/' && prevChar === '*') {
        inComment = false;
      } else if (!inString && char === '*' && prevChar === '/') {
        inComment = true;
      }
      
      if (inComment) continue;
      
      // Manejar strings
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }
      
      if (inString) continue;
      
      // Contar llaves
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount < 0) {
          issues.syntax.push({
            file: filename,
            line: lineNum,
            type: 'error',
            message: 'Llave de cierre sin apertura'
          });
        }
      }
    }
  }
  
  if (braceCount !== 0) {
    issues.syntax.push({
      file: filename,
      line: 'EOF',
      type: 'error',
      message: `Llaves desbalanceadas (${braceCount > 0 ? 'faltan cierres' : 'cierres extra'})`
    });
  }
  
  // Verificar keyframes duplicados
  const keyframeRegex = /@keyframes\s+(\w+)/g;
  const keyframes = new Set();
  let match;
  
  while ((match = keyframeRegex.exec(content)) !== null) {
    if (keyframes.has(match[1])) {
      issues.warnings.push({
        file: filename,
        type: 'warning',
        message: `@keyframes duplicado: ${match[1]}`
      });
    }
    keyframes.add(match[1]);
  }
}

/**
 * Verifica problemas de seguridad en CSS
 */
function verifyCSSSecurity(content, filename) {
  // Verificar uso de url() con datos externos
  const urlRegex = /url\(['"]?(https?:\/\/|\/\/)[^'"()]+['"]?\)/gi;
  const urls = content.match(urlRegex) || [];
  
  urls.forEach(url => {
    if (!url.includes('extension://') && !url.includes('chrome-extension://')) {
      issues.security.push({
        file: filename,
        type: 'security',
        message: `URL externa detectada: ${url.substring(0, 50)}...`
      });
    }
  });
  
  // Verificar uso de eval() o expression() (obsoleto pero peligroso)
  if (/\bexpression\s*\(/.test(content)) {
    issues.security.push({
      file: filename,
      type: 'security',
      message: 'Uso de expression() detectado (peligroso)'
    });
  }
  
  // Verificar uso de -moz-binding (peligroso)
  if (/-moz-binding/.test(content)) {
    issues.security.push({
      file: filename,
      type: 'security',
      message: 'Uso de -moz-binding detectado (peligroso)'
    });
  }
}

/**
 * Verifica mejores prácticas
 */
function verifyBestPractices(content, filename) {
  // Verificar uso de !important excesivo
  const importantRegex = /!\s*important/g;
  const matches = content.match(importantRegex) || [];
  
  if (matches.length > 20) {
    issues.warnings.push({
      file: filename,
      type: 'warning',
      message: `Uso excesivo de !important (${matches.length} veces)`
    });
  }
  
  // Verificar selectores universales
  if (/\*\s*\{/.test(content)) {
    issues.warnings.push({
      file: filename,
      type: 'warning',
      message: 'Selector universal (*) detectado - puede afectar rendimiento'
    });
  }
}

/**
 * Verifica variables CSS duplicadas
 */
function verifyCSSVariables(content, filename) {
  const varRegex = /--[\w-]+:/g;
  const variables = new Map();
  let match;
  
  while ((match = varRegex.exec(content)) !== null) {
    const varName = match[0].replace(':', '');
    if (variables.has(varName)) {
      issues.warnings.push({
        file: filename,
        type: 'warning',
        message: `Variable CSS duplicada: ${varName}`
      });
    }
    variables.set(varName, true);
  }
}

// Ejecutar verificaciones
console.log('🔍 Verificando archivos CSS...\n');

cssFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(fullPath)) {
    issues.syntax.push({
      file: file,
      type: 'error',
      message: 'Archivo no encontrado'
    });
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  
  console.log(`📄 ${file}`);
  console.log(`   Líneas: ${lineCount}`);
  
  verifyCSSSyntax(content, file);
  verifyCSSSecurity(content, file);
  verifyBestPractices(content, file);
  verifyCSSVariables(content, file);
});

// Mostrar resultados
console.log('\n' + '='.repeat(60));
console.log('📊 RESULTADOS DE VERIFICACIÓN');
console.log('='.repeat(60));

if (issues.syntax.length === 0 && issues.security.length === 0 && issues.warnings.length === 0) {
  console.log('\n✅ No se encontraron problemas. Todos los archivos CSS son válidos.');
} else {
  if (issues.syntax.length > 0) {
    console.log(`\n❌ ERRORES DE SINTAXIS (${issues.syntax.length}):`);
    issues.syntax.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.message}`);
    });
  }
  
  if (issues.security.length > 0) {
    console.log(`\n🔒 PROBLEMAS DE SEGURIDAD (${issues.security.length}):`);
    issues.security.forEach(issue => {
      console.log(`   ${issue.file} - ${issue.message}`);
    });
  }
  
  if (issues.warnings.length > 0) {
    console.log(`\n⚠️  ADVERTENCIAS (${issues.warnings.length}):`);
    issues.warnings.forEach(issue => {
      console.log(`   ${issue.file} - ${issue.message}`);
    });
  }
}

console.log('\n' + '='.repeat(60));

// Exit code
const exitCode = issues.syntax.length > 0 || issues.security.length > 0 ? 1 : 0;
process.exit(exitCode);
