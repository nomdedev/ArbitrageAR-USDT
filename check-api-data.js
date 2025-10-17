// Script para verificar qué datos llegan de la API de bancos
const https = require('https');

console.log('=== VERIFICACIÓN DE DATOS DE LA API DE BANCOS ===\n');

const url = 'https://criptoya.com/api/bancostodos';

console.log('Consultando API:', url);

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const banksData = JSON.parse(data);
      const bankKeys = Object.keys(banksData);

      console.log('✅ API responde correctamente');
      console.log('📊 Número total de bancos:', bankKeys.length);
      console.log('🏦 Primeros 10 bancos:', bankKeys.slice(0, 10));

      // Verificar si los bancos por defecto existen
      const defaultBanks = ['bna', 'galicia', 'santander', 'bbva', 'icbc'];
      console.log('\n🔍 Verificación de bancos por defecto:');
      defaultBanks.forEach(bank => {
        const exists = bankKeys.includes(bank);
        console.log(`  ${bank}: ${exists ? '✅' : '❌'}`);
      });

      // Mostrar algunos bancos reales
      console.log('\n📋 Muestra de bancos reales en la API:');
      bankKeys.slice(0, 15).forEach(bank => {
        console.log(`  ${bank}`);
      });

    } catch (error) {
      console.log('❌ Error parseando respuesta JSON:', error.message);
      console.log('Respuesta cruda:', data.substring(0, 200));
    }
  });

}).on('error', (error) => {
  console.log('❌ Error consultando API:', error.message);
});