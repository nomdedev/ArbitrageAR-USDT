// Script para verificar la sintaxis CSS de popup.css
const fs = require('fs');

console.log('🔍 Verificando sintaxis CSS de popup.css...\n');

try {
  const css = fs.readFileSync('src/popup.css', 'utf8');
  const lines = css.split('\n');
  
  let braceCount = 0;
  let inComment = false;
  let inString = false;
  let stringChar = '';
  let issues = [];
  let keyframes = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Track comments
    if (!inString) {
      if (line.includes('/*') && !line.includes('*/')) {
        inComment = true;
      }
      if (line.includes('*/')) {
        inComment = false;
      }
    }
    
    // Skip comment lines
    if (inComment) continue;
    
    // Track strings
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const prevChar = j > 0 ? line[j-1] : '';
      
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }
    }
    
    // Skip strings
    if (inString) continue;
    
    // Count braces (excluding @keyframes content)
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    
    braceCount += openBraces;
    braceCount -= closeBraces;
    
    if (braceCount < 0) {
      issues.push(`Línea ${lineNum}: Llave de cierre sin apertura`);
    }
    
    // Track @keyframes
    const keyframeMatch = line.match(/@keyframes\s+(\w+)/);
    if (keyframeMatch) {
      keyframes.push({ name: keyframeMatch[1], line: lineNum });
    }
  }
  
  // Final brace check
  if (braceCount !== 0) {
    issues.push(`Balance de llaves incorrecto: ${braceCount > 0 ? 'faltan cerrar' : 'sobran cerrar'} ${Math.abs(braceCount)} llaves`);
  }
  
  // Report results
  console.log('📊 RESULTADOS DE VERIFICACIÓN:\n');
  console.log(`Total de líneas: ${lines.length}`);
  console.log(`Total de @keyframes encontrados: ${keyframes.length}`);
  console.log(`Balance de llaves: ${braceCount === 0 ? '✅ Correcto' : '❌ Incorrecto (' + braceCount + ')'}`);
  
  if (issues.length === 0) {
    console.log('\n✅ Sintaxis CSS válida - No se encontraron errores\n');
  } else {
    console.log('\n❌ Problemas encontrados:\n');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  }
  
  console.log('🎬 @keyframes definidos en popup.css:\n');
  keyframes.forEach(kf => console.log(`  - ${kf.name} (línea ${kf.line})`));
  
} catch (error) {
  console.error('❌ Error al leer el archivo:', error.message);
  process.exit(1);
}
