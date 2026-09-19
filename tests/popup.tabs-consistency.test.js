/**
 * Consistencia de las pestanas del popup.
 *
 * Nace de un bug real: popup.js hacia
 *     document.querySelector('[data-tab="guide"]').click();
 * sin guarda, pero ningun boton de popup.html tiene data-tab="guide": el selector devolvia null y el
 * clic en una tarjeta de la lista vieja tiraba TypeError. La seccion #tab-guide existe y su
 * generador de pasos tambien, pero no habia forma de abrirla.
 *
 * Estos tests cubren la clase de bug, no el caso:
 *   1) ningun .click() sobre [data-tab=...] puede quedar sin guarda (?.).
 *   2) toda seccion id="tab-X" debe tener su boton data-tab="X" (con la lista de excepciones
 *      conocidas declarada aca abajo, para que agregar una seccion huerfana falle ruidosamente).
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const POPUP_JS = fs.readFileSync(path.join(RAIZ, 'src', 'popup.js'), 'utf8');
const POPUP_HTML = fs.readFileSync(path.join(RAIZ, 'src', 'popup.html'), 'utf8');

/** Secciones sin boton toleradas: ninguna. Si aparece una, el test falla y hay que decidir. */
const SECCIONES_SIN_BOTON_CONOCIDAS = [];

describe('pestañas del popup: secciones y botones en pareja', () => {
  test('ningún .click() sobre [data-tab=...] está sin guarda', () => {
    const lineas = POPUP_JS.split('\n');
    const sinGuarda = [];

    lineas.forEach((linea, i) => {
      if (!/\[\s*data-tab=/.test(linea) || !/\.click\(\)/.test(linea)) return;
      // acepta: ?.click()  |  if (x) { x.click() } en la misma linea  |  se guarda antes
      const guardada = /\?\.\s*click\(\)/.test(linea) || /if\s*\(/.test(linea);
      if (!guardada) sinGuarda.push(`${i + 1}: ${linea.trim()}`);
    });

    expect(sinGuarda).toEqual([]);
  });

  test('toda sección id="tab-*" tiene su botón data-tab, salvo las conocidas', () => {
    const secciones = [...POPUP_HTML.matchAll(/<section\s+id="tab-([a-z-]+)"/g)].map((m) => m[1]);
    const botones = [...POPUP_HTML.matchAll(/data-tab="([a-z-]+)"/g)].map((m) => m[1]);

    expect(secciones.length).toBeGreaterThan(0);
    const huerfanas = secciones.filter((s) => !botones.includes(s));
    expect(huerfanas.sort()).toEqual([...SECCIONES_SIN_BOTON_CONOCIDAS].sort());
  });

  test('cada botón data-tab apunta a una sección existente', () => {
    const secciones = [...POPUP_HTML.matchAll(/<section\s+id="tab-([a-z-]+)"/g)].map((m) => m[1]);
    const botones = [...POPUP_HTML.matchAll(/data-tab="([a-z-]+)"/g)].map((m) => m[1]);
    const rotos = botones.filter((b) => !secciones.includes(b));
    expect(rotos).toEqual([]);
  });
});
