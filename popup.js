// Estado global
let currentData = null;
let selectedArbitrage = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  setupTabNavigation();
  setupRefreshButton();
  fetchAndDisplay();
  loadBanksData();
});

// Formateo de números
function formatNumber(num) {
  return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Navegación entre tabs
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remover active de todos
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Activar el seleccionado
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

// Botón de actualizar
function setupRefreshButton() {
  document.getElementById('refresh').addEventListener('click', () => {
    fetchAndDisplay();
    loadBanksData();
  });
}

// Obtener y mostrar datos de arbitraje
function fetchAndDisplay() {
  const container = document.getElementById('arbitrages');
  const loading = document.getElementById('loading');
  
  loading.style.display = 'block';
  container.innerHTML = '';
  
  chrome.runtime.sendMessage({ action: 'getArbitrages' }, data => {
    loading.style.display = 'none';
    
    if (!data) {
      container.innerHTML = '<p class="error">❌ No se pudo comunicar con el servicio de fondo.</p>';
      return;
    }
    
    currentData = data;
    updateLastUpdateTimestamp(data.lastUpdate);
    
    if (data.error) {
      container.innerHTML = `<p class="error">❌ Error: ${data.error}</p>`;
      return;
    }
    
    if (!data.arbitrages || !Array.isArray(data.arbitrages)) {
      container.innerHTML = '<p class="warning">⏳ No hay datos de arbitraje disponibles. Espera un momento...</p>';
      return;
    }
    
    if (data.arbitrages.length === 0) {
      container.innerHTML = '<p class="info">📊 No se encontraron oportunidades de arbitraje rentables en este momento.</p>';
      return;
    }
    
    displayArbitrages(data.arbitrages, data.official);
  });
}

// Mostrar tarjetas de arbitraje
function displayArbitrages(arbitrages, official) {
  const container = document.getElementById('arbitrages');
  let html = '';
  
  arbitrages.forEach((arb, index) => {
    const profitClass = arb.profitPercent > 5 ? 'high-profit' : '';
    const profitBadgeClass = arb.profitPercent > 5 ? 'high' : '';
    
    html += `
      <div class="arbitrage-card ${profitClass}" data-index="${index}">
        <div class="card-header">
          <h3>🏦 ${arb.broker}</h3>
          <div class="profit-badge ${profitBadgeClass}">+${formatNumber(arb.profitPercent)}%</div>
        </div>
        <div class="card-body">
          <div class="price-row">
            <span class="price-label">💵 Dólar Oficial</span>
            <span class="price-value">$${formatNumber(arb.officialPrice)}</span>
          </div>
          <div class="price-row">
            <span class="price-label">💰 USDT Compra</span>
            <span class="price-value">$${formatNumber(arb.buyPrice)}</span>
          </div>
          <div class="price-row">
            <span class="price-label">💸 USDT Venta</span>
            <span class="price-value highlight">$${formatNumber(arb.sellPrice)}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Agregar event listeners a las tarjetas
  document.querySelectorAll('.arbitrage-card').forEach(card => {
    card.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      selectArbitrage(index);
      
      // Remover selección previa
      document.querySelectorAll('.arbitrage-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      
      // Cambiar a la pestaña de guía
      document.querySelector('[data-tab="guide"]').click();
    });
  });
}

// Seleccionar un arbitraje y mostrar guía
function selectArbitrage(index) {
  if (!currentData?.arbitrages?.[index]) {
    return;
  }
  
  selectedArbitrage = currentData.arbitrages[index];
  displayStepByStepGuide(selectedArbitrage);
}

// Mostrar guía paso a paso
function displayStepByStepGuide(arb) {
  const container = document.getElementById('selected-arbitrage-guide');
  
  const estimatedInvestment = 100000; // $100,000 ARS como ejemplo
  const usdAmount = estimatedInvestment / arb.officialPrice;
  const usdtAmount = usdAmount; // 1:1 asumiendo conversión directa
  const finalAmount = usdtAmount * arb.sellPrice;
  const profit = finalAmount - estimatedInvestment;
  
  const html = `
    <div class="step-container">
      <div class="arbitrage-summary">
        <h3>📊 ${arb.broker}</h3>
        <div class="profit-display">+${formatNumber(arb.profitPercent)}%</div>
        <p style="text-align: center; font-size: 0.9em;">Ganancia estimada por operación</p>
      </div>
      
      <div class="step">
        <div class="step-header">
          <div class="step-number">1</div>
          <div class="step-title">Comprar Dólares Oficiales</div>
        </div>
        <div class="step-content">
          <p>Compra dólares al tipo de cambio oficial en tu banco habilitado.</p>
          <div class="step-detail">
            <strong>Precio:</strong> $${formatNumber(arb.officialPrice)} ARS por USD<br>
            <strong>Dónde:</strong> Bancos autorizados (ver pestaña "Bancos")<br>
            <strong>Límite:</strong> USD 200 mensuales por persona<br>
            <strong>Requisitos:</strong> CBU, cuenta bancaria, CUIT/CUIL
          </p>
          <a href="#" class="platform-link" onclick="document.querySelector('[data-tab=\\"banks\\"]').click(); return false;">
            🏦 Ver bancos disponibles
          </a>
        </div>
      </div>
      
      <div class="step">
        <div class="step-header">
          <div class="step-number">2</div>
          <div class="step-title">Convertir USD a USDT</div>
        </div>
        <div class="step-content">
          <p>Deposita tus dólares en ${arb.broker} y compra USDT.</p>
          <div class="step-detail">
            <strong>Exchange:</strong> ${arb.broker}<br>
            <strong>Par:</strong> USD/USDT<br>
            <strong>Precio referencia:</strong> $${formatNumber(arb.buyPrice)} ARS por USDT<br>
            <strong>Importante:</strong> ❌ NO usar P2P, usar el exchange oficial
          </div>
        </div>
      </div>
      
      <div class="step">
        <div class="step-header">
          <div class="step-number">3</div>
          <div class="step-title">Vender USDT por Pesos</div>
        </div>
        <div class="step-content">
          <p>Vende tus USDT en ${arb.broker} por pesos argentinos (ARS).</p>
          <div class="step-detail">
            <strong>Precio de venta:</strong> $${formatNumber(arb.sellPrice)} ARS por USDT<br>
            <strong>Método:</strong> Venta directa en el exchange<br>
            <strong>Retiro:</strong> Transferencia bancaria a tu cuenta
          </div>
        </div>
      </div>
      
      <div class="step">
        <div class="step-header">
          <div class="step-number">4</div>
          <div class="step-title">Retirar Ganancias</div>
        </div>
        <div class="step-content">
          <p>Retira tus pesos a tu cuenta bancaria.</p>
          <div class="step-detail">
            <strong>Método:</strong> Transferencia bancaria<br>
            <strong>Tiempo:</strong> 24-48 horas hábiles<br>
            <strong>Comisiones:</strong> Verificar con ${arb.broker}
          </div>
        </div>
      </div>
      
      <div class="calculation-box">
        <h4>💰 Ejemplo con $${formatNumber(estimatedInvestment)} ARS</h4>
        <div class="calculation-line">
          <span>Inversión inicial:</span>
          <span>$${formatNumber(estimatedInvestment)} ARS</span>
        </div>
        <div class="calculation-line">
          <span>Compras USD:</span>
          <span>$${formatNumber(usdAmount)} USD</span>
        </div>
        <div class="calculation-line">
          <span>Conviertes a USDT:</span>
          <span>${formatNumber(usdtAmount)} USDT</span>
        </div>
        <div class="calculation-line">
          <span>Vendes por ARS:</span>
          <span>$${formatNumber(finalAmount)} ARS</span>
        </div>
        <div class="calculation-line">
          <span>Ganancia neta:</span>
          <span>$${formatNumber(profit)} ARS (${formatNumber(arb.profitPercent)}%)</span>
        </div>
      </div>
      
      <div class="warning" style="margin-top: 15px;">
        ⚠️ <strong>Consideraciones importantes:</strong><br>
        • Verifica comisiones del exchange antes de operar<br>
        • Los precios fluctúan constantemente<br>
        • Respeta el límite de USD 200 mensuales<br>
        • Considera tiempos de transferencia bancaria
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// Cargar datos de bancos
function loadBanksData() {
  const container = document.getElementById('banks-list');
  
  chrome.runtime.sendMessage({ action: 'getBanks' }, data => {
    if (!data?.banks || data.banks.length === 0) {
      container.innerHTML = '<p class="info">📋 Información de bancos no disponible en este momento.</p>';
      return;
    }
    
    displayBanks(data.banks);
  });
}

// Mostrar lista de bancos
function displayBanks(banks) {
  const container = document.getElementById('banks-list');
  let html = '';
  
  banks.forEach(bank => {
    html += `
      <div class="bank-card">
        <div class="bank-header">
          <div class="bank-name">🏦 ${bank.name}</div>
        </div>
        <div class="bank-prices">
          <div class="bank-price">
            <div class="bank-price-label">Compra</div>
            <div class="bank-price-value">$${formatNumber(bank.compra)}</div>
          </div>
          <div class="bank-price">
            <div class="bank-price-label">Venta</div>
            <div class="bank-price-value">$${formatNumber(bank.venta)}</div>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Actualizar timestamp
function updateLastUpdateTimestamp(timestamp) {
  const container = document.getElementById('last-update');
  if (timestamp) {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('es-AR');
    container.textContent = `⏰ Última actualización: ${timeStr}`;
  }
}
