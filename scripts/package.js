/**
 * Package Script for ArbitrageAR Extension
 * Crea un archivo ZIP listo para Chrome Web Store
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const pkg = require(path.join(ROOT_DIR, 'package.json'));

const outputFile = path.join(ROOT_DIR, `ArbitrageAR-v${pkg.version}.zip`);

// Verificar que dist existe
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Error: La carpeta dist no existe. Ejecuta "npm run build" primero.');
  process.exit(1);
}

console.log(`📦 Empaquetando ArbitrageAR v${pkg.version}...\n`);

// Crear stream de salida
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const sizeKB = (archive.pointer() / 1024).toFixed(2);
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Paquete creado exitosamente!`);
  console.log(`📁 Archivo: ${outputFile}`);
  console.log(`📊 Tamaño: ${sizeKB} KB`);
  console.log('='.repeat(50));
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️  Advertencia:', err.message);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Agregar contenido de dist
archive.directory(DIST_DIR, false);

archive.finalize();
