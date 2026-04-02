const fs = require('fs');

// Check module interface mismatches
const popupJs = fs.readFileSync('src/popup.js', 'utf8');

const modules = {
  Sim: { file: 'src/modules/simulator.js', alias: 'Sim' },
  RteMgr: { file: 'src/modules/routeManager.js', alias: 'RteMgr' },
  FltMgr: { file: 'src/modules/filterManager.js', alias: 'FltMgr' },
  ModMgr: { file: 'src/modules/modalManager.js', alias: 'ModMgr' },
  NotifMgr: { file: 'src/modules/notificationManager.js', alias: 'NotifMgr' },
  Utils: { file: 'src/utils/commonUtils.js', alias: 'Utils' },
  State: { file: 'src/utils/stateManager.js', alias: 'State' },
  Fmt: { file: 'src/utils/formatters.js', alias: 'Fmt' },
};

for (const [name, info] of Object.entries(modules)) {
  let moduleCode;
  try {
    moduleCode = fs.readFileSync(info.file, 'utf8');
  } catch (e) {
    console.log(`\n❌ ${name} (${info.file}): FILE NOT FOUND`);
    continue;
  }

  // Extract exported methods from the module
  // Look for the export object pattern: const ModuleName = { ... };
  const exportMatch = moduleCode.match(/const\s+\w+\s*=\s*\{([^}]+)\}/g);
  const exportedMethods = new Set();
  
  if (exportMatch) {
    exportMatch.forEach(block => {
      const methodMatches = block.matchAll(/(\w+)\s*[,}]/g);
      for (const m of methodMatches) {
        if (m[1] !== 'const' && m[1].length > 1) {
          exportedMethods.add(m[1]);
        }
      }
    });
  }

  // Extract method calls from popup.js: Alias.methodName(
  const callRegex = new RegExp(`${info.alias}\\.([A-Za-z_][A-Za-z0-9_]*)\\s*\\(`, 'g');
  const calls = new Set();
  let match;
  while ((match = callRegex.exec(popupJs)) !== null) {
    calls.add(match[1]);
  }

  // Find calls that don't exist in exports
  const missing = [...calls].filter(c => !exportedMethods.has(c));
  
  console.log(`\n=== ${name} (${info.file}) ===`);
  console.log(`  Exported methods: ${[...exportedMethods].join(', ') || 'NONE FOUND'}`);
  console.log(`  Called from popup.js: ${[...calls].join(', ') || 'NONE'}`);
  if (missing.length > 0) {
    console.log(`  ⚠️ MISSING from exports: ${missing.join(', ')}`);
  } else {
    console.log(`  ✅ All calls match exports`);
  }
}

// Also check popup.html script loading order
const popupHtml = fs.readFileSync('src/popup.html', 'utf8');
const scriptMatches = [...popupHtml.matchAll(/<script[^>]*src="([^"]+)"[^>]*>/g)];
console.log('\n=== Script loading order in popup.html ===');
scriptMatches.forEach((m, i) => console.log(`  ${i + 1}. ${m[1]}`));

// Check if popup.js is loaded after all modules
const popupJsPos = scriptMatches.findIndex(m => m[1].includes('popup.js'));
const moduleScripts = scriptMatches.filter(m => 
  m[1].includes('modules/') || m[1].includes('utils/') || m[1].includes('ui/')
);
const lastModulePos = moduleScripts.length > 0 ? 
  scriptMatches.indexOf(moduleScripts[moduleScripts.length - 1]) : -1;

console.log(`\npopup.js position: ${popupJsPos + 1}`);
console.log(`Last module position: ${lastModulePos + 1}`);
if (popupJsPos < lastModulePos) {
  console.log('⚠️ popup.js loads BEFORE some modules!');
} else {
  console.log('✅ popup.js loads after all modules');
}
