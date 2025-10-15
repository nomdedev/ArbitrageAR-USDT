// Utilidades compartidas entre popup y tests

function getProfitClasses(profitPercent) {
  const isNegative = profitPercent < 0;
  const isHighProfit = profitPercent > 5;
  
  let profitClass;
  if (isNegative) {
    profitClass = 'negative-profit';
  } else if (isHighProfit) {
    profitClass = 'high-profit';
  } else {
    profitClass = '';
  }
  
  let profitBadgeClass;
  if (isNegative) {
    profitBadgeClass = 'negative';
  } else if (isHighProfit) {
    profitBadgeClass = 'high';
  } else {
    profitBadgeClass = '';
  }
  
  return { isNegative, profitClass, profitBadgeClass };
}

module.exports = { getProfitClasses };
