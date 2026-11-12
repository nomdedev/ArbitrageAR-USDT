/**
 * Tema claro/oscuro compartido por el popup y la página de configuración.
 *
 * Las dos páginas viven en el mismo origen (chrome-extension://<id>), así que comparten
 * localStorage y el evento `storage` avisa a la otra en vivo: cambiar el tema en una lo cambia
 * en la otra. Por defecto es oscuro (el aspecto original del popup).
 * Se carga en <head>, antes de pintar, para que no parpadee.
 */
(function () {
  'use strict';
  const CLAVE = 'theme';

  function leer() {
    try {
      return localStorage.getItem(CLAVE) === 'light' ? 'light' : 'dark';
    } catch (_) {
      return 'dark';
    }
  }

  function aplicar(tema) {
    document.documentElement.dataset.theme = tema;
    const etiqueta = tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
    document.querySelectorAll('[data-theme-toggle]').forEach(boton => {
      boton.setAttribute('aria-label', etiqueta);
      boton.setAttribute('title', etiqueta);
    });
  }

  aplicar(leer());
  window.addEventListener('storage', e => {
    if (e.key === CLAVE) aplicar(leer());
  });

  document.addEventListener('DOMContentLoaded', () => {
    aplicar(leer());
    document.querySelectorAll('[data-theme-toggle]').forEach(boton => {
      boton.addEventListener('click', () => {
        const siguiente = leer() === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem(CLAVE, siguiente);
        } catch (_) {
          /* sin storage: el cambio vale solo para esta página */
        }
        aplicar(siguiente);
      });
    });
  });
})();
