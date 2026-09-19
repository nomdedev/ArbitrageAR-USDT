# REGISTRO CONSOLIDADO DE HALLAZGOS — ArbitrageAR-USDT

Generado por `docs/auditoria-2026-09/tools/consolidar.py` el 2026-09-19 12:15 (hora local).

Extensión auditada: **ArbitrARS - Detector de Arbitraje**, manifest v6.0.0, commit base `5fdfa9e` (= `origin/main`), cargada descomprimida en Brave desde `D:\martin\Proyectos\ArbitrageAR-USDT`.

Este archivo es una **vista agregada**. El detalle, la evidencia citada y el fix propuesto de cada hallazgo viven en el informe del área correspondiente; acá está el conteo, la trazabilidad y el orden de corrección.

Informes incluidos en esta corrida: `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md`, `01-BACKGROUND.md`, `02-POPUP.md`, `03-OPTIONS.md`, `04-SEGURIDAD.md`, `06-CALIDAD-BUILD.md`.

## Conteo por severidad

| Severidad | Cantidad | Áreas |
|---|---:|---|
| CRÍTICO | 5 | Configuración (options), Financiero / motor de cálculo |
| ALTO | 24 | Background (service worker), Calidad / build, Configuración (options), Financiero / motor de cálculo, Popup / UI |
| MEDIO | 38 | Background (service worker), Calidad / build, Configuración (options), Financiero / motor de cálculo, Popup / UI, Seguridad |
| BAJO | 20 | Background (service worker), Calidad / build, Configuración (options), Financiero / motor de cálculo, Popup / UI, Seguridad |
| COSMÉTICO | 4 | Background (service worker), Calidad / build, Configuración (options), Popup / UI |
| **Total** | **91** | |

## Tabla maestra

| ID | Sev | Área | Hallazgo | Evidencia principal | Informe |
|---|---|---|---|---|---|
| **F-01** | CRÍTICO | Financiero / motor de cálculo | El motor descarta la comisión de venta y sobreestima la ganancia | `src/background/main-simple.js:897` | `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md` |
| **F-02** | CRÍTICO | Financiero / motor de cálculo | Por defecto la extensión muestra ganancia **sin** comisiones | `src/options.js:63`<br>`src/background/main-simple.js:1006` | `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md` |
| **F-09** | CRÍTICO | Financiero / motor de cálculo | La etiqueta "✅ Ganancia Neta" aparece justo cuando el número está mal, y desaparece cuando falta | `src/popup.js:1202` | `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md` |
| **O-01** | CRÍTICO | Configuración (options) | "Guardar" borra silenciosamente todos los fees por broker | `src/options.js:793`<br>`src/options.js:742` | `03-OPTIONS.md` |
| **O-02** | CRÍTICO | Configuración (options) | La sección "Fees y Comisiones" no tiene efecto y no hay forma de activarla desde la UI | `src/options.js:63`<br>`src/background/main-simple.js:1006` | `03-OPTIONS.md` |
| **B-01** | ALTO | Background (service worker) | El antiduplicado de notificaciones usa dos claves distintas y nunca coincide | `src/background/main-simple.js:1669`<br>`docs/CHANGELOG.md:239` | `01-BACKGROUND.md` |
| **B-02** | ALTO | Background (service worker) | Todo el estado de control de notificaciones vive en memoria y muere con el worker | `src/background/main-simple.js:1595` | `01-BACKGROUND.md` |
| **B-03** | ALTO | Background (service worker) | Cada arranque del worker dispara `updateData()` duplicados y concurrentes, sin guard | `src/options.js:742`<br>`src/options.js:763` | `01-BACKGROUND.md` |
| **B-04** | ALTO | Background (service worker) | El rate limiting real está desactivado en el camino de producción | `src/background/main-simple.js:279`<br>`src/background/apiClient.js:17`<br>`src/DataService.js:38` | `01-BACKGROUND.md` |
| **B-05** | ALTO | Background (service worker) | Un fallo de API se presenta como "0 oportunidades" | `src/background/main-simple.js:206`<br>`src/popup.js:1039` | `01-BACKGROUND.md` |
| **F-03** | ALTO | Financiero / motor de cálculo | La comisión de venta se ignora salvo configuración manual por exchange | `src/background/main-simple.js:635` | `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md` |
| **F-04** | ALTO | Financiero / motor de cálculo | Lógica de cálculo duplicada, muerta y con fórmula dimensionalmente incorrecta | `src/background/arbitrageCalculator.js:6`<br>`src/background/arbitrageCalculator.js:250`<br>`tests/arbitrageCalculator.test.js:18` | `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md` |
| **O-03** | ALTO | Configuración (options) | 53 de 191 controles (27,7%) no cambian ningún comportamiento | (revisar en el informe origen) | `03-OPTIONS.md` |
| **O-04** | ALTO | Configuración (options) | "Exchanges Tradicionales": 36 checkboxes idénticos a "Exchanges USDT" pero inertes | `src/options.html:402`<br>`src/options.js:861` | `03-OPTIONS.md` |
| **O-05** | ALTO | Configuración (options) | El fee de Lemon nunca se aplica: `lemon-cash` vs `lemoncash` | `src/options.html:925`<br>`src/background/main-simple.js:635` | `03-OPTIONS.md` |
| **O-06** | ALTO | Configuración (options) | Unidades contradictorias: la UI dice % y USD, el motor resta ARS | `src/options.html:893`<br>`src/background/main-simple.js:914`<br>`src/options.js:59` | `03-OPTIONS.md` |
| **O-07** | ALTO | Configuración (options) | "Horario silencioso": las horas son inalcanzables | `src/options.html:1055` | `03-OPTIONS.md` |
| **O-08** | ALTO | Configuración (options) | El botón "🔔 Probar" no hace nada | `src/options.html:1136` | `03-OPTIONS.md` |
| **O-09** | ALTO | Configuración (options) | "Umbral monto alto" se guarda en una clave ajena y el umbral real es una constante | `src/options.js:219`<br>`src/ValidationService.js:13` | `03-OPTIONS.md` |
| **O-10** | ALTO | Configuración (options) | Validación inexistente y URLs custom sin whitelist (pendiente previo: SIGUE ABIERTO) | `src/background/main-simple.js:564` | `03-OPTIONS.md` |
| **O-11** | ALTO | Configuración (options) | Los 16 checkboxes de bancos no afectan el filtrado del popup (sync vs local) | `src/popup.js:3607` | `03-OPTIONS.md` |
| **O-12** | ALTO | Configuración (options) | "Paso 2: USD → USDT": los 13 checkboxes se guardan en una clave que nadie lee | `src/options.js:839`<br>`src/options.js:251`<br>`src/options.js:100` | `03-OPTIONS.md` |
| **P-01** | ALTO | Popup / UI | El botón "Configuración avanzada" del simulador no abre nunca: `Sim.init()` se llama dos veces y el toggle se cancela a sí mismo | `src/popup.js:113`<br>`src/popup.js:3034`<br>`src/modules/simulator.js:198` | `02-POPUP.md` |
| **P-02** | ALTO | Popup / UI | La matriz de riesgo se calcula siempre con precios fijos (USD 1000-1500, USDT 1000-1100), nunca con datos de mercado | `src/modules/simulator.js:53`<br>`src/popup.js:65`<br>`src/popup.js:877` | `02-POPUP.md` |
| **Q-01** | ALTO | Calidad / build | El ZIP distribuido es un build de `deeeb66` (2 commits atrás) y `npm run package` lo pisa con el mismo nombre | `scripts/package.js:14` | `06-CALIDAD-BUILD.md` |
| **Q-02** | ALTO | Calidad / build | El build no puede fallar: minificación JS *fire-and-forget*, errores tragados y métrica de tamaño falsa | `scripts/build.js:88`<br>`scripts/build.js:153`<br>`src/popup.html:1428` | `06-CALIDAD-BUILD.md` |
| **Q-03** | ALTO | Calidad / build | El ZIP se escribe en la raíz pero CI y Release lo buscan en `dist/*.zip` | `scripts/package.js:11`<br>`.github/workflows/ci.yml:121`<br>`.github/workflows/release.yml:57` | `06-CALIDAD-BUILD.md` |
| **Q-04** | ALTO | Calidad / build | El gate de calidad no detecta ningún error del motor (bug inyectado en `:918` → 203/203 en verde) | `src/background/main-simple.js:918`<br>`.github/workflows/ci.yml:39` | `06-CALIDAD-BUILD.md` |
| **Q-05** | ALTO | Calidad / build | La cobertura mide el código muerto: 17,6 % real, 0 % en el service worker y el umbral configurado no se cumple | `.claude/auditorias/CONSOLIDATED_AUDIT_2026-04-01.md:18` | `06-CALIDAD-BUILD.md` |
| **B-06** | MEDIO | Background (service worker) | `MESSAGE_TIMEOUT_MS = 12000` fijo contra un timeout configurable de 5 a 120 s | `src/background/main-simple.js:2040`<br>`src/options.html:1184`<br>`src/background/main-simple.js:303` | `01-BACKGROUND.md` |
| **B-07** | MEDIO | Background (service worker) | Las alarmas se borran y recrean en cada arranque del worker; no hay guard de solapamiento | `src/background/main-simple.js:2409`<br>`src/options.html:1176` | `01-BACKGROUND.md` |
| **B-08** | MEDIO | Background (service worker) | Tres módulos se importan en cada arranque y no se usan: no existe caché real | `src/background/main-simple.js:22`<br>`src/background/cacheManager.js:10` | `01-BACKGROUND.md` |
| **B-09** | MEDIO | Background (service worker) | Las URLs de API que el usuario edita no se usan; el background lee claves que nadie escribe | `src/options.js:874`<br>`src/background/main-simple.js:184`<br>`src/options.js:30` | `01-BACKGROUND.md` |
| **B-10** | MEDIO | Background (service worker) | El badge `!` y `pendingUpdate` son permanentes: no hay forma de limpiarlos | `src/background/main-simple.js:2330`<br>`src/modules/notificationManager.js:145` | `01-BACKGROUND.md` |
| **B-11** | MEDIO | Background (service worker) | El test que dice cubrir el background no carga el background; 2475 líneas sin cobertura | `tests/background.messageHandler.test.js:2`<br>`tests/setup.js:57` | `01-BACKGROUND.md` |
| **F-05** | MEDIO | Financiero / motor de cálculo | El aviso de "nueva versión disponible" se dispara en falso | `src/background/main-simple.js:2300` | `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md` |
| **F-06** | MEDIO | Financiero / motor de cálculo | El repo tiene 5 archivos `.backup` dentro de `src/` y se compilan igual | `scripts/build.js:62` | `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md` |
| **F-07** | MEDIO | Financiero / motor de cálculo | Métricas de CI/desarrollo rotas (3 señales rojas) | `src/options.js:661` | `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md` |
| **F-10** | MEDIO | Financiero / motor de cálculo | Las comisiones se muestran con signo `%` pero el valor está en pesos | `src/popup.js:1239`<br>`src/background/main-simple.js:925`<br>`src/popup.js:3154` | `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md` |
| **O-13** | MEDIO | Configuración (options) | Guardar pisa 18 claves que la UI no conoce | `src/options.js:794` | `03-OPTIONS.md` |
| **O-14** | MEDIO | Configuración (options) | Los checkboxes de notificaciones pre-marcados nunca se desmarcan al cargar | `src/options.js:159`<br>`src/options.html:1075` | `03-OPTIONS.md` |
| **O-15** | MEDIO | Configuración (options) | "Umbral monto alto" arranca en `0.5` (porcentaje) dentro de un campo de ARS | `src/options.js:52`<br>`src/options.html:1217` | `03-OPTIONS.md` |
| **O-16** | MEDIO | Configuración (options) | `0` y vacío se reemplazan por defaults en silencio; los negativos se aceptan | `src/options.js:798` | `03-OPTIONS.md` |
| **O-17** | MEDIO | Configuración (options) | La subdivisión P2P "por paso" es cosmética: el motor une las tres listas | `src/background/main-simple.js:669` | `03-OPTIONS.md` |
| **O-18** | MEDIO | Configuración (options) | Reset: puede reportar éxito sobre un guardado fallido, no refresca la lista de brokers y muta `DEFAULT_SETTINGS` | `src/options.js:486` | `03-OPTIONS.md` |
| **O-19** | MEDIO | Configuración (options) | Deshabilitar notificaciones no deshabilita sus campos hasta recargar | `src/options.js:945` | `03-OPTIONS.md` |
| **O-20** | MEDIO | Configuración (options) | Un solo punto de guardado al final de 5808 px, sin indicador de cambios, feedback de 3 s fuera de viewport | `src/options.html:1232`<br>`src/options.js:898` | `03-OPTIONS.md` |
| **O-21** | MEDIO | Configuración (options) | Dos escritores del mismo objeto sin listeners cruzados (actualización perdida) | `src/options.js:742`<br>`src/popup.js:745`<br>`src/popup.js:3145` | `03-OPTIONS.md` |
| **P-03** | MEDIO | Popup / UI | La conversión USD→USDT del simulador está fabricada y sobreestima la ganancia entre 2,5 y 10,8 puntos porcentuales | `src/modules/simulator.js:697`<br>`src/background/main-simple.js:700` | `02-POPUP.md` |
| **P-04** | MEDIO | Popup / UI | El simulador usa el precio de **compra** del dólar; el motor usa el de **venta** | `src/modules/simulator.js:65`<br>`src/background/main-simple.js:805`<br>`src/popup.js:3130` | `02-POPUP.md` |
| **P-05** | MEDIO | Popup / UI | "Aplicar filtro" de la matriz ignora los dos inputs del usuario y filtra siempre con `-5..10` | `src/modules/simulator.js:249`<br>`src/modules/simulator.js:731`<br>`src/popup.html:1279` | `02-POPUP.md` |
| **P-06** | MEDIO | Popup / UI | El modal de detalles no se cierra con Escape ni recibe el foco: usa `display:flex` en vez de `showModal()` | `src/popup.html:1400`<br>`src/popup.js:1661`<br>`src/modules/notificationManager.js:460` | `02-POPUP.md` |
| **P-07** | MEDIO | Popup / UI | El popup no puede distinguir "la API falló" de "no hay oportunidades"; la única pantalla que lo diría es inalcanzable | `src/popup.js:910`<br>`src/popup.js:1039`<br>`src/background/main-simple.js:2048` | `02-POPUP.md` |
| **P-08** | MEDIO | Popup / UI | Toda la UI de "datos cacheados / datos obsoletos" es inalcanzable | `src/popup.js:856`<br>`src/popup.js:2972`<br>`src/popup.html:980` | `02-POPUP.md` |
| **P-09** | MEDIO | Popup / UI | Accesibilidad: 0 `role`/ARIA de estado en todo el popup; las tarjetas de ruta no se pueden abrir con teclado | `src/modules/routeManager.js:375`<br>`src/renderHelpers.js:98`<br>`src/popup.html:1016` | `02-POPUP.md` |
| **P-10** | MEDIO | Popup / UI | "Resetear" del simulador no resetea nada: sale por un `return` porque busca 3 ids que no existen | `src/modules/simulator.js:404`<br>`src/popup.html:1230` | `02-POPUP.md` |
| **Q-06** | MEDIO | Calidad / build | No hay fuente única de versión y `bump-version.js` no puede actualizar el popup (regex que no matchea) | `scripts/bump-version.js:46`<br>`src/popup.html:869`<br>`src/popup.css:649` | `06-CALIDAD-BUILD.md` |
| **Q-07** | MEDIO | Calidad / build | `dist/` es un build de **desarrollo** de `deeeb66`, no está versionado y no coincide con HEAD | (revisar en el informe origen) | `06-CALIDAD-BUILD.md` |
| **Q-08** | MEDIO | Calidad / build | `npm run validate` no pasa y cuelga de `npm install`; `no-undef: warn` nunca puede fallar | `.github/workflows/ci.yml:37`<br>`src/options.js:661`<br>`src/options.html:1240` | `06-CALIDAD-BUILD.md` |
| **Q-09** | MEDIO | Calidad / build | El CI no ejecuta ningún chequeo que pueda fallar por calidad, y el release nunca podría correr | `.github/workflows/ci.yml:39`<br>`.github/workflows/ci.yml:143`<br>`.github/workflows/release.yml:3` | `06-CALIDAD-BUILD.md` |
| **Q-10** | MEDIO | Calidad / build | Sin lockfile: el CI no es reproducible | (revisar en el informe origen) | `06-CALIDAD-BUILD.md` |
| **Q-11** | MEDIO | Calidad / build | `tests/ValidationService.test.js` reimplementa la clase que dice testear (2.º caso tras B-11) y su copia divergió | `tests/ValidationService.test.js:1`<br>`tests/ValidationService.test.js:33`<br>`src/ValidationService.js:45` | `06-CALIDAD-BUILD.md` |
| **Q-12** | MEDIO | Calidad / build | Deuda muerta inventariada con evidencia de alcanzabilidad (qué se puede borrar sin cambiar el comportamiento) | `src/background/main-simple.js:23`<br>`scripts/build.js:62`<br>`src/popup.html:1434` | `06-CALIDAD-BUILD.md` |
| **SEG-01** | MEDIO | Seguridad | `sanitizeHTML()` no escapa comillas y se usa en contexto de atributo | `src/utils/commonUtils.js:35`<br>`src/popup.js:2662`<br>`src/popup.js:2785` | `04-SEGURIDAD.md` |
| **SEG-02** | MEDIO | Seguridad | El listener `onMessage` acepta cualquier remitente sin `sender.id` y no valida la forma del payload | `src/background/main-simple.js:2221` | `04-SEGURIDAD.md` |
| **SEG-03** | MEDIO | Seguridad | URL configurable → petición a host arbitrario desde el service worker (SSRF ciega) y redirecciones seguidas sin validar el host final | `src/background/main-simple.js:562`<br>`src/background/main-simple.js:334`<br>`src/popup.js:2432` | `04-SEGURIDAD.md` |
| **SEG-04** | MEDIO | Seguridad | Cuatro implementaciones distintas de escape, con tres semánticas incompatibles | (revisar en el informe origen) | `04-SEGURIDAD.md` |
| **B-12** | BAJO | Background (service worker) | Estado/funciones muertas y listas de bancos triplicadas | `src/background/main-simple.js:263`<br>`src/utils/bankCalculations.js:195`<br>`docs/AUDITORIA_COMPLETA_2026.md:637` | `01-BACKGROUND.md` |
| **B-13** | BAJO | Background (service worker) | `console.error`/`console.warn` no están gateados: el background escribe en la consola del usuario | `src/background/main-simple.js:3`<br>`src/popup.js:73`<br>`src/options.js:5` | `01-BACKGROUND.md` |
| **F-08** | BAJO | Financiero / motor de cálculo | Documentación que contradice el código (deriva de documentación) | `.claude/CLAUDE.md:170`<br>`.claude/CLAUDE.md:5`<br>`docs/CHANGELOG.md:5` | `HALLAZGOS-VERIFICADOS-ORQUESTADOR.md` |
| **O-22** | BAJO | Configuración (options) | Crash del botón "Agregar" si el nombre del broker tiene comilla | `src/options.js:569` | `03-OPTIONS.md` |
| **O-23** | BAJO | Configuración (options) | Código y markup muertos en la página | `src/options.js:151`<br>`src/options.html:981` | `03-OPTIONS.md` |
| **O-24** | BAJO | Configuración (options) | ESLint `'CommonUtils' is not defined` (`src/options.js:661`): falso positivo, pero la config está mal | `src/options.js:658`<br>`src/utils/commonUtils.js:557`<br>`src/options.html:1239` | `03-OPTIONS.md` |
| **O-25** | BAJO | Configuración (options) | Accesibilidad: 0 `aria`, encabezados no operables por teclado, 3 labels huérfanos | (revisar en el informe origen) | `03-OPTIONS.md` |
| **P-11** | BAJO | Popup / UI | El estado vacío informa "Umbral: 1%" siempre: lee una clave que nadie escribe | `src/modules/routeManager.js:429`<br>`src/options.js:800` | `02-POPUP.md` |
| **P-12** | BAJO | Popup / UI | El "Monto del simulador" configurado en Ajustes nunca llega al popup | `src/options.js:813`<br>`src/options.js:196`<br>`src/popup.js:470` | `02-POPUP.md` |
| **P-13** | BAJO | Popup / UI | Números con formato inconsistente: punto decimal y sin separador de miles en la matriz, el modal de detalle y las tarjetas cripto | `src/utils/formatters.js:11`<br>`src/modules/simulator.js:633`<br>`src/popup.js:1901` | `02-POPUP.md` |
| **P-14** | BAJO | Popup / UI | El "sanitizador" del sistema de tooltips no hace nada y el contenido se inyecta con `innerHTML` (latente) | `src/ui/tooltipSystem.js:525` | `02-POPUP.md` |
| **P-15** | BAJO | Popup / UI | `initMagneticButtons()` acumula 1 `MutationObserver` y 2 listeners por tarjeta en cada re-render, sin `disconnect()` | `src/popup.js:4393`<br>`src/popup.js:1466`<br>`src/modules/routeManager.js:546` | `02-POPUP.md` |
| **P-17** | BAJO | Popup / UI | El "Recalcular con precio personalizado" usa `prompt`/`alert` nativos y con un valor inválido no hace nada ni avisa | `src/popup.js:3141`<br>`src/popup.html:993`<br>`src/popup.js:3121` | `02-POPUP.md` |
| **Q-13** | BAJO | Calidad / build | Artefactos de build y de test commiteados, con huecos en `.gitignore` | (revisar en el informe origen) | `06-CALIDAD-BUILD.md` |
| **Q-14** | BAJO | Calidad / build | Herramientas que informan problemas graves y terminan con código 0 | (revisar en el informe origen) | `06-CALIDAD-BUILD.md` |
| **SEG-05** | BAJO | Seguridad | El "sanitizado" de `TooltipSystem.updateContent` es una identidad | `src/ui/tooltipSystem.js:525` | `04-SEGURIDAD.md` |
| **SEG-06** | BAJO | Seguridad | `error.message` se interpola sin escapar en 3 `innerHTML` | `src/popup.js:1071`<br>`src/popup.js:2948`<br>`src/popup.js:3294` | `04-SEGURIDAD.md` |
| **SEG-07** | BAJO | Seguridad | Permisos de más: `activeTab` sin consumidor y `dolarito.ar` sólo usado por código sin callers | `src/modules/notificationManager.js:389`<br>`src/popup.js:3171`<br>`src/DataService.js:454` | `04-SEGURIDAD.md` |
| **SEG-08** | BAJO | Seguridad | `getRouteDescription()` devuelve `route.broker` sin escapar y ese valor entra en un atributo | `src/renderHelpers.js:178`<br>`src/renderHelpers.js:99` | `04-SEGURIDAD.md` |
| **SEG-09** | BAJO | Seguridad | Las URLs de API se guardan, se muestran y se loguean en claro; `setSafeHTML` escribe HTML sin sanear | `src/options.js:742`<br>`src/background/main-simple.js:355`<br>`src/utils/commonUtils.js:61` | `04-SEGURIDAD.md` |
| **B-14** | COSMÉTICO | Background (service worker) | Carácter de reemplazo U+FFFD incrustado en un log | `src/background/main-simple.js:1885`<br>`src/background/main-simple.js:918`<br>`src/options.js:63` | `01-BACKGROUND.md` |
| **O-26** | COSMÉTICO | Configuración (options) | Emojis en todas las etiquetas, 3 ayudas para 191 controles, plegado no persistido | `src/options.js:661`<br>`src/options.html:1240`<br>`src/options.js:63` | `03-OPTIONS.md` |
| **P-16** | COSMÉTICO | Popup / UI | ~1500 líneas de código muerto en el popup, 35 de 52 iconos del sprite sin usar y un SVG que nadie referencia | (revisar en el informe origen) | `02-POPUP.md` |
| **Q-15** | COSMÉTICO | Calidad / build | Las auditorías previas citan archivos y métricas que ya no existen en el árbol | `.claude/auditorias/AUDITORIA_POST_FIX_2026-04-01.md:148`<br>`tests/ValidationService.test.js:6`<br>`src/background/main-simple.js:918` | `06-CALIDAD-BUILD.md` |

## Índice por área

**Background (service worker)** (14): B-01 (alto), B-02 (alto), B-03 (alto), B-04 (alto), B-05 (alto), B-06 (medio), B-07 (medio), B-08 (medio), B-09 (medio), B-10 (medio), B-11 (medio), B-12 (bajo), B-13 (bajo), B-14 (cosmético)

**Calidad / build** (15): Q-01 (alto), Q-02 (alto), Q-03 (alto), Q-04 (alto), Q-05 (alto), Q-06 (medio), Q-07 (medio), Q-08 (medio), Q-09 (medio), Q-10 (medio), Q-11 (medio), Q-12 (medio), Q-13 (bajo), Q-14 (bajo), Q-15 (cosmético)

**Configuración (options)** (26): O-01 (crítico), O-02 (crítico), O-03 (alto), O-04 (alto), O-05 (alto), O-06 (alto), O-07 (alto), O-08 (alto), O-09 (alto), O-10 (alto), O-11 (alto), O-12 (alto), O-13 (medio), O-14 (medio), O-15 (medio), O-16 (medio), O-17 (medio), O-18 (medio), O-19 (medio), O-20 (medio), O-21 (medio), O-22 (bajo), O-23 (bajo), O-24 (bajo), O-25 (bajo), O-26 (cosmético)

**Financiero / motor de cálculo** (10): F-01 (crítico), F-02 (crítico), F-09 (crítico), F-03 (alto), F-04 (alto), F-05 (medio), F-06 (medio), F-07 (medio), F-10 (medio), F-08 (bajo)

**Popup / UI** (17): P-01 (alto), P-02 (alto), P-03 (medio), P-04 (medio), P-05 (medio), P-06 (medio), P-07 (medio), P-08 (medio), P-09 (medio), P-10 (medio), P-11 (bajo), P-12 (bajo), P-13 (bajo), P-14 (bajo), P-15 (bajo), P-17 (bajo), P-16 (cosmético)

**Seguridad** (9): SEG-01 (medio), SEG-02 (medio), SEG-03 (medio), SEG-04 (medio), SEG-05 (bajo), SEG-06 (bajo), SEG-07 (bajo), SEG-08 (bajo), SEG-09 (bajo)

