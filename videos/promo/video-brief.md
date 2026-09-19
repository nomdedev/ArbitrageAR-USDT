# VIDEO BRIEF — ArbitrageAR-USDT

> Análisis del proyecto para el video promocional. Generado el 2026-09-19.
> Commit base analizado: `5fdfa9e` (= `origin/main`). Versión de manifest: **6.0.0**.
> Todos los números de este brief están verificados contra el código, no copiados del README
> (el README tiene afirmaciones desactualizadas — ver "Advertencias" al final).

## 1. Nombre y tagline

**ArbitrARS — Detector de Arbitraje** (nombre en `manifest.json`; el repo se llama
ArbitrageAR-USDT).

> *Detecta cuándo el dólar oficial y el USDT se separan lo suficiente como para ganar plata —
> y te dice exactamente qué hacer, paso a paso.*

Tagline corto para pantalla: **"La brecha entre el dólar oficial y el USDT, en tiempo real."**

## 2. Problema que resuelve y para quién

En Argentina conviven dos precios del dólar: el **oficial** (el que conseguís en tu banco, con
cupo) y el que el mercado le pone al **USDT** en los exchanges locales. La diferencia entre
comprar dólar oficial y vender USDT por pesos es una oportunidad de arbitraje real — pero
calcularla a mano es inviable: hay que mirar decenas de exchanges, dos o tres precios por
exchange, y descontar comisiones que cambian según dónde operás. Para cuando terminás la
cuenta, el spread ya se movió.

**Para quién:** el ahorrista o trader argentino con cuenta en bancos y exchanges locales, que
ya sabe operar pero no tiene forma práctica de comparar el mercado completo en el momento.

## 3. Las 5 capacidades que venderían el proyecto

1. **Detección en tiempo real sobre el mercado completo.** Monitorea USDT/ARS en **49 exchanges**
   (88 combinaciones configuradas: spot y P2P por separado) más las cotizaciones bancarias del
   dólar oficial. Se refresca cada 30 s–1 min.
2. **Rutas de arbitraje con el paso a paso.** No tira un número: ordena las rutas por rentabilidad
   y, al elegir una, despliega la guía de 4 pasos (dónde comprar el dólar → convertir a USDT →
   vender USDT → retirar), con las advertencias de comisiones y tiempos de cada tramo.
3. **Simulador con tu monto y tus comisiones.** Cargás cuánto pensás invertir y qué comisiones
   pagás (trading, retiro, transferencia, comisión bancaria) y la extensión estima el resultado
   antes de que muevas un peso. Trae presets de perfil: Conservador / Moderado / Agresivo.
4. **Alertas automáticas.** Notificaciones nativas de Windows cuando el spread supera tu umbral,
   con filtros por exchange y horario silencioso configurable — no hace falta tener el popup
   abierto mirando.
5. **191 controles de configuración.** Fuentes de datos (automático con consenso bancario o
   precio manual), bancos, exchanges por tipo de operación, fees por broker, umbrales de alerta.
   Se adapta a cómo opera cada uno.

## 4. Stack tecnológico real

| Capa | Qué usa |
|---|---|
| Plataforma | **Chromium Manifest V3** (Chrome / Brave / Edge) |
| Lenguaje | **JavaScript ES6+** vanilla — sin frameworks, sin bundler en runtime |
| Arquitectura | 3 contextos aislados: **service worker** + **popup** + **página de opciones**, comunicados por `chrome.runtime` messaging |
| Estado | `chrome.storage.local` (una sola clave, `notificationSettings`) |
| Datos | **CriptoYA** (`criptoya.com/api/usdt/ars`) + **DolarAPI** (oficial + bancos) + Dolarito |
| Permisos | 4: `storage`, `alarms`, `notifications`, `activeTab` · hosts: `dolarapi.com`, `criptoya.com`, `dolarito.ar`, `api.github.com` |
| Testing | **Jest** (203 tests, 16 suites) + **Playwright** (incluye E2E sobre la extensión cargada) |
| Tooling | ESLint 8, Prettier 3, build propio con Terser + CleanCSS, GitHub Actions (CI + release) |
| Backend | **Ninguno.** Todo corre en el navegador del usuario; no hay servidor ni datos que se suban |

**Sin backend** es un dato de pitch, no un detalle técnico: no hay nada que hackear del lado del
servidor porque no hay servidor, y la instalación es cargar la carpeta descomprimida.

## 5. Arquitectura en una frase

Extensión de navegador **sin servidor** que corre un pipeline de datos en el service worker
(consulta APIs → filtra outliers → calcula rutas de arbitraje con comisiones), persiste la
configuración en el storage del navegador y la muestra en dos interfaces (popup de monitoreo y
página de configuración).

## 6. Identidad visual existente (todo verificado en los CSS del proyecto)

| Token | Valor | Origen |
|---|---|---|
| Fondo | `#09090b` → `#18181b` (gradiente vertical) | `src/ui-components/design-system.css:31` |
| Fondo alterno | `#0a0e1a` | `src/base.css:26` |
| Azul de marca (primario) | `#3b82f6` | `design-system.css:38` · `options.css:25` usa `#58a6ff` |
| Azul claro (secundario) | `#60a5fa` | `design-system.css:39` |
| Índigo (acento) | `#818cf8` | `design-system.css:40` |
| Cian (acento legacy) | `#56d4dd` | `popup.css:142` |
| Tipografía | stack del sistema (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`) | `popup.css`/`options.css` |

Ya es una paleta "dev tool" oscura con un azul de acento — **no hace falta inventar una**.

**Assets disponibles en el repo:**
- `icons/arbitraje trading.png` — **2048×2048**, logo vectorial-style: un `$` blanco construido con
  ángulos rectos que se fusiona con un gráfico de barras ascendente y una línea de tendencia con
  dos nodos. Fondo negro azulado. Texto "Arbitrage Trading" en gris abajo. Limpio, plano,
  monocromo → ideal para animar.
- `icons/icon128.png` (128×128) y variantes 16/32/48.
- `screenshots/popup-main.png`, `popup-sim.png`, `popup-exchanges.png`, `popup-cripto.png` —
  capturas **reales** del popup, ~428×599 cada una. Son el único material fotográfico auténtico
  del producto y son la base de los planos de producto del video.

## 7. Métricas impactantes (todas recontadas sobre el código)

| Métrica | Valor | Cómo se verificó |
|---|---|---|
| Exchanges integrados | **49** | valores únicos de los checkboxes de exchange en `options.html` |
| Casillas de exchange | 88 | ídem (spot + P2P contados por separado) |
| Líneas de código fuente | **32.296** (17.074 JS + 12.530 CSS + 2.692 HTML) | `wc -l` sobre `src/` |
| Tests automatizados | **203** en 16 suites | `npx jest` |
| Controles de configuración | **191** | parseo de `options.html` |
| Permisos requeridos | 4 | `manifest.json` |
| Backend / servidor | **0** | no existe carpeta ni endpoint propio |
| Actualización de datos | cada 30 s–1 min | `chrome.alarms` en el service worker |

## 8. ¿Se puede capturar la UI real?

**No hay URL desplegada** (es una extensión, no un sitio) y no corresponde levantar un dev server
— por lo tanto el video va en **modo no-capture / text-only**, con los assets propios del repo:
las 4 capturas del popup, el logo y la paleta real. Esto además respeta la regla de no ejecutar ni
modificar la extensión durante la producción.

---

## Advertencias — decisiones de honestidad para el video

La auditoría en curso (`docs/auditoria-2026-09/`, 50 hallazgos) encontró que **varias
afirmaciones del README no se corresponden con el código**. Un video promocional no puede repetir
frases que sabemos falsas, así que quedan **excluidas del guion**:

| Frase del README / promo tentativa | Por qué NO va al video |
|---|---|
| "Cálculos precisos considerando **todas** las comisiones" / "Ganancia NETA ya descontadas comisiones" | F-01: el cálculo **descarta la comisión de venta** y en un caso realista invierte el signo (muestra +1,49% donde hay −0,03%). F-02: por defecto las comisiones no se aplican y no hay control en la UI para activarlas (O-02). |
| "47 tests / cobertura ~35% / 8.1/10" | Métricas del README desactualizadas: hoy son 203 tests, y O-03 mide que 39,3% de los controles no tienen efecto. |
| "Rate limiting en APIs externas" | B-04: el rate limiting está desactivado en el camino real de producción. |
| "Sin almacenamiento de datos sensibles" | Verificación de seguridad **en curso** (informe 04 pendiente): no se afirma hasta tenerla. |

**Lo que el video SÍ afirma** es lo que está verificado y funciona: qué mira (49 exchanges +
bancos), cada cuánto (30 s–1 min), qué te muestra (rutas ordenadas + guía de 4 pasos), que podés
simular con tu monto, que avisa solo por notificación, y que corre 100% local sin backend.
