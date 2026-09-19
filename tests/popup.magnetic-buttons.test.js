/**
 * P-15 · `initMagneticButtons()` acumulaba listeners y MutationObservers.
 *
 * La funcion se llama desde cinco lugares de popup.js (1489, 2726, 3906, 4564) y otra vez desde
 * routeManager.js:562, y se vuelve a llamar despues de cada render. Antes, cada llamada registraba
 * de nuevo los listeners de cada boton y creaba un MutationObserver nuevo, sin desconectar nunca.
 * El informe midio el sintoma: observadores 5 -> 15 -> 25.
 *
 * Este test extrae la funcion REAL de popup.js (no una copia), la corre cinco veces contra tres
 * botones falsos y cuenta listeners y observadores. Sin el arreglo daria 15 y 15.
 */
const fs = require('fs');
const path = require('path');

const RUTA = path.join(__dirname, '..', 'src', 'popup.js');
const SRC = fs.readFileSync(RUTA, 'utf8');

/** Extrae una funcion por nombre contando llaves, y valida que el resultado parsee. */
function extraerFuncion(texto, nombre) {
  const inicio = texto.indexOf(`function ${nombre}(`);
  if (inicio === -1) throw new Error(`No encontre la funcion ${nombre} en ${RUTA}`);
  let profundidad = 0;
  let i = texto.indexOf('{', inicio);
  for (; i < texto.length; i++) {
    if (texto[i] === '{') profundidad++;
    else if (texto[i] === '}') {
      profundidad--;
      if (profundidad === 0) break;
    }
  }
  const cuerpo = texto.slice(inicio, i + 1);
  // Si la extraccion quedo cortada, esto tira SyntaxError y el test falla con un error claro.
  new Function(cuerpo);
  return cuerpo;
}

function construirEntorno(cantidadBotones) {
  const botones = [];
  const listeners = [];
  const observadores = [];

  for (let i = 0; i < cantidadBotones; i++) {
    botones.push({
      style: {},
      parentNode: {},
      addEventListener: (tipo, fn, opts) => listeners.push({ boton: i, tipo, opts }),
      removeEventListener: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 40 }),
      matches: () => false,
      contains: () => true,
    });
  }

  class MutationObserverFalso {
    constructor(cb) {
      this.cb = cb;
      observadores.push(this);
    }
    observe() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  return { botones, listeners, observadores, MutationObserverFalso };
}

describe('P-15 · initMagneticButtons no acumula listeners ni observadores', () => {
  test('cinco llamadas instrumentan tres botones una sola vez cada uno', () => {
    const { botones, listeners, observadores, MutationObserverFalso } = construirEntorno(3);

    const constantes = SRC.match(
      /const botonesMagneticosListos = new WeakSet\(\);[\s\S]*?const observadoresMagneticos = \[\];/
    );
    expect(constantes).not.toBeNull(); // el arreglo tiene que estar en el archivo

    const cuerpo = extraerFuncion(SRC, 'initMagneticButtons');
    const fabrica = new Function(
      'document',
      'navigator',
      'window',
      'MutationObserver',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'setTimeout',
      `${constantes[0]}\n${cuerpo}\nreturn initMagneticButtons;`
    );

    const documentFalso = {
      querySelectorAll: () => botones,
      contains: () => true,
      getElementById: () => null,
    };
    const navigatorFalso = { maxTouchPoints: 0 };
    const initMagneticButtons = fabrica(
      documentFalso,
      navigatorFalso,
      {},
      MutationObserverFalso,
      () => 1,
      () => {},
      () => 0
    );

    for (let vuelta = 0; vuelta < 5; vuelta++) initMagneticButtons();

    console.log(`[P-15] listeners=${listeners.length} observadores=${observadores.length} (3 botones)`);
    // Un listener por boton (mas el que cada boton registre aparte) y un observador por boton.
    expect(observadores.length).toBe(3);
    const mousemove = listeners.filter((l) => l.tipo === 'mousemove');
    expect(mousemove.length).toBe(3);
  });

  test('un boton nuevo del render dinamico si se instrumenta', () => {
    const { botones, observadores, MutationObserverFalso } = construirEntorno(2);
    const constantes = SRC.match(
      /const botonesMagneticosListos = new WeakSet\(\);[\s\S]*?const observadoresMagneticos = \[\];/
    );
    const cuerpo = extraerFuncion(SRC, 'initMagneticButtons');
    const fabrica = new Function(
      'document',
      'navigator',
      'window',
      'MutationObserver',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'setTimeout',
      `${constantes[0]}\n${cuerpo}\nreturn initMagneticButtons;`
    );
    const init = fabrica(
      { querySelectorAll: () => botones, contains: () => true },
      { maxTouchPoints: 0 },
      {},
      MutationObserverFalso,
      () => 1,
      () => {},
      () => 0
    );

    init();
    expect(observadores.length).toBe(2);
    // Aparece un boton nuevo (como despues de un render de rutas) y se instrumenta.
    botones.push({
      style: {},
      parentNode: {},
      addEventListener: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }),
      matches: () => false,
      contains: () => true,
    });
    init();
    console.log(`[P-15] tras agregar un boton: observadores=${observadores.length}`);
    expect(observadores.length).toBe(3);
  });
});
