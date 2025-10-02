// Test suite for refactored SOLID architecture
// Tests the service classes independently and integration

console.log('🧪 Testing Refactored SOLID Architecture...\n');

// Mock Chrome APIs for testing
global.chrome = {
  storage: {
    local: {
      get: async (keys) => {
        // Mock storage data
        const mockData = {
          settings: {
            minProfitPercentage: 1.0,
            maxInvestment: 100000,
            notificationEnabled: true,
            notificationHours: { start: 9, end: 18 }
          },
          banks: [
            { name: 'Banco Nación', sellPrice: 1050, logo: 'nation.png' },
            { name: 'Banco Provincia', sellPrice: 1045, logo: 'provincia.png' }
          ],
          arbitrages: []
        };
        return mockData;
      },
      set: async (data) => {
        console.log('Mock storage set:', data);
        return true;
      }
    }
  },
  notifications: {
    create: async (id, options) => {
      console.log('Mock notification:', options.title, options.message);
      return id;
    }
  }
};

// Mock fetch for API calls
global.fetch = async (url) => {
  console.log('Mock fetch:', url);
  if (url.includes('dolarapi.com/v1/dolares/oficial')) {
    return {
      ok: true,
      json: async () => ({ compra: 1040, venta: 1050 })
    };
  }
  if (url.includes('criptoya.com/api/usdt/ars/1')) {
    return {
      ok: true,
      json: async () => ({
        binance: { ask: 1520, bid: 1510 },
        buenbit: { ask: 1530, bid: 1520 }
      })
    };
  }
  if (url.includes('criptoya.com/api/usdt/usd/1')) {
    return {
      ok: true,
      json: async () => ({
        binance: { ask: 1.05, bid: 1.04 },
        buenbit: { ask: 1.06, bid: 1.03 }
      })
    };
  }
  if (url.includes('dolarapi.com/v1/dolares')) {
    return {
      ok: true,
      json: async () => ([
        { nombre: 'oficial', compra: 1040, venta: 1050 },
        { nombre: 'blue', compra: 1080, venta: 1100 }
      ])
    };
  }
  return { ok: false, status: 404 };
};

// Import services (using ES6 modules)
import dataService from './DataService.js';
import storageManager from './StorageManager.js';
import ArbitrageCalculator from './ArbitrageCalculator.js';
import NotificationManager from './NotificationManager.js';
import ScrapingService from './ScrapingService.js';

async function runTests() {
  console.log('TEST 1: DataService API calls...');
  try {
    const officialData = await dataService.fetchDolarOficial();
    const usdtData = await dataService.fetchUSDTData();

    console.log('✅ DataService: API calls successful');
    console.log('   Official rate:', officialData.venta);
    console.log('   USDT exchanges:', Object.keys(usdtData).length);
  } catch (error) {
    console.error('❌ DataService failed:', error.message);
  }

  console.log('\nTEST 2: StorageManager operations...');
  try {
    const settings = await storageManager.getSettings();
    const banks = await storageManager.getBanks();

    console.log('✅ StorageManager: Operations successful');
    console.log('   Settings loaded:', Object.keys(settings).length, 'keys');
    console.log('   Banks loaded:', banks.length);
  } catch (error) {
    console.error('❌ StorageManager failed:', error.message);
  }

  console.log('\nTEST 3: ArbitrageCalculator logic...');
  try {
    const calculator = new ArbitrageCalculator(storageManager);
    // Get mock data
    const officialData = await dataService.fetchDolarOficial();
    const usdtData = await dataService.fetchUSDTData();
    const usdtUsdData = await dataService.fetchUSDTUsdData();

    const routes = await calculator.calculateRoutes(officialData, usdtData, usdtUsdData);
    console.log('✅ ArbitrageCalculator: Calculation successful');
    console.log('   Routes calculated:', routes ? routes.length : 0);
    if (routes && routes.length > 0) {
      console.log('   Best route profit:', routes[0].profitPercentage ? routes[0].profitPercentage.toFixed(2) + '%' : 'N/A');
    }
  } catch (error) {
    console.error('❌ ArbitrageCalculator failed:', error.message);
  }

  console.log('\nTEST 4: NotificationManager logic...');
  try {
    const notificationManager = new NotificationManager(storageManager);
    const shouldSend = await notificationManager.shouldSendNotification(2.5);

    console.log('✅ NotificationManager: Logic check successful');
    console.log('   Should send notification for 2.5% profit:', shouldSend);
  } catch (error) {
    console.error('❌ NotificationManager failed:', error.message);
  }

  console.log('\nTEST 5: ScrapingService operations...');
  try {
    const scrapingService = new ScrapingService(dataService);
    const banksData = await scrapingService.scrapeBanksData();

    console.log('✅ ScrapingService: Scraping successful');
    console.log('   Banks scraped:', banksData.length);
  } catch (error) {
    console.error('❌ ScrapingService failed:', error.message);
  }

  console.log('\nTEST 6: Integration test - Full flow...');
  try {
    // Create service instances with dependencies
    const calculator = new ArbitrageCalculator(storageManager);
    const notificationManager = new NotificationManager(storageManager);
    const scrapingService = new ScrapingService(dataService);

    // Simulate full update cycle
    console.log('   Fetching data...');
    const [officialData, usdtData] = await Promise.all([
      dataService.fetchDolarOficial(),
      dataService.fetchUSDTData()
    ]);

    console.log('   Loading settings...');
    const settings = await storageManager.getSettings();

    console.log('   Scraping banks data...');
    const banksData = await scrapingService.scrapeBanksData();

    console.log('   Calculating arbitrages...');
    const usdtUsdData = await dataService.fetchUSDTUsdData();
    const routes = await calculator.calculateRoutes(officialData, usdtData, usdtUsdData);

    console.log('   Checking notifications...');
    if (routes.length > 0 && routes[0].profitPercentage > settings.minProfitPercentage) {
      const shouldNotify = await notificationManager.shouldSendNotification(routes[0].profitPercentage);
      if (shouldNotify) {
        await notificationManager.sendNotification(routes[0]);
      }
    }

    console.log('✅ Integration test: Full flow successful');
    console.log('   Total routes found:', routes.length);
    console.log('   Banks data loaded:', banksData.length);
    console.log('   Settings applied:', Object.keys(settings).length, 'keys');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }

  console.log('\n🎉 Test suite completed!');
}

runTests().catch(console.error);