# Plan de Fix por Agentes Especialistas

Fecha: 2026-02-25  
Proyecto: ArbitrageAR-USDT

## 1) Objetivo
Resolver errores de runtime, desacoples de arquitectura, inestabilidad de tests y deuda crítica de calidad **sin cambiar el alcance funcional** de la app.

## 2) Estrategia de ejecución
- Ejecutar en paralelo lo que no tenga dependencia directa.
- Priorizar primero bloqueos de runtime y confiabilidad del pipeline.
- Validar por capas después de cada entrega parcial.

## 3) Asignación de tareas por agente

## Agente A — Runtime Background (Service Worker)
**Especialidad:** Chrome Extension background, asincronía, storage y mensajería.

**Tareas:**
1. Corregir referencias inválidas en `src/background/main-simple.js`:
   - `getUserSettings` no definido.
   - `dataService` no definido (usar referencia consistente ya disponible en runtime, p.ej. `self.dataService`).
2. Garantizar que handlers de mensajes no rompan por variables fuera de scope.
3. Mantener compatibilidad MV3 y comportamiento actual.

**Entregables:**
- Cambios mínimos en `src/background/main-simple.js`.
- Nota breve de riesgos/resolución.

**DoD (Definition of Done):**
- No quedan `no-undef` funcionales en rutas de ejecución críticas del background.
- Flujo `getBanksData` y `GET_CRYPTO_ARBITRAGE` no arroja ReferenceError.

---

## Agente B — Arquitectura UI (RouteManager desacoplado)
**Especialidad:** módulos frontend, encapsulación, dependencias explícitas.

**Tareas:**
1. Eliminar dependencia implícita de `src/modules/routeManager.js` con globals de `popup.js` (ej. `getRouteTypeName`).
2. Definir helper local o importar desde util compartido sin generar acoplamiento circular.
3. Verificar que el render de cards mantenga texto/labels esperados.

**Entregables:**
- Cambios en `src/modules/routeManager.js` (y util compartido solo si es estrictamente necesario).

**DoD:**
- `routeManager` funciona por sí mismo con dependencias explícitas.
- No depende de orden accidental de carga para funciones críticas de render.

---

## Agente C — Tooling de Tests (Jest vs Playwright)
**Especialidad:** configuración de test runners, aislamiento de suites.

**Tareas:**
1. Ajustar `jest.config.js` para excluir tests E2E Playwright (`tests/e2e/playwright/**` y/o `*.spec.js` de esa carpeta).
2. Mantener ejecución de unit/integration por `npm test`.
3. No romper comando dedicado E2E (`npm run test:e2e`).

**Entregables:**
- Cambios en `jest.config.js`.

**DoD:**
- `npm test` deja de intentar cargar `@playwright/test`.
- `npm run test:e2e` sigue siendo el canal E2E.

---

## Agente D — Suite Legacy (alineación con código actual)
**Especialidad:** mantenimiento de tests legacy y compatibilidad de contratos.

**Tareas:**
1. Actualizar `tests/test-e2e-complete.js` para:
   - No exigir `formatNumber` exportado si ya no es API pública de `renderHelpers`.
   - Validar `<!doctype html>` de forma case-insensitive.
2. Mantener intención del test (detectar regresiones reales, no falsos positivos).

**Entregables:**
- Cambios en `tests/test-e2e-complete.js`.

**DoD:**
- `npm run test:legacy` no falla por checks obsoletos.
- Los tests siguen detectando errores funcionales reales.

---

## Agente E — Validación y QA técnico
**Especialidad:** validación incremental y triage de resultados.

**Tareas:**
1. Ejecutar y registrar resultados en orden:
   - `npm run lint`
   - `npm test -- --runInBand`
   - `npm run test:legacy`
   - (opcional) `npm run test:e2e`
2. Clasificar hallazgos en:
   - Bloqueante
   - Alto
   - Medio/Bajo

**Entregables:**
- Resumen de ejecución con comando + estado + causa raíz.

**DoD:**
- Evidencia reproducible de estado final del repo.

---

## Agente F — Limpieza de warnings críticos
**Especialidad:** calidad estática y deuda técnica con bajo riesgo.

**Tareas:**
1. Atacar warnings con impacto real primero (`no-undef`, variables críticas no usadas por refactor incompleto).
2. Evitar cambios cosméticos masivos (espacios/indentación) en esta fase.
3. No alterar APIs públicas ni UX.

**Entregables:**
- Cambios acotados en archivos críticos.

**DoD:**
- Reducción clara de warnings de riesgo sin introducir regresiones.

---

## Agente G — Documentación de cierre
**Especialidad:** handoff técnico y trazabilidad.

**Tareas:**
1. Generar resumen final con:
   - Qué se corrigió.
   - Qué riesgos quedan.
   - Checklist de regresión manual.
2. Actualizar docs/changelog si aplica.

**Entregables:**
- Documento de cierre en `docs/`.

**DoD:**
- Equipo puede continuar sin contexto oral adicional.

## 4) Dependencias entre agentes
- A (Runtime) y C (Jest/Playwright) pueden iniciar en paralelo.
- B (RouteManager) puede correr en paralelo con A/C.
- D (Legacy tests) depende parcialmente de B/C (para evitar ruido en validación).
- E (Validación) corre tras A+B+C+D.
- F (Limpieza warnings) después de E para no tapar señales.
- G (Documentación final) al cierre.

## 5) Orden recomendado de ejecución
1. Agente A
2. Agente C
3. Agente B
4. Agente D
5. Agente E
6. Agente F
7. Agente G

## 6) Prompts listos para lanzar cada agente

### Prompt Agente A
"Revisa y corrige `src/background/main-simple.js` para eliminar errores de runtime por símbolos no definidos (`getUserSettings`, `dataService`). Debes mantener comportamiento actual, aplicar cambios mínimos y validar que los handlers `getBanksData` y `GET_CRYPTO_ARBITRAGE` no lancen ReferenceError. Entrega diff y breve explicación de causa raíz."

### Prompt Agente B
"Desacopla `src/modules/routeManager.js` de globals definidos en `src/popup.js` (ej. `getRouteTypeName`). Implementa dependencias explícitas con cambios mínimos y sin alterar UX ni textos clave. Entrega diff y justificación técnica."

### Prompt Agente C
"Ajusta `jest.config.js` para que `npm test` no ejecute tests E2E de Playwright (`tests/e2e/playwright/**`). Mantén `npm run test:e2e` como canal E2E. Entrega diff y validación rápida con comandos."

### Prompt Agente D
"Actualiza `tests/test-e2e-complete.js` para eliminar checks obsoletos: doctype case-insensitive y contrato actual de `renderHelpers` (sin `formatNumber` exportado). Mantén la cobertura funcional del test. Entrega diff y resultado de `npm run test:legacy`."

### Prompt Agente E
"Ejecuta validación técnica en orden: `npm run lint`, `npm test -- --runInBand`, `npm run test:legacy` (y opcional `npm run test:e2e`). Resume resultados por severidad, con causas raíz y archivos implicados."

### Prompt Agente F
"Realiza limpieza de warnings críticos (prioriza `no-undef` y problemas de riesgo real), evitando cambios masivos de estilo. Mantén APIs y comportamiento funcional. Entrega diff y métrica antes/después."

### Prompt Agente G
"Genera documento de cierre técnico con: fixes aplicados, riesgos residuales, y checklist de regresión manual para popup/background/options. Guardar en `docs/` con fecha."

## 7) Criterios de éxito global
- Sin errores de runtime en flujos críticos.
- `npm test` estable (sin mezclar E2E Playwright).
- `npm run test:legacy` sin falsos positivos por contratos viejos.
- Riesgos remanentes documentados y priorizados.
