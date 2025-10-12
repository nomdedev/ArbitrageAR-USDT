// ============================================
// VALIDATION & SECURITY MODULE - ArbitrageAR v5.0.28
// ============================================

/**
 * Módulo de validación y seguridad para prevenir pérdidas del usuario
 * Incluye: validación de datos, alertas de riesgo, verificación de cálculos
 */

class ValidationService {
  constructor() {
    this.DATA_FRESHNESS_THRESHOLD = 5 * 60 * 1000; // 5 minutos en ms
    this.HIGH_AMOUNT_THRESHOLD = 500000; // $500,000 ARS
    this.MIN_PROFIT_THRESHOLD = 0.5; // 0.5% mínimo recomendado
  }

  /**
   * Verificar si los datos están frescos (< 5 minutos)
   */
  isDataFresh(timestamp) {
    if (!timestamp) return false;
    
    const dataDate = new Date(timestamp);
    const now = new Date();
    const ageMs = now - dataDate;
    
    return ageMs < this.DATA_FRESHNESS_THRESHOLD;
  }

  /**
   * Obtener el nivel de frescura de los datos
   * @returns {Object} { level: 'fresh'|'warning'|'stale', ageMinutes, color }
   */
  getDataFreshnessLevel(timestamp) {
    if (!timestamp) {
      return { level: 'unknown', ageMinutes: null, color: '#94a3b8', icon: '❓' };
    }

    const dataDate = new Date(timestamp);
    const now = new Date();
    const ageMs = now - dataDate;
    const ageMinutes = Math.floor(ageMs / 60000);

    if (ageMinutes < 5) {
      return { level: 'fresh', ageMinutes, color: '#4ade80', icon: '🟢' };
    } else if (ageMinutes < 15) {
      return { level: 'warning', ageMinutes, color: '#fbbf24', icon: '🟡' };
    } else {
      return { level: 'stale', ageMinutes, color: '#f87171', icon: '🔴' };
    }
  }

  /**
   * Calcular nivel de riesgo de una ruta
   * @returns {Object} { level: 'low'|'medium'|'high', score, reasons[], color }
   */
  calculateRouteRiskLevel(route, profitPercent, params = {}) {
    const risks = [];
    let riskScore = 0;

    // 1. Rentabilidad muy baja o negativa
    if (profitPercent < 0) {
      risks.push('Operación con pérdida');
      riskScore += 40;
    } else if (profitPercent < this.MIN_PROFIT_THRESHOLD) {
      risks.push('Rentabilidad muy baja (< 0.5%)');
      riskScore += 25;
    } else if (profitPercent < 1.0) {
      risks.push('Rentabilidad marginal');
      riskScore += 10;
    }

    // 2. Transferencia entre exchanges (mayor riesgo)
    if (!route.isSingleExchange) {
      risks.push('Requiere transferencia entre exchanges');
      riskScore += 15;
    }

    // 3. Fees altos
    const totalFees = (params.buyFeePercent || 1) + (params.sellFeePercent || 1);
    if (totalFees > 3) {
      risks.push('Fees combinados altos (> 3%)');
      riskScore += 10;
    }

    // 4. Spread USD muy alto
    const usdSpread = ((params.usdSellPrice - params.usdBuyPrice) / params.usdBuyPrice) * 100;
    if (usdSpread > 3) {
      risks.push('Spread USD inusualmente alto');
      riskScore += 15;
    }

    // 5. Exchanges con potenciales problemas (P2P)
    if (route.isP2P) {
      risks.push('Involucra operaciones P2P (más tiempo/riesgo)');
      riskScore += 20;
    }

    // Determinar nivel de riesgo
    let level, color, icon;
    if (riskScore >= 50) {
      level = 'high';
      color = '#ef4444';
      icon = '🔴';
    } else if (riskScore >= 25) {
      level = 'medium';
      color = '#f59e0b';
      icon = '🟡';
    } else {
      level = 'low';
      color = '#10b981';
      icon = '🟢';
    }

    return {
      level,
      score: riskScore,
      reasons: risks,
      color,
      icon,
      isAcceptable: riskScore < 50
    };
  }

  /**
   * Verificar coherencia de cálculos
   * Recalcula de forma inversa para validar
   */
  verifyCalculations(input, output) {
    const errors = [];

    // 1. Verificar que los valores son números válidos
    if (!this.isValidNumber(input.amount) || input.amount < 1000) {
      errors.push('Monto de inversión inválido');
    }

    if (!this.isValidNumber(output.finalAmount)) {
      errors.push('Monto final inválido');
    }

    // 2. Verificar coherencia: output no puede ser > input * 1.5 (ganancia > 50% es sospechosa)
    if (output.finalAmount > input.amount * 1.5) {
      errors.push('Ganancia inusualmente alta (> 50%), verificar cálculos');
    }

    // 3. Verificar que los pasos intermedios sean lógicos
    if (output.step1_usd && output.step1_usd > input.amount * 2) {
      errors.push('Conversión ARS → USD fuera de rango esperado');
    }

    // 4. Verificar que las fees no sean excesivas
    const totalFeesPercent = (input.buyFeePercent || 0) + (input.sellFeePercent || 0) + (input.bankCommissionPercent || 0);
    if (totalFeesPercent > 10) {
      errors.push('Fees totales muy altos (> 10%)');
    }

    // 5. Verificación inversa: calcular profit de otra manera
    const expectedProfit = output.finalAmount - input.amount;
    const profitDiff = Math.abs(expectedProfit - output.profit);
    if (profitDiff > 0.01) {
      errors.push('Inconsistencia en cálculo de ganancia');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.generateWarnings(input, output)
    };
  }

  /**
   * Generar advertencias adicionales
   */
  generateWarnings(input, output) {
    const warnings = [];

    // Advertencia si el monto es muy alto
    if (input.amount > this.HIGH_AMOUNT_THRESHOLD) {
      warnings.push(`Monto elevado ($${this.formatNumber(input.amount)} ARS) - Verificar disponibilidad de liquidez`);
    }

    // Advertencia si la ganancia es muy pequeña
    if (output.profitPercent < 1 && output.profitPercent >= 0) {
      warnings.push('Rentabilidad baja - Considerar costos operativos adicionales');
    }

    // Advertencia sobre volatilidad
    if (!input.usdBuyPrice || !input.usdSellPrice) {
      warnings.push('Precios USD no configurados - Resultados pueden variar');
    }

    return warnings;
  }

  /**
   * Validar que un número sea válido
   */
  isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Formatear número para display
   */
  formatNumber(num) {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  }

  /**
   * Verificar si se requiere confirmación para una operación
   */
  requiresConfirmation(amount, profitPercent, settings) {
    if (!settings || !settings.requireConfirmHighAmount) {
      return false;
    }

    // Confirmar si el monto es alto
    if (amount > this.HIGH_AMOUNT_THRESHOLD) {
      return true;
    }

    // Confirmar si hay pérdida
    if (profitPercent < 0) {
      return true;
    }

    return false;
  }

  /**
   * Mostrar diálogo de confirmación
   */
  async showConfirmation(amount, profitPercent, route) {
    const profitSign = profitPercent >= 0 ? '+' : '';
    const profitColor = profitPercent >= 0 ? 'verde' : 'rojo';
    
    let message = `⚠️ CONFIRMACIÓN REQUERIDA\n\n`;
    message += `Monto: $${this.formatNumber(amount)} ARS\n`;
    message += `Ganancia estimada: ${profitSign}${profitPercent.toFixed(2)}%\n`;
    message += `Ruta: ${route.buyExchange} → ${route.sellExchange}\n\n`;
    
    if (amount > this.HIGH_AMOUNT_THRESHOLD) {
      message += `⚠️ Este es un monto considerable.\n`;
    }
    
    if (profitPercent < 0) {
      message += `⚠️ Esta operación resultaría en PÉRDIDA.\n`;
    } else if (profitPercent < this.MIN_PROFIT_THRESHOLD) {
      message += `⚠️ La rentabilidad es muy baja.\n`;
    }
    
    message += `\n¿Deseas continuar con la simulación?`;
    
    return confirm(message);
  }

  /**
   * Generar resumen de estado del sistema
   */
  generateSystemHealthReport(data) {
    const issues = [];
    const warnings = [];

    // Verificar frescura de datos
    if (data.officialPrice) {
      const freshness = this.getDataFreshnessLevel(data.officialPrice.timestamp);
      if (freshness.level === 'stale') {
        issues.push(`Precio oficial desactualizado (${freshness.ageMinutes} min)`);
      } else if (freshness.level === 'warning') {
        warnings.push(`Precio oficial con antigüedad (${freshness.ageMinutes} min)`);
      }
    }

    // Verificar disponibilidad de rutas
    if (!data.optimizedRoutes || data.optimizedRoutes.length === 0) {
      issues.push('No hay rutas disponibles');
    }

    // Verificar uso de cache
    if (data.usingCache) {
      warnings.push('Usando datos en caché (APIs no disponibles)');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      warnings,
      status: issues.length === 0 ? (warnings.length === 0 ? 'healthy' : 'warning') : 'error'
    };
  }
}

// Exportar instancia singleton
const validationService = new ValidationService();

// Para uso en el navegador
if (typeof window !== 'undefined') {
  window.ValidationService = ValidationService;
  window.validationService = validationService;
}
