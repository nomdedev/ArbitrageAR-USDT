/**
 * Verificación F-01 sobre el CÓDIGO REAL.
 *
 * A diferencia de `repro-f01-sell-fee.mjs` (que copia la aritmética), este script lee
 * `src/background/main-simple.js`, EXTRAE las tres funciones reales por nombre y las
 * ejecuta en un sandbox de Node (`vm`). No importa el módulo entero porque es un service
 * worker que necesita `chrome.*`, `importScripts` y compañía.
 *
 * Invariante que se verifica, evaluado SÓLO con el objeto que devuelve la función:
 *
 *     calculation.finalAmount === calculation.arsFromSale
 *                                 − fees.sell − fees.withdrawal − fees.transfer − fees.bank
 *
 * Es decir: el monto final tiene que ser lo que se obtuvo de la venta menos TODAS las
 * comisiones posteriores a la compra. Antes del fix F-01 falla en los tres escenarios.
 *
 * Uso:     node docs/auditoria-2026-09/verificar-f01-real.mjs
 * Salida:  exit 1 si algún escenario viola el invariante (sirve como gate de CI).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const FUENTE = path.join(RAIZ, 'src', 'background', 'main-simple.js');

/** Extrae una función por nombre desde el archivo real.
 *
 *  Ojo: hay que saltar PRIMERO la lista de parámetros con conteo de paréntesis, porque
 *  `calculateSingleExchangeRoute` usa destructuring (`{ initialAmount, ... }`) y las llaves
 *  de ese patrón cierran un conteo ingenuo de llaves justo en el paréntesis de parámetros.
 */
function extraerFuncion(src, nombre) {
  const cabecera = `function ${nombre}`;
  const inicio = src.indexOf(`${cabecera}(`);
  if (inicio < 0) throw new Error(`No se encontró la función ${nombre} en ${FUENTE}`);

  let i = inicio + cabecera.length;
  let parens = 0;
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
  if (parens !== 0) throw new Error(`Paréntesis sin cerrar en ${nombre}`);

  const cuerpo = src.indexOf('{', i);
  if (cuerpo < 0) throw new Error(`Sin cuerpo en ${nombre}`);
  let depth = 0;
  for (let j = cuerpo; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return src.slice(inicio, j + 1);
    }
  }
  throw new Error(`La función ${nombre} no cierra sus llaves`);
}

const src = fs.readFileSync(FUENTE, 'utf8');
const nombres = [
  'normalizarBroker',
  'resolveUsdToUsdtRate',
  'resolveBrokerFee',
  'calculateSingleExchangeRoute',
];
const extraidas = nombres.map((n) => ({ nombre: n, codigo: extraerFuncion(src, n) }));

// Validación de la extracción: si el extractor devolviera basura, el test podría "pasar"
// por el motivo equivocado. Se comprueba forma, tamaño y una marca propia de cada función.
for (const { nombre, codigo: c } of extraidas) {
  const lineas = c.split('\n').length;
  if (!c.startsWith(`function ${nombre}(`)) throw new Error(`Extracción inválida de ${nombre}`);
  if (lineas < 5) throw new Error(`Extracción sospechosamente corta de ${nombre}: ${lineas} líneas`);
  console.log(`  extraída ${nombre}: ${lineas} líneas`);
}
const codigo = extraidas.map((e) => e.codigo).join('\n\n');
if (!codigo.includes('arsAfterSellFee')) throw new Error('La extracción no contiene la aritmética esperada');
if (!codigo.includes('extraTradingFee')) throw new Error('La extracción no contiene resolveBrokerFee');

const ctx = vm.createContext({ console: { log() {}, warn() {}, info() {} } });
vm.runInContext(`${codigo}\nthis.__calc = calculateSingleExchangeRoute;`, ctx);
const calculateSingleExchangeRoute = ctx.__calc;

// ── escenarios (los mismos del informe F-01) ───────────────────────────────────────
const escenarios = [
  {
    nombre: 'A) Comisiones 1% compra / 1% venta, spread amplio',
    data: { totalAsk: 1000, totalBid: 1200 },
    entradas: {
      initialAmount: 1_000_000,
      officialPrice: 1000,
      usdtUsd: { ripio: { totalAsk: 1 } },
      applyFees: true,
      userSettings: broker(1, 1),
      exchange: 'ripio',
    },
  },
  {
    nombre: 'B) Caso realista: spread 2%, comisiones 0,5% / 1,5%',
    data: { totalAsk: 1000, totalBid: 1020 },
    entradas: {
      initialAmount: 1_000_000,
      officialPrice: 1000,
      usdtUsd: { ripio: { totalAsk: 1 } },
      applyFees: true,
      userSettings: broker(0.5, 1.5),
      exchange: 'ripio',
    },
  },
  {
    nombre: 'C) Igual que B + 3.000 de retiro + 2.000 de transferencia',
    data: { totalAsk: 1000, totalBid: 1020 },
    entradas: {
      initialAmount: 1_000_000,
      officialPrice: 1000,
      usdtUsd: { ripio: { totalAsk: 1 } },
      applyFees: true,
      userSettings: {
        ...broker(0.5, 1.5),
        extraWithdrawalFee: 3000,
        extraTransferFee: 2000,
      },
      exchange: 'ripio',
    },
  },
];

function broker(buyFee, sellFee) {
  return {
    extraTradingFee: 0,
    extraWithdrawalFee: 0,
    extraTransferFee: 0,
    bankCommissionFee: 0,
    brokerFees: [{ broker: 'ripio', buyFee, sellFee }],
  };
}

const fmt = (n) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n);
const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(3)}%`;

console.log('=== F-01 · verificación sobre el código real ===');
console.log(`Fuente: ${path.relative(RAIZ, FUENTE)}`);
console.log(`Funciones extraídas y ejecutadas: ${nombres.join(', ')}\n`);

let fallos = 0;
for (const { nombre, data, entradas } of escenarios) {
  const r = calculateSingleExchangeRoute(entradas.exchange, data, entradas);
  if (!r) {
    console.log(`✗ ${nombre}: la función devolvió null (datos de entrada inválidos)`);
    fallos++;
    continue;
  }
  const { calculation: c, fees } = r;
  const descontadoReal = fees.sell + fees.withdrawal + fees.transfer + fees.bank;
  const finalEsperado = c.arsFromSale - descontadoReal;
  const ok = Math.abs(c.finalAmount - finalEsperado) < 0.01;
  if (!ok) fallos++;

  console.log(`${ok ? '✓' : '✗'} ${nombre}`);
  console.log(`    venta bruta (arsFromSale)      ${fmt(c.arsFromSale)} ARS`);
  console.log(`    comisión de venta calculada    ${fmt(fees.sell)} ARS`);
  console.log(`    comisiones fijas (retiro+transf+banco) ${fmt(fees.withdrawal + fees.transfer + fees.bank)} ARS`);
  console.log(`    fees.total que se informa      ${fmt(fees.total)} ARS`);
  console.log(`    finalAmount real               ${fmt(c.finalAmount)} ARS`);
  console.log(`    finalAmount que DEBERÍA ser    ${fmt(finalEsperado)} ARS`);
  console.log(`    ganancia neta                  ${fmt(c.netProfit)} ARS  ${pct(r.profitPercent)}`);
  if (!ok) {
    console.log(
      `    >>> VIOLA EL INVARIANTE por ${fmt(c.finalAmount - finalEsperado)} ARS ` +
        `(la comisión de venta se calcula, se informa en fees.total y NO se descuenta)`
    );
  }
  console.log('');
}

console.log(
  fallos === 0
    ? '✓ Los 3 escenarios cumplen el invariante: lo informado en fees coincide con lo descontado.'
    : `✗ ${fallos} de ${escenarios.length} escenarios violan el invariante (hallazgo F-01 abierto).`
);
process.exit(fallos === 0 ? 0 : 1);
