/**
 * La compuerta de las alertas (`shouldSendNotification`) — sin navegador, corre en CI.
 *
 * Por qué existe este archivo: las alertas son la promesa central del producto ("te avisa
 * solo cuando la brecha supera tu umbral"). Había un test del antiduplicado, pero ninguna
 * prueba de la compuerta en sí: umbral, silencio, frecuencia y exchanges se probaban a mano,
 * si se probaban. Lo de acá corre en cualquier lado y en cualquier zona horaria.
 *
 * Cómo: se extrae la función REAL de `src/background/main-simple.js` (no una copia) y se la
 * construye con sus dependencias inyectadas. Si alguien cambia la lógica, esto cambia con
 * ella.
 *
 * Los horarios usan fechas locales sin zona (`2026-09-20T23:30:00`), así que el resultado es
 * el mismo en UTC-3 y en UTC.
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
  new Function(`return (${cuerpo})`); // valida que no esté truncada
  return cuerpo;
}

const CLAVE = new Function(
  `${extraerFuncion(SRC, 'claveArbitrajeNotificado')}\nreturn claveArbitrajeNotificado;`
)();
const CUERPO_GATE = extraerFuncion(SRC, 'shouldSendNotification');

/** Construye la compuerta real con sus dependencias inyectadas. */
function construirGate({ ultimaNotificacion = 0, notificados = new Set(), logs = [] } = {}) {
  const fabrica = new Function(
    'log',
    'notifiedArbitrages',
    'claveArbitrajeNotificado',
    'lastNotificationTime',
    `${CUERPO_GATE}\nreturn shouldSendNotification;`
  );
  const real = fabrica(
    (...args) => logs.push(args.join(' ')),
    notificados,
    CLAVE,
    ultimaNotificacion
  );
  // La función real está marcada `async` en producción aunque su cuerpo sea síncrono: al
  // extraerla del fuente se pierde el `async`, así que se envuelve para conservar el
  // contrato (siempre una promesa). Si mañana le agregan un `await` adentro, esto sigue
  // funcionando igual.
  const gate = (...args) => Promise.resolve(real(...args));
  return { gate, logs, notificados };
}

const AJUSTES = {
  notificationsEnabled: true,
  alertThreshold: 5,
  notificationFrequency: 'always',
  notificationExchanges: [],
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '08:00'
};

const arbitraje = extra => ({ broker: 'binance', profitPercentage: 7.5, ...extra });

describe('compuerta de alertas · shouldSendNotification (función real de main-simple.js)', () => {
  test('el corte es por umbral: igual o por encima avisa, por debajo no', async () => {
    const { gate } = construirGate();
    await expect(gate(AJUSTES, arbitraje({ profitPercentage: 4.99 }))).resolves.toBe(false);
    await expect(gate(AJUSTES, arbitraje({ profitPercentage: 5 }))).resolves.toBe(true);
    await expect(gate(AJUSTES, arbitraje({ profitPercentage: 12 }))).resolves.toBe(true);
  });

  test('sin umbral configurado usa 1% (y no 0: una brecha de 0,4% no avisa)', async () => {
    const { gate } = construirGate();
    const sinUmbral = { ...AJUSTES };
    delete sinUmbral.alertThreshold;
    await expect(gate(sinUmbral, arbitraje({ profitPercentage: 0.4 }))).resolves.toBe(false);
    await expect(gate(sinUmbral, arbitraje({ profitPercentage: 1 }))).resolves.toBe(true);
  });

  test('acepta profitPercent además de profitPercentage (dos formas en el código)', async () => {
    const { gate } = construirGate();
    await expect(gate(AJUSTES, { broker: 'binance', profitPercent: 9 })).resolves.toBe(true);
  });

  test('notificaciones deshabilitadas: nada pasa', async () => {
    const { gate } = construirGate();
    await expect(
      gate({ ...AJUSTES, notificationsEnabled: false }, arbitraje({ profitPercentage: 50 }))
    ).resolves.toBe(false);
  });

  describe('horario silencioso', () => {
    afterEach(() => jest.useRealTimers());

    test('22:00 → 08:00 bloquea a las 23:30 y a las 03:00, deja pasar a las 12:00', async () => {
      const enSilencio = [
        ['2026-09-20T23:30:00', false],
        ['2026-09-20T03:00:00', false],
        ['2026-09-20T12:00:00', true]
      ];
      for (const [momento, esperado] of enSilencio) {
        jest.useFakeTimers({ now: new Date(momento) });
        const { gate } = construirGate();
        await expect(gate({ ...AJUSTES, quietHoursEnabled: true }, arbitraje())).resolves.toBe(
          esperado
        );
      }
    });

    test('08:00 → 22:00 (no cruza medianoche) bloquea a las 12:00 y deja pasar a las 23:30', async () => {
      jest.useFakeTimers({ now: new Date('2026-09-20T12:00:00') });
      const a = construirGate();
      await expect(
        a.gate({ ...AJUSTES, quietHoursEnabled: true, quietStart: '08:00', quietEnd: '22:00' }, arbitraje())
      ).resolves.toBe(false);

      jest.useFakeTimers({ now: new Date('2026-09-20T23:30:00') });
      const b = construirGate();
      await expect(
        b.gate({ ...AJUSTES, quietHoursEnabled: true, quietStart: '08:00', quietEnd: '22:00' }, arbitraje())
      ).resolves.toBe(true);
    });

    test('desactivado, la hora no importa', async () => {
      jest.useFakeTimers({ now: new Date('2026-09-20T23:30:00') });
      const { gate } = construirGate();
      await expect(gate({ ...AJUSTES, quietHoursEnabled: false }, arbitraje())).resolves.toBe(true);
    });
  });

  describe('frecuencia', () => {
    test('"sin límite" no frena aunque se acabe de avisar', async () => {
      // Regresión: `frequencies['always']` es 0 y con `||` caía en 1 minuto, así que "Sin
      // límite" esperaba un minuto entre avisos. Se arregló con `??`.
      jest.useFakeTimers({ now: new Date('2026-09-20T12:00:00') });
      const { gate } = construirGate({ ultimaNotificacion: Date.now() - 1000 });
      await expect(
        gate({ ...AJUSTES, notificationFrequency: 'always' }, arbitraje())
      ).resolves.toBe(true);
    });

    test('"cada 5 min" frena a los 30s y deja pasar a los 6 min', async () => {
      jest.useFakeTimers({ now: new Date('2026-09-20T12:00:00') });
      const hace30s = construirGate({ ultimaNotificacion: Date.now() - 30 * 1000 });
      await expect(
        hace30s.gate({ ...AJUSTES, notificationFrequency: '5min' }, arbitraje())
      ).resolves.toBe(false);

      const hace6min = construirGate({ ultimaNotificacion: Date.now() - 6 * 60 * 1000 });
      await expect(
        hace6min.gate({ ...AJUSTES, notificationFrequency: '5min' }, arbitraje())
      ).resolves.toBe(true);
    });

    test('frecuencia desconocida cae en 1 minuto (no en 0)', async () => {
      jest.useFakeTimers({ now: new Date('2026-09-20T12:00:00') });
      const { gate } = construirGate({ ultimaNotificacion: Date.now() - 30 * 1000 });
      await expect(
        gate({ ...AJUSTES, notificationFrequency: 'lo-que-sea' }, arbitraje())
      ).resolves.toBe(false);
    });

    test('la opción "once" no existe en la interfaz pero dejaría de avisar para siempre', async () => {
      // Documenta la trampa: minInterval = Infinity hace que `now - ultima < Infinity` sea
      // siempre verdadero. Si algún día se agrega "una sola vez" al selector, hay que
      // implementarla con una marca persistida, no con Infinity.
      const { gate } = construirGate({ ultimaNotificacion: 0 });
      await expect(
        gate({ ...AJUSTES, notificationFrequency: 'once' }, arbitraje())
      ).resolves.toBe(false);
    });
  });

  describe('exchanges habilitados', () => {
    test('lista vacía = todos los exchanges', async () => {
      const { gate } = construirGate();
      await expect(gate({ ...AJUSTES, notificationExchanges: [] }, arbitraje())).resolves.toBe(true);
    });

    test('lista con ripio no deja pasar una oportunidad de binance, sí una de ripio', async () => {
      const { gate } = construirGate();
      const soloRipio = { ...AJUSTES, notificationExchanges: ['ripio'] };
      await expect(gate(soloRipio, { broker: 'binance', profitPercentage: 9 })).resolves.toBe(false);
      await expect(gate(soloRipio, { broker: 'ripio', profitPercentage: 9 })).resolves.toBe(true);
    });

    test('el respaldo a preferredExchanges sólo actúa si notificationExchanges no existe', async () => {
      const { gate } = construirGate();
      // Con la clave ausente, el respaldo legacy sí filtra.
      const sinClave = { ...AJUSTES, preferredExchanges: ['fiwind'] };
      delete sinClave.notificationExchanges;
      await expect(gate(sinClave, { broker: 'fiwind', profitPercentage: 9 })).resolves.toBe(true);
      await expect(gate(sinClave, { broker: 'binance', profitPercentage: 9 })).resolves.toBe(false);

      // Con la clave presente y vacía (lo que guarda la interfaz) la lista vacía significa
      // "todos", así que el respaldo no se aplica: es el comportamiento que muestra la UI.
      const vaciaConRespaldo = { ...AJUSTES, preferredExchanges: ['fiwind'] };
      await expect(
        gate(vaciaConRespaldo, { broker: 'binance', profitPercentage: 9 })
      ).resolves.toBe(true);
    });
  });

  test('antiduplicado: el mismo broker queda bloqueado aunque cambie el %, otro broker pasa', async () => {
    const notificados = new Set();
    const { gate } = construirGate({ notificados });
    notificados.add(CLAVE({ broker: 'binance' }, 7.5)); // "binance"
    await expect(gate(AJUSTES, { broker: 'binance', profitPercentage: 7.9 })).resolves.toBe(false);
    await expect(gate(AJUSTES, { broker: 'binance', profitPercentage: 8.1 })).resolves.toBe(false);
    await expect(gate(AJUSTES, { broker: 'fiwind', profitPercentage: 7.9 })).resolves.toBe(true);
  });
});
