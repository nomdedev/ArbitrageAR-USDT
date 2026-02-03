/**
 * Simulator Module
 * Módulo para la gestión del simulador de arbitraje y matriz de riesgo
 * @module Simulator
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  // ==========================================
  // PRESETS DEL SIMULADOR
  // ==========================================

  /**
   * Presets de configuración para el simulador
   * @constant {Object}
   */
  const SIMULATOR_PRESETS = {
    conservative: {
      name: 'Conservador',
      description: 'Fees altos, comisiones máximas - Escenario pesimista',
      buyFee: 1.5,
      sellFee: 1.5,
      transferFee: 5.0,
      bankCommission: 1.0,
      spreadMultiplier: 1.03 // 3% spread en USD
    },
    moderate: {
      name: 'Moderado',
      description: 'Configuración balanceada - Escenario realista',
      buyFee: 1.0,
      sellFee: 1.0,
      transferFee: 2.0,
      bankCommission: 0.5,
      spreadMultiplier: 1.02 // 2% spread en USD
    },
    aggressive: {
      name: 'Agresivo',
      description: 'Fees mínimos - Escenario optimista',
      buyFee: 0.5,
      sellFee: 0.5,
      transferFee: 0,
      bankCommission: 0,
      spreadMultiplier: 1.01 // 1% spread en USD
    }
  };

  // ==========================================
  // ESTADO DEL MÓDULO
  // ==========================================

  let currentData = null;
  let userSettings = null;

  // ==========================================
  // FUNCIONES PRIVADAS
  // ==========================================

  /**
   * Obtener el precio actual del dólar oficial
   * @private
   * @returns {number} Precio del dólar
   */
  function getCurrentDollarPrice() {
    return currentData?.dollarPrice || currentData?.oficial?.compra || 950;
  }

  /**
   * Mostrar tooltip temporal del preset aplicado
   * @private
   * @param {string} name - Nombre del preset
   * @param {string} description - Descripción del preset
   */
  function showPresetTooltip(name, description) {
    // Remover tooltip existente
    const existing = document.querySelector('.preset-tooltip');
    if (existing) existing.remove();

    const tooltip = document.createElement('div');
    tooltip.className = 'preset-tooltip';
    tooltip.innerHTML = `<strong>${name}</strong>: ${description}`;
    tooltip.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(59, 130, 246, 0.95);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.85em;
      z-index: 9999;
      animation: fadeInUp 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(tooltip);

    setTimeout(() => {
      tooltip.style.opacity = '0';
      tooltip.style.transition = 'opacity 0.3s ease';
      setTimeout(() => tooltip.remove(), 300);
    }, 2500);
  }

  /**
   * Generar precios USD equidistantes
   * @private
   * @param {number} min - Precio mínimo
   * @param {number} max - Precio máximo
   * @param {number} count - Cantidad de precios a generar
   * @returns {number[]} Array de precios
   */
  function generateEquidistantPrices(min, max, count = 5) {
    const prices = [];
    for (let i = 0; i < count; i++) {
      prices.push(min + ((max - min) * i) / (count - 1));
    }
    return prices;
  }

  /**
   * Obtener datos de bancos desde currentData
   * @private
   * @returns {Object|null} Datos de bancos
   */
  function getBanksData() {
    return currentData?.banks || null;
  }

  /**
   * Obtener datos de exchanges USDT desde currentData
   * @private
   * @returns {Object|null} Datos de exchanges USDT
   */
  function getUSDTData() {
    return currentData?.usdt || null;
  }

  // ==========================================
  // FUNCIONES PÚBLICAS
  // ==========================================

  /**
   * Inicializar el módulo de simulador
   * @public
   * @param {Object} data - Datos actuales de la aplicación
   * @param {Object} settings - Configuración del usuario
   */
  function init(data, settings) {
    currentData = data;
    userSettings = settings;
    console.log('✅ [Simulator] Módulo inicializado');
  }

  /**
   * Actualizar los datos del simulador
   * @public
   * @param {Object} data - Nuevos datos
   */
  function updateData(data) {
    currentData = data;
  }

  /**
   * Actualizar la configuración del usuario
   * @public
   * @param {Object} settings - Nueva configuración
   */
  function updateSettings(settings) {
    userSettings = settings;
  }

  /**
   * Obtener los presets disponibles
   * @public
   * @returns {Object} Presets del simulador
   */
  function getPresets() {
    return SIMULATOR_PRESETS;
  }

  /**
   * Aplicar un preset al simulador
   * @public
   * @param {string} presetName - Nombre del preset a aplicar
   * @returns {boolean} True si se aplicó correctamente
   */
  function applyPreset(presetName) {
    const preset = SIMULATOR_PRESETS[presetName];
    if (!preset) {
      console.warn(`⚠️ [Simulator] Preset desconocido: ${presetName}`);
      return false;
    }

    const officialPrice = getCurrentDollarPrice();

    // Obtener elementos del DOM
    const elements = {
      usdBuy: document.getElementById('sim-usd-buy-price'),
      usdSell: document.getElementById('sim-usd-sell-price'),
      buyFee: document.getElementById('sim-buy-fee'),
      sellFee: document.getElementById('sim-sell-fee'),
      transferFee: document.getElementById('sim-transfer-fee-usd'),
      bankCommission: document.getElementById('sim-bank-commission')
    };

    // Verificar que existan todos los elementos
    const missing = Object.entries(elements)
      .filter(([, el]) => !el)
      .map(([k]) => k);
    
    if (missing.length > 0) {
      console.warn('⚠️ [Simulator] Elementos faltantes para preset:', missing);
      return false;
    }

    // Aplicar valores del preset
    elements.usdBuy.value = officialPrice.toFixed(2);
    elements.usdSell.value = (officialPrice * preset.spreadMultiplier).toFixed(2);
    elements.buyFee.value = preset.buyFee.toFixed(2);
    elements.sellFee.value = preset.sellFee.toFixed(2);
    elements.transferFee.value = preset.transferFee.toFixed(2);
    elements.bankCommission.value = preset.bankCommission.toFixed(2);

    console.log(`✅ [Simulator] Preset "${preset.name}" aplicado:`, preset);

    // Mostrar tooltip de confirmación
    showPresetTooltip(preset.name, preset.description);

    return true;
  }

  /**
   * Cargar valores por defecto en el simulador
   * @public
   */
  function loadDefaultValues() {
    const officialPrice = getCurrentDollarPrice();

    // Verificar elementos
    const elements = {
      amount: document.getElementById('sim-amount'),
      usdBuy: document.getElementById('sim-usd-buy-price'),
      usdSell: document.getElementById('sim-usd-sell-price'),
      buyFee: document.getElementById('sim-buy-fee'),
      sellFee: document.getElementById('sim-sell-fee'),
      transferFee: document.getElementById('sim-transfer-fee-usd'),
      bankCommission: document.getElementById('sim-bank-commission')
    };

    if (!elements.usdBuy || !elements.usdSell || !elements.buyFee || 
        !elements.sellFee || !elements.transferFee || !elements.bankCommission) {
      console.warn('⚠️ [Simulator] No se encontraron todos los inputs del simulador');
      return;
    }

    // Monto por defecto desde configuración
    if (elements.amount && userSettings?.simulatorDefaultAmount) {
      elements.amount.value = userSettings.simulatorDefaultAmount;
    }

    // Precios del dólar
    elements.usdBuy.value = officialPrice.toFixed(2);
    elements.usdSell.value = (officialPrice * 1.02).toFixed(2);

    // Fees desde configuración
    const buyFee = (userSettings?.extraTradingFee || 0) + 1.0;
    const sellFee = (userSettings?.extraTradingFee || 0) + 1.0;
    const transferFee = userSettings?.transferFeeUSD || 0;
    const bankCommission = userSettings?.bankCommissionFee || 0;

    elements.buyFee.value = buyFee.toFixed(2);
    elements.sellFee.value = sellFee.toFixed(2);
    elements.transferFee.value = transferFee.toFixed(2);
    elements.bankCommission.value = bankCommission.toFixed(2);

    console.log('✅ [Simulator] Valores por defecto cargados');
  }

  /**
   * Resetear la configuración del simulador
   * @public
   */
  function resetConfig() {
    const elements = {
      usdBuy: document.getElementById('sim-usd-buy-price'),
      usdSell: document.getElementById('sim-usd-sell-price'),
      buyFee: document.getElementById('sim-buy-fee'),
      sellFee: document.getElementById('sim-sell-fee'),
      transferFee: document.getElementById('sim-transfer-fee-usd'),
      bankCommission: document.getElementById('sim-bank-commission'),
      matrixMin: document.getElementById('matrix-min-percent'),
      matrixMax: document.getElementById('matrix-max-percent'),
      matrixStep: document.getElementById('matrix-step-percent')
    };

    const missingElements = Object.entries(elements)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingElements.length > 0) {
      console.warn('⚠️ [Simulator] Elementos faltantes en reset:', missingElements);
      return;
    }

    // Reset a valores por defecto
    elements.usdBuy.value = '';
    elements.usdSell.value = '';
    elements.buyFee.value = '1.0';
    elements.sellFee.value = '1.0';
    elements.transferFee.value = '0';
    elements.bankCommission.value = '0';
    elements.matrixMin.value = '0';
    elements.matrixMax.value = '2';
    elements.matrixStep.value = '0.5';

    // Recargar valores desde configuración
    loadDefaultValues();

    console.log('✅ [Simulator] Configuración reseteada');
  }

  /**
   * Generar matriz de riesgo
   * @public
   * @param {boolean} useCustomParams - Usar parámetros personalizados
   * @returns {Promise<boolean>} True si se generó correctamente
   */
  async function generateRiskMatrix(useCustomParams = false) {
    console.log('🔍 [Simulator] Generando matriz de riesgo...');

    const amountInput = document.getElementById('sim-amount');
    const amount = parseFloat(amountInput?.value) || 1000000;

    // Validar monto
    if (!amount || amount < 1000) {
      alert('⚠️ Ingresa un monto válido (mínimo $1,000 ARS)');
      return false;
    }

    const usdPrices = [];
    let usdtPrices = [];

    if (useCustomParams) {
      // MODO PERSONALIZADO
      const usdMinInput = parseFloat(document.getElementById('matrix-usd-min')?.value) || 
                         currentData?.oficial?.compra || 1000;
      const usdMaxInput = parseFloat(document.getElementById('matrix-usd-max')?.value) || 
                         currentData?.oficial?.compra * 1.5 || 1500;
      const usdtMinInput = parseFloat(document.getElementById('matrix-usdt-min')?.value) || 1000;
      const usdtMaxInput = parseFloat(document.getElementById('matrix-usdt-max')?.value) || 1100;

      // Validaciones
      if (usdMinInput >= usdMaxInput) {
        alert('⚠️ El USD mínimo debe ser menor que el USD máximo');
        return false;
      }
      if (usdtMinInput >= usdtMaxInput) {
        alert('⚠️ El USDT mínimo debe ser menor que el USDT máximo');
        return false;
      }

      usdPrices.push(...generateEquidistantPrices(usdMinInput, usdMaxInput, 5));
      usdtPrices.push(...generateEquidistantPrices(usdtMinInput, usdtMaxInput, 5));
    } else {
      // MODO AUTOMÁTICO con datos reales
      const banksData = getBanksData();
      
      if (banksData && Object.keys(banksData).length > 0) {
        const bankCompraPrices = Object.values(banksData)
          .filter(bank => bank.compra && bank.compra > 0)
          .map(bank => bank.compra)
          .sort((a, b) => a - b);

        if (bankCompraPrices.length >= 1) {
          const usdMin = Math.min(...bankCompraPrices);
          const usdMax = usdMin * 1.5;
          usdPrices.push(...generateEquidistantPrices(usdMin, usdMax, 5));
        }
      }

      // Fallback a precio oficial
      if (usdPrices.length === 0) {
        const usdMin = currentData?.oficial?.compra || 1000;
        const usdMax = usdMin * 1.5;
        usdPrices.push(...generateEquidistantPrices(usdMin, usdMax, 5));
      }

      // Procesar datos de exchanges USDT
      const usdtData = getUSDTData();
      if (usdtData && Object.keys(usdtData).length > 0) {
        const usdtSellPrices = Object.values(usdtData)
          .filter(exchange => exchange.venta && exchange.venta > 0)
          .map(exchange => exchange.venta)
          .sort((a, b) => b - a);

        if (usdtSellPrices.length >= 5) {
          usdtPrices = usdtSellPrices.slice(0, 5);
        } else if (usdtSellPrices.length >= 1) {
          usdtPrices = usdtSellPrices;
        }
      }

      // Fallback para USDT
      if (usdtPrices.length === 0) {
        const usdtMin = 1000;
        const usdtMax = 1100;
        usdtPrices.push(...generateEquidistantPrices(usdtMin, usdtMax, 5));
      }
    }

    // Validaciones finales
    const finalUsdMin = Math.min(...usdPrices);
    const finalUsdMax = Math.max(...usdPrices);
    const finalUsdtMin = Math.min(...usdtPrices);
    const finalUsdtMax = Math.max(...usdtPrices);

    if (finalUsdMin >= finalUsdMax) {
      alert('⚠️ Error: Los precios USD no son válidos');
      return false;
    }
    if (finalUsdtMin >= finalUsdtMax) {
      alert('⚠️ Error: Los precios USDT no son válidos');
      return false;
    }

    // Obtener parámetros configurables
    const buyFeePercent = parseFloat(document.getElementById('sim-buy-fee')?.value) || 1.0;
    const sellFeePercent = parseFloat(document.getElementById('sim-sell-fee')?.value) || 1.0;
    const transferFeeUSD = parseFloat(document.getElementById('sim-transfer-fee-usd')?.value) || 0;
    const bankCommissionPercent = parseFloat(document.getElementById('sim-bank-commission')?.value) || 0;

    // Validaciones de parámetros
    if (buyFeePercent < 0 || buyFeePercent > 10) {
      alert('⚠️ El fee de compra debe estar entre 0% y 10%');
      return false;
    }
    if (sellFeePercent < 0 || sellFeePercent > 10) {
      alert('⚠️ El fee de venta debe estar entre 0% y 10%');
      return false;
    }

    // Generar tabla HTML
    const tableHTML = generateMatrixTableHTML(
      usdPrices, 
      usdtPrices, 
      amount, 
      buyFeePercent, 
      sellFeePercent, 
      transferFeeUSD, 
      bankCommissionPercent
    );

    // Mostrar matriz
    const matrixTable = document.getElementById('risk-matrix-table');
    const matrixResult = document.getElementById('risk-matrix-result');

    if (!matrixTable || !matrixResult) {
      alert('⚠️ Error: elementos de la matriz no encontrados');
      return false;
    }

    matrixTable.innerHTML = tableHTML;
    matrixResult.style.display = 'block';

    // Scroll hacia la matriz
    matrixResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    return true;
  }

  /**
   * Generar HTML de la tabla de matriz de riesgo
   * @private
   * @param {number[]} usdPrices - Precios USD
   * @param {number[]} usdtPrices - Precios USDT
   * @param {number} amount - Monto de inversión
   * @param {number} buyFeePercent - Fee de compra
   * @param {number} sellFeePercent - Fee de venta
   * @param {number} transferFeeUSD - Fee de transferencia en USD
   * @param {number} bankCommissionPercent - Comisión bancaria
   * @returns {string} HTML de la tabla
   */
  function generateMatrixTableHTML(
    usdPrices, 
    usdtPrices, 
    amount, 
    buyFeePercent, 
    sellFeePercent, 
    transferFeeUSD, 
    bankCommissionPercent
  ) {
    const Fmt = window.Formatters;
    
    let tableHTML = '<thead><tr><th>USD Compra \\ USDT Venta</th>';
    usdtPrices.forEach(price => {
      tableHTML += `<th>$${price.toFixed(0)}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    // Calcular rentabilidad para cada combinación
    usdPrices.forEach(usdPrice => {
      tableHTML += `<tr><td><strong>$${usdPrice.toFixed(0)}</strong></td>`;

      usdtPrices.forEach(usdtPrice => {
        const profitPercentage = calculateProfitPercent(
          amount, usdPrice, usdtPrice, buyFeePercent, sellFeePercent,
          transferFeeUSD, bankCommissionPercent
        );

        // Determinar clase CSS según rentabilidad
        let cellClass = 'matrix-cell-negative';
        if (profitPercentage > 1.0) {
          cellClass = 'matrix-cell-positive';
        } else if (profitPercentage >= 0) {
          cellClass = 'matrix-cell-neutral';
        }

        const profit = (amount * profitPercentage) / 100;
        tableHTML += `<td class="${cellClass}" title="Ganancia: $${Fmt.formatNumber(profit)} ARS (${profitPercentage.toFixed(2)}%)">${profitPercentage.toFixed(2)}%</td>`;
      });

      tableHTML += '</tr>';
    });

    tableHTML += '</tbody>';
    return tableHTML;
  }

  /**
   * Calcular porcentaje de ganancia para una combinación de precios
   * @private
   * @param {number} amount - Monto de inversión
   * @param {number} usdPrice - Precio USD
   * @param {number} usdtPrice - Precio USDT
   * @param {number} buyFeePercent - Fee de compra
   * @param {number} sellFeePercent - Fee de venta
   * @param {number} transferFeeUSD - Fee de transferencia
   * @param {number} bankCommissionPercent - Comisión bancaria
   * @returns {number} Porcentaje de ganancia
   */
  function calculateProfitPercent(
    amount, usdPrice, usdtPrice, buyFeePercent, sellFeePercent,
    transferFeeUSD, bankCommissionPercent
  ) {
    // Paso 1: Aplicar comisión bancaria
    const bankCommissionARS = amount * (bankCommissionPercent / 100);
    const amountAfterBankCommission = amount - bankCommissionARS;

    // Paso 2: Comprar USD
    const step1_usd = amountAfterBankCommission / usdPrice;

    // Paso 3: Comprar USDT con USD
    const usdToUsdtRate = usdPrice / usdtPrice;
    const step2_usdt = step1_usd / usdToUsdtRate;

    // Paso 4: Aplicar fee de compra
    const buyFeeDecimal = buyFeePercent / 100;
    const step2_usdtAfterFee = step2_usdt * (1 - buyFeeDecimal);

    // Paso 5: Fee de transferencia
    const transferFeeUSDT = transferFeeUSD / usdToUsdtRate;
    const step3_usdtAfterTransfer = step2_usdtAfterFee - transferFeeUSDT;

    // Paso 6: Vender USDT por ARS
    const step4_ars = step3_usdtAfterTransfer * usdtPrice;

    // Paso 7: Aplicar fee de venta
    const sellFeeDecimal = sellFeePercent / 100;
    const finalAmount = step4_ars * (1 - sellFeeDecimal);

    // Calcular ganancia
    const profit = finalAmount - amount;
    const profitPercentage = (profit / amount) * 100;

    return profitPercentage;
  }

  /**
   * Aplicar filtro a la matriz de riesgo
   * @public
   * @param {number} minProfit - Ganancia mínima
   * @param {number} maxProfit - Ganancia máxima
   */
  function applyMatrixFilter(minProfit = -5, maxProfit = 10) {
    const matrixTable = document.getElementById('risk-matrix-table');
    if (!matrixTable) return;

    const cells = matrixTable.querySelectorAll('td');
    let visibleCount = 0;
    let totalCells = 0;

    cells.forEach(cell => {
      // Skip header cells
      if (cell.tagName === 'TH' || cell.querySelector('strong')) return;

      const text = cell.textContent.trim();
      if (text.endsWith('%')) {
        totalCells++;
        const profitValue = parseFloat(text.replace('%', ''));

        if (profitValue >= minProfit && profitValue <= maxProfit) {
          cell.style.opacity = '1';
          cell.style.backgroundColor = '';
          visibleCount++;
        } else {
          cell.style.opacity = '0.2';
          cell.style.backgroundColor = '#333';
        }
      }
    });

    // Mostrar contador
    const filterResults = document.getElementById('filter-results');
    const filterCount = document.getElementById('filter-count');
    if (filterResults && filterCount) {
      filterCount.textContent = visibleCount;
      filterResults.style.display = 'block';
    }
  }

  /**
   * Resetear filtro de la matriz
   * @public
   */
  function resetMatrixFilter() {
    const matrixTable = document.getElementById('risk-matrix-table');
    if (!matrixTable) return;

    const cells = matrixTable.querySelectorAll('td');
    cells.forEach(cell => {
      cell.style.opacity = '1';
      cell.style.backgroundColor = '';
    });

    // Ocultar contador
    const filterResults = document.getElementById('filter-results');
    if (filterResults) {
      filterResults.style.display = 'none';
    }

    // Reset valores de filtro
    const filterMin = document.getElementById('filter-min-profit');
    const filterMax = document.getElementById('filter-max-profit');
    if (filterMin) filterMin.value = '-5';
    if (filterMax) filterMax.value = '10';
  }

  // ==========================================
  // EXPORTAR MÓDULO
  // ==========================================

  const Simulator = {
    // Constantes
    PRESETS: SIMULATOR_PRESETS,

    // Inicialización
    init,
    updateData,
    updateSettings,

    // Presets
    getPresets,
    applyPreset,

    // Configuración
    loadDefaultValues,
    resetConfig,

    // Matriz de riesgo
    generateRiskMatrix,
    applyMatrixFilter,
    resetMatrixFilter
  };

  // Exportar para uso global
  window.Simulator = Simulator;

  console.log('✅ [Simulator] Módulo cargado correctamente');

})(window);
