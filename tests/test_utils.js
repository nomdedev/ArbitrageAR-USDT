const { getProfitClasses } = require('../src/utils.js');

function assertEqual(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    console.error('FAIL:', msg, a, '!==', b);
    process.exit(1);
  }
}

console.log('Running test_utils.js');
assertEqual(getProfitClasses(3.5), { isNegative: false, profitClass: '', profitBadgeClass: '' }, '3.5');
assertEqual(getProfitClasses(6.2), { isNegative: false, profitClass: 'high-profit', profitBadgeClass: 'high' }, '6.2');
assertEqual(getProfitClasses(-2.1), { isNegative: true, profitClass: 'negative-profit', profitBadgeClass: 'negative' }, '-2.1');
console.log('All utils tests passed');
