/**
 * P-01 · El toggle de "configuración avanzada" del simulador no abría nunca.
 *
 * `popup.js` llama a `Sim.init()` DOS veces en su arranque: en `:116` y, vía
 * `setupAdvancedSimulator()` (`:3059`), otra vez. `init()` registraba los listeners sin
 * ninguna guarda de idempotencia, así que el handler del toggle quedaba dos veces sobre el
 * mismo botón. Y como el handler decide según el estado actual del panel
 * (`style.display === 'none'`), un click ejecutaba las dos copias: la primera abría
 * (`block`), la segunda miraba el estado ya cambiado y lo volvía a cerrar (`none`).
 * Resultado neto: el panel no se abría nunca.
 *
 * El informe lo midió con un probe sobre el popup.html real: cada botón con `{"click": 2}`
 * y el panel en `"none"` después de 1 y de 2 clicks.
 */
beforeAll(() => {
  globalThis.window.Logger = { debug: () => {} };
  document.body.innerHTML = `
    <button id="toggle-advanced">Configuración avanzada</button>
    <div id="advanced-config" style="display: none"></div>
  `;
  require('../src/modules/simulator.js');
});

describe('P-01 · toggle de configuración avanzada', () => {
  let Sim;

  beforeAll(() => {
    Sim = globalThis.window?.Simulator;
    if (!Sim) throw new Error('Simulator no fue expuesto en window');
  });

  test('init() dos veces (como popup.js) no duplica el listener: un click abre el panel', () => {
    const toggle = document.getElementById('toggle-advanced');
    const panel = document.getElementById('advanced-config');
    const espia = jest.spyOn(toggle, 'addEventListener');

    Sim.init({}, {}); // popup.js:116
    Sim.init({}, {}); // popup.js:3059, vía setupAdvancedSimulator()

    // La segunda init() actualiza datos, pero NO vuelve a registrar el listener.
    expect(espia).toHaveBeenCalledTimes(1);

    expect(panel.style.display).toBe('none');
    toggle.click();
    expect(panel.style.display).toBe('block'); // antes de P-01 quedaba en 'none'
    toggle.click();
    expect(panel.style.display).toBe('none'); // y sigue alternando normalmente
  });
});
