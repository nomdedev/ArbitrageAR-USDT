# ArbitrageAR-USDT

Extensión Chromium que detecta oportunidades de arbitraje entre el dólar oficial argentino y el USDT en exchanges locales. Este glosario fija el vocabulario del dominio: qué es una ruta, qué mide cada número y qué palabra usamos para cada cosa. No describe implementación; para eso están `docs/` y el código.

## Mercado y cotizaciones

**Dólar oficial**:
Cotización ARS/USD publicada por los bancos, que el motor usa como precio de compra de dólares.
Código: `src/background/main-simple.js` (`fetchDolarOficial`, `fetchAllDollarTypes`), `src/DataService.js`.
_Evitar_: "dólar banco", "dólar API".

**Compra / venta (de una cotización)**:
Precios desde el punto de vista de quien cotiza, no del usuario: `venta` es lo que cuesta comprar el activo y `compra` lo que se recibe al venderlo.
Código: `oficial.compra` / `oficial.venta` en `main-simple.js`; CriptoYa entrega `bid`/`ask` y se traducen en `fetchAllDollarTypes` y en `totalBid`/`totalAsk`.
_Evitar_: decir "precio de compra" para lo que paga el usuario al comprar dólares.

**Precio de referencia del dólar**:
El ARS/USD con el que se calculan todas las rutas; puede venir de la API oficial, de un método sobre bancos o del modo manual.
Código: `resolveDollarPrice` en `src/background/main-simple.js`.
_Evitar_: "precio del dólar" a secas, "dólar blue", "cotización".

**Modo manual**:
Configuración en la que el usuario fija el ARS/USD y el motor no consulta ninguna API.
Código: `dollarPriceSource: 'manual'` y `manualDollarPrice` en `src/options.js`, consumidos por `resolveDollarPrice`.
_Evitar_: "precio fijo", "simulación".

**Método de cálculo bancario**:
Forma de resumir las cotizaciones de varios bancos en un único precio: `consenso` (mediana), `promedio` (media), `mejor-compra` (mínimo), `mejor-venta` (máximo) o un banco puntual.
Código: `BANK_CALCULATIONS` en `src/background/main-simple.js`.
_Evitar_: llamar "promedio" al consenso (es mediana).

**Bancos**:
Listado de cotizaciones por banco (Nación, Galicia, Santander, BBVA, ICBC y regionales) que alimenta el precio de referencia y la pestaña "Bancos".
Código: `fetchAllDollarTypes` y `fetchBankDollarRates` en `src/background/main-simple.js`; pestaña `banks` en `src/popup.html` y `src/popup.js`.
_Evitar_: "tipos de dólar" en singular.

**USDT/ARS**:
Precio de Tether en pesos en cada exchange; es la punta de venta de casi todas las rutas de arbitraje.
Código: `fetchUSDT` en `src/background/main-simple.js`; API `/api/usdt/ars/1`.
_Evitar_: "precio del USDT" sin decir contra qué moneda.

**USDT/USD**:
Cuántos dólares cuesta un USDT en cada exchange; convierte el tramo USD→USDT de la ruta.
Código: `fetchUSDT_USD_Brokers` y `resolveUsdToUsdtRate` en `src/background/main-simple.js`.
_Evitar_: "paridad", "tasa USDT".

**USDT/USD calculada**:
Tasa de respaldo que el motor deriva del precio oficial cuando el exchange no publica el par; se marca como advertencia en la ruta.
Código: `config.usdtUsdSource = 'calculated'` y `config.usdtUsdWarning` en `tryCalculateInterBrokerPair`.
_Evitar_: presentarla como dato del exchange.

**totalAsk / totalBid**:
Precio de compra y de venta de un exchange ya con su comisión incluida, tal como llega de CriptoYa; el motor nunca opera con el precio sin comisión.
Código: `getValidCryptoExchanges` y `tryCalculateCryptoPair` en `src/background/main-simple.js`.
_Evitar_: `ask`/`bid` para datos de exchanges (esos nombres quedan para bancos y fuentes crudas).

**Spread**:
Diferencia entre el precio de venta y el de compra del mismo activo; es un costo o una señal de datos raros, no una ganancia.
Código: `spreadPercent` en `tryCalculateCryptoPair`; validación de spreads en `fetchAllDollarTypes`.
_Evitar_: usar "spread" como sinónimo de rentabilidad.

**Cotización vencida**:
Cotización con más antigüedad que la tolerada (6 h en exchanges, 3 días en bancos) que se descarta antes de calcular.
Código: `isFreshQuote`, `MAX_EXCHANGE_QUOTE_AGE_S` y `MAX_BANK_QUOTE_AGE_S` en `src/background/main-simple.js`.
_Evitar_: "dato viejo" (para la antigüedad está el nivel de frescura).

## Rutas

**Ruta**:
Una operación concreta de compra y venta, con su rentabilidad y sus costos; es la unidad que muestra el popup y la que dispara alertas.
Código: objeto que arma `calculateAllRoutes` en `src/background/main-simple.js` (`broker`, `profitPercentage`, `netProfit`, `calculation`, `fees`); se dibuja en `src/modules/routeManager.js`.
_Evitar_: "operación", "trade", "opportunity".

**Arbitraje**:
Ruta ARS→USD (oficial)→USDT→ARS que gana por la diferencia entre el dólar oficial y el USDT local.
Código: `calculateSimpleRoutes` y `calculateSingleExchangeRoute` en `src/background/main-simple.js`; tipo `arbitrage`.
_Evitar_: "arbitraje" para las rutas directas de venta o compra de USDT.

**Ruta intra-broker**:
Compra y venta de USDT dentro del mismo exchange, sin transferir fondos.
Código: `isSingleExchange: true` en `calculateSingleExchangeRoute`.
_Evitar_: "ruta simple", "ruta interna".

**Ruta inter-broker**:
Compra de USDT en un exchange y venta en otro, con transferencia en el medio.
Código: `calculateInterBrokerRoutes` y `tryCalculateInterBrokerPair` en `src/background/main-simple.js`.
_Evitar_: "cross-exchange", "entre exchanges" como nombre propio.

**Ruta directa USDT→ARS**:
Venta de USDT que el usuario ya tiene, sin pasar por el dólar oficial; se mide en ARS recibidos.
Código: `calculateDirectUsdtToArsRoutes`; tipo `direct_usdt_ars`.
_Evitar_: "arbitraje directo".

**Ruta USD→USDT**:
Compra de USDT con dólares; se mide por eficiencia (USDT obtenidos por dólar invertido).
Código: `calculateUsdToUsdtRoutes`; tipo `usd_to_usdt`; campo `efficiency`.
_Evitar_: "compra de USDT" para la ruta de arbitraje completa.

**Arbitraje cripto**:
Compra de una cripto en un exchange y venta en otro, ambas en ARS, para símbolos como BTC, ETH, USDC o DOGE.
Código: `calculateCryptoArbitrageRoutes` y `tryCalculateCryptoPair` en `src/background/main-simple.js`; pestaña `crypto-arbitrage`.
_Evitar_: "arbitraje cripto" para la ruta ARS→USD→USDT→ARS.

**Tipo de operación**:
Clasificación de una ruta cripto según el traslado necesario: `DIRECT` (mismo exchange), `TRANSFER` (entre exchanges) o `P2P`.
Código: `operationType`, junto a `speed` y `difficulty`, en `tryCalculateCryptoPair`.
_Evitar_: "modo" para esto.

**P2P**:
Compraventa de USDT contra pesos entre personas (Binance P2P); suma pasos y riesgo, por eso el motor la marca aparte.
Código: `requiresP2P`, `isP2PRoute`, `fetchBinanceP2P_USDT_ARS` y `fetchBinanceP2P_USDT_USD`.
_Evitar_: "peer to peer" en la UI, donde se muestra "P2P" o "Directo".

**Broker**:
Nombre interno del exchange o plataforma donde se ejecuta una pata de la ruta.
Código: campo `broker` (`"binance→lemoncash"`), `normalizarBroker` y `brokerFees` en `src/background/main-simple.js`; `src/modules/filterManager.js`.
_Evitar_: usar "exchange" y "broker" como si fueran cosas distintas.

## Ganancia y costos

**Ganancia bruta**:
Resultado de la ruta antes de descontar comisiones y costos fijos.
Código: `grossProfit` y `grossProfitPercent`.
_Evitar_: "ganancia" a secas.

**Ganancia neta**:
Resultado después de todas las comisiones y costos configurados; decide si la ruta sirve y es lo que se notifica.
Código: `netProfit` y `profitPercentage` (`profitPercent`) en `src/background/main-simple.js`.
_Evitar_: "brecha", "retorno", "spread" y "rentabilidad" como sinónimos sueltos.

**Fees aplicados**:
Interruptor que define si el cálculo descuenta comisiones; apagado, la ganancia es teórica.
Código: `applyFeesInCalculation` en `src/options.js`, `applyFees` en `src/background/main-simple.js`.
_Evitar_: "con comisiones" sin aclarar si están incluidas o no.

**Comisión de compra / venta**:
Porcentaje que cobra cada broker por operar; puede definirse por broker o como valor global.
Código: `buyFee`/`sellFee` en `brokerFees` y `resolveBrokerFee`; `extraTradingFee` como comisión general.
_Evitar_: "fee" para los costos fijos en pesos.

**Costos fijos de la operación**:
Retiro, transferencia y comisión bancaria, en ARS, que se restan al final de la ruta.
Código: `extraWithdrawalFee`, `extraTransferFee` y `bankCommissionFee`; bloque `fees` de cada ruta.
_Evitar_: "gastos", "costos operativos".

**Fee de red**:
Costo en cripto de mover el activo entre exchanges, valorizado en ARS.
Código: `getNetworkFee` en `src/DataService.js`; `fees.network` en `tryCalculateCryptoPair`.
_Evitar_: "comisión de red".

**Monto base**:
Capital con el que se calcula la ruta; define la ganancia en pesos, no el porcentaje.
Código: `defaultSimAmount` → `initialAmount` en `calculateSimpleRoutes`; `defaultUsdtAmount` en `calculateDirectUsdtToArsRoutes`.
_Evitar_: "inversión", "monto inicial" mezclado con el saldo disponible.

**Umbral mínimo**:
Rentabilidad (%) a partir de la cual una ruta se muestra o se avisa; hay uno para mostrar y otro para notificar.
Código: `profitThreshold` en `routeManager.js` y `popup.js`, `filterMinProfit` y `alertThreshold` en `src/options.js` y `shouldSendNotification`.
_Evitar_: usar "umbral" sin decir si es el de la lista o el de las alertas.

**Nivel de urgencia**:
Etiqueta del aviso según la ganancia neta: normal (<5 %), moderado (5–10 %), alto (10–15 %) y extremo (≥15 %).
Código: `sendNotification` en `src/background/main-simple.js`.
_Evitar_: "tipo de notificación".

## Datos y riesgo

**Frescura de los datos**:
Antigüedad de la última actualización, clasificada como `fresh` (<5 min), `warning` (5–15 min) o `stale` (>15 min), que pinta el indicador de estado.
Código: `getDataFreshnessLevel` en `src/ValidationService.js`; indicador en `src/popup.js`.
_Evitar_: "estado de la conexión" para la frescura.

**Nivel de riesgo de la ruta**:
Puntaje que combina rentabilidad baja, transferencia entre exchanges, fees altos, spread del dólar y P2P, y se muestra como bajo, medio o alto.
Código: `calculateRouteRiskLevel` en `src/ValidationService.js`.
_Evitar_: "riesgo" a secas, sin aclarar si es de la ruta o del mercado.

**Matriz de riesgo**:
Grilla del simulador que cruza un rango de precios del dólar con un rango de precios del USDT y muestra la ganancia de cada combinación.
Código: `generateRiskMatrix` y `calculateProfitPercent` en `src/modules/simulator.js`.
_Evitar_: "tabla de escenarios".

**Simulador**:
Calculadora que aplica la ruta al capital y a precios elegidos por el usuario, sin depender del mercado en vivo.
Código: `src/modules/simulator.js`; pestaña `simulator` en `src/popup.html`.
_Evitar_: "calculadora" para el resultado de una ruta real.

**Preset**:
Juego de fees y spread prearmado para simular escenarios: Conservador, Moderado o Agresivo.
Código: `SIMULATOR_PRESETS` en `src/modules/simulator.js`.
_Evitar_: "perfil", "escenario".

## Selección y fuentes

**Brokers seleccionados**:
Plataformas habilitadas que participan del cálculo; si la lista está vacía, participan todas.
Código: `selectedUsdtBrokers` y `selectedTraditionalExchanges` en `src/options.js`; `filterExchangesBySelection` y `buildFilteredUsdtMap` en `src/background/main-simple.js`.
_Evitar_: "exchanges preferidos" (eso es solo orden y filtro de la lista).

**Bancos seleccionados**:
Bancos que entran al precio de referencia y al método de cálculo bancario.
Código: `selectedBanks` en `src/options.js` y `resolveDollarPrice`.
_Evitar_: "bancos preferidos".

**Exchanges de notificación**:
Subconjunto de plataformas que puede disparar alertas; si está vacío, todas pueden.
Código: `notificationExchanges` en `src/options.js` y `shouldSendNotification`.
_Evitar_: "exchanges favoritos", "preferredExchanges" (nombre viejo).

**Horario silencioso**:
Franja horaria configurada en la que no se envían alertas.
Código: `quietHoursEnabled`, `quietStart` y `quietEnd` en `src/options.js`; `shouldSendNotification`.
_Evitar_: "modo no molestar" en el código.
