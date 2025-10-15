const { renderArbitrageCard, formatNumber } = require('../src/renderHelpers.js');

const sample = {
  broker: 'TestBroker',
  profitPercentage: 2.5,
  usdToUsdtRate: 1.001,
  usdtArsBid: 1120.5,
  officialPrice: 950,
  fees: { total: 1.2 }
};

const html = renderArbitrageCard(sample, 0);
console.log('Generated HTML snippet:\n', html.slice(0, 300));
if (!html.includes('TestBroker')) {
  console.error('FAIL: broker missing');
  process.exit(1);
}
const expectedProfit = formatNumber(sample.profitPercentage);
if (!html.includes(expectedProfit)) {
  console.error('FAIL: profit not formatted correctly. Expected:', expectedProfit);
  process.exit(1);
}
console.log('test_display_arbitrages passed');
