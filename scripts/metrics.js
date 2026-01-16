#!/usr/bin/env node
/**
 * @file metrics.js
 * @description Script para analizar métricas del proyecto
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      lines: countLines(filePath)
    };
  } catch {
    return { size: 0, lines: 0 };
  }
}

function analyzeDirectory(dir, extensions = ['.js', '.css', '.html']) {
  const results = [];
  
  function walk(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
          walk(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          results.push({
            path: fullPath.replace(dir + path.sep, ''),
            ...getFileStats(fullPath)
          });
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }
  
  walk(dir);
  return results;
}

function calculateComplexityScore(lines) {
  if (lines < 200) return { score: '🟢 Bajo', color: colors.green };
  if (lines < 500) return { score: '🟡 Medio', color: colors.yellow };
  if (lines < 1000) return { score: '🟠 Alto', color: colors.yellow };
  return { score: '🔴 Muy Alto', color: colors.red };
}

function estimateLoadTime(sizeKB) {
  // Estimación basada en conexión 3G (1.5 Mbps)
  const loadTime3G = (sizeKB * 8) / 1500;
  // Estimación basada en 4G (10 Mbps)
  const loadTime4G = (sizeKB * 8) / 10000;
  return { fast: loadTime4G.toFixed(2), slow: loadTime3G.toFixed(2) };
}

// Main
console.log('\n');
log(colors.bold + colors.cyan, '📊 MÉTRICAS DE ARBIT🇦🇷RS - v5.0.83');
log(colors.cyan, '═'.repeat(50));

const projectRoot = path.resolve(__dirname, '..');

// 1. Análisis de archivos fuente
log(colors.bold, '\n📁 ARCHIVOS FUENTE (src/)');
log(colors.reset, '-'.repeat(40));

const srcFiles = analyzeDirectory(path.join(projectRoot, 'src'));
let totalSize = 0;
let totalLines = 0;

// Ordenar por tamaño descendente
srcFiles.sort((a, b) => b.size - a.size);

console.log('\nArchivo'.padEnd(40) + 'Tamaño'.padEnd(12) + 'Líneas'.padEnd(10) + 'Complejidad');
console.log('-'.repeat(75));

for (const file of srcFiles) {
  totalSize += file.size;
  totalLines += file.lines;
  const complexity = calculateComplexityScore(file.lines);
  
  const sizeStr = formatBytes(file.size).padEnd(12);
  const linesStr = file.lines.toString().padEnd(10);
  
  console.log(
    file.path.padEnd(40) + 
    sizeStr + 
    linesStr + 
    complexity.score
  );
}

console.log('-'.repeat(75));
console.log(`${'TOTAL'.padEnd(40)}${formatBytes(totalSize).padEnd(12)}${totalLines.toString().padEnd(10)}`);

// 2. Análisis de tests
log(colors.bold, '\n🧪 TESTS');
log(colors.reset, '-'.repeat(40));

const testFiles = analyzeDirectory(path.join(projectRoot, 'tests'), ['.js', '.test.js']);
let testLines = 0;

for (const file of testFiles) {
  testLines += file.lines;
  console.log(`  ${file.path}: ${file.lines} líneas`);
}

console.log(`\n  Total líneas de test: ${testLines}`);
console.log(`  Ratio test/código: ${(testLines / totalLines * 100).toFixed(1)}%`);

// 3. Tiempo de carga estimado
log(colors.bold, '\n⚡ TIEMPO DE CARGA ESTIMADO');
log(colors.reset, '-'.repeat(40));

const totalKB = totalSize / 1024;
const loadTimes = estimateLoadTime(totalKB);

console.log(`  Tamaño total: ${formatBytes(totalSize)}`);
console.log(`  Conexión rápida (4G): ~${loadTimes.fast}s`);
console.log(`  Conexión lenta (3G): ~${loadTimes.slow}s`);

// 4. Resumen de calidad
log(colors.bold, '\n📈 RESUMEN DE CALIDAD');
log(colors.reset, '-'.repeat(40));

const metrics = {
  'Archivos JS': srcFiles.filter(f => f.path.endsWith('.js')).length,
  'Archivos CSS': srcFiles.filter(f => f.path.endsWith('.css')).length,
  'Archivos HTML': srcFiles.filter(f => f.path.endsWith('.html')).length,
  'Líneas de código': totalLines,
  'Archivos de test': testFiles.length,
  'Líneas de test': testLines
};

for (const [key, value] of Object.entries(metrics)) {
  console.log(`  ${key}: ${value}`);
}

// 5. Archivos críticos
log(colors.bold, '\n⚠️  ARCHIVOS QUE NECESITAN ATENCIÓN');
log(colors.reset, '-'.repeat(40));

const criticalFiles = srcFiles.filter(f => f.lines > 500);
if (criticalFiles.length === 0) {
  log(colors.green, '  ✅ Ningún archivo supera 500 líneas');
} else {
  for (const file of criticalFiles) {
    const complexity = calculateComplexityScore(file.lines);
    console.log(`  ${complexity.score} ${file.path}: ${file.lines} líneas`);
  }
}

// 6. Score general
log(colors.bold, '\n🏆 PUNTUACIÓN DE MÉTRICAS');
log(colors.reset, '-'.repeat(40));

let score = 100;

// Penalizar archivos muy grandes
score -= criticalFiles.length * 5;

// Bonus por tests
const testRatio = testLines / totalLines;
if (testRatio >= 0.3) score += 10;
else if (testRatio >= 0.1) score += 5;

// Penalizar si hay demasiadas líneas totales
if (totalLines > 10000) score -= 10;
else if (totalLines > 15000) score -= 20;

score = Math.max(0, Math.min(100, score));

const scoreColor = score >= 80 ? colors.green : score >= 60 ? colors.yellow : colors.red;
log(scoreColor, `\n  Puntuación de métricas: ${score}/100`);

if (score >= 80) {
  log(colors.green, '  ✅ El proyecto mantiene buenas métricas');
} else if (score >= 60) {
  log(colors.yellow, '  🟡 El proyecto tiene métricas aceptables');
} else {
  log(colors.red, '  ❌ El proyecto necesita optimización');
}

console.log('\n');
