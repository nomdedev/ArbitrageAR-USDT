// ============================================
// DOLLAR PRICE MANAGER - dollarPriceManager.js
// Responsabilidad: Gestionar precios del dólar oficial según configuración del usuario
// ============================================

import { log } from './config.js';

// Importar DataService para acceso a métodos de fetch
import { DataService } from '../DataService.js';

class DollarPriceManager {
  constructor() {
    this.bankRatesCache = null;
    this.cacheTimestamp = 0;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
    this.dataService = new DataService(); // Crear instancia local de DataService
  }

  // Método para invalidar cache (usado cuando cambia configuración)
  invalidateCache() {
    log('🔄 [DOLLAR] Invalidando cache del DollarPriceManager');
    this.bankRatesCache = null;
    this.cacheTimestamp = 0;
  }

  // Obtener precio del dólar según la configuración del usuario
  async getDollarPrice(userSettings = null) {
    try {
      // Cargar configuración del usuario si no se proporciona
      if (!userSettings) {
        const result = await chrome.storage.local.get('notificationSettings');
        userSettings = result.notificationSettings || {};
      }

      const dollarPriceSource = userSettings.dollarPriceSource || 'auto';
      
      if (dollarPriceSource === 'manual') {
        // Usar precio manual configurado por el usuario (precio de VENTA del dólar)
        const manualPrice = userSettings.manualDollarPrice || 950;
        log(`💵 [MANUAL] Usando precio manual del dólar VENTA: $${manualPrice}`);
        
        // IMPORTANTE: El precio manual es el precio de VENTA del dólar (lo que pagamos por 1 USD)
        const manualData = {
          compra: manualPrice * 0.98, // Precio de compra estimado (no se usa en cálculos)
          venta: manualPrice, // ESTE es el precio real que se usa en todos los cálculos
          source: 'manual',
          bank: 'Manual',
          timestamp: new Date().toISOString()
        };
        
        log(`💵 [MANUAL] Datos retornados:`, manualData);
        return manualData;
      } else {
        // Usar precio automático desde dolarito.ar
        log(`💵 [AUTO] Usando precio automático (fuente: ${dollarPriceSource})`);
        return await this.getAutomaticDollarPrice(userSettings);
      }
    } catch (error) {
      console.error('Error obteniendo precio del dólar:', error);
      // Fallback al precio promedio
      return await this.getFallbackPrice();
    }
  }

  // Obtener precio automático desde dolarito.ar
  async getAutomaticDollarPrice(userSettings) {
    const preferredBank = userSettings.preferredBank || 'promedio';
    
    // NUEVO v5.0.32: Log de configuración recibida
    log(`💵 [CONFIG] preferredBank: ${preferredBank}`);
    log(`💵 [CONFIG] selectedBanks: ${userSettings.selectedBanks ? `[${userSettings.selectedBanks.join(', ')}]` : 'TODOS (no especificado)'}`);
    
    // IMPORTANTE: Pasar userSettings para aplicar filtro de selectedBanks
    const bankRates = await this.getBankRates(userSettings);
    
    if (!bankRates || Object.keys(bankRates).length === 0) {
      log('⚠️ No se pudieron obtener tasas bancarias, usando fallback');
      return await this.getFallbackPrice();
    }
    
    // NUEVO v5.0.32: Log de bancos obtenidos después del filtro
    log(`💵 [FILTRADO] Bancos obtenidos: ${Object.keys(bankRates).length} - [${Object.keys(bankRates).join(', ')}]`);

    if (preferredBank === 'consenso') {
      // NUEVO v5.0.33: Calcular CONSENSO - Encuentra el grupo más grande de precios similares
      // Este método es ideal cuando queremos el "valor más representativo" del mercado
      // IMPORTANTE: bankRates ya viene FILTRADO por selectedBanks desde getBankRates()
      const banks = Object.values(bankRates);
      const compraValues = banks.map(b => ({ price: b.compra, name: b.name }));
      const ventaValues = banks.map(b => ({ price: b.venta, name: b.name }));
      
      // NUEVO v5.0.33: Log detallado de bancos usados (ya filtrados)
      const bankNames = banks.map(b => `${b.name || 'Unknown'} ($${b.venta.toFixed(2)})`).join(', ');
      log(`💵 [CONSENSO] Calculando consenso SOLO con ${banks.length} bancos ${userSettings.selectedBanks && userSettings.selectedBanks.length > 0 ? 'SELECCIONADOS' : 'disponibles (sin filtro)'}`);
      log(`💵 [CONSENSO] Bancos para análisis de cluster: [${bankNames}]`);
      
      // Función para encontrar el cluster (grupo) más grande de valores similares
      const findConsensusCluster = (values, tolerance = 0.02) => {
        if (values.length === 0) return null;
        
        // Ordenar por precio
        const sorted = values.slice().sort((a, b) => a.price - b.price);
        
        let bestCluster = [];
        
        // Probar cada valor como centro de un cluster
        for (let i = 0; i < sorted.length; i++) {
          const center = sorted[i].price;
          const cluster = sorted.filter(item => {
            const diff = Math.abs(item.price - center) / center;
            return diff <= tolerance; // Dentro del 2% de tolerancia
          });
          
          if (cluster.length > bestCluster.length) {
            bestCluster = cluster;
          }
        }
        
        return bestCluster;
      };
      
      const compraCluster = findConsensusCluster(compraValues);
      const ventaCluster = findConsensusCluster(ventaValues);
      
      // Calcular promedio del cluster más grande
      const consensoCompra = compraCluster.reduce((sum, item) => sum + item.price, 0) / compraCluster.length;
      const consensoVenta = ventaCluster.reduce((sum, item) => sum + item.price, 0) / ventaCluster.length;
      
      // Log detallado del cluster encontrado
      const clusterBanks = ventaCluster.map(item => `${item.name} ($${item.price.toFixed(2)})`).join(', ');
      const clusterMin = Math.min(...ventaCluster.map(item => item.price));
      const clusterMax = Math.max(...ventaCluster.map(item => item.price));
      const variance = ((clusterMax - clusterMin) / consensoVenta * 100).toFixed(2);
      
      log(`💵 [CONSENSO] Cluster más grande: ${ventaCluster.length} de ${banks.length} bancos (${(ventaCluster.length/banks.length*100).toFixed(0)}%)`);
      log(`💵 [CONSENSO] Bancos en cluster: [${clusterBanks}]`);
      log(`💵 [CONSENSO] Rango del cluster: $${clusterMin.toFixed(2)} - $${clusterMax.toFixed(2)} (varianza: ${variance}%)`);
      log(`💵 [CONSENSO] Promedio del cluster: $${consensoVenta.toFixed(2)} VENTA`);
      
      return {
        compra: consensoCompra,
        venta: consensoVenta,
        source: 'dolarito_consensus',
        bank: 'Consenso',
        timestamp: new Date().toISOString(),
        banksCount: banks.length,
        clusterSize: ventaCluster.length,
        clusterPercentage: Math.round(ventaCluster.length / banks.length * 100)
      };
    }

    if (preferredBank === 'mediana') {
      // Calcular MEDIANA - Más robusta ante outliers que el promedio
      const banks = Object.values(bankRates);
      const compraValues = banks.map(b => b.compra).sort((a, b) => a - b);
      const ventaValues = banks.map(b => b.venta).sort((a, b) => a - b);
      
      // NUEVO v5.0.32: Log detallado de bancos usados
      const bankNames = banks.map(b => `${b.name || 'Unknown'} ($${b.compra})`).join(', ');
      log(`💵 [MEDIANA] Bancos disponibles para cálculo: [${bankNames}]`);
      
      const getMedian = (arr) => {
        const mid = Math.floor(arr.length / 2);
        return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
      };
      
      const medianaCompra = getMedian(compraValues);
      const medianaVenta = getMedian(ventaValues);
      
      log(`💵 [MEDIANA] Usando MEDIANA del dólar: $${medianaVenta.toFixed(2)} VENTA (${banks.length} bancos)`);
      log(`💵 [MEDIANA] Rango de precios: $${Math.min(...ventaValues).toFixed(2)} - $${Math.max(...ventaValues).toFixed(2)}`);
      
      return {
        compra: medianaCompra,
        venta: medianaVenta,
        source: 'dolarito_median',
        bank: 'Mediana',
        timestamp: new Date().toISOString(),
        banksCount: banks.length
      };
    }

    if (preferredBank === 'promedio_recortado') {
      // Calcular PROMEDIO RECORTADO (elimina 10% extremos)
      // Mucho más robusto ante outliers que el promedio simple
      const banks = Object.values(bankRates);
      const compraValues = banks.map(b => b.compra).sort((a, b) => a - b);
      const ventaValues = banks.map(b => b.venta).sort((a, b) => a - b);
      
      // NUEVO v5.0.32: Log detallado de bancos usados
      const bankNames = banks.map(b => `${b.name || 'Unknown'} ($${b.compra})`).join(', ');
      log(`💵 [PROM.RECORTADO] Bancos disponibles: [${bankNames}]`);
      
      const trimPercent = 0.10; // 10% de cada extremo
      const trimCount = Math.floor(compraValues.length * trimPercent);
      
      const trimmedCompra = compraValues.slice(trimCount, -trimCount || undefined);
      const trimmedVenta = ventaValues.slice(trimCount, -trimCount || undefined);
      
      const avgCompra = trimmedCompra.reduce((sum, val) => sum + val, 0) / trimmedCompra.length;
      const avgVenta = trimmedVenta.reduce((sum, val) => sum + val, 0) / trimmedVenta.length;
      
      log(`💵 [PROM.RECORTADO] Usando PROMEDIO RECORTADO del dólar: $${avgVenta.toFixed(2)} VENTA (${trimmedVenta.length}/${banks.length} bancos)`);
      
      return {
        compra: avgCompra,
        venta: avgVenta,
        source: 'dolarito_trimmed_average',
        bank: 'Prom. Recortado',
        timestamp: new Date().toISOString(),
        banksCount: banks.length,
        usedBanks: trimmedCompra.length
      };
    }

    if (preferredBank === 'menor_valor') {
      // Encontrar el banco con el menor precio de compra
      const banks = Object.values(bankRates);
      
      // NUEVO v5.0.32: Log detallado de bancos disponibles
      const bankNames = banks.map(b => `${b.name || 'Unknown'} ($${b.compra})`).join(', ');
      log(`💵 [MENOR_VALOR] Bancos disponibles: [${bankNames}]`);
      
      const cheapestBank = banks.reduce((cheapest, current) =>
        current.compra < cheapest.compra ? current : cheapest
      );

      log(`💵 [MENOR_VALOR] Usando banco con menor precio: ${cheapestBank.name} - $${cheapestBank.compra.toFixed(2)} COMPRA / $${cheapestBank.venta.toFixed(2)} VENTA`);

      return {
        compra: cheapestBank.compra,
        venta: cheapestBank.venta,
        source: 'dolarito_cheapest',
        bank: cheapestBank.name,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Usar banco específico
      const bankData = bankRates[preferredBank];
      
      if (bankData) {
        log(`💵 Usando precio del ${preferredBank}: $${bankData.compra}`);
        return {
          ...bankData,
          source: 'dolarito_bank',
          bank: preferredBank
        };
      } else {
        log(`⚠️ Banco ${preferredBank} no encontrado, usando mediana (más robusta)`);
        return await this.getAutomaticDollarPrice({ ...userSettings, preferredBank: 'mediana' });
      }
    }
  }

  // Obtener tasas bancarias desde dolarito.ar + criptoya (con cache)
  async getBankRates(userSettings = {}) {
    const now = Date.now();
    
    // Usar cache si es válido
    if (this.bankRatesCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      log('💰 Usando cache de tasas bancarias');
      let filteredRates = this.bankRatesCache;
      
      // MEJORADO v5.0.31: Aplicar filtro de bancos seleccionados
      if (userSettings.selectedBanks && userSettings.selectedBanks.length > 0) {
        filteredRates = {};
        userSettings.selectedBanks.forEach(bankCode => {
          if (this.bankRatesCache[bankCode]) {
            filteredRates[bankCode] = this.bankRatesCache[bankCode];
          }
        });
        log(`🔍 [FILTRO] Bancos seleccionados: [${userSettings.selectedBanks.join(', ')}]`);
        log(`🔍 [FILTRO] ${Object.keys(filteredRates).length} de ${Object.keys(this.bankRatesCache).length} bancos después del filtro`);
      } else {
        log(`🔍 [FILTRO] Sin filtro de bancos (selectedBanks vacío o ausente), usando todos los ${Object.keys(this.bankRatesCache).length} bancos`);
      }
      
      return filteredRates;
    }

    try {
      // NUEVO v5.0.22: Usar método combinado (dolarito + criptoya)
      const fetchPromise = this.dataService.fetchCombinedBankRates();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetchCombinedBankRates (10s)')), 10000)
      );
      
      const bankRates = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (bankRates) {
        this.bankRatesCache = bankRates;
        this.cacheTimestamp = now;
        log(`💰 Cache de tasas bancarias actualizado: ${Object.keys(bankRates).length} bancos`);
        
        // MEJORADO v5.0.31: Aplicar filtro si hay selección de bancos
        let filteredRates = bankRates;
        if (userSettings.selectedBanks && userSettings.selectedBanks.length > 0) {
          filteredRates = {};
          userSettings.selectedBanks.forEach(bankCode => {
            if (bankRates[bankCode]) {
              filteredRates[bankCode] = bankRates[bankCode];
            }
          });
          log(`🔍 [FILTRO] Bancos seleccionados: [${userSettings.selectedBanks.join(', ')}]`);
          log(`🔍 [FILTRO] ${Object.keys(filteredRates).length} de ${Object.keys(bankRates).length} bancos después del filtro`);
        } else {
          log(`🔍 [FILTRO] Sin filtro de bancos, usando todos los ${Object.keys(bankRates).length} bancos`);
        }
        
        return filteredRates;
      }
    } catch (error) {
      console.error('Error obteniendo tasas bancarias:', error);
    }

    // Si hay cache anterior, usarlo aunque esté vencido
    if (this.bankRatesCache) {
      log('⚠️ Usando cache vencido de tasas bancarias');
      let filteredRates = this.bankRatesCache;
      
      // MEJORADO v5.0.31: Aplicar filtro de bancos seleccionados incluso con cache vencido
      if (userSettings.selectedBanks && userSettings.selectedBanks.length > 0) {
        filteredRates = {};
        userSettings.selectedBanks.forEach(bankCode => {
          if (this.bankRatesCache[bankCode]) {
            filteredRates[bankCode] = this.bankRatesCache[bankCode];
          }
        });
        log(`🔍 [FILTRO] Cache vencido pero filtrado: ${Object.keys(filteredRates).length} bancos`);
      }
      
      return filteredRates;
    }

    return null;
  }

  // Precio fallback cuando no se pueden obtener datos
  async getFallbackPrice() {
    log('⚠️ Usando precio fallback del dólar');
    
    // Intentar obtener de DolarAPI como backup
    try {
      const dolarData = await this.dataService.fetchDolarOficial();
      if (dolarData) {
        return {
          compra: dolarData.compra,
          venta: dolarData.venta,
          source: 'dolarapi_fallback',
          bank: 'DolarAPI',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error en fallback de DolarAPI:', error);
    }

    // Fallback final con precio fijo
    return {
      compra: 950,
      venta: 970,
      source: 'hardcoded_fallback',
      bank: 'Fallback',
      timestamp: new Date().toISOString()
    };
  }

  // Obtener lista de bancos disponibles
  async getAvailableBanks() {
    const bankRates = await this.getBankRates();
    if (!bankRates) return [];
    
    return Object.keys(bankRates).map(bankName => ({
      name: bankName,
      compra: bankRates[bankName].compra,
      venta: bankRates[bankName].venta
    }));
  }

  // Limpiar cache (para testing o forzar actualización)
  clearCache() {
    this.bankRatesCache = null;
    this.cacheTimestamp = 0;
    log('🗑️ Cache de tasas bancarias limpiado');
  }
}

// Exportar instancia singleton
const dollarPriceManager = new DollarPriceManager();

// Hacer disponible globalmente en service worker
if (typeof self !== 'undefined') {
  self.dollarPriceManager = dollarPriceManager;
}

export { dollarPriceManager };