const assert = require('assert');
const { getProfitClasses } = require('../src/utils.js');

function runAllTests() {
  console.log('🧪 Test getProfitClasses');

  const cases = [
    {
      input: 3.5,
      expected: { isNegative: false, profitClass: '', profitBadgeClass: '' }
    },
    {
      input: 6.2,
      expected: { isNegative: false, profitClass: 'high-profit', profitBadgeClass: 'high' }
    },
    {
      input: -2.1,
      expected: { isNegative: true, profitClass: 'negative-profit', profitBadgeClass: 'negative' }
    }
  ];

  for (const testCase of cases) {
    const result = getProfitClasses(testCase.input);
    console.log(`profit: ${testCase.input} =>`, result);
    assert.deepStrictEqual(result, testCase.expected);
  }

  console.log('✅ test_profit_classes.js completado');
  return true;
}

if (require.main === module) {
  try {
    runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en test_profit_classes.js:', error.message);
    process.exit(1);
  }
}

module.exports = { runAllTests };
