/**
 * Estado de la seleccion, visible de un vistazo (agente B, puntos c y e).
 *
 * Antes: para saber que participa del calculo habia que expandir 8 tarjetas y leer 140 casillas a
 * lo largo de 5213px. Y "Deseleccionar todos" + Guardar NO desactivaba nada, porque el motor trata
 * la lista vacia como "usar todos" (options.js:386-393 / 439-446 y main-simple.js:667-676): el
 * control mentia. Ahora cada tarjeta muestra "x de y activos" y avisa explicitamente cuando una
 * lista quedo vacia y por lo tanto se usa completa.
 *
 * Ademas: las 8 cabeceras de tarjeta eran <div> con listener de click, sin tabindex ni role, asi
 * que colapsar una seccion era imposible sin mouse. Se les da role/aria y teclado.
 *
 * No modifica ningun name/value ni el guardado: solo lee el estado y lo muestra.
 */
(function () {
  'use strict';

  /** Etiquetas legibles para los grupos de casillas. */
  const ETIQUETAS = {
    'bank': 'Bancos',
    'traditional-exchange': 'Exchanges tradicionales',
    'usdt-broker': 'Exchanges para rutas USDT',
    'p2p-usdt-usdt-exchange': 'P2P USDT/USDT',
    'p2p-usdt-ars-exchange': 'P2P USDT/ARS',
    'p2p-sync-exchange': 'Sincronización P2P',
    'notify-exchange': 'Notificaciones por exchange'
  };

  /** Agrupa las casillas por name dentro de un contenedor. */
  function grupos(contenedor) {
    const porNombre = new Map();
    contenedor.querySelectorAll('input[type="checkbox"][name]').forEach((input) => {
      // los switches de configuración no son selección de listas
      if (input.closest('.switch')) return;
      if (!porNombre.has(input.name)) porNombre.set(input.name, []);
      porNombre.get(input.name).push(input);
    });
    return porNombre;
  }

  /** "12 de 36 activos" / "0 de 36 · se usarán todos". */
  function texto(nombre, lista) {
    const total = lista.length;
    const activos = lista.filter((i) => i.checked).length;
    const etiqueta = ETIQUETAS[nombre] || nombre;
    if (activos === 0) {
      return `${etiqueta}: <strong>0 de ${total}</strong> · se usarán todos`;
    }
    return `${etiqueta}: <strong>${activos} de ${total}</strong>`;
  }

  /** Crea o actualiza la linea de resumen de una tarjeta. */
  function resumen(contenido) {
    let linea = contenido.querySelector(':scope > .selection-summary');
    if (!linea) {
      const mapa = grupos(contenido);
      if (!mapa.size) return;
      linea = document.createElement('p');
      linea.className = 'selection-summary';
      linea.setAttribute('aria-live', 'polite'); // el resumen se anuncia al cambiar una casilla
      contenido.prepend(linea);
    }
    const mapa = grupos(contenido);
    const vacias = [];
    const partes = [];
    mapa.forEach((lista, nombre) => {
      partes.push(texto(nombre, lista));
      if (lista.filter((i) => i.checked).length === 0) vacias.push(ETIQUETAS[nombre] || nombre);
    });
    linea.innerHTML = partes.join(' · ');
    // Aviso honesto: el motor interpreta la lista vacia como "usar todos".
    if (vacias.length) {
      linea.innerHTML += `<br /><span class="selection-warning">Listas vacías: ${vacias.join(', ')}. Con ninguna casilla marcada se usan todas.</span>`;
    }
  }

  function actualizarTodo() {
    document.querySelectorAll('.card-content').forEach(resumen);
  }

  /** Cabeceras de tarjeta operables con teclado. */
  function cabecerasAccesibles() {
    document.querySelectorAll('.card-header[data-action="toggle-section"]').forEach((header) => {
      if (header.dataset.accesible === '1') return;
      header.dataset.accesible = '1';
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      const contenido = header.nextElementSibling;
      const sincronizar = () => {
        const colapsado = !!(contenido && contenido.classList.contains('collapsed'));
        header.setAttribute('aria-expanded', String(!colapsado));
      };
      sincronizar();
      header.addEventListener('click', sincronizar);
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });
  }

  function init() {
    actualizarTodo();
    cabecerasAccesibles();
    // Un solo listener delegado: se recalcula cuando cambia cualquier casilla.
    document.addEventListener('change', (e) => {
      if (e.target && e.target.matches && e.target.matches('input[type="checkbox"]')) {
        const contenido = e.target.closest('.card-content');
        if (contenido) resumen(contenido);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
