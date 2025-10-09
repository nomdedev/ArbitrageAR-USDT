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
    
    // Obtener tasas bancarias (con cache)
    const bankRates = await this.getBankRates();
    
    if (!bankRates || Object.keys(bankRates).length === 0) {
      log('⚠️ No se pudieron obtener tasas bancarias, usando fallback');
      return await this.getFallbackPrice();
    }

    if (preferredBank === 'promedio') {
      // Calcular promedio de todos los bancos
      const banks = Object.values(bankRates);
      const avgCompra = banks.reduce((sum, bank) => sum + bank.compra, 0) / banks.length;
      const avgVenta = banks.reduce((sum, bank) => sum + bank.venta, 0) / banks.length;
      
      log(`💵 Usando precio promedio del dólar: $${avgCompra.toFixed(2)}`);
      
      return {
        compra: avgCompra,
        venta: avgVenta,
        source: 'dolarito_average',
        bank: 'Promedio',
        timestamp: new Date().toISOString(),
        banksCount: banks.length
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
        log(`⚠️ Banco ${preferredBank} no encontrado, usando promedio`);
        return await this.getAutomaticDollarPrice({ ...userSettings, preferredBank: 'promedio' });
      }
    }
  }

  // Obtener tasas bancarias desde dolarito.ar (con cache)
  async getBankRates() {
    const now = Date.now();
    
    // Usar cache si es válido
    if (this.bankRatesCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      log('💰 Usando cache de tasas bancarias');
      return this.bankRatesCache;
    }

    try {
      // Usar dataService para obtener precios con timeout de 5 segundos
      const fetchPromise = this.dataService.fetchDolaritoBankRates();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetchDolaritoBankRates (5s)')), 5000)
      );
      
      const bankRates = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (bankRates) {
        this.bankRatesCache = bankRates;
        this.cacheTimestamp = now;
        log(`💰 Cache de tasas bancarias actualizado: ${Object.keys(bankRates).length} bancos`);
        return bankRates;
      }
    } catch (error) {
      console.error('Error obteniendo tasas bancarias:', error);
    }

    // Si hay cache anterior, usarlo aunque esté vencido
    if (this.bankRatesCache) {
      log('⚠️ Usando cache vencido de tasas bancarias');
      return this.bankRatesCache;
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