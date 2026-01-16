/**
 * Build Script for ArbitrageAR Extension
 * Crea una versión de producción optimizada
 */

const fs = require('fs');
const path = require('path');

const isProduction = process.argv.includes('--production');
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ICONS_DIR = path.join(ROOT_DIR, 'icons');

console.log(`🔧 Building ArbitrageAR Extension (${isProduction ? 'PRODUCTION' : 'development'})...\n`);

// Limpiar dist
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Copiar manifest.json
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'manifest.json'), 'utf8'));
fs.writeFileSync(
  path.join(DIST_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, isProduction ? 0 : 2)
);
console.log('✅ manifest.json copiado');

// Copiar iconos
if (fs.existsSync(ICONS_DIR)) {
  const distIconsDir = path.join(DIST_DIR, 'icons');
  fs.mkdirSync(distIconsDir, { recursive: true });
  
  fs.readdirSync(ICONS_DIR).forEach(file => {
    fs.copyFileSync(
      path.join(ICONS_DIR, file),
      path.join(distIconsDir, file)
    );
  });
  console.log('✅ Iconos copiados');
}

// Función para copiar directorio recursivamente
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  
  fs.readdirSync(src).forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copiar src
copyDir(SRC_DIR, path.join(DIST_DIR, 'src'));
console.log('✅ Código fuente copiado');

// Minificar en producción
if (isProduction) {
  console.log('\n🔄 Minificando archivos...');
  
  try {
    const { minify } = require('terser');
    const CleanCSS = require('clean-css');
    
    // Minificar JS
    const jsFiles = [];
    function findJsFiles(dir) {
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          findJsFiles(filePath);
        } else if (file.endsWith('.js')) {
          jsFiles.push(filePath);
        }
      });
    }
    findJsFiles(path.join(DIST_DIR, 'src'));
    
    let jsMinified = 0;
    jsFiles.forEach(async (file) => {
      const code = fs.readFileSync(file, 'utf8');
      try {
        const result = await minify(code, {
          compress: {
            drop_console: false, // Mantener console para debugging
            drop_debugger: true
          },
          mangle: true
        });
        if (result.code) {
          fs.writeFileSync(file, result.code);
          jsMinified++;
        }
      } catch (err) {
        console.warn(`⚠️  Error minificando ${path.basename(file)}: ${err.message}`);
      }
    });
    
    // Minificar CSS
    const cssFiles = [];
    function findCssFiles(dir) {
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          findCssFiles(filePath);
        } else if (file.endsWith('.css')) {
          cssFiles.push(filePath);
        }
      });
    }
    findCssFiles(path.join(DIST_DIR, 'src'));
    
    const cleanCss = new CleanCSS({ level: 2 });
    cssFiles.forEach(file => {
      const css = fs.readFileSync(file, 'utf8');
      const result = cleanCss.minify(css);
      if (result.styles) {
        fs.writeFileSync(file, result.styles);
      }
    });
    
    console.log(`✅ ${jsFiles.length} archivos JS procesados`);
    console.log(`✅ ${cssFiles.length} archivos CSS minificados`);
    
  } catch (err) {
    console.warn('⚠️  Minificación omitida (dependencias no instaladas)');
  }
}

// Calcular tamaño
function getDirSize(dir) {
  let size = 0;
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += stat.size;
    }
  });
  return size;
}

const totalSize = getDirSize(DIST_DIR);
const sizeKB = (totalSize / 1024).toFixed(2);

console.log('\n' + '='.repeat(50));
console.log(`✅ Build completado!`);
console.log(`📁 Output: ${DIST_DIR}`);
console.log(`📊 Tamaño total: ${sizeKB} KB`);
console.log('='.repeat(50));
