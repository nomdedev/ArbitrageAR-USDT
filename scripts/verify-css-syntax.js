// Script para verificar la sintaxis CSS de popup.css
const fs = require('fs');

/**
 * Escaner caracter por caracter: ignora comentarios y cadenas, lleva la profundidad de llaves y
 * devuelve donde quedo desbalanceado.
 *
 * Por que existe: el chequeo de mas abajo cuenta llaves linea por linea y se apoya en su propio
 * rastreo de comillas/comentarios, que puede quedar "pegado" y saltear lineas enteras. Con popup.css
 * desbalanceado en una llave (613 '{' contra 612 '}') este script imprimia "Sintaxis CSS valida" y no
 * veia nada. Ese desbalance real hizo que el navegador descartara ~780 lineas del final del archivo
 * (incluido el bloque que pinta los numeros de paso de la guia, que quedaban negros sobre negro).
 *
 * Devuelve null si esta balanceado, o { linea, restantes } si no lo esta.
 */
function balanceReal(css) {
  let linea = 1;
  let prof = 0;
  let enComentario = false;
  let enCadena = false;
  let cita = '';
  let ultimoCero = 1;

  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    const sig = css[i + 1];
    if (c === '\n') linea++;

    if (enComentario) {
      if (c === '*' && sig === '/') {
        enComentario = false;
        i++;
      }
      continue;
    }
    if (enCadena) {
      if (c === '\\') i++;
      else if (c === cita) enCadena = false;
      continue;
    }
    if (c === '/' && sig === '*') {
      enComentario = true;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      enCadena = true;
      cita = c;
      continue;
    }
    if (c === '{') prof++;
    else if (c === '}') prof--;
    if (prof === 0) ultimoCero = linea;
  }

  if (prof === 0) return null;
  return { linea: ultimoCero, restantes: prof };
}

/** Aplica el escaner a todos los CSS del proyecto. */
function verificarTodos() {
  const archivos = ['src/popup.css', 'src/options.css', 'src/options.chips.css', 'src/base.css'].concat(
    fs.existsSync('src/ui-components')
      ? fs.readdirSync('src/ui-components').filter((f) => f.endsWith('.css')).map((f) => 'src/ui-components/' + f)
      : []
  );

  let malos = 0;
  for (const archivo of archivos) {
    if (!fs.existsSync(archivo)) continue;
    const desbalance = balanceReal(fs.readFileSync(archivo, 'utf8'));
    if (desbalance) {
      malos++;
      console.log(
        `\u274c ${archivo}: llaves desbalanceadas (${desbalance.restantes > 0 ? 'falta cerrar' : 'sobra cerrar'} ${Math.abs(desbalance.restantes)}). ` +
          `La ultima regla abierta arranca cerca de la linea ${desbalance.linea}; el navegador descarta todo lo que viene despues.`
      );
    }
  }
  if (malos) {
    console.log('');
    process.exit(1);
  }
}

verificarTodos();

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
