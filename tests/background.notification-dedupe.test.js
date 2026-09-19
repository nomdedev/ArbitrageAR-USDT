/**
 * B-01 · El antiduplicado de notificaciones nunca bloqueaba nada.
 *
 * Causa exacta: el chequeo armaba la clave como `${broker}_${Math.floor(profitPct)}` (ej.
 * "binance_3") y el alta como `${broker}_${profit.toFixed(2)}` (ej. "binance_3.35"). Dos formatos
 * distintos en las dos puntas de la misma deduplicacion: jamas podian coincidir, asi que el Set
 * crecia sin bloquear repeticiones.
 *
 * El test usa la funcion REAL extraida de main-simple.js y ademas verifica que no queden claves
 * armadas a mano en ninguno de los dos lugares.
 */
const fs = require('fs');
const path = require('path');

const RUTA = path.join(__dirname, '..', 'src', 'background', 'main-simple.js');
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
  new Function(`return (${cuerpo})`); // valida que no este truncada
  return cuerpo;
}

const clave = new Function(
  `${extraerFuncion(SRC, 'claveArbitrajeNotificado')}
   return claveArbitrajeNotificado;`
)();

describe('B-01 · clave de deduplicacion de notificaciones', () => {
  test('la misma operacion produce la misma clave (antes no coincidian)', () => {
    const arbitraje = { broker: 'binance', profitPercentage: 3.35 };
    // El chequeo pasa profitPct y el alta pasa profit: tienen que dar la misma clave.
    expect(clave(arbitraje, 3.35)).toBe(clave(arbitraje, 3.35));
    expect(clave(arbitraje, 3.35)).toBe('binance_3');
    console.log(`[B-01] clave(3.35) = ${clave(arbitraje, 3.35)}`);
  });

  test('el Set bloquea la repeticion y sigue permitiendo una banda nueva', () => {
    const notificados = new Set();
    const arbitraje = { broker: 'binance' };

    // Primera notificacion: 3,35% -> se agrega.
    const primera = clave(arbitraje, 3.35);
    notificados.add(primera);

    // La misma banda, con otro decimal (antes generaba "binance_3.90" y no encontraba nada).
    expect(notificados.has(clave(arbitraje, 3.9))).toBe(true);
    // Otra banda de 1% tiene que poder notificarse.
    expect(notificados.has(clave(arbitraje, 4.2))).toBe(false);
    // Otro broker no interfiere.
    expect(notificados.has(clave({ broker: 'fiwind' }, 3.35))).toBe(false);
  });

  test('las dos puntas del codigo usan la funcion y no queda ninguna clave armada a mano', () => {
    const usos = SRC.match(/claveArbitrajeNotificado\(/g) || [];
    console.log(`[B-01] usos de la funcion en main-simple.js = ${usos.length} (1 definicion + 2 usos)`);
    expect(usos.length).toBeGreaterThanOrEqual(3);
    // Ninguna clave de notificacion construida con template literal suelto.
    expect(SRC.match(/\$\{arbitrage\.broker\}_\$\{/g)).toBeNull();
    expect(SRC).not.toMatch(/notifiedArbitrages\.add\(`/);
  });
});
