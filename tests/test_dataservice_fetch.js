(async () => {
  try {
    const mod = await import('../src/DataService.js');
    const DataService = mod.DataService;
    const ds = new DataService();

    console.log('Testing fetchWithRateLimit to invalid URL (should return null or warn)');
    const res = await ds.fetchWithRateLimit('https://invalid.example.invalid/404');
    console.log('Result:', res);

    console.log('Testing fetchDolarOficial (may return null in offline env)');
    const dolar = await ds.fetchDolarOficial();
    console.log('Dolar oficial:', dolar);

    console.log('Testing fetchUSDTData (may return null in offline env)');
    const usdt = await ds.fetchUSDTData();
    console.log('USDT data sample keys:', usdt ? Object.keys(usdt).slice(0,5) : null);
  } catch (err) {
    console.error('Error importing DataService:', err.message);
  }
})();