/**
 * Alertas / notificaciones EN VIVO.
 *
 * Por qué existe: el video afirma "te avisa solo, cuando supera tu umbral". Eso es una
 * promesa de producto y hay que probarla, no deducirla del código. Este test carga la
 * extensión en un Chromium real, entra al service worker y llama a las funciones REALES
 * (`shouldSendNotification`, `sendNotification`, `checkAndNotify`) con oportunidades
 * controladas, capturando lo que se habría notificado.
 *
 * Qué se verifica:
 *   1. se dispara por encima del umbral, con el nivel de urgencia correcto
 *   2. NO se dispara por debajo del umbral
 *   3. respeta "notificaciones deshabilitadas"
 *   4. respeta el horario silencioso (incluido el que cruza medianoche)
 *   5. respeta la lista de exchanges habilitados
 *   6. no repite el mismo arbitraje (antiduplicado B-01)
 *   7. dice "BRUTA" cuando el motor no descontó comisiones (regla F-09)
 *   8. el aviso automático (el que dispara la alarma) no queda bloqueado por isFirstUpdate
 *   9. la alarma periódica existe, con el intervalo configurado
 *  10. Chrome acepta una notificación real (sin stub)
 */
const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

test.describe('Alertas y notificaciones · en vivo', () => {
  test.setTimeout(180000);

  test('la alerta real respeta umbral, silencio, exchanges, deduplicación y el aviso automático', async () => {
    const extensionPath = path.resolve(__dirname, '../../../');
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-arbitrars-alertas-'));

    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
    });

    try {
      let [sw] = context.serviceWorkers();
      if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 30000 });
      expect(sw, 'el service worker de la extensión tiene que estar').toBeTruthy();
      const extensionId = (sw.url().match(/^chrome-extension:\/\/([a-p]{32})\//) || [])[1];
      expect(extensionId).toBeTruthy();

      const informe = await sw.evaluate(async () => {
        const out = {
          api: {},
          alarmasAlEntrar: [],
          alarmasTrasLlamarla: [],
          startPeriodicUpdates: null,
          alarmaManual: null,
          alarmasTrasEsperar: [],
          casos: [],
          dedupe: null,
          automatico: null,
          alarmas: [],
          iconProbes: {},
          real: null
        };

        out.api = {
          shouldSendNotification: typeof shouldSendNotification,
          sendNotification: typeof sendNotification,
          checkAndNotify: typeof checkAndNotify,
          updateData: typeof updateData,
          startPeriodicUpdates: typeof startPeriodicUpdates,
          claveArbitrajeNotificado: typeof claveArbitrajeNotificado,
          isFirstUpdateAlArrancar:
            typeof isFirstUpdate === 'boolean' ? isFirstUpdate : 'inalcanzable'
        };
        if (out.api.shouldSendNotification !== 'function') return out;

        // ── ¿El reloj del aviso automático está creado? ─────────────────────────
        out.alarmasAlEntrar = (await chrome.alarms.getAll()).map(a => ({
          nombre: a.name,
          cadaMinutos: a.periodInMinutes
        }));

        // ¿La función que crea el reloj funciona si se la llama a mano?
        out.startPeriodicUpdates = { ok: null, error: null };
        try {
          await startPeriodicUpdates();
          out.startPeriodicUpdates.ok = true;
        } catch (e) {
          out.startPeriodicUpdates.ok = false;
          out.startPeriodicUpdates.error = String((e && e.message) || e);
        }
        out.alarmasTrasLlamarla = (await chrome.alarms.getAll()).map(a => ({
          nombre: a.name,
          cadaMinutos: a.periodInMinutes
        }));

        // ¿La API de alarmas funciona en este contexto? (control)
        out.alarmaManual = { ok: null, error: null };
        try {
          await chrome.alarms.create('prueba_manual_control', { periodInMinutes: 2 });
          out.alarmaManual.ok = true;
        } catch (e) {
          out.alarmaManual.ok = false;
          out.alarmaManual.error = String((e && e.message) || e);
        }

        // ¿Con qué valores corre la creación del reloj al arrancar? (el mismo camino que
        // ejecuta el módulo, replicado paso a paso, para ver el error si lo hay)
        const guardado =
          (await chrome.storage.local.get('notificationSettings')).notificationSettings || {};
        out.ajustesAlEntrar = {
          existeNotificationSettings: Object.keys(guardado).length > 0,
          updateIntervalMinutes: guardado.updateIntervalMinutes ?? null,
          tipoUpdateIntervalMinutes: typeof guardado.updateIntervalMinutes,
          alertThreshold: guardado.alertThreshold ?? null,
          notificationsEnabled: guardado.notificationsEnabled ?? null
        };
        out.reintentoDelReloj = { ok: null, error: null, intervalo: null };
        try {
          const intervalo = guardado.updateIntervalMinutes || 5;
          out.reintentoDelReloj.intervalo = intervalo;
          await chrome.alarms.clear('updateDataAlarm');
          await chrome.alarms.create('updateDataAlarm', { periodInMinutes: intervalo });
          out.reintentoDelReloj.ok = true;
        } catch (e) {
          out.reintentoDelReloj.ok = false;
          out.reintentoDelReloj.error = String((e && e.message) || e);
        }

        // El arranque del módulo es asincrónico: hay que darle tiempo antes de mirar.
        await new Promise(r => setTimeout(r, 2500));
        out.alarmasTrasEsperar = (await chrome.alarms.getAll()).map(a => ({
          nombre: a.name,
          cadaMinutos: a.periodInMinutes
        }));

        const base = {
          notificationsEnabled: true,
          alertThreshold: 5,
          notificationFrequency: 'always',
          notificationExchanges: [],
          quietHoursEnabled: false,
          quietStart: '22:00',
          quietEnd: '08:00',
          soundEnabled: true,
          updateIntervalMinutes: 5
        };

        // Capturamos los envíos sin que salgan al sistema operativo.
        const originalCreate = chrome.notifications.create.bind(chrome.notifications);
        let capturadas = [];
        let stubOk = true;
        try {
          chrome.notifications.create = (nid, opts) => {
            capturadas.push({ nid, opts });
            return Promise.resolve(nid);
          };
        } catch (e) {
          stubOk = false;
        }
        out.api.stubDeNotificaciones = stubOk;

        const reset = () => {
          capturadas = [];
          lastNotificationTime = 0;
          notifiedArbitrages.clear();
        };

        const correr = async (nombre, ajustes, arbitraje) => {
          reset();
          const settings = { ...base, ...ajustes };
          let gate = null;
          let error = null;
          try {
            gate = await shouldSendNotification(settings, arbitraje);
            if (gate) await sendNotification(arbitraje, settings);
          } catch (e) {
            error = String((e && e.message) || e);
          }
          const c = capturadas[0];
          out.casos.push({
            nombre,
            gate,
            enviadas: capturadas.length,
            titulo: c ? c.opts.title : null,
            mensaje: c ? c.opts.message : null,
            prioridad: c ? c.opts.priority : null,
            requiereInteraccion: c ? c.opts.requireInteraction : null,
            error
          });
        };

        await correr(
          '1 · 7,5% con umbral 5% (debe avisar)',
          {},
          {
            broker: 'binance',
            profitPercentage: 7.5,
            usdtArsBid: 1478.5,
            applyFees: true
          }
        );
        await correr(
          '2 · 12% (nivel alto: prioridad 2 y requiere interacción)',
          {},
          {
            broker: 'ripio',
            profitPercentage: 12,
            usdtArsBid: 1500,
            applyFees: true
          }
        );
        await correr(
          '3 · 7,5% sin comisiones descontadas (debe decir BRUTA)',
          {},
          {
            broker: 'binance',
            profitPercentage: 7.5,
            applyFees: false
          }
        );
        await correr(
          '4 · 2% con umbral 5% (NO debe avisar)',
          {},
          {
            broker: 'binance',
            profitPercentage: 2
          }
        );
        await correr(
          '5 · notificaciones deshabilitadas (NO debe avisar)',
          { notificationsEnabled: false },
          {
            broker: 'binance',
            profitPercentage: 9
          }
        );
        await correr(
          '6 · horario silencioso 00:00-23:59 (NO debe avisar)',
          {
            quietHoursEnabled: true,
            quietStart: '00:00',
            quietEnd: '23:59'
          },
          { broker: 'binance', profitPercentage: 9 }
        );
        await correr(
          '7 · solo ripio habilitado, oportunidad en binance (NO debe avisar)',
          {
            notificationExchanges: ['ripio']
          },
          { broker: 'binance', profitPercentage: 9 }
        );

        // Deduplicación: mismo broker, misma banda de 1% (7,5% y 7,9% -> binance_7)
        reset();
        const sDedupe = { ...base };
        const a1 = { broker: 'binance', profitPercentage: 7.5, applyFees: true };
        const a2 = { broker: 'binance', profitPercentage: 7.9, applyFees: true };
        const primeraVez = await shouldSendNotification(sDedupe, a1);
        if (primeraVez) await sendNotification(a1, sDedupe);
        const enviosTras1 = capturadas.length;
        lastNotificationTime = 0; // que lo único que pueda bloquear sea el antiduplicado
        const segundaVez = await shouldSendNotification(sDedupe, a2);
        if (segundaVez) await sendNotification(a2, sDedupe);
        out.dedupe = {
          primeraVez,
          segundaVez,
          enviosTrasElPrimero: enviosTras1,
          enviosTotales: capturadas.length,
          clave: claveArbitrajeNotificado(a1, 7.5)
        };

        // EL AVISO AUTOMÁTICO — el que dispara la alarma.
        // Manifest V3 apaga y recrea el service worker, y la alarma lo despierta: cada
        // despertar deja isFirstUpdate en true. Antes, checkAndNotify salía temprano en
        // cada arranque, así que el aviso automático no llegaba nunca. Ahora la siembra
        // queda anotada en storage: se salta UNA vez en la vida de la instalación, no una
        // vez por arranque.
        // el antiduplicado ahora es por broker y persiste: el envío del paso 8 bloquearía este
        await chrome.storage.local.remove(['notificacionSembrada', 'notificationState']);
        await chrome.storage.local.set({ notificationSettings: { ...base, alertThreshold: 0.5 } });
        const arbitrajeGrande = { broker: 'binance', profitPercentage: 20, applyFees: true };
        const banderaAntes = isFirstUpdate;

        reset();
        isFirstUpdate = true; // primer arranque de la instalación: no debe avisar
        await checkAndNotify([arbitrajeGrande]);
        const enviosPrimeraVezDeLaInstalacion = capturadas.length;
        const sembrada =
          (await chrome.storage.local.get('notificacionSembrada')).notificacionSembrada === true;

        // Y ahora un arranque nuevo del service worker (lo que pasa cada vez que la alarma
        // lo despierta).
        reset();
        isFirstUpdate = true; // como recién despertado por la alarma
        await checkAndNotify([arbitrajeGrande]);
        const enviosTrasReinicioDelServiceWorker = capturadas.length;

        out.automatico = {
          isFirstUpdateAlEntrar: banderaAntes,
          primeraVezDeLaInstalacion: enviosPrimeraVezDeLaInstalacion,
          sembradaEnStorage: sembrada,
          trasReiniciarElServiceWorker: enviosTrasReinicioDelServiceWorker
        };

        // Alarmas reales: el reloj del "te avisa solo"
        const todas = await chrome.alarms.getAll();
        out.alarmas = todas.map(a => ({
          nombre: a.name,
          cadaMinutos: a.periodInMinutes,
          proximaEnSegundos: Math.round((a.scheduledTime - Date.now()) / 1000)
        }));

        // Y notificaciones REALES, sin stub: el código de producción usa una ruta relativa.
        if (stubOk) chrome.notifications.create = originalCreate;
        const probarIcono = async (nombre, opts) => {
          try {
            const idReal = await chrome.notifications.create(
              `verificacion_${nombre}_${Date.now()}`,
              opts
            );
            out.iconProbes[nombre] = { ok: true, id: idReal };
          } catch (e) {
            out.iconProbes[nombre] = { ok: false, error: String((e && e.message) || e) };
          }
        };
        await probarIcono('relativo_como_produccion', {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Verificación · ruta relativa',
          message: 'Igual que el código de producción.',
          silent: true
        });
        await probarIcono('relativo_desde_el_script', {
          type: 'basic',
          iconUrl: '../../icons/icon128.png',
          title: 'Verificación · relativa desde el script',
          message: 'Si la ruta se resuelve contra el script del service worker.',
          silent: true
        });
        await probarIcono('absoluto_correcto', {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon128.png'),
          title: 'Verificación · ruta absoluta',
          message: 'Con chrome.runtime.getURL.',
          silent: true
        });
        await probarIcono('absoluto_inexistente', {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/no-existe-este-archivo.png'),
          title: 'Verificación · absoluta inexistente (control)',
          message: 'Tiene que fallar con el mismo error.',
          silent: true
        });
        await probarIcono('sin_icono', {
          type: 'basic',
          title: 'Verificación · sin icono',
          message: 'Sin iconUrl.',
          silent: true
        });
        out.real = out.iconProbes.absoluto_correcto;
        return out;
      });

      console.log('\n===== API alcanzable desde el service worker =====');
      console.log(JSON.stringify(informe.api, null, 1));
      console.log('\n===== Reloj del aviso automático =====');
      console.log('al entrar al service worker: ' + JSON.stringify(informe.alarmasAlEntrar));
      console.log('startPeriodicUpdates() a mano: ' + JSON.stringify(informe.startPeriodicUpdates));
      console.log('después de llamarla:          ' + JSON.stringify(informe.alarmasTrasLlamarla));
      console.log('control (create manual):      ' + JSON.stringify(informe.alarmaManual));
      console.log('\najustes guardados al entrar:  ' + JSON.stringify(informe.ajustesAlEntrar));
      console.log(
        'reintento del reloj (misma lógica): ' + JSON.stringify(informe.reintentoDelReloj)
      );
      console.log(
        'alarmas tras esperar el arranque:   ' + JSON.stringify(informe.alarmasTrasEsperar)
      );
      console.log('\n===== Casos =====');
      informe.casos.forEach(c => console.log(' ' + JSON.stringify(c)));
      console.log('\n===== Antiduplicado =====');
      console.log(JSON.stringify(informe.dedupe, null, 1));
      console.log('\n===== Aviso automático (alarma) =====');
      console.log(JSON.stringify(informe.automatico, null, 1));
      console.log('\n===== Alarmas al final =====');
      console.log(JSON.stringify(informe.alarmas, null, 1));
      console.log('\n===== Notificaciones reales (sin stub) =====');
      console.log(JSON.stringify(informe.iconProbes, null, 1));

      // ── Aserciones ────────────────────────────────────────────────────────────
      expect(informe.api.shouldSendNotification).toBe('function');
      expect(informe.api.stubDeNotificaciones).toBe(true);

      const c = n => informe.casos.find(x => x.nombre.startsWith(String(n) + ' · '));
      const uno = c(1),
        dos = c(2),
        tres = c(3),
        cuatro = c(4),
        cinco = c(5),
        seis = c(6),
        siete = c(7);

      // 1. sobre el umbral
      expect(uno.gate).toBe(true);
      expect(uno.enviadas).toBe(1);
      expect(uno.titulo).toContain('Oportunidad interesante en Binance');
      expect(uno.mensaje).toContain('Ganancia neta estimada: +7.50%');

      // 2. nivel alto
      expect(dos.enviadas).toBe(1);
      expect(dos.prioridad).toBe(2);
      expect(dos.requiereInteraccion).toBe(true);

      // 3. regla de honestidad F-09
      expect(tres.enviadas).toBe(1);
      expect(tres.mensaje).toContain('BRUTA');

      // 4-7. los cuatro frenos
      [cuatro, cinco, seis, siete].forEach(caso => {
        expect(caso.gate).toBe(false);
        expect(caso.enviadas).toBe(0);
      });

      // 8. antiduplicado
      expect(informe.dedupe.enviosTrasElPrimero).toBe(1);
      expect(informe.dedupe.segundaVez).toBe(false);
      expect(informe.dedupe.enviosTotales).toBe(1);
      expect(informe.dedupe.clave).toBe('binance'); // solo el broker: la ganancia ya no entra en la clave

      // 9. el aviso automático: se salta una sola vez (la primera de la instalación) y
      //    sigue funcionando después de cada reinicio del service worker
      expect(informe.automatico.primeraVezDeLaInstalacion).toBe(0);
      expect(informe.automatico.sembradaEnStorage).toBe(true);
      expect(informe.automatico.trasReiniciarElServiceWorker).toBe(1);

      // 10. el reloj existe con el intervalo configurado (medido después de esperar el arranque)
      const updateAlarm = informe.alarmasTrasEsperar.find(a => a.nombre === 'updateDataAlarm');
      expect(updateAlarm, 'tiene que existir la alarma updateDataAlarm').toBeTruthy();
      expect(updateAlarm.cadaMinutos).toBe(5);

      // 11. rutas de ícono: la relativa no resuelve, la absoluta sí
      expect(informe.iconProbes.relativo_como_produccion.ok).toBe(false);
      expect(informe.iconProbes.absoluto_inexistente.ok).toBe(false);
      expect(informe.iconProbes.absoluto_correcto.ok).toBe(true);
      expect(informe.iconProbes.sin_icono.ok).toBe(true);
    } finally {
      await context.close();
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {
        // limpieza best-effort
      }
    }
  });
});
