# Auditoría CALIDAD Y BUILD — ArbitrageAR-USDT

Fecha: 2026-09-19 · Commit auditado: `5fdfa9e` (`docs: sync claude notes and analysis` = `origin/main`)
Herramientas usadas: Node v24.12.0 / npm 11.6.2 / jest 29.7.0 / prettier 3.2.5 / eslint 8.57.0 / terser 5.31 / clean-css 5.3.

> **Regla de trabajo cumplida**: el repositorio auditado no se modificó. `git diff --stat` está vacío y el único
> archivo que escribí es este informe. (En el working tree hay dos directorios sin trackear: `docs/auditoria-2026-09/`,
> que es la salida de esta auditoría, y `videos/promo/`, un proyecto de HyperFrames que **no** generé yo y que
> apareció durante la sesión por otra tarea en paralelo.)

> **Todo lo que se ejecutó corrió sobre una copia** en
> `C:\Users\epic\AppData\Local\Temp\arb-build-audit`, creada con:
> `tar --exclude=./node_modules --exclude=./coverage --exclude=./playwright-report --exclude=./test-results -cf - . | (cd $DESTINO && tar -xf -)`
> y a la que luego se copió `node_modules/` (125 MB) **para poder ejecutar de verdad** jest, eslint,
> prettier, terser y archiver. Nada quedó sin ejecutar por falta de dependencias.
> Los builds de commits anteriores (`deeeb66`, `1b9c2dc`) se hicieron con `git checkout` **dentro de la copia**.

Este informe **no repite** los hallazgos ya registrados (F-01..F-10 del orquestador, B-01..B-14 de
`01-BACKGROUND.md`, O-01..O-12 de `03-OPTIONS.md`). Los matices nuevos sobre ellos van en la sección
"Matices sobre hallazgos ya registrados".

---

## Alcance

**Leídos completos**

| Archivo | Líneas | Por qué |
|---|---|---|
| `scripts/build.js` | 160 | área build |
| `scripts/package.js` | 54 | área empaquetado |
| `scripts/bump-version.js` | 98 | fuente de verdad de versión |
| `.github/workflows/ci.yml` | 155 | área CI |
| `.github/workflows/release.yml` | 76 | área release |
| `package.json`, `jest.config.js`, `babel.config.js`, `.eslintrc.json`, `.prettierrc`, `.prettierignore`, `.gitignore`, `manifest.json` | — | configuración del pipeline |
| `tests/ValidationService.test.js` (199) y `tests/background.messageHandler.test.js` (198) | 397 | calidad de tests (los dos casos de "test que reimplementa") |
| `src/utils/commonUtils.js` | 558 | resolver el warning de ESLint |

**Leídos parcialmente (grep + ventanas de líneas)**

`src/background/main-simple.js` (cabecera, `importScripts`, `BANK_CALCULATIONS`, `:918`, `:2301`),
`src/popup.js` (grep de `CommonUtils`/`getProfitClasses`/`validationService`), `src/options.js`
(`:650-675`), `src/ValidationService.js` (grep + cola), `src/utils/bankCalculations.js` (cabecera + cola),
`src/utils/logger.js` (cabecera), `src/popup.html` (grep de `<script>` + `version-indicator`),
`src/options.html` (grep de `<script>`), `docs/CHANGELOG.md` (cabecera),
`.claude/AUDITORIA_COMPLETA.md` y `.claude/auditorias/*.md` (grep de afirmaciones sobre tests/build/CI).

**No leídos (confesión)**

`src/popup.js` completo (4697 líneas), `src/modules/*.js` completos, `src/popup.css`, `src/options.css`,
`tests/*.test.js` más allá de los dos citados y del inventario de `require`, `docs/` más allá de lo exigido,
los `*.spec.js` de Playwright. Nada de lo que afirmo depende de ellos.

**Ejecutado (todo en la copia)**

`node scripts/build.js`, `node scripts/build.js --production`, `npm run package`, `npm run metrics`,
`npm run validate`, `npx eslint src/ --ext .js`, `npx prettier --check "src/**/*.{js,css,html}"`,
`npx jest --silent`, `npx jest --coverage --silent`, `npm audit --audit-level=high`, y tres experimentos
propios (build de HEAD vs `1b9c2dc` vs `deeeb66`, build con un archivo roto a propósito, build sin `terser`,
y build con un bug financiero inyectado en `main-simple.js:918`).

---

## Resumen

| ID | Severidad | Título | Archivo:línea |
|---|---|---|---|
| Q-01 | ALTO | El ZIP distribuido es un build de `deeeb66` (2 commits atrás) y `npm run package` lo pisa con el mismo nombre | `ArbitrageAR-v6.0.0.zip` vs `scripts/package.js:14` |
| Q-02 | ALTO | El build no puede fallar: minificación JS *fire-and-forget*, errores tragados y métrica de tamaño falsa | `scripts/build.js:88`, `:102`, `:133`, `:153` |
| Q-03 | ALTO | El ZIP se escribe en la raíz pero CI y Release lo buscan en `dist/*.zip` | `scripts/package.js:14` vs `ci.yml:125`, `release.yml:61` |
| Q-04 | ALTO | El gate de calidad no detecta ningún error del motor (bug inyectado en `:918` → 203/203 en verde) | `src/background/main-simple.js:918` + `package.json:30` |
| Q-05 | ALTO | La cobertura mide el código muerto: 17,6 % real, 0 % en el service worker; `test:coverage` falla el umbral | `jest.config.js:20-27`, `src/background/main-simple.js` (931 líneas ejecutables, 0 cubiertas) |
| Q-06 | MEDIO | No hay fuente única de versión y `bump-version.js` no puede actualizar el popup (regex que no matchea) | `scripts/bump-version.js:46-53` vs `src/popup.html:876` |
| Q-07 | MEDIO | `dist/` es un build de **desarrollo** de `deeeb66`, no está versionado y no coincide con HEAD | `dist/src/options.html` (48136 B) vs `src/options.html` (48274 B) |
| Q-08 | MEDIO | `npm run validate` no pasa (4 archivos) y cuelga de `npm install` vía `prepare`; `no-undef: warn` nunca puede fallar | `package.json:30`, `:32`, `.eslintrc.json:34` |
| Q-09 | MEDIO | El CI no ejecuta ningún chequeo que pueda fallar por calidad: prettier y `npm audit` son `continue-on-error`; `tests/` y `scripts/` no se lintean | `ci.yml:43-46`, `:144-146`, `package.json:22` |
| Q-10 | MEDIO | Sin lockfile (`package-lock.json` está en `.gitignore`): el CI no es reproducible | `.gitignore:10` |
| Q-11 | MEDIO | `tests/ValidationService.test.js` reimplementa la clase que dice testear (2.º caso tras B-11) y su copia divergió | `tests/ValidationService.test.js:6`, `:24-37` |
| Q-12 | MEDIO | Deuda muerta inventariada con evidencia de alcanzabilidad: 5 módulos inalcanzables, 5 scripts huérfanos, 5 `.backup` | `src/ui/filterController.js`, `src/utils/bankCalculations.js:14`, `src/background/{apiClient,cacheManager,arbitrageCalculator}.js` |
| Q-13 | BAJO | Artefactos de build/test commiteados y huecos en `.gitignore` | `test-results/.last-run.json`, `playwright-report/index.html` |
| Q-14 | BAJO | Herramientas que informan problemas graves y salen con código 0 (`metrics.js`, `lint`) | `scripts/metrics.js`, `package.json:31` |
| Q-15 | COSMÉTICO | Las auditorías previas citan archivos y métricas que ya no existen en el árbol | `.claude/auditorias/AUDITORIA_POST_FIX_2026-04-01.md:151` |

---

## Hallazgos

### Q-01 — ALTO — El ZIP distribuido es un build de `deeeb66` (2 commits atrás) y `npm run package` lo pisa con el mismo nombre

**Evidencia (1) — el ZIP es byte a byte el build de producción de `deeeb66`.**
Comparé los 53 archivos del ZIP contra un build limpio de cada commit, normalizando CRLF→LF
(script propio sobre el árbol extraído):

```
### ZIP vs build(deeeb66):  comunes=53 identicos=53 distintos=0
### ZIP vs build(1b9c2dc):  comunes=53 identicos=49 distintos=4
    DIFIERE src/modules/simulator.js  [_zip=9816B  _dist-1b9c2dc=10719B]
    DIFIERE src/options.html          [_zip=48136B _dist-1b9c2dc=49517B]
    DIFIERE src/options.js            [_zip=18598B _dist-1b9c2dc=18537B]
    DIFIERE src/popup.css             [_zip=79407B _dist-1b9c2dc=79971B]
### ZIP vs build(HEAD):     comunes=53 identicos=49 distintos=4   (los mismos 4)
### build(1b9c2dc) vs build(HEAD): comunes=53 identicos=53 distintos=0
```

Los 4 archivos que faltan son **exactamente** los 4 que toca el commit `1b9c2dc` (`git show --stat 1b9c2dc`
→ `src/modules/simulator.js`, `src/options.html`, `src/options.js`, `src/popup.css`). Y `build(1b9c2dc)` es
idéntico a `build(HEAD)`, así que el ZIP está **2 commits atrás** del código que corre en Brave.

**Evidencia (2) — el ZIP es un build de producción, hecho 7 minutos después de `deeeb66`.**
`ls -l` en el repo: `-rw-r--r-- 1275243 2026-04-02 11:58 ArbitrageAR-v6.0.0.zip`; `deeeb66` se commiteó
11:51 y `1b9c2dc` a las 13:36. El ZIP nunca se volvió a generar (HEAD es del 2026-06-20).

**Evidencia (3) — el ZIP NO está versionado en git.** `*.zip` está en `.gitignore:6` y `git ls-files | grep zip`
no devuelve nada. Lo mismo vale para `dist/` (`.gitignore:36`). El ZIP y el `dist/` son artefactos locales
sin trackear que están presentes en el working tree.

**Evidencia (4) — `npm run package` sobrescribe el artefacto sin cambiar el nombre:**

```
$ md5sum ArbitrageAR-v6.0.0.zip     # antes
cb7d6715e519251d0fef8de6dbf591a1    # = código de deeeb66
$ npm run package
📦 Empaquetando ArbitrageAR v6.0.0...
📁 Archivo: C:\...\arb-build-audit\ArbitrageAR-v6.0.0.zip
$ md5sum ArbitrageAR-v6.0.0.zip     # después
2efee71fde0c62de36a46c540bc69220    # = código de HEAD, nombre idéntico
```

**Qué está mal:** el nombre del artefacto es `ArbitrageAR-v${pkg.version}.zip` (`scripts/package.js:14`) y la
versión de `package.json`/`manifest.json` es `6.0.0` en los tres commits. Dos bases de código distintas
(el ZIP existente y el código actual) llevan el mismo rótulo "v6.0.0", y cualquier `npm run package`
pisa el archivo sin dejar rastro de qué código contiene.

**Impacto:** quien distribuya o instale `ArbitrageAR-v6.0.0.zip` creyendo que es "la versión 6.0.0 final"
obtiene código al que le faltan los cambios de `1b9c2dc` (entre ellos la unificación de
`CommonUtils.sanitizeHTML` en `options.js:661` y los mensajes inline del simulador). Y al revés: quien
regenera el ZIP cree estar publicando lo mismo cuando en realidad publica otra cosa. En un canal de
distribución no hay forma de distinguir los dos archivos por el nombre.

**Fix propuesto:**
1. **No conservar artefactos binarios en el working tree.** El ZIP y `dist/` ya están gitignoreados: sacarlos
   del árbol de trabajo y generarlos sólo en release (`npm run package`), dejando el hash en la release.
2. Hacer que el nombre del artefacto incluya un discriminante real: `ArbitrageAR-v${version}+${commit corto}.zip`
   (usar `git rev-parse --short HEAD` y `git status --porcelain` para marcar `-dirty`).
3. Si el proyecto publica en Chrome Web Store, subir el número de versión *antes* de empaquetar (ver Q-06).

**Cómo verificar que quedó bien:**
`md5sum ArbitrageAR-v6.0.0.zip` antes y después de `npm run package`; después del fix el archivo no debe
existir en el working tree y el ZIP generado debe llevar el hash del commit en el nombre.

---

### Q-02 — ALTO — El build no puede fallar: minificación JS *fire-and-forget*, errores tragados y métrica de tamaño falsa

**Evidencia (1) — `forEach(async …)` no se espera.**
`scripts/build.js:88-105`:

```js
88|    jsFiles.forEach(async (file) => {
89|      const code = fs.readFileSync(file, 'utf8');
90|      try {
91|        const result = await minify(code, {
...
98|        if (result.code) {
99|          fs.writeFileSync(file, result.code);
100|          jsMinified++;
101|        }
102|      } catch (err) {
103|        console.warn(`⚠️  Error minificando ${path.basename(file)}: ${err.message}`);
104|      }
105|    });
```

`forEach` ignora la promesa que devuelve cada callback: el script sigue de largo sin esperar ninguna
minificación. Demostración instrumentando **una copia** de `build.js` en el directorio temporal
(`scripts/_probe.js`, el repo no se tocó) y midiendo el tamaño real del archivo minificado en tres momentos:

```
✅ 26 archivos JS procesados          ← se informa ANTES de escribir nada
✅ 12 archivos CSS minificados
PROBE-A getDirSize(): main-simple.js= 83445  popup.css= 79971   ← 83445 = SIN minificar
✅ Build completado!
📊 Tamaño total: 2289.78 KB          ← tamaño calculado con el JS sin minificar
PROBE-B final(): main-simple.js= 83445
PROBE-C en exit: main-simple.js= 41686    ← recién acá termina la minificación
```

**Evidencia (2) — un archivo JS roto no rompe el build.** Con un error de sintaxis inyectado a propósito en
`src/modules/simulator.js` de la copia:

```
✅ Build completado!
📊 Tamaño total: 2289.80 KB
⚠️  Error minificando simulator.js: Unexpected token: eof (undefined)
EXIT_CODE_BUILD=0
-rw-r--r-- 27739 dist/src/modules/simulator.js   ← el archivo roto viaja al dist, sin minificar
```

El mensaje de error sale **después** de "✅ Build completado!" y el proceso termina con código 0.
`npm run package` empaqueta ese `dist/` sin ninguna validación.
Comparar con `package.json:28`: `"package": "npm run build:prod && node scripts/package.js"`.

**Evidencia (3) — si falta `terser`, el build tampoco falla.** Renombrando `node_modules/terser` en la copia:

```
🔄 Minificando archivos...
⚠️  Minificación omitida (dependencias no instaladas)
✅ Build completado!
📊 Tamaño total: 2382.01 KB
EXIT_CODE_BUILD_B=0
-rw-r--r-- 83445 dist/src/background/main-simple.js   ← unminificado, código 0
```

Esto es correcto en apariencia pero el mensaje miente (no es "dependencias no instaladas", es "terser no se
pudo cargar") y el código de salida 0 hace que un `dist/` completo sin minificar pase por bueno.

**Evidencia (4) — la métrica de tamaño es falsa y siempre en la misma dirección.** Tres builds consecutivos
de `HEAD`:

| corrida | tamaño reportado | tamaño real de `dist/` |
|---|---|---|
| 1 | 2289.78 KB | 2 077 443 B = 2028.75 KB |
| 2 | 2289.78 KB | 2 077 443 B = 2028.75 KB |
| 3 | 2289.78 KB | 2 077 443 B = 2028.75 KB |

Sobrestima **261 KB (+12,9 %)**, porque `scripts/build.js:153` (`const totalSize = getDirSize(DIST_DIR);`)
corre mientras el JS todavía no está minificado (`PROBE-A`). También `jsMinified` (`:100`) se incrementa y
nunca se lee: el log de `:130` informa `jsFiles.length`.

**Qué está mal:** el build no tiene ninguna verificación de salida y no puede fallar: ni con un archivo
sintácticamente inválido, ni sin minificador, ni con escrituras pendientes. El único reporte de éxito que el
usuario/CI ve ("✅ Build completado!", el tamaño) se emite antes de que el trabajo esté hecho.

**Impacto:** un ZIP con un `.js` que no parsea se distribuye con exit code 0 y un cartel verde. Como el
popup carga los 15 scripts por `<script src>` en orden (`src/popup.html:1428-1447`), un `SyntaxError` en
cualquiera de ellos corta la inicialización de la UI sin que el build lo detecte. Además el único número con
el que se compara el tamaño de releases (`.claude/auditorias/AUDITORIA_POST_FIX_2026-04-01.md:13` → "Build
✅ OK 2365.33 KB") es un valor que nunca describió al `dist/` real.

**Fix propuesto:**

```js
// 1) esperar de verdad y acumular errores
let minifyErrors = 0;
await Promise.all(
  jsFiles.map(async file => {
    const code = fs.readFileSync(file, 'utf8');
    const result = await minify(code, { compress: { drop_console: false, drop_debugger: true }, mangle: true });
    if (!result.code) throw new Error(`terser no devolvió código para ${file}`);
    fs.writeFileSync(file, result.code);
  })
).catch(err => {
  console.error('❌ Falló la minificación:', err.message);
  process.exit(1);           // el build DEBE fallar
});

// 2) validar la salida antes de reportar éxito
for (const file of jsFiles) new Function(fs.readFileSync(file, 'utf8')); // lanza si no parsea
const totalSize = getDirSize(DIST_DIR);   // ahora sí, DESPUÉS de minificar
```

Envolver todo el script en `async function main()` con `main().catch(e => { console.error(e); process.exit(1); })`
y **no** usar `try/catch` para degradar la minificación en producción.

**Cómo verificar que quedó bien:**
`printf '\nfunction broken( {\n' >> src/modules/simulator.js && npm run build:prod; echo $?` debe devolver
un código distinto de 0; y el tamaño reportado debe coincidir con `du -sb dist`.

---

### Q-03 — ALTO — El ZIP se escribe en la raíz pero CI y Release lo buscan en `dist/*.zip`

**Evidencia** — `scripts/package.js:11-14`:

```js
11|const DIST_DIR = path.join(ROOT_DIR, 'dist');
12|const pkg = require(path.join(ROOT_DIR, 'package.json'));
13|
14|const outputFile = path.join(ROOT_DIR, `ArbitrageAR-v${pkg.version}.zip`);
```

contra `.github/workflows/ci.yml:121-126`:

```yaml
121|        uses: actions/upload-artifact@v4
122|        with:
123|          name: extension-build
124|          path: dist/*.zip
125|          retention-days: 30
```

y `.github/workflows/release.yml:57-61`:

```yaml
57|        uses: softprops/action-gh-release@v1
58|        with:
59|          files: |
60|            dist/*.zip
```

Ejecutado en la copia (`npm run package` = `build:prod` + `package.js`):

```
📁 Archivo: C:\Users\epic\AppData\Local\Temp\arb-build-audit\ArbitrageAR-v6.0.0.zip
$ ls -l dist/*.zip
NO EXISTE dist/*.zip  <-- upload-artifact no encontraria nada
```

**Qué está mal:** `package.js` escribe el ZIP en la raíz del proyecto; los dos workflows lo buscan en `dist/`.
Ningún paso del pipeline copia el ZIP a `dist/`.

**Impacto:** el job `build` del CI (`ci.yml:83-126`) termina con "No files were found with the provided path"
y **no publica ningún artefacto** (con `actions/upload-artifact@v4` el default `if-no-files-found: warn` deja
el job en verde, así que el fallo es silencioso). El workflow de release (`release.yml`) crea la release de
GitHub apuntando a `dist/*.zip`, que tampoco existe: la release queda sin el `.zip` que el propio cuerpo de la
release indica descargar (`release.yml:65-69`, "Descarga el archivo `.zip`").

**Fix propuesto:** que el ZIP se escriba donde el pipeline lo busca:

```js
// scripts/package.js
const outputFile = path.join(DIST_DIR, `ArbitrageAR-v${pkg.version}.zip`);
```

Si se prefiere dejarlo en la raíz, cambiar `ci.yml` y `release.yml` a `ArbitrageAR-v*.zip`.
Además, en `ci.yml` usar `if-no-files-found: error` en el `upload-artifact`, para que un build sin artefacto
rompa el job en vez de avisar.

**Cómo verificar que quedó bien:**
`npm run package && ls -l dist/*.zip` debe listar el ZIP; y en GitHub Actions, el job `build` debe mostrar el
artefacto `extension-build` con archivos.

---

### Q-04 — ALTO — El gate de calidad no detecta ningún error del motor (bug inyectado en `:918` → 203/203 en verde)

**Evidencia (1) — el service worker no está en ninguna suite.** Medición real de cobertura
(`npx jest --coverage --silent` en la copia, leído de `coverage/lcov.info`):

```
src/background/main-simple.js                   931 líneas instrumentadas, 0 cubiertas → 0.0%
src/popup.js                                   1299,  0 → 0.0%
src/options.js                                  344,  0 → 0.0%
```

`grep -rn "main-simple" tests/` devuelve **sólo** el comentario de la línea 2 de
`tests/background.messageHandler.test.js` (ya reportado como B-11); ningún test carga el archivo.

**Evidencia (2) — experimento: introducir un error financiero y correr el gate.** Sobre la copia,
reemplazando la línea real de `src/background/main-simple.js:918` por una fórmula absurda:

```
918:    finalAmount = arsFromSale * 1.37 + 999; // BUG INTRODUCIDO A PROPOSITO

--- npx jest ---
Test Suites: 16 passed, 16 total
Tests:       203 passed, 203 total
--- eslint ---
✖ 1 problem (0 errors, 1 warning)     ← el mismo warning preexistente de options.js:661
ESLINT_EXIT=0
```

(el archivo se restauró después con `git checkout -- src/background/main-simple.js`, verificado con
`grep -c "BUG INTRODUCIDO"` → `0`).

**Evidencia (3) — el CI ejecuta exactamente eso y nada más que pueda fallar por corrección.**
`.github/workflows/ci.yml:39-49`: `npm run lint` (warnings no rompen), `npm run format:check`
(con `continue-on-error: true`) y `npm test -- --runInBand`.

**Qué está mal:** el único valor de un gate de calidad es detectar que el código dejó de hacer lo que debe.
Acá no puede: el motor de cálculo del producto (F-01 incluido) está en un archivo con 0 % de cobertura y
ninguna herramienta del pipeline analiza semántica, sólo estilo.

**Impacto:** cualquier regresión en la fórmula de arbitraje —la función por la que existe la extensión—
llega a producción con todos los checks en verde. El bug F-01 (que invierte el signo del resultado en
escenarios realistas) y el `:918` que inyecté son indistinguibles para la suite actual. La frase
"203/203 tests pasan" que aparece en las auditorías previas no dice nada sobre la corrección del producto.

**Fix propuesto (mínimo, concretamente):**
1. Un test que cargue el archivo real y rompa si se cambia la matemática (esto también es el fix de B-11):

```js
// tests/background.calculation.test.js
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync('src/background/main-simple.js', 'utf8');
let sandbox;
sandbox = { chrome: globalThis.chrome, importScripts: () => {}, console, self: {} };
vm.runInNewContext(src + '\n;globalThis.__calc = { calculateSingleExchangeRoute, resolveBrokerFee };', sandbox);
const { calculateSingleExchangeRoute } = sandbox.__calc;

test('applyFees=true con sellFee=1% descuenta la comisión de venta (F-01)', () => {
  const r = calculateSingleExchangeRoute(/* ...datos del escenario B del informe F-01... */);
  expect(r.finalAmount).toBeCloseTo(r.arsFromSale * 0.99, 2);
});
```
2. En CI, cambiar `npm test` por `npm run test:coverage`, que hoy **falla** (Q-05) — sirve como ratchet.
3. Regla permanente: ningún PR que toque `src/background/main-simple.js` sin un test que lo ejecute.

**Cómo verificar que quedó bien:** volver a inyectar el bug de `:918` y comprobar que la suite falla.

---

### Q-05 — ALTO — La cobertura mide el código muerto: 17,6 % real, 0 % en el service worker y el umbral configurado no se cumple

**Evidencia** — `npx jest --coverage --silent` (salida real, umbral de `jest.config.js:20-27`):

```
Test Suites: 16 passed, 16 total
Tests:       203 passed, 203 total
Jest: "global" coverage threshold for statements (30%) not met: 17.65%
Jest: "global" coverage threshold for branches (30%) not met: 13.47%
Jest: "global" coverage threshold for lines (30%) not met: 17.57%
Jest: "global" coverage threshold for functions (30%) not met: 22.24%
JEST_COV_EXIT=1
```

Y el detalle por archivo (de `coverage/lcov.info`), ordenado de peor a mejor:

| archivo | líneas | cubiertas | línea % |
|---|---|---|---|
| `src/ValidationService.js` | 120 | 0 | 0,0 % |
| `src/options.js` | 344 | 0 | 0,0 % |
| `src/popup.js` | 1299 | 0 | 0,0 % |
| `src/renderHelpers.js` | 41 | 0 | 0,0 % |
| `src/utils.js` | 15 | 0 | 0,0 % |
| **`src/background/main-simple.js`** | **931** | **0** | **0,0 %** |
| `src/ui/filterController.js` | 116 | 0 | 0,0 % |
| `src/ui/routeRenderer.js` | 97 | 0 | 0,0 % |
| `src/ui/tooltipSystem.js` | 223 | 0 | 0,0 % |
| `src/ui-components/animations.js` | 127 | 0 | 0,0 % |
| `src/ui-components/arbitrage-panel.js` | 78 | 0 | 0,0 % |
| `src/ui-components/tabs.js` | 127 | 0 | 0,0 % |
| `src/modules/simulator.js` | 295 | 43 | 14,6 % |
| `src/DataService.js` | 188 | 33 | 17,6 % |
| `src/modules/routeManager.js` | 189 | 45 | 23,8 % |
| `src/modules/filterManager.js` | 245 | 96 | 39,2 % |
| `src/modules/notificationManager.js` | 192 | 92 | 47,9 % |
| `src/utils/commonUtils.js` | 140 | 78 | 55,7 % |
| **`src/background/arbitrageCalculator.js`** | 76 | 69 | **90,8 %** |
| `src/utils/formatters.js` | 66 | 61 | 92,4 % |
| **`src/background/cacheManager.js`** | 48 | 45 | **93,8 %** |
| `src/modules/modalManager.js` | 130 | 125 | 96,2 % |
| **`src/background/apiClient.js`** | 78 | 76 | **97,4 %** |
| `src/utils/logger.js` | 55 | 54 | 98,2 % |
| `src/utils/stateManager.js` | 56 | 55 | 98,2 % |
| **`src/utils/bankCalculations.js`** | 67 | 67 | **100,0 %** |
| **TOTAL** | **5343** | **939** | **17,6 %** |

**Qué está mal:** hay una correlación invertida perfecta entre "qué tan testeado está" y "qué se ejecuta en
la extensión". Los cuatro módulos con mejor cobertura —`bankCalculations.js` (100 %), `apiClient.js` (97,4 %),
`cacheManager.js` (93,8 %), `arbitrageCalculator.js` (90,8 %)— **son exactamente los cuatro que la extensión
nunca ejecuta** (apiClient/cacheManager/arbitrageCalculator ya reportados en B-08/F-04; `bankCalculations.js`
lo verifico en Q-12). El código que sí corre —`main-simple.js` (931 líneas), `popup.js` (1299), `options.js`
(344)— está en 0 %. Total: 939 de 5343 líneas.

**Impacto:** el número "203 tests, 16 suites, 0 fallos" que la documentación usa como prueba de calidad mide
mayoritariamente módulos inertes. El umbral de 30 % configurado en `jest.config.js:20-27` **no se ejecuta
nunca en CI** porque CI corre `npm test` (`ci.yml:49`) y no `npm run test:coverage`; cuando lo corrí, falló
con código 1. Cualquiera que confíe en ese umbral o en la frase "Coverage ~70 %"
(`.claude/auditorias/CONSOLIDATED_AUDIT_2026-04-01.md:18`) está leyendo una métrica que no existe.

**Fix propuesto:**
1. **Primero medir lo que importa**: en `jest.config.js`, acotar `collectCoverageFrom` a los archivos que
   corren en la extensión (`src/background/main-simple.js`, `src/popup.js`, `src/options.js`, `src/modules/*`)
   y subir el umbral gradualmente por archivo (`coverageThreshold` por path) para que el número no se diluya
   con código muerto que se va a borrar (Q-12).
2. Cambiar el paso de CI a `npm run test:coverage` (hoy rojo: hay que arreglar Q-04/Q-11/Q-12 primero).
3. Corregir las afirmaciones de cobertura en `.claude/auditorias/CONSOLIDATED_AUDIT_2026-04-01.md:18`.

**Cómo verificar que quedó bien:** `npx jest --coverage` debe salir con código 0 y el reporte no debe
mencionar los módulos muertos (ya borrados o excluidos explícitamente).

---

### Q-06 — MEDIO — No hay fuente única de versión y `bump-version.js` no puede actualizar el popup (regex que no matchea)

**Evidencia (1) — la versión que el usuario ve está hardcodeada en el HTML y el mecanismo que debería
mantenerla no matchea.** `scripts/bump-version.js:46-53`:

```js
46|    path: 'src/popup.html',
47|    update: (content) => {
48|      return content.replace(
49|        /(<span id="version-indicator"[^>]*>)v[\d.]+(<\/span>)/,
50|        `$1v${newVersion}$2`
51|      );
52|    }
53|  },
```

contra el markup real, `src/popup.html:869-876`:

```html
869|          <!-- Indicador de versión con badge de actualización -->
870|          <button
871|            id="version-indicator"
872|            class="version-indicator"
873|            data-tooltip="Versión actual"
874|            aria-label="Ver versión"
875|          >
876|            <span class="version-text">v6.0.0</span>
```

Ejecutado:

```
$ node -e "console.log(/(<span id=\"version-indicator\"[^>]*>)v[\d.]+(<\/span>)/.test(require('fs').readFileSync('src/popup.html','utf8')))"
match en popup.html: false
```

El elemento es un `<button id="version-indicator">` que contiene `<span class="version-text">`: el regex busca
un `<span id="version-indicator">` que ya no existe. `git log -S 'id="version-indicator"' -- src/popup.html`
muestra que el markup cambió (`c4751d6`), y `git log -S '<span id="version-indicator"'` confirma que el formato
viejo existió: la regex quedó obsoleta y nunca se actualizó.

**Evidencia (2) — nada más escribe ese texto.**
`grep -rn "version-text" src/` → sólo `src/popup.css:649` (el estilo) y `src/popup.html:876` (el literal).
`grep -rn "getManifest().version" src/` → sólo `src/background/main-simple.js:2301`, en el service worker
(que es justamente el chequeo de F-05). `src/modules/notificationManager.js:330` y `:400` toman
`document.getElementById('version-indicator')` pero sólo para agregar/quitar clases y el badge
`#update-badge`: **el texto de la versión nunca sale del manifest**.

**Evidencia (3) — el script tampoco falla si no actualiza nada.** `scripts/bump-version.js:81-93`:

```js
81|    if (content !== newContent) {
82|      fs.writeFileSync(fullPath, newContent);
83|      console.log(`✅ Actualizado: ${filePath}`);
84|      updatedCount++;
85|    } else {
86|      console.log(`⏭️  Sin cambios: ${filePath}`);
87|    }
...
93|console.log(`\n✨ Versión actualizada en ${updatedCount} archivo(s)`);
```

No hay ninguna comprobación de que `updatedCount` sea 4: si 3 de los 4 archivos no cambian (por ejemplo, por el
regex roto de más arriba), el script termina con código 0 y el mensaje "✨ Versión actualizada en 3 archivo(s)".

**Evidencia (4) — hoy conviven siete números de versión distintos:**

| Fuente | Valor | Línea |
|---|---|---|
| `manifest.json` (la única que Chrome usa) | `6.0.0` | `manifest.json:4` |
| `package.json` (nombre del ZIP y guardia de release) | `6.0.0` | `package.json:3` |
| Badge del `README.md` | `6.0.0` | `README.md:3` |
| Texto visible del popup | `v6.0.0` | `src/popup.html:876` |
| `docs/CHANGELOG.md` (entrada más nueva) | `6.0.1` | `docs/CHANGELOG.md:5` |
| Cabecera del service worker | `v5.0.84` | `src/background/main-simple.js:10` |
| Mensaje de commit / comentarios de código | `v6.0.2` | `6c1e807`, `src/options.js:658`, `src/options.js:733` |
| Auditoría previa | `v6.0.2` | `.claude/auditorias/CONSOLIDATED_AUDIT_2026-04-01.md:3` |

y `git tag` devuelve **0 tags** (no hay ninguna release etiquetada, ver Q-09), así que la versión "6.0.2"
no existe como artefacto en ningún lado.

**Qué está mal:** no hay una fuente de verdad; hay cuatro lugares que deberían estar sincronizados
(manifest, package.json, README, popup) y un script que intenta sincronizarlos pero se rompió para el único
lugar que el usuario ve. La versión del manifest es la que decide si el navegador aplica una actualización, y
la del popup es la que el usuario reporta cuando pide soporte: hoy pueden divergir sin que nada avise.

**Impacto:** el usuario puede estar viendo "v6.0.0" en el header con un manifest que mañana diga 6.0.3 (nadie
actualiza el span), o al revés: el `<span>` puede quedar mostrando una versión que ya no es la instalada.
Cuando alguien reporte un problema, la versión que muestre la UI no será confiable. Y el chequeo de
actualización del service worker (F-05) seguirá comparando contra un número sacado del *mensaje de un commit*
en vez de contra una fuente real, con 0 tags de git para respaldarlo.

**Fix propuesto:**
1. **Una sola fuente: `manifest.json:4`.** Y que el popup lo lea en runtime, con lo cual el regex de
   `bump-version.js` deja de ser necesario:

```js
// src/modules/notificationManager.js (o popup.js, en initUIComponents)
document.querySelector('.version-text').textContent =
  'v' + chrome.runtime.getManifest().version;
```
2. En `bump-version.js`, después de recorrer `filesToUpdate`, **abortar** si `updatedCount` no es el esperado:

```js
const esperados = filesToUpdate.length;
if (updatedCount !== esperados) {
  console.error(`❌ Se actualizaron ${updatedCount} de ${esperados} archivos. Abortando.`);
  process.exit(1);
}
```
3. Agregar al CI un paso que verifique la consistencia de las fuentes que se deciden mantener:

```yaml
- name: Versiones consistentes
  run: |
    M=$(node -p "require('./manifest.json').version")
    P=$(node -p "require('./package.json').version")
    [ "$M" = "$P" ] || { echo "manifest=$M package=$P"; exit 1; }
    grep -q "^## \[$M\]" docs/CHANGELOG.md || { echo "CHANGELOG sin entrada para $M"; exit 1; }
```
4. Para el chequeo de actualización (F-05): usar `git tag`/GitHub Releases (o el raw de `manifest.json` en
   `main`, que ya está en `host_permissions` vía `api.github.com`) en lugar del mensaje del commit. Requiere
   primero empezar a etiquetar los releases (`git tag -a v6.0.1 && git push --tags`), porque hoy no hay ninguno.

**Cómo verificar que quedó bien:** `node scripts/bump-version.js 6.0.3` debe actualizar los 4 archivos
(no 3) o salir con código ≠ 0; y el header del popup debe mostrar la versión del manifest sin editar el HTML.

---

### Q-07 — MEDIO — `dist/` es un build de **desarrollo** de `deeeb66`, no está versionado y no coincide con HEAD

**Evidencia** — comparación byte a byte (CRLF→LF) de `dist/` (el que está hoy en el working tree, movido a
`_dist-asfound`) contra builds limpios:

```
### dist/ del working tree VS build DEV de HEAD:
    comunes=53 identicos=49 distintos=4
    DIFIERE src/modules/simulator.js  A=24200B  B=27719B
    DIFIERE src/options.html          A=48136B  B=49517B
    DIFIERE src/options.js            A=34677B  B=35678B
    DIFIERE src/popup.css             A=106853B B=112202B
### dist/ del working tree VS build DEV de deeeb66:
    comunes=53 identicos=53 distintos=0        ← es exactamente el build de deeeb66
### dist/ del working tree VS build PROD de HEAD:
    comunes=53 identicos=13 distintos=40       ← 40 archivos (y ninguno minificado)
    DIFIERE manifest.json  A=1061B  B=873B     ← el manifest está pretty-printed: build de desarrollo
```

**Evidencia (2) — no está versionado.** `.gitignore:35-36` (`# Build directories` / `dist/`) y `git ls-files dist`
→ 0 archivos. El `dist/` es un artefacto local de 53 archivos / 2,4 MB.

**Qué está mal:** el `dist/` del working tree no es "el build de la versión actual" como asume el brief: es un
build de **desarrollo** (sin minificar, manifest con identación de 2) del commit `deeeb66`, es decir 2 commits
atrás, generado el 2026-04-02 12:30. `mtime` de `dist/manifest.json` = 2026-04-02 12:30; `src/options.html`
fue modificado a las 12:39 (y commiteado en `1b9c2dc` a las 13:36): el `dist/` se generó 9 minutos **antes**
de esa edición y nunca se regeneró.

**Impacto:** hoy el usuario no lo nota porque la extensión que corre en Brave se carga desde la **raíz** del
repositorio (location 4, `manifest.json` de la raíz → `src/...`), no desde `dist/`. El riesgo es de proceso:
cualquiera que (a) cargue `dist/` como extensión descomprimida, (b) lo comprima a mano y lo suba, o (c)
asuma —como hace el brief de esta auditoría— que `dist/` refleja el commit actual, está trabajando con código
de `deeeb66` sin ninguna señal de que está viejo. Es la misma trampa que el ZIP de Q-01 y con el mismo origen.

**Fix propuesto:** no conservar `dist/` en el árbol de trabajo (`npm run clean` antes de terminar; ya está
gitignoreado) y hacer que el build escriba un sello verificable dentro del dist:

```js
fs.writeFileSync(path.join(DIST_DIR, 'BUILD-INFO.json'), JSON.stringify({
  version: manifest.version,
  commit: require('child_process').execSync('git rev-parse --short HEAD').toString().trim(),
  dirty: require('child_process').execSync('git status --porcelain').toString().length > 0,
  mode: isProduction ? 'production' : 'development',
  builtAt: new Date().toISOString()
}, null, 2));
```
Así cualquier `dist/` (o ZIP) dice de qué código salió. **Ojo:** `BUILD-INFO.json` dentro de `dist/` se subiría
a la Chrome Web Store; si no se quiere, escribirlo al lado (`dist/../build-info.json`) o excluirlo del ZIP.

**Cómo verificar que quedó bien:** `ls dist/BUILD-INFO.json` después de cada build y comparar el `commit` con
`git rev-parse --short HEAD`.

---

### Q-08 — MEDIO — `npm run validate` no pasa y cuelga de `npm install`; `no-undef: warn` nunca puede fallar

**Evidencia (1) — cuatro archivos, no uno.** `npx prettier --check "src/**/*.{js,css,html}"` en la copia:

```
Checking formatting...
[warn] src/modules/simulator.js
[warn] src/options.html
[warn] src/options.js
[warn] src/popup.css
[warn] Code style issues found in 4 files. Run Prettier with --write to fix.
PRETTIER_EXIT=1
```

Los 4 son exactamente los archivos que tocó el commit `1b9c2dc` ("correcciones y test"), que se commiteó sin
pasar el formateador. F-07 sólo menciona `simulator.js`: el alcance real son **4 archivos, no 1**.

**Evidencia (2) — `validate` no ejecuta ni un test.** `npm run validate`:

```
> npm run lint && npm run format:check && npm run test
...
✖ 1 problem (0 errors, 1 warning)          ← lint: exit 0
[warn] src/modules/simulator.js            ← format:check: exit 1 → corta acá
VALIDATE_EXIT=1
```

`package.json:30` (`"validate": "npm run lint && npm run format:check && npm run test"`) usa `&&`: como
`format:check` falla, `npm run test` **nunca corre**. En CI no se nota porque los 3 pasos son pasos separados,
pero cualquier automatización que use `validate` (o un humano) obtiene "falló" sin haber ejecutado los tests.

**Evidencia (3) — `validate` está colgado de `npm install`.** `package.json:32`:

```json
32|    "prepare": "npm run validate"
```

`npm` ejecuta `prepare` al final de `npm install` en el directorio del paquete: con `validate` en rojo, un
`npm install` limpio de un colaborador (o de una máquina de CI) termina en error. El propio historial del
repositorio documenta ese problema y su parche: commit `a4e14af` — *"ci: avoid install-time validate by using
npm install --ignore-scripts"*, que es lo que hace hoy `.github/workflows/ci.yml:37`
(`run: npm install --ignore-scripts`). La solución adoptada fue **desactivar los scripts de instalación**, no
arreglar el hook: cualquiera que instale sin `--ignore-scripts` sigue fallando.

**Evidencia (4) — el único warning de ESLint es un falso positivo y está degradado a `warn`.**
`src/options.js:661`:

```js
661|        <span class="broker-fee-name">${CommonUtils.sanitizeHTML(label)}</span>
```

`CommonUtils` no está definido en `options.js`, pero `src/options.html:1240-1241` carga primero el módulo que
lo publica globalmente:

```html
1240|    <script src="utils/commonUtils.js"></script>
1241|    <script src="options.js"></script>
```

y `src/utils/commonUtils.js:557` hace `window.CommonUtils = CommonUtils;` → en runtime la referencia resuelve
y no hay `ReferenceError`. Lo mismo muestran los otros globals de `.eslintrc.json:15-20` (`chrome`,
`DataService`, `ValidationService`, `getProfitClasses`), agregados a mano para silenciar `no-undef`. El problema
es que la regla está en `.eslintrc.json:34` como `"no-undef": "warn"`: aunque el warning fuera real, exit code
0. Verificado: `npx eslint src/ --ext .js` → `✖ 1 problem (0 errors, 1 warning)`, `ESLINT_EXIT=0`.

**Impacto:** (a) ningún colaborador puede `npm install` sin conocer el flag (el proyecto tuvo que documentarlo
en un mensaje de commit); (b) el "script de validación del proyecto" está roto y no ejecuta la suite;
(c) la única regla estática capaz de detectar un identificador inexistente (y por lo tanto un `ReferenceError`
en el popup/options) está en nivel `warn`: no puede romper nada.

**Fix propuesto:**
1. `npx prettier --write "src/**/*.{js,css,html}"` (los 4 archivos) y agregar el paso a un pre-commit hook o a
   `lint-staged` para que `1b9c2dc` no vuelva a pasar.
2. Desacoplar: `"validate": "npm run lint && npm run format:check && npm run test"` → usar `npm-run-all --continue-on-error`
   o simplemente `"validate:ci": "npm run lint && npm run format:check"` + dejar los tests como paso propio.
3. Borrar `"prepare": "npm run validate"` (o reemplazarlo por algo que no pueda fallar, como `node scripts/check-version.js`)
   para que `npm install` funcione de fábrica. Un hook de instalación que corre la suite completa es una mala
   idea incluso cuando pasa.
4. En `.eslintrc.json`, `"no-undef": "error"` + `"globals": { "CommonUtils": "readonly", ... }` en vez de bajar
   la severidad; y dejar `no-unused-vars`/`prefer-const` en `warn`.

**Cómo verificar que quedó bien:** `npm run validate` debe salir con código 0 y mostrar la salida de
`Test Suites: 16 passed`; `npm install` en un clon limpio (sin `--ignore-scripts`) no debe fallar.

---

### Q-09 — MEDIO — El CI no ejecuta ningún chequeo que pueda fallar por calidad, y el release nunca podría correr

**Evidencia (1) — todo lo que puede fallar está apagado.** `.github/workflows/ci.yml:39-49`:

```yaml
39|      - name: Run ESLint
40|        if: matrix.node-version == '20.x'
41|        run: npm run lint
42|
43|      - name: Check Prettier formatting (non-blocking)
44|        if: matrix.node-version == '20.x'
45|        run: npm run format:check
46|        continue-on-error: true
47|
48|      - name: Run tests
49|        run: npm test -- --runInBand
```

y `.github/workflows/ci.yml:143-146`:

```yaml
143|      - name: Run npm audit
144|        run: npm audit --audit-level=high
145|        continue-on-error: true
```

`npm run lint` sale con 0 aunque haya warnings (Q-08, evidencia 4) y `format:check` tiene `continue-on-error`:
el CI queda **verde con `src/modules/simulator.js` sin formatear**, es decir, verde con el mismo problema que
hace fallar `npm run validate` en la máquina del desarrollador.

**Evidencia (2) — `npm audit` reporta y no bloquea.** En la copia: `14 vulnerabilities (2 low, 2 moderate, 10 high)`
(`@babel/plugin-transform-modules-systemjs`, `brace-expansion`, `browserslist`, `flatted`, `form-data`,
`js-yaml`, `lodash`, `minimatch`, `picomatch`, `ws`). Con `npm audit --omit=dev` → **0 vulnerabilidades**: son
dependencias de desarrollo. El paso del CI, además, no usa `--omit=dev`, así que reporta ruido de dependencias
que no se empaquetan, con `continue-on-error`.

**Evidencia (3) — el 50 % del árbol no pasa por ninguna herramienta.** `package.json:22-23`:

```json
22|    "lint": "eslint src/ --ext .js",
23|    "lint:fix": "eslint src/ --ext .js --fix",
```

y `package.json:24`: `"format:check": "prettier --check \"src/**/*.{js,css,html}\""`. Quedan fuera de lint
y de prettier **16 archivos de tests (4.093 líneas)** y **9 archivos de `scripts/` (incluido el `build.js`
que empaqueta la extensión)**. Nota: los `.spec.js` de Playwright sí están bien aislados de Jest
(`jest.config.js:29` ignora `<rootDir>/tests/e2e/playwright/`, y todos los `.spec.js` viven ahí) — eso está
bien y no es un hallazgo.

**Evidencia (4) — el workflow de release no puede ejecutarse.** `.github/workflows/release.yml:3-6`:

```yaml
3|on:
4|  push:
5|    tags:
6|      - 'v*.*.*'
```

`git tag` → 0 tags en el repositorio (y `git ls-remote --tags origin` no devuelve nada). Nunca se creó un tag
`v*.*.*`, así que la release de GitHub —`release.yml`— **nunca corrió**; y su paso de validación
(`release.yml:45-55`, "La versión del tag no coincide con package.json") exige que alguien etiquete exactamente
la versión de `package.json`, que hoy es `6.0.0` aunque el CHANGELOG va por `6.0.1` (Q-06).

**Impacto:** el CI es un semáforo verde permanente: puede decir "todo OK" mientras el build empaqueta un archivo
roto (Q-02), el formateo está roto y hay 10 vulnerabilidades altas en dev. El canal de distribución automática no
existe (0 tags) y, si se activara, el `.zip` no se adjuntaría (Q-03).

**Fix propuesto:**
1. Quitar `continue-on-error` de `format:check` (una vez arreglados los 4 archivos, Q-08) y de `npm audit`
   (usar `npm audit --omit=dev --audit-level=high`, que hoy pasa con 0).
2. Agregar un paso propio que ejecute el build de producción y lo valide —es el fix de Q-02— más
   `npm run test:coverage` (con los umbrales corregidos de Q-05).
3. Extender `lint` a `eslint src/ tests/ scripts/ --ext .js` y `format:check` a `prettier --check "src/**/*.{js,css,html}" "tests/**/*.js" "scripts/**/*.js"`.
4. Crear el primer tag (`git tag -a v6.0.1 -m ...`) cuando la versión del manifest y del CHANGELOG coincidan, y
   corregir el `path` de los artefactos (Q-03).

**Cómo verificar que quedó bien:** en un PR de prueba, romper a propósito el formateo de un archivo de `tests/`
y el `dist` del build: los tres jobs deben ponerse en rojo.

---

### Q-10 — MEDIO — Sin lockfile: el CI no es reproducible

**Evidencia** — `.gitignore:8-10`:

```
 8|# Node modules (if using npm in future)
 9|node_modules/
10|package-lock.json
```

`git ls-files | grep -c package-lock` → **0**. El archivo existe en el disco (318.150 B, `package-lock.json`) pero
no está versionado. Consecuencia en CI (`ci.yml:36-37`):

```yaml
36|      - name: Install dependencies
37|        run: npm install --ignore-scripts
```

se usa `npm install` (no `npm ci`) y `setup-node` sin `cache` — los commits `45ba677`
(*"ci: fix setup-node failures without lockfile by removing cache and npm ci"*) y `1cf9c5c` documentan que el
pipeline se adaptó a la ausencia de lockfile en vez de versionarlo.

**Qué está mal:** sin lockfile, cada corrida de CI resuelve versiones nuevas de `jest`, `prettier`, `eslint`,
`terser`, `clean-css`, `archiver` y `@babel/*` según los rangos `^` de `package.json`. No hay hashes de
integridad ni garantía de que lo que pasó ayer pase hoy.

**Impacto:** un CI verde no dice nada sobre la próxima corrida; reproducir localmente el build de un release
requiere adivinar las versiones. Y explica una fragilidad concreta de esta área: el empaquetado depende de
`terser`/`clean-css`/`archiver` (Q-02/Q-03) y su versión no está fijada, así que una actualización menor puede
cambiar el `dist/` sin que ningún archivo del repositorio cambie.

**Fix propuesto:** quitar `package-lock.json` de `.gitignore`, commitearlo, y en CI usar `npm ci` con
`cache: 'npm'` en `setup-node`. Si se prefiere no versionarlo, al menos fijar versiones exactas (sin `^`) en
`devDependencies` para las herramientas del build (`terser`, `clean-css`, `archiver`).

**Cómo verificar que quedó bien:** `git ls-files package-lock.json` debe devolver el archivo y `ci.yml` debe
usar `npm ci`.

---

### Q-11 — MEDIO — `tests/ValidationService.test.js` reimplementa la clase que dice testear (2.º caso tras B-11) y su copia divergió

**Evidencia (1) — la clase está definida dentro del test.** `tests/ValidationService.test.js:1-12`:

```js
 1|/**
 2| * Tests for ValidationService (refactorizado)
 3| */
 4|
 5|// Simular ValidationService en entorno de test
 6|const ValidationServiceModule = (() => {
 7|  class ValidationService {
 8|    constructor() {
 9|      this.DATA_FRESHNESS_THRESHOLD = 5 * 60 * 1000;
10|      this.HIGH_AMOUNT_THRESHOLD = 500000;
11|      this.MIN_PROFIT_THRESHOLD = 0.5;
12|    }
```

El archivo tiene **0 `require`** (`grep -c "require(" tests/ValidationService.test.js` → 0) y ningún
`readFileSync`/`vm.runInNewContext`: la clase que se ejercita es una copia local. Es el mismo vicio que B-11
documentó para `tests/background.messageHandler.test.js`, en un segundo archivo.

**Evidencia (2) — la copia ya divergió del original.**

```js
// tests/ValidationService.test.js:33        (la copia)
33|        return { level: 'fresh', ageMinutes, color: '#4ade80', icon: 'verde' };

// src/ValidationService.js:45               (el original)
45|      return { level: 'fresh', ageMinutes, color: '#4ade80', icon: '🟢' };
```

Lo mismo con `icon: '?'` (test `:24`) vs `icon: '❓'` (original `:36`) y con `'rojo'`/`'amarillo'` vs `'🔴'`/`'🟡'`.
La copia cubre **4 de los 9 métodos** del original (`isDataFresh`, `getDataFreshnessLevel`,
`calculateRouteRiskLevel`, `isValidNumber`); quedan afuera `verifyCalculations` (`:129`), `generateWarnings`
(`:175`), `formatNumber` (`:208`), `requiresConfirmation` (`:218`) y `generateSystemHealthReport` (`:265`).

**Evidencia (3) — el original sí se usa en producción y mide 0 % de cobertura.**
`src/ValidationService.js:299-305`:

```js
299|const validationService = new ValidationService();
...
303|if (typeof window !== 'undefined') {
304|  window.ValidationService = ValidationService;
305|  window.validationService = validationService;
```

y el consumidor, `src/popup.js:543-545`:

```js
543|  if (!window.validationService) return '';
544|
545|  const risk = window.validationService.calculateRouteRiskLevel(
```

Cobertura medida del archivo real: **120 líneas instrumentadas, 0 cubiertas (0,0 %)** — ver Q-05.

**Qué está mal:** el único test que "cubre" la lógica de niveles de riesgo y frescura que el popup muestra al
usuario prueba una copia que ya no coincide con el original, y el original no está ejecutado por ningún test.
Es el patrón de F-04/B-11 por tercera vez: el test da la señal de "esto está cubierto" sin cubrir el código.

**Impacto:** `calculateRouteRiskLevel` decide qué advertencias ve el usuario antes de operar (`'Operacion con
perdida'`, `'Requiere transferencia entre exchanges'`, etc.). Si esa función se rompe o cambia de umbral, la
suite sigue en verde y el usuario recibe (o deja de recibir) advertencias sin que nadie lo detecte.

**Fix propuesto:** cargar el archivo real con el mock de `chrome` que ya existe en `tests/setup.js`:

```js
// tests/ValidationService.test.js
require('../src/ValidationService.js');           // publica window.validationService
const vs = window.validationService;
test('getDataFreshnessLevel devuelve los iconos del original', () => {
  expect(vs.getDataFreshnessLevel(Date.now()).icon).toBe('🟢');
});
```
y agregar cobertura para `verifyCalculations` y `generateSystemHealthReport` (son las que consumen
`input.amount`, `output.profitPercent`, etc.). Al hacerlo, el test va a fallar si alguien vuelve a tocar la copia.

**Cómo verificar que quedó bien:** `npx jest tests/ValidationService.test.js --coverage --collectCoverageFrom='src/ValidationService.js'`
debe reportar cobertura > 0 %; y cambiar un umbral en `src/ValidationService.js:12-14` debe romper un test.

---

### Q-12 — MEDIO — Deuda muerta inventariada con evidencia de alcanzabilidad (qué se puede borrar sin cambiar el comportamiento)

Método: para cada archivo, (a) ¿lo carga algún `<script src>` de `src/*.html`?, (b) ¿está en el
`importScripts` del service worker?, (c) ¿lo referencia algún otro archivo? El único `importScripts` es
`src/background/main-simple.js:23`:

```js
23|  importScripts('apiClient.js', 'arbitrageCalculator.js', '../DataService.js', 'cacheManager.js');
```

**Se puede borrar sin cambiar ningún comportamiento (0 rutas de ejecución):**

| Archivo | Líneas | Evidencia de inalcanzabilidad | Test que quedaría huérfano |
|---|---|---|---|
| `src/background/apiClient.js` | 207 | `grep -rn "ApiClient" src/` → sólo `apiClient.js:6,206` (definición y export). Se importa en `:23` pero nadie lo invoca (B-08) | `tests/apiClient.test.js` (227 líneas) |
| `src/background/cacheManager.js` | 209 | `grep -rn "CacheManager" src/` → sólo `cacheManager.js:176`. Igual que arriba (B-08) | `tests/cacheManager.test.js` (208) |
| `src/background/arbitrageCalculator.js` | 251 | F-04: sólo `arbitrageCalculator.js:6,250` | `tests/arbitrageCalculator.test.js` (289) |
| `src/utils/bankCalculations.js` | 262 | **No está en ningún HTML ni en el `importScripts` de `:23`.** Además usa sintaxis de módulo ES (`bankCalculations.js:14` `export function calculateBankConsensus(...)`) y `package.json` no declara `"type": "module"`: aunque se agregara al `importScripts`, un service worker de extensión no soporta `import`/`export` y fallaría al cargar. `main-simple.js:35-38` tiene su propia copia local de `BANK_CALCULATIONS` y `DataService.js:545` su propio `normalizeBankName` | `tests/bankCalculations.test.js` (204) |
| `src/ui/filterController.js` | 279 | `grep -rn "filterController" src/ tests/` → 0 referencias; no aparece en `popup.html` ni en `options.html` | — |
| **Subtotal src** | **1.208** | | **928 líneas de tests** |
| `.backup`: `src/ui-components/{animations,design-system,exchange-card,header}.css.backup` + `src/utils/formatters.js.backup` | 52.075 B | `scripts/build.js:62` (`copyDir(SRC_DIR, ...)`) copia todo `src/` sin filtrar → viajan a `dist/` y al ZIP. Confirmado en el listado real del ZIP (`unzip -l ArbitrageAR-v6.0.0.zip` → `src/ui-components/animations.css.backup`, `design-system.css.backup`, `exchange-card.css.backup`, `header.css.backup`, `src/utils/formatters.js.backup`) | — |
| Scripts huérfanos: `scripts/analyze-css.js`, `scripts/check-api-data.js`, `scripts/check-ids.js`, `scripts/check-interfaces.js`, `scripts/verify-css-syntax.js` | 5 archivos | `grep` de cada nombre en `package.json` y en `.github/workflows/*.yml` → **0 referencias**. Ningún npm script ni workflow los invoca. Sólo `metrics.js` (`package.json:31`) y `bump-version.js` (`:29`) están cableados | — |
| HTML de prueba versionados: `tests/test-simple.html`, `tests/test_utils_modules.html`, `tests/e2e/test-filters.html`, `tests/test_utils_results.png` | — | No los referencia `jest.config.js`, `playwright.config.js` ni `playwright.extension.config.js` | — |

**NO se puede borrar (refuto la hipótesis de la consigna en estos casos, con evidencia):**

| Archivo | Por qué está vivo |
|---|---|
| `src/utils/logger.js` (150) | `src/popup.html:1434` lo carga y `src/utils/commonUtils.js:473` lo usa (`window.Logger?.debug`) |
| `src/utils.js` (31) | `src/popup.html:1437` lo carga; `src/renderHelpers.js:10` hace `require('./utils.js').getProfitClasses`; `src/popup.js:1189` y `:1393` lo llaman como global |
| `src/ValidationService.js` (305) | `:299` instancia el singleton y `:305` lo publica; `src/popup.js:543-545` lo consume. **No es código muerto**: lo que está roto es su test (Q-11) |
| `src/DataService.js` (653) | `src/background/main-simple.js:23` lo importa y lo usa de verdad: `:1299-1300` (`self.dataService.getNetworkFee`) y `:2172-2187` (`dataService.getActiveCryptos`, `fetchAllCryptos`). Es el único de los 4 módulos del `importScripts` que tiene uso real |

**Impacto:** ~1.200 líneas de producción y ~930 de tests que nunca se ejecutan en la extensión, más 5 archivos
`.backup` que sí se distribuyen. Además de la confusión (Q-05: el código muerto es el mejor cubierto), el efecto
concreto del `importScripts` de `:23` es que el worker **evalúa 3 módulos inútiles en cada arranque** (F-04/B-08).

**Fix propuesto (orden recomendado):**
1. Borrar los 5 `.backup` **primero** y anotar que no son recuperables por git (ver "Matices", F-06).
2. Borrar `apiClient.js`, `cacheManager.js`, `arbitrageCalculator.js` y sus 3 tests; reducir `importScripts` a
   `importScripts('../DataService.js')`. **Decisión previa:** si alguno de esos módulos tiene la intención de ser
   el motor real (F-04 sugiere que `arbitrageCalculator.js` lo parece), portar primero la lógica a
   `main-simple.js` con un test, y recién después borrar.
3. Decidir `bankCalculations.js`: o se convierte en script clásico (`window.BANK_CALCULATIONS`) y se hace que
   `main-simple.js` use ESA implementación (borrando la copia local `:35-38` y el `normalizeBankName` duplicado de
   `DataService.js:545`), o se borra junto con su test.
4. Borrar `src/ui/filterController.js` (nadie lo carga).
5. Los 5 scripts huérfanos: o se cablean en `npm run validate`/CI (tienen valor: ids duplicados, interfaces,
   sintaxis CSS) o se borran. Un script de verificación que nadie corre no verifica nada.

**Cómo verificar que quedó bien:** después de borrar, `grep -rn "apiClient\|cacheManager\|arbitrageCalculator\|bankCalculations\|filterController" src/ tests/ scripts/`
no debe devolver nada; `npx jest` debe seguir pasando; y el ZIP no debe contener ningún `*.backup`.

---

### Q-13 — BAJO — Artefactos de build y de test commiteados, con huecos en `.gitignore`

**Evidencia** — archivos versionados que son salida de herramientas (no fuente):

| Archivo | Qué es |
|---|---|
| `test-results/.last-run.json` (línea 1: `"status": "passed"`) | estado de la última corrida de Playwright; se reescribe en cada `npx playwright test` |
| `playwright-report/index.html` | reporte HTML de Playwright (`playwright.config.js:22`) |
| `.playwright-mcp/` (20 archivos versionados: `playwright-report/index.html` + 6 PNG en `screenshots/`) | salida de la herramienta de MCP |
| `screenshots/popup-*.png` (4) | imágenes de documentación |
| `diagnostics/*.js` (5) + `README.md` | scripts de diagnóstico sueltos, sin npm script que los invoque |
| `tests/test_utils_results.png` | resultado de un HTML de prueba |

`coverage/` (81 archivos, 5,7 MB) sí está en el disco pero no versionado (`.gitignore:51`), y `dist/`/`*.zip`
están ignorados (Q-01/Q-07). En cambio `test-results/`, `playwright-report/`, `.playwright-mcp/`,
`screenshots/` y `diagnostics/` **no** están en `.gitignore`.

**Impacto:** cualquier corrida de Playwright (o de la herramienta MCP) deja el working tree sucio por
`test-results/.last-run.json` y `playwright-report/index.html`, que son justamente los archivos que se
commitean por accidente con "chore: update reports". El `test-results/.last-run.json` versionado además afirma
`"status": "passed"` sin relación con el código actual: es un registro que no se puede auditar. `git status`
limpio deja de ser una señal confiable.

**Fix propuesto:** `git rm -r --cached test-results playwright-report .playwright-mcp screenshots diagnostics tests/test_utils_results.png tests/test-simple.html tests/test_utils_modules.html tests/e2e/test-filters.html`
y agregar al `.gitignore`:

```
test-results/
playwright-report/
.playwright-mcp/
```

(Además, `.gitignore:58-65` tiene el bloque "# Backup files" **duplicado literalmente**: `*.bak` y `*.backup`
aparecen dos veces, y `*~` también en `:65` y `:18`. Cosmético, pero es la firma de los merge mal resueltos.)

**Cómo verificar que quedó bien:** `npx playwright test` (o un test e2e) y después `git status --porcelain`
debe salir vacío.

---

### Q-14 — BAJO — Herramientas que informan problemas graves y terminan con código 0

**Evidencia (1) — la métrica propia del proyecto se autopuntúa en 0 y no falla.** `npm run metrics`
(`package.json:31` → `scripts/metrics.js`):

```
🏆 PUNTUACIÓN DE MÉTRICAS
----------------------------------------
  Puntuación de métricas: 0/100
  ❌ El proyecto necesita optimización
METRICS_EXIT=0
```

**Evidencia (2)** — `npx eslint src/ --ext .js` → 1 warning, `ESLINT_EXIT=0` (`.eslintrc.json:34`
`"no-undef": "warn"`); `npm run build:prod` → código 0 con un archivo sintácticamente roto (Q-02);
`npm audit --audit-level=high` → 10 vulnerabilidades altas pero `continue-on-error: true` (Q-09).

**Qué está mal:** cuatro herramientas del propio proyecto producen una señal roja y ninguna puede bloquear
nada: o informan y salen 0 (`metrics`, `lint`, `build`), o su fallo está explícitamente permitido en CI
(`audit`, `format:check`). Un umbral que no puede fallar no es un umbral.

**Impacto:** no hay forma de que el repositorio se autoimpida avanzar hacia un estado peor: el puntaje de
calidad puede bajar de 0 a 0 sin que nada lo registre.

**Fix propuesto:** `metrics.js` debe salir con código ≠ 0 cuando la puntuación es 0 (o cuando baja respecto de
un baseline guardado en un archivo versionado); `lint` debe usar `--max-warnings 0` una vez limpios los
warnings; y el CI debe ejecutar `npm run metrics` como paso con umbral creciente.

**Cómo verificar que quedó bien:** `npm run metrics; echo $?` debe devolver ≠ 0 mientras la puntuación sea 0.

---

### Q-15 — COSMÉTICO — Las auditorías previas citan archivos y métricas que ya no existen en el árbol

**Evidencia** — `.claude/auditorias/AUDITORIA_POST_FIX_2026-04-01.md:148-152` lista como modificado y
verificado:

```
148|| `src/renderHelpers.js` | ~200 | 1 fix (escapeHtml en route description) | ✅ |
149|| `tests/auditoria.test.js` | ~366 | 2 fixes (assertions actualizadas) | ✅ |
```

`ls tests/auditoria.test.js` → `No such file or directory`. El archivo de test que la auditoría dice haber
modificado y verificado no existe (los otros 15 archivos de test que lista sí existen).

Los conteos de líneas del mismo documento también están desactualizados: `src/popup.js ~4651` (real: 4697),
`src/modules/simulator.js ~770` (real: 824), `src/background/apiClient.js ~200` (real: 207).

**Impacto:** ninguno funcional. Pero es evidencia de que las auditorías previas se escribieron **sobre un árbol
que ya no es el actual** y se publicaron sin volver a verificarlas: quien las lea como fuente de verdad se
forma un modelo mental equivocado. Se relaciona con F-08 (deriva de documentación) y refuerza la necesidad de
una tabla de verificación como la de este informe.

**Fix propuesto:** al cerrar esta auditoría, corregir `.claude/auditorias/AUDITORIA_POST_FIX_2026-04-01.md`
(eliminar la fila de `tests/auditoria.test.js` y actualizar los conteos) o marcar el documento como histórico.
Opción estructural: hacer que cada informe incluya el hash del commit sobre el que se escribió y una nota de
"válido hasta <commit>".

**Cómo verificar que quedó bien:** todos los `archivo:línea` citados en el informe deben existir en el commit
indicado en su cabecera.

---

## Matices sobre hallazgos ya registrados

Aportes nuevos a hallazgos de otros documentos (no los repito, sólo agrego lo que verifiqué):

| Hallazgo previo | Matiz nuevo verificado |
|---|---|
| **F-04** (código muerto con fórmula incorrecta) | Cuantificado: `src/background/arbitrageCalculator.js` tiene **90,8 % de cobertura de línea** (76 instrumentadas, 69 cubiertas) sobre un módulo que la extensión **nunca ejecuta**. El mismo patrón se repite en `apiClient.js` (97,4 %), `cacheManager.js` (93,8 %) y `bankCalculations.js` (100,0 %) → los 4 módulos mejor cubiertos son los 4 que no corren (Q-05) |
| **F-06** (`.backup` empaquetados) | **El fix propuesto en F-06 es incorrecto**: los `.backup` **NO están en git**. `.gitignore:60` y `:64` (`*.backup`), `git ls-files \| grep backup` → vacío, `git check-ignore -v src/utils/formatters.js.backup` → `.gitignore:64:*.backup`. Borrarlos **no es recuperable con `git show`**: son huérfanos definitivos. Antes de borrarlos hay que decidir si alguno tiene valor; el ZIP actual (Q-01) los incluye: `unzip -l` muestra los 5, 52.075 B |
| **F-07** (métricas de CI rotas) | (1) `format:check` falla en **4** archivos, no en 1: `src/modules/simulator.js`, `src/options.html`, `src/options.js`, `src/popup.css` — exactamente los 4 que toca el commit `1b9c2dc`. (2) `npm run lint` **no falla**: sale con código 0 con 1 warning (`no-undef: warn`), así que la única señal que rompe `validate` es prettier. (3) `validate` corta en `&&`: `npm run test` **nunca corre**. (4) En CI `format:check` es `continue-on-error: true` (`ci.yml:43-46`), así que el "script de validación que no pasa" no bloquea ningún merge: `validate` está roto sólo en la máquina del desarrollador |
| **F-05** (aviso de "nueva versión" falso) | La fragilidad es mayor de lo reportado: **no existe ninguna fuente de versión confiable** de la que el chequeo podría tomar el dato. `manifest.json:4` es la única que Chrome usa, y hay 5 lugares más editados a mano (Q-06). Además `git tag` → **0 tags**: no hay ninguna release etiquetada, así que "comparar contra tags" (fix propuesto en F-05) requiere primero crear el mecanismo de tags, que hoy no existe (y `release.yml`, que depende de tags, nunca corrió: Q-09) |
| **B-08** (3 módulos muertos en `importScripts`) | Hay un **cuarto** módulo muerto del mismo tipo: `src/utils/bankCalculations.js` (262 líneas), con el agravante de que usa `export function` (`:14`) y **no podría cargarse** en un service worker de extensión aunque se agregara al `importScripts` de `main-simple.js:23` |
| **B-11** (test que reimplementa los handlers) | El vicio tiene un **segundo caso**: `tests/ValidationService.test.js:6` define su propia clase (0 `require`, 0 `vm`), cubre 4 de los 9 métodos del original y ya divergió de él (`icon: 'verde'` vs `'🟢'`). Efecto medido sobre el archivo central: `src/background/main-simple.js` = 931 líneas ejecutables, **0 cubiertas** (Q-11) |
| **B-04/B-08** ("los fixes viven en módulos muertos") | Coincido y agrego el efecto perverso: esos módulos muertos son los que tienen la cobertura más alta del repo (`apiClient` 97,4 %, `cacheManager` 93,8 %). La suite protege justamente el código que no se ejecuta, y no protege el que sí: `main-simple.js`/`popup.js`/`options.js` = 0 % (Q-05) |
| **F-02 / F-01** (números financieros) | El pipeline no puede detectarlos: inyecté `finalAmount = arsFromSale * 1.37 + 999;` en `src/background/main-simple.js:918` y la suite completa (203 tests) y ESLint siguieron en verde (Q-04) |

---

## Verificación de auditorías previas

Contra `.claude/AUDITORIA_COMPLETA.md` y `.claude/auditorias/*.md` (marzo/abril 2026):
cada afirmación, si sigue siendo cierta hoy, y la evidencia.

| Afirmación previa (fuente) | ¿Sigue siendo cierta? | Evidencia |
|---|---|---|
| `CONSOLIDATED_AUDIT_2026-04-01.md:18` — "**Testing** 7.0/10 ✅ OK \| **Coverage ~70%**" | **NO** | Medido: **17,57 % de líneas** (939/5343) y 17,65 % de statements. `npx jest --coverage` falla los 4 umbrales del 30 % y sale con código 1 |
| `CONSOLIDATED_AUDIT_2026-04-01.md:3` — "**Versión:** v6.0.2" | **NO** | `manifest.json:4` = `6.0.0`; `package.json:3` = `6.0.0`; `git tag` = 0; el CHANGELOG llega a `6.0.1` (`docs/CHANGELOG.md:5`). La "v6.0.2" existe sólo en mensajes de commit y comentarios |
| `CONSOLIDATED_AUDIT_2026-04-01.md:12-19` — "Seguridad 8.5/10 ✅ Mejorado \| 0 XSS activos", "Background 9.5/10 ✅ Corregido \| 0 issues", "APIs 8.0/10 ✅ OK \| Rate limiting OK" | **NO verificado por mí** (áreas de otros agentes) | Sólo aporto que el "0 issues" del background convive con 0 % de cobertura sobre `main-simple.js` y con F-01/F-02 hallados después: la puntuación no está respaldada por ninguna medición ejecutable |
| `AUDITORIA_POST_FIX_2026-04-01.md:12` — "**Tests** ✅ 203/203 \| 16 suites, 0 failures" | **SÍ** | Reproducido: `npx jest --silent` → `Test Suites: 16 passed, 16 total` / `Tests: 203 passed, 203 total` / ~13,5 s. **Matiz**: pasan sin ejecutar el motor (Q-04) ni el popup/options (Q-05) |
| `AUDITORIA_POST_FIX_2026-04-01.md:13` y `:130-134` y `:186` — "**Build** ✅ OK \| 2365.33 KB" | **NO es una medición válida** | Ese número lo imprime `build.js:159` calculado en `:153`, **antes** de que se escriban los JS minificados (Q-02, demostrado con el probe). El `dist/` real de HEAD es 2 077 443 B = **2028,75 KB**, no 2289,78 KB. La auditoría previa tomó el log del script como evidencia del artefacto |
| `AUDITORIA_POST_FIX_2026-04-01.md:149` — "`tests/auditoria.test.js` (~366) \| 2 fixes ✅" | **NO** | `ls tests/auditoria.test.js` → `No such file or directory`. El archivo no existe en el árbol (Q-15) |
| `AUDITORIA_POST_FIX_2026-04-01.md:165,177` — "R-03 … 71 tests unitarios para modalManager ✅ PARCIALMENTE RESUELTO" | **SÍ** | `tests/modalManager.test.js` existe (887 líneas) y da **96,2 %** de cobertura de línea sobre `src/modules/modalManager.js` (130/125). Es el mejor test del repo y testea un módulo que sí corre |
| `AUDITORIA_POST_FIX_2026-04-01.md:190` — "La extensión está lista para testing manual en Chrome y posterior deploy" | **NO (por esta área)** | Con el mismo commit: `npm run validate` sale con código 1, `npm run test:coverage` falla los 4 umbrales, y el único `.zip` de distribución es un build de `deeeb66` con 4 archivos desactualizados (Q-01). "Lista para deploy" no se sostiene sin rebuild y sin arreglar el gate |
| `AUDITORIA_COMPLETA.md:206-210` — "Cobertura objetivo: Statements > 80 %, Branches > 75 %, Functions > 80 %, Lines > 80 %" | **NO alcanzado, y sin gate** | Real: statements 17,65 %, branches 13,47 %, functions 22,24 %, lines 17,57 %. El único umbral configurado (`jest.config.js:20-27`, 30 %) no se ejecuta en CI porque CI corre `npm test` y no `npm run test:coverage` (`ci.yml:49`) |
| `AUDITORIA_COMPLETA.md:442` — forma de verificar el build: "`npm run build:prod && ls -la dist/`" | **Parcialmente** | El comando corre, pero `ls -la dist/` muestra 2028 KB mientras el script informa 2289 KB: la verificación propuesta no detecta el problema de Q-02 y de hecho es la que produjo el "2365.33 KB" de la auditoría anterior |
| `AUDITORIA_COMPLETA.md:436` — "`npm run lint && npm run test`" como comando de verificación | **Parcialmente** | `npm run lint` sale 0 con 1 warning; el `&&` sí llega a `test`. Pero `npm run validate` (el script que el proyecto declara, `package.json:30`) agrega `format:check` en el medio y corta antes de los tests |
| `SECURITY_AUDIT_2026-03-31.md:282` — "Estas son dependencias de desarrollo (jest, jsdom), no afectan la extensión en producción" | **SÍ** | Verificado con `npm audit --omit=dev` → **0 vulnerabilidades**. El total (`npm audit`) es 14 (2 low, 2 moderate, 10 high), todas de dev. **Matiz**: el paso del CI (`ci.yml:144`) no usa `--omit=dev` y está en `continue-on-error`, así que ni bloquea ni filtra el ruido |
| `docs/CHANGELOG.md:239` (v5.0.85) — "`arbKey` ahora usa `Math.floor()`…" | **NO** (ya reportado como B-01) | Lo incluyo porque es el mismo síntoma que Q-06: el CHANGELOG documenta versiones (`5.0.84`, `6.0.0`, `6.0.2`) que no tienen entrada, y salta de `5.0.83` (`:227`) a `5.0.85` (`:159`) mientras `main-simple.js:10` dice "v5.0.84" |

---

## Lo que NO pude verificar

1. **El comportamiento real de GitHub Actions.** No puedo ejecutar los workflows. Verifiqué el desajuste de
   rutas `package.js` (raíz) vs `ci.yml`/`release.yml` (`dist/*.zip`) y que `dist/*.zip` no se crea, pero
   **no verifiqué** qué hace exactamente `actions/upload-artifact@v4` con 0 archivos (default documentado
   `if-no-files-found: warn`) ni si `softprops/action-gh-release@v1` falla o publica una release sin adjuntos
   con un glob vacío.
2. **La suite en Node 18/20.** Corrí todo en Node **v24.12.0**. El CI usa la matriz `[18.x, 20.x]`
   (`ci.yml:25`); no verifiqué si jest 29 / babel con `targets: {node: 'current'}` se comporta igual.
3. **`npm install` limpio de verdad.** No ejecuté un `npm install` completo (requiere red y re-resolución).
   Verifiqué que `npm run prepare` (= `npm run validate`) sale con código 1. Que eso haga fallar `npm install`
   es semántica documentada de npm más el commit `a4e14af` ("avoid install-time validate by using
   `npm install --ignore-scripts`"), no una medición mía.
4. **Los tests de Playwright** (`tests/e2e/playwright/*.spec.js`). No los corrí (requieren
   `npx playwright install` + navegador). Por eso no sé si pasan hoy; sólo verifiqué que `test-results/.last-run.json`
   versionado dice `"status": "passed"`.
5. **La carga real del ZIP/`dist/` en Brave.** Los hallazgos de alcance son estáticos: sé que el ZIP contiene el
   código de `deeeb66` (53/53 archivos idénticos a un build limpio) y que un `dist/` puede contener un JS roto,
   pero no cargué ninguno de los dos como extensión para ver el efecto en el navegador.
6. **El origen exacto del ZIP** (`ArbitrageAR-v6.0.0.zip`). Su `mtime` (2026-04-02 11:58) y los timestamps
   internos (14:58 UTC = 11:58 local, `deeeb66` commiteado 11:51) encajan con "build de producción de `deeeb66`
   hecho minutos después de ese commit", pero no hay registro de auditoría del archivo: la conclusión se apoya
   en el diff byte a byte, no en quién lo generó.
7. **El significado de "6.0.2".** Aparece en el mensaje del commit `6c1e807`, en comentarios
   (`src/options.js:658`, `:733`) y en una auditoría previa, pero no hay tag, release ni entrada de CHANGELOG
   que lo respalde. No pude determinar si fue un número proyectado, un error o una versión que se revirtió.
8. **Los 5 scripts huérfanos de `scripts/`**: verifiqué que ningún npm script ni workflow los invoca; no
   verifiqué si alguien los ejecuta a mano ni si siguen funcionando.
9. **El código de los módulos muertos**, línea por línea, más allá de su inalcanzabilidad y (en el caso de
   `arbitrageCalculator.js`) de lo ya reportado en F-04. No audité `apiClient.js`, `cacheManager.js` ni
   `bankCalculations.js` en profundidad: afirmo que no se ejecutan, no que sean correctos.
