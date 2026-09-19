# Inventario de assets (modo no-capture)

**No hubo captura de URL**: el proyecto es una extensión de navegador y no tiene sitio desplegado.
Los assets son los del propio repositorio, copiados a `capture/assets/` y congelados en local.

## Assets reales del producto (los únicos fotográficos)

| Archivo | Dimensiones | Qué es | Uso previsto en el video |
|---|---|---|---|
| `popup-main.png` | 428×599 | Captura real del popup: rutas de arbitraje con % de ganancia | Plano de producto — feature "rutas" |
| `popup-sim.png` | 428×599 | Captura real del simulador con monto y comisiones | Plano de producto — feature "simulador" |
| `popup-exchanges.png` | 428×599 | Captura real de precios de compra/venta por exchange | Plano de producto — feature "49 exchanges" |
| `popup-cripto.png` | 428×599 | Captura real de arbitraje cripto (BTC/ETH/USDC) | Reserva / plano secundario |
| `logo-2048.png` | 2048×2048 | Marca: `$` blanco fusionado con gráfico de barras ascendente y línea de tendencia. Fondo negro azulado. | Marca de agua, cierre |
| `icon128.png` | 128×128 | Ícono de la extensión | Firma pequeña, badge |

## Assets generados para el video (locales, sin red en render)

| Archivo | Qué es |
|---|---|
| `assets/gsap.min.js` | GSAP 3.14.2 vendorizado (72779 bytes) — evita el CDN en tiempo de render |
| `assets/fonts/*.woff2` + `assets/fonts.css` | Barlow (400/500/600/700/900) + IBM Plex Mono (400/500/600), subset latin, licencia OFL |

## Lo que NO hay

- Sin captura de sitio, sin DOM, sin tokens extraídos de un sitio, sin videos, sin imágenes de stock.
- No se generó ni descargó ninguna imagen con IA: todo el material visual es del propio proyecto
  o tipografía/animación generada en HTML.
