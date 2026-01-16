#!/usr/bin/env node
/**
 * Script para actualizar la versión en todos los archivos del proyecto
 * Uso: node scripts/bump-version.js <version>
 * Ejemplo: node scripts/bump-version.js 5.0.76
 */

const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('❌ Error: Debes especificar una versión');
  console.log('Uso: node scripts/bump-version.js <version>');
  console.log('Ejemplo: node scripts/bump-version.js 5.0.76');
  process.exit(1);
}

// Validar formato de versión
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('❌ Error: Formato de versión inválido. Usa: X.Y.Z');
  process.exit(1);
}

const rootDir = path.join(__dirname, '..');

const filesToUpdate = [
  {
    path: 'package.json',
    update: (content) => {
      const pkg = JSON.parse(content);
      pkg.version = newVersion;
      return JSON.stringify(pkg, null, 2) + '\n';
    }
  },
  {
    path: 'manifest.json',
    update: (content) => {
      const manifest = JSON.parse(content);
      manifest.version = newVersion;
      return JSON.stringify(manifest, null, 2) + '\n';
    }
  },
  {
    path: 'src/popup.html',
    update: (content) => {
      return content.replace(
        /(<span id="version-indicator"[^>]*>)v[\d.]+(<\/span>)/,
        `$1v${newVersion}$2`
      );
    }
  },
  {
    path: 'README.md',
    update: (content) => {
      return content.replace(
        /version-[\d.]+-blue\.svg/,
        `version-${newVersion}-blue.svg`
      );
    }
  }
];

console.log(`🚀 Actualizando versión a ${newVersion}...\n`);

let updatedCount = 0;

filesToUpdate.forEach(({ path: filePath, update }) => {
  const fullPath = path.join(rootDir, filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const newContent = update(content);
    
    if (content !== newContent) {
      fs.writeFileSync(fullPath, newContent);
      console.log(`✅ Actualizado: ${filePath}`);
      updatedCount++;
    } else {
      console.log(`⏭️  Sin cambios: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error actualizando ${filePath}:`, error.message);
  }
});

console.log(`\n✨ Versión actualizada en ${updatedCount} archivo(s)`);
console.log(`\n📋 Próximos pasos:`);
console.log(`   git add -A`);
console.log(`   git commit -m "chore: bump version to ${newVersion}"`);
console.log(`   git tag v${newVersion}`);
console.log(`   git push && git push --tags`);
