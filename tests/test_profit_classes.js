const { getProfitClasses } = require('../src/utils.js');

function test(value, expected) {
  const res = getProfitClasses(value);
  console.log(`profit: ${value} =>`, res);
}

console.log('Test getProfitClasses');
test(3.5);
test(6.2);
test(-2.1);
