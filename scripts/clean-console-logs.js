const fs = require('fs');
let js = fs.readFileSync('src/popup.js', 'utf8');

const beforeSize = js.length;

// Eliminar console.log con emojis específicos de debug
const emojiPatterns = [
  '🔍', '📤', '📥', '✅', '⏳', '🔧', '📊', '🖱️', '✨', 
  '💾', '🚀', '📡', '💡', '🎯', '📈', '⚡', '🔄', '📱', '🌐',
  '🔢', '💰', '🏦', '💱', '📋', '🎨', '⚙️', '🛠️'
];

emojiPatterns.forEach(emoji => {
  const regex = new RegExp(`^\\s*console\\.log\\(['\"\`]${emoji}[^;]+;\\s*$`, 'gm');
  js = js.replace(regex, '');
});

// Eliminar console.log de diagnóstico específicos
js = js.replace(/^\s*console\.log\([`'"]?\[DIAGNÓSTICO[^;]+;\s*$/gm, '');
js = js.replace(/^\s*console\.log\([`'"]?\[DEBUG[^;]+;\s*$/gm, '');
js = js.replace(/^\s*console\.log\([`'"]?\[POPUP\][^;]+;\s*$/gm, '');
js = js.replace(/^\s*console\.log\([`'"]?\[INIT\][^;]+;\s*$/gm, '');

// Eliminar líneas vacías múltiples
js = js.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync('src/popup.js', js);

const afterSize = js.length;
const logs = (js.match(/console\.(log|warn|error)/g) || []);
console.log('Console calls restantes:', logs.length);
console.log('Antes:', Math.round(beforeSize / 1024), 'KB');
console.log('Después:', Math.round(afterSize / 1024), 'KB');
console.log('Reducción:', Math.round((beforeSize - afterSize) / 1024), 'KB');
