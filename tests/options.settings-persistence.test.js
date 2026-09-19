/**
 * O-01 / O-13 · Guardar configuración NO debe pisar las claves que la UI no maneja.
 *
 * El bug: `getCurrentSettings()` construía el objeto a guardar desde `{ ...DEFAULT_SETTINGS }`
 * y sólo sobreescribía los controles que existen en la página. Toda clave que la UI no sabe
 * leer (`brokerFees` y otras 17) volvía al default y se escribía así en storage: agregar un
 * fee por broker y después apretar "Guardar" lo borraba en silencio, sin error ni aviso.
 *
 * Se prueba de dos maneras independientes:
 *   A) el mecanismo aislado — la función REAL extraída del archivo, con y sin base persistida
 *   B) end-to-end — se carga src/options.js completo en jsdom con el HTML real de la página
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const RUTA_OPTIONS_JS = path.join(RAIZ, 'src', 'options.js');
const RUTA_OPTIONS_HTML = path.join(RAIZ, 'src', 'options.html');

/** Extrae una función por nombre del archivo real (salta parámetros con destructuring). */
function extraerFuncion(src, nombre) {
  const cabecera = `function ${nombre}`;
  const inicio = src.indexOf(`${cabecera}(`);
  if (inicio < 0) throw new Error(`No se encontró ${nombre}`);
  let parens = 0;
  let i = inicio + cabecera.length;
  for (; i < src.length; i++) {
    if (src[i] === '(') parens++;
    else if (src[i] === ')') {
      parens--;
      if (parens === 0) {
        i++;
        break;
      }
    }
  }
  let depth = 0;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return src.slice(inicio, j + 1);
    }
  }
  throw new Error(`${nombre} no cierra`);
}

/** Carga el HTML real de la página de opciones en el documento (sin scripts). */
function cargarDomReal() {
  const html = fs.readFileSync(RUTA_OPTIONS_HTML, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
  document.documentElement.innerHTML = html.replace(/<!DOCTYPE[^>]*>/i, '');
}

/** chrome.storage.local con almacén de verdad, en las dos formas (promesa y callback). */
function instalarStorage(inicial) {
  const store = JSON.parse(JSON.stringify(inicial));
  chrome.storage.local.get = jest.fn((keys, cb) => {
    const res = {};
    if (typeof keys === 'string') {
      if (keys in store) res[keys] = store[keys];
    } else if (Array.isArray(keys)) {
      keys.forEach((k) => {
        if (k in store) res[k] = store[k];
      });
    } else {
      Object.assign(res, store);
    }
    if (typeof cb === 'function') {
      cb(res);
      return undefined;
    }
    return Promise.resolve(res);
  });
  chrome.storage.local.set = jest.fn((data, cb) => {
    Object.assign(store, data);
    if (typeof cb === 'function') {
      cb();
      return undefined;
    }
    return Promise.resolve();
  });
  return store;
}

const FEES = [{ broker: 'ripio', label: 'Ripio', buyFee: 0.5, sellFee: 1.5 }];
const SEMILLA = {
  notificationsEnabled: true,
  brokerFees: FEES,
  applyFeesInCalculation: true,
  'clave-que-la-ui-no-conoce': { raro: true },
};

describe('A) el mecanismo: la base de getCurrentSettings es lo persistido', () => {
  const src = fs.readFileSync(RUTA_OPTIONS_JS, 'utf8');
  const cuerpo = extraerFuncion(src, 'getCurrentSettings');

  /** Extrae un objeto literal por su declaración (`const NOMBRE = { ... }`). */
  function extraerObjeto(fuente, declaracion) {
    const i = fuente.indexOf(declaracion);
    if (i < 0) throw new Error(`No se encontró ${declaracion}`);
    let depth = 0;
    for (let j = fuente.indexOf('{', i); j < fuente.length; j++) {
      if (fuente[j] === '{') depth++;
      else if (fuente[j] === '}') {
        depth--;
        if (depth === 0) return fuente.slice(i, j + 1);
      }
    }
    throw new Error(`${declaracion} no cierra`);
  }
  const defaults = extraerObjeto(src, 'const DEFAULT_SETTINGS');

  /** Ejecuta la función REAL con una base dada (y sin controles: el peor caso). */
  function ejecutarCon(base) {
    const ctx = vm.createContext({ document, console, persistedSettings: base });
    vm.runInContext(`${defaults}\n${cuerpo}\nthis.__r = getCurrentSettings;`, ctx);
    return ctx.__r();
  }

  test('con base persistida, conserva brokerFees y las claves que la UI desconoce', () => {
    document.documentElement.innerHTML = '<body></body>';
    const r = ejecutarCon(SEMILLA);
    expect(r.brokerFees).toEqual(FEES);
    expect(r.applyFeesInCalculation).toBe(true);
    expect(r['clave-que-la-ui-no-conoce']).toEqual({ raro: true });
  });

  test('sin base persistida se borran — es el bug O-01 que se corrigió', () => {
    document.documentElement.innerHTML = '<body></body>';
    const r = ejecutarCon(null);
    // El default trae `brokerFees: []`: los fees no quedan ausentes, quedan BORRADOS.
    expect(r.brokerFees).toEqual([]);
    // Y peor: el default de applyFeesInCalculation es `false`, así que cada "Guardar"
    // APAGABA las comisiones aunque el usuario las hubiera activado (enlaza con F-02).
    expect(r.applyFeesInCalculation).toBe(false);
    expect(r['clave-que-la-ui-no-conoce']).toBeUndefined();
  });
});

describe('B) end-to-end: options.js real, HTML real, storage con memoria', () => {
  let store;

  beforeAll(() => {
    chrome.runtime.id = 'test-id';
  });

  beforeEach(() => {
    cargarDomReal();
    store = instalarStorage({ notificationSettings: SEMILLA });
  });

  function cargarPagina() {
    const src = fs.readFileSync(RUTA_OPTIONS_JS, 'utf8');
    const exportador =
      '\n;globalThis.__opts = { loadSettings, saveSettings, getCurrentSettings };';
    new Function(src + exportador)();
    return globalThis.__opts;
  }

  test('loadSettings + saveSettings conservan brokerFees y applyFeesInCalculation', async () => {
    const { loadSettings, saveSettings } = cargarPagina();
    await loadSettings();
    await saveSettings();
    expect(chrome.storage.local.set).toHaveBeenCalled();
    expect(store.notificationSettings.brokerFees).toEqual(FEES);
    expect(store.notificationSettings.applyFeesInCalculation).toBe(true);
    expect(store.notificationSettings['clave-que-la-ui-no-conoce']).toEqual({ raro: true });
  });

  test('el interruptor de comisiones viaja en los dos sentidos (F-02/O-02)', async () => {
    const { loadSettings, saveSettings } = cargarPagina();
    // El control existe en el HTML real y arranca apagado si no hay nada guardado.
    const control = document.getElementById('apply-fees');
    expect(control).not.toBeNull();
    await loadSettings();
    // La semilla trae applyFeesInCalculation: true -> el interruptor queda encendido.
    expect(control.checked).toBe(true);
    // Y al guardar se conserva encendido (antes lo apagaba el default en cada guardado).
    await saveSettings();
    expect(store.notificationSettings.applyFeesInCalculation).toBe(true);
  });

  test('el objeto guardado sigue siendo una configuración válida y completa', async () => {
    const { loadSettings, saveSettings } = cargarPagina();
    await loadSettings();
    await saveSettings();
    const g = store.notificationSettings;
    expect(g.notificationsEnabled).toBe(true);
    expect(typeof g.alertThreshold).toBe('number');
    expect(Array.isArray(g.brokerFees)).toBe(true);
    expect(Object.keys(g).length).toBeGreaterThan(20);
  });
});
