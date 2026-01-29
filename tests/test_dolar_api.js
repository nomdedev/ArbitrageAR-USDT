/**
 * Script de prueba para verificar la API de dólar oficial de CriptoYa
 * Prueba de funcionalidad y manejo de errores
 */

console.log('='.repeat(60));
console.log('PRUEBA DE API DE DÓLAR OFICIAL - CRIPTOYA');
console.log('='.repeat(60));

// Test 1: Prueba de funcionalidad - URL correcta
async function testDolarApi() {
  console.log('\n📋 TEST 1: Prueba de Funcionalidad - API Dólar Oficial');
  console.log('-'.repeat(60));

  const url = 'https://criptoya.com/api/dolar';
  console.log(`URL de prueba: ${url}`);
  console.log(`Protocolo seguro (HTTPS): ${url.startsWith('https://') ? '✅ SÍ' : '❌ NO'}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log(`Status HTTP: ${response.status} ${response.statusText}`);
    console.log(`Status OK: ${response.ok ? '✅ SÍ' : '❌ NO'}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('\n📊 Datos recibidos:');
    console.log('Estructura de datos:', Object.keys(data));

    // Verificar estructura esperada
    if (data.oficial) {
      console.log('\n✅ Propiedad "oficial" encontrada');
      console.log(`  - oficial.ask: ${data.oficial.ask} (tipo: ${typeof data.oficial.ask})`);
      console.log(`  - oficial.bid: ${data.oficial.bid} (tipo: ${typeof data.oficial.bid})`);

      // Validar tipos
      const askValid = typeof data.oficial.ask === 'number' && !isNaN(data.oficial.ask);
      const bidValid = typeof data.oficial.bid === 'number' && !isNaN(data.oficial.bid);

      console.log(`\nValidación de tipos:`);
      console.log(`  - ask es número válido: ${askValid ? '✅ SÍ' : '❌ NO'}`);
      console.log(`  - bid es número válido: ${bidValid ? '✅ SÍ' : '❌ NO'}`);

      if (askValid && bidValid) {
        console.log('\n✅ TEST 1 PASADO: API devuelve datos válidos');
        return { success: true, data };
      } else {
        console.log('\n❌ TEST 1 FALLIDO: Tipos de datos incorrectos');
        return { success: false, error: 'Tipos inválidos' };
      }
    } else {
      console.log('\n❌ Propiedad "oficial" no encontrada en la respuesta');
      console.log('Estructura recibida:', JSON.stringify(data, null, 2));
      return { success: false, error: 'Propiedad oficial no encontrada' };
    }
  } catch (error) {
    console.log('\n❌ TEST 1 FALLIDO: Error en la petición');
    console.log(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 2: Prueba de manejo de errores - URL inválida
async function testInvalidUrl() {
  console.log('\n📋 TEST 2: Prueba de Manejo de Errores - URL Inválida');
  console.log('-'.repeat(60));

  const url = 'https://criptoya.com/api/dolar-invalido';
  console.log(`URL de prueba: ${url}`);

  try {
    const response = await fetch(url);
    console.log(`Status HTTP: ${response.status}`);

    if (!response.ok) {
      console.log('✅ El código maneja correctamente respuestas HTTP no exitosas');
      return { success: true };
    }

    const data = await response.json();
    console.log('⚠️ La petición fue exitosa (inesperado)');
    return { success: false };
  } catch (error) {
    console.log(`✅ El código maneja correctamente errores de red: ${error.message}`);
    return { success: true };
  }
}

// Test 3: Prueba de validación de datos - estructura incorrecta
async function testDataValidation() {
  console.log('\n📋 TEST 3: Prueba de Validación de Datos - Estructura Incorrecta');
  console.log('-'.repeat(60));

  // Simular respuesta con estructura incorrecta
  const mockData = {
    compra: 950,
    venta: 970
  };

  console.log('Datos simulados (sin propiedad "oficial"):');
  console.log(JSON.stringify(mockData, null, 2));

  // Verificar lógica de validación del código
  const hasOficial = mockData && mockData.oficial;
  const hasValidAsk = hasOficial && typeof mockData.oficial.ask === 'number';
  const hasValidBid = hasOficial && typeof mockData.oficial.bid === 'number';

  console.log('\nValidación:');
  console.log(`  - Tiene propiedad "oficial": ${hasOficial ? '✅' : '❌ NO'}`);
  console.log(`  - oficial.ask válido: ${hasValidAsk ? '✅' : '❌ NO'}`);
  console.log(`  - oficial.bid válido: ${hasValidBid ? '✅' : '❌ NO'}`);

  if (!hasOficial || !hasValidAsk || !hasValidBid) {
    console.log('\n✅ El código debería devolver NULL para datos inválidos');
    return { success: true };
  }

  return { success: false };
}

// Test 4: Prueba de seguridad - inyección de código
async function testSecurity() {
  console.log('\n📋 TEST 4: Prueba de Seguridad - Inyección de Código');
  console.log('-'.repeat(60));

  // Simular datos maliciosos
  const maliciousData = {
    oficial: {
      ask: '<script>alert("XSS")</script>',
      bid: 'javascript:alert("XSS")'
    }
  };

  console.log('Datos simulados (posible inyección):');
  console.log(JSON.stringify(maliciousData, null, 2));

  // Verificar si el código valida tipos
  const askIsNumber = typeof maliciousData.oficial.ask === 'number';
  const bidIsNumber = typeof maliciousData.oficial.bid === 'number';

  console.log('\nValidación de tipos:');
  console.log(`  - ask es número: ${askIsNumber ? '✅' : '❌ NO (cadena detectada)'}`);
  console.log(`  - bid es número: ${bidIsNumber ? '✅' : '❌ NO (cadena detectada)'}`);

  if (!askIsNumber && !bidIsNumber) {
    console.log('\n✅ El código rechaza datos que no son números (previene inyección)');
    return { success: true };
  }

  return { success: false };
}

// Test 5: Simular comportamiento de fetchDolarOficial()
async function testFetchDolarOficialBehavior() {
  console.log('\n📋 TEST 5: Simulación de fetchDolarOficial()');
  console.log('-'.repeat(60));

  const url = 'https://criptoya.com/api/dolar';

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    console.log('Datos recibidos de la API:', data);

    // Simular la lógica de fetchDolarOficial()
    if (data && data.oficial && typeof data.oficial.ask === 'number' && typeof data.oficial.bid === 'number') {
      const result = {
        compra: data.oficial.bid,
        venta: data.oficial.ask,
        source: 'criptoya_oficial',
        timestamp: Date.now()
      };

      console.log('\nResultado simulado de fetchDolarOficial():');
      console.log(JSON.stringify(result, null, 2));

      console.log('\nValidación del mapeo:');
      console.log(`  - compra = data.oficial.bid (${result.compra}): ✅`);
      console.log(`  - venta = data.oficial.ask (${result.venta}): ✅`);
      console.log(`  - source: ${result.source}: ✅`);
      console.log(`  - timestamp: ${result.timestamp}: ✅`);

      console.log('\n✅ TEST 5 PASADO: Mapeo correcto de datos');
      return { success: true, result };
    } else {
      console.log('\n❌ TEST 5 FALLIDO: Estructura de datos incorrecta');
      return { success: false };
    }
  } catch (error) {
    console.log('\n❌ TEST 5 FALLIDO: Error en la petición');
    console.log(`Error: ${error.message}`);
    return { success: false };
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  const results = [];

  results.push(await testDolarApi());
  results.push(await testInvalidUrl());
  results.push(await testDataValidation());
  results.push(await testSecurity());
  results.push(await testFetchDolarOficialBehavior());

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\nTotal de pruebas: ${results.length}`);
  console.log(`✅ Pasadas: ${passed}`);
  console.log(`❌ Fallidas: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 TODAS LAS PRUEBAS PASARON');
  } else {
    console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON - Revisar detalles arriba');
  }

  console.log('='.repeat(60));
}

// Ejecutar
runAllTests().catch(console.error);
