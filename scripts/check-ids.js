const fs = require('fs');
const js = fs.readFileSync('src/popup.js', 'utf8');
const html = fs.readFileSync('src/popup.html', 'utf8');

const jsMatches = [...js.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)];
const jsIds = [...new Set(jsMatches.map(m => m[1]))];

const htmlMatches = [...html.matchAll(/id="([^"]+)"/g)];
const htmlIds = [...new Set(htmlMatches.map(m => m[1]))];

const missing = jsIds.filter(id => !htmlIds.includes(id));

console.log('=== IDs in popup.js but NOT in popup.html ===');
missing.forEach(id => {
  // Find line number
  const lines = js.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`getElementById('${id}')`) || lines[i].includes(`getElementById("${id}")`)) {
      console.log(`  - "${id}" (line ${i + 1})`);
      break;
    }
  }
});

console.log('\nTotal JS IDs:', jsIds.length, 'HTML IDs:', htmlIds.length, 'Missing:', missing.length);

// Also check data-tab vs tab-content IDs
const dataTabs = [...html.matchAll(/data-tab="([^"]+)"/g)].map(m => m[1]);
const tabContentIds = [...html.matchAll(/id="tab-([^"]+)"/g)].map(m => m[1]);

console.log('\n=== data-tab values ===');
dataTabs.forEach(t => console.log('  data-tab:', t));

console.log('\n=== tab-content IDs (without tab- prefix) ===');
tabContentIds.forEach(t => console.log('  tab-content:', t));

const tabMissing = dataTabs.filter(t => !tabContentIds.includes(t));
console.log('\n=== data-tab values without matching tab-content ===');
tabMissing.forEach(t => console.log('  MISSING: tab-' + t));

// Check for tab-guide which exists in HTML but has no data-tab button
const guideMissing = tabContentIds.filter(t => !dataTabs.includes(t));
console.log('\n=== tab-content IDs without matching data-tab button ===');
guideMissing.forEach(t => console.log('  NO BUTTON FOR: tab-' + t));
