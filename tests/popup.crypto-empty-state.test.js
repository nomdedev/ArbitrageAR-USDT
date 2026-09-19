/**
 * B-05 · Un problema de datos se mostraba como "no hay oportunidades con los filtros".
 *
 * `renderCryptoRoutes()` mostraba SIEMPRE el mismo texto cuando la lista venia vacia, culpando a
 * los filtros elegidos: el usuario se ponia a tocar filtros cuando la causa real era que la
 * consulta de precios no habia devuelto rutas. Ahora distingue los dos casos.
 *
 * El test extrae la funcion REAL de popup.js y la corre con un DOM falso.
 */
const fs = require('fs');
const path = require('path');

const RUTA = path.join(__dirname, '..', 'src', 'popup.js');
const SRC = fs.readFileSync(RUTA, 'utf8');

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
  new Function(cuerpo);
  return cuerpo;
}

function correr(routes, totalSinFiltrar) {
  const mensajes = [];
  const cuerpo = extraerFuncion(SRC, 'renderCryptoRoutes');
  const fabrica = new Function(
    'document',
    'log',
    'showCryptoEmpty',
    'console',
    `${cuerpo}
     return renderCryptoRoutes;`
  );
  const documentFalso = { getElementById: () => ({ innerHTML: '' }) };
  const fn = fabrica(documentFalso, () => {}, (m) => mensajes.push(m), { warn: () => {}, error: () => {} });
  fn(routes, totalSinFiltrar);
  return mensajes;
}

describe('B-05 · estado vacio del arbitraje cripto', () => {
  test('sin rutas de origen NO culpa a los filtros y dice que revisar', () => {
    const mensajes = correr([], 0);
    expect(mensajes.length).toBe(1);
    console.log(`[B-05] sin origen: ${mensajes[0]}`);
    expect(mensajes[0]).not.toMatch(/filtros activos/i);
    expect(mensajes[0]).toMatch(/conexi[oó]n|recarg/i);
  });

  test('si los filtros dejaron todo afuera, lo dice con el numero exacto', () => {
    const mensajes = correr([], 7);
    expect(mensajes.length).toBe(1);
    console.log(`[B-05] filtrado: ${mensajes[0]}`);
    expect(mensajes[0]).toMatch(/7/);
    expect(mensajes[0]).toMatch(/filtros activos/i);
  });

  test('el llamador pasa el total previo a filtrar', () => {
    expect(SRC).toMatch(/renderCryptoRoutes\(filtered,\s*cryptoRoutes\.length\)/);
  });
});
