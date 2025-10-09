// ============================================
// MONITOR DE SALUD - healthMonitor.js
// Herramienta de diagnóstico para timeout issues
// ============================================

// Para usar en DevTools Console cuando hay problemas
const ArbitrageHealthMonitor = {
  
  // Test de conectividad a APIs
  async testApis() {
    console.log('🏥 [MONITOR] Iniciando test de APIs...');
    
    const apis = [
      { name: 'DolarAPI', url: 'https://dolarapi.com/v1/dolares/oficial' },
      { name: 'CriptoYA ARS', url: 'https://criptoya.com/api/usdt/ars/1' },
      { name: 'CriptoYA USD', url: 'https://criptoya.com/api/usdt/usd/1' },
      { name: 'Dolarito', url: 'https://www.dolarito.ar/cotizacion/bancos' }
    ];

    const results = [];
    
    for (const api of apis) {
      const start = Date.now();
      try {
        const response = await fetch(api.url);
        const duration = Date.now() - start;
        results.push({
          name: api.name,
          status: response.ok ? '✅ OK' : '❌ ERROR',
          statusCode: response.status,
          duration: `${duration}ms`,
          ok: response.ok
        });
      } catch (error) {
        results.push({
          name: api.name,
          status: '❌ FAIL',
          statusCode: 'N/A',
          duration: `${Date.now() - start}ms`,
          error: error.message,
          ok: false
        });
      }
    }

    console.table(results);
    
    const healthyApis = results.filter(r => r.ok).length;
    console.log(`🏥 [MONITOR] Resultado: ${healthyApis}/${apis.length} APIs funcionando`);
    
    return results;
  },

  // Test de comunicación popup-background
  async testBackgroundCommunication() {
    console.log('📡 [MONITOR] Testando comunicación con background...');
    
    if (!chrome.runtime) {
      console.error('❌ chrome.runtime no disponible');
      return false;
    }

    return new Promise((resolve) => {
      const start = Date.now();
      const timeout = setTimeout(() => {
        console.error('❌ [MONITOR] Timeout en comunicación (5s)');
        resolve({ success: false, duration: '5000ms+', error: 'Timeout' });
      }, 5000);

      try {
        chrome.runtime.sendMessage({ action: 'getArbitrages' }, (response) => {
          clearTimeout(timeout);
          const duration = Date.now() - start;
          
          if (chrome.runtime.lastError) {
            console.error('❌ [MONITOR] Error de runtime:', chrome.runtime.lastError);
            resolve({ 
              success: false, 
              duration: `${duration}ms`, 
              error: chrome.runtime.lastError.message 
            });
            return;
          }

          console.log('✅ [MONITOR] Comunicación exitosa');
          console.log('📊 [MONITOR] Respuesta:', {
            hasData: !!response,
            hasRoutes: !!response?.optimizedRoutes,
            routesCount: response?.optimizedRoutes?.length || 0,
            hasError: !!response?.error,
            usingCache: response?.usingCache
          });

          resolve({ 
            success: true, 
            duration: `${duration}ms`,
            data: {
              hasRoutes: !!response?.optimizedRoutes,
              routesCount: response?.optimizedRoutes?.length || 0,
              hasError: !!response?.error,
              usingCache: response?.usingCache
            }
          });
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error('❌ [MONITOR] Error enviando mensaje:', error);
        resolve({ success: false, duration: 'N/A', error: error.message });
      }
    });
  },

  // Diagnóstico completo
  async runFullDiagnostic() {
    console.log('🔍 [MONITOR] ======= DIAGNÓSTICO COMPLETO =======');
    console.log('🕐 [MONITOR] Timestamp:', new Date().toISOString());
    
    // Test 1: Estado del runtime
    console.log('\n📋 [MONITOR] 1. Estado de Chrome Runtime:');
    console.log('   - chrome.runtime disponible:', !!chrome.runtime);
    console.log('   - chrome.runtime.sendMessage disponible:', !!chrome.runtime?.sendMessage);
    console.log('   - chrome.runtime.id:', chrome.runtime?.id || 'N/A');
    
    // Test 2: APIs externas
    console.log('\n🌐 [MONITOR] 2. Test de APIs Externas:');
    const apiResults = await this.testApis();
    
    // Test 3: Comunicación background
    console.log('\n📡 [MONITOR] 3. Test de Comunicación Background:');
    const commResults = await this.testBackgroundCommunication();
    console.log('   - Resultado:', commResults);
    
    // Test 4: Estado del DOM
    console.log('\n🖼️ [MONITOR] 4. Estado del DOM:');
    console.log('   - Container presente:', !!document.getElementById('optimized-routes'));
    console.log('   - Loading presente:', !!document.getElementById('loading'));
    console.log('   - Document ready state:', document.readyState);
    
    // Resumen
    console.log('\n📊 [MONITOR] ======= RESUMEN =======');
    const healthyApis = apiResults.filter(r => r.ok).length;
    console.log(`   🌐 APIs: ${healthyApis}/${apiResults.length} funcionando`);
    console.log(`   📡 Background: ${commResults.success ? '✅ OK' : '❌ ERROR'}`);
    console.log(`   ⏱️ Tiempo respuesta: ${commResults.duration}`);
    
    if (!commResults.success) {
      console.log('\n🚨 [MONITOR] POSIBLES SOLUCIONES:');
      console.log('   1. Recargar la página del popup');
      console.log('   2. Recargar la extensión completamente');
      console.log('   3. Verificar conexión a internet');
      console.log('   4. Revisar logs del background en chrome://extensions');
    }
    
    return {
      runtime: {
        available: !!chrome.runtime,
        sendMessageAvailable: !!chrome.runtime?.sendMessage
      },
      apis: {
        total: apiResults.length,
        healthy: healthyApis,
        results: apiResults
      },
      background: commResults,
      timestamp: new Date().toISOString()
    };
  },

  // Monitoreo continuo (para debugging)
  startContinuousMonitoring(intervalSeconds = 30) {
    console.log(`🔄 [MONITOR] Iniciando monitoreo continuo cada ${intervalSeconds}s`);
    console.log('🔄 [MONITOR] Para detener: ArbitrageHealthMonitor.stopContinuousMonitoring()');
    
    this.monitoringInterval = setInterval(async () => {
      console.log('\n🔄 [MONITOR] ===== CHECK PERIÓDICO =====');
      const commTest = await this.testBackgroundCommunication();
      if (!commTest.success) {
        console.error('🚨 [MONITOR] ALERTA: Comunicación con background falló');
        console.error('🚨 [MONITOR] Error:', commTest.error);
      } else {
        console.log('✅ [MONITOR] Background OK -', commTest.duration);
      }
    }, intervalSeconds * 1000);
  },

  stopContinuousMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 [MONITOR] Monitoreo continuo detenido');
    }
  }
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.ArbitrageHealthMonitor = ArbitrageHealthMonitor;
}

console.log('🏥 ArbitrageHealthMonitor cargado');
console.log('💡 Uso: ArbitrageHealthMonitor.runFullDiagnostic()');
console.log('💡 APIs: ArbitrageHealthMonitor.testApis()');
console.log('💡 Background: ArbitrageHealthMonitor.testBackgroundCommunication()');