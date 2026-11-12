/**
 * Abrir el popup despierta al service worker y dispara updateData(); eso avisaba en cada clic.
 * Solo la alarma periódica puede habilitar el aviso.
 */
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'background', 'main-simple.js'),
  'utf8'
);

test('solo el listener de la alarma habilita el aviso', () => {
  const encendidos = [...SRC.matchAll(/avisoPendiente = true/g)];
  expect(encendidos).toHaveLength(1);
  const listener = SRC.slice(SRC.indexOf('chrome.alarms.onAlarm.addListener'));
  expect(listener.indexOf('avisoPendiente = true')).toBeGreaterThan(-1);
  expect(listener.indexOf('avisoPendiente = true')).toBeLessThan(listener.indexOf('});'));
});

test('updateData no avisa si la alarma no lo pidió', () => {
  const llamadas = [...SRC.matchAll(/await checkAndNotify\(/g)];
  expect(llamadas).toHaveLength(1);
  const antes = SRC.slice(llamadas[0].index - 400, llamadas[0].index);
  expect(antes).toMatch(/if \(avisoPendiente && /);
});
