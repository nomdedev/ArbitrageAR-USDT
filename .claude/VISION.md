# VISION — ArbitrageAR-USDT

> Propósito anti-goal-drift. Toda decisión de arquitectura debe alinearse con esta visión.
> Revisar cada 3 meses.

## Propósito

Extensión de navegador (Chrome/Edge/Brave, Manifest V3) que detecta oportunidades de arbitraje
entre el Dólar Oficial argentino y USDT en exchanges locales, con alertas y simulador.

## Objetivos

1. Detectar y comunicar rutas de arbitraje ARS→USD→USDT→ARS con datos frescos y confiables.
2. Mantener calidad y seguridad (extensión de finanzas = superficie sensible) con gates ejecutables.

## Anti-objetivos (NO hacer)

1. No es un bot de trading ni ejecuta órdenes: solo detección, alertas y simulación.

## Principios

- La calidad se verifica con gates ejecutables, no con opinión.
- Maker ≠ Checker: quien escribe no califica su propio trabajo.
- Todo cambio pasa por el runner (`graph:pre` / `graph:post`).