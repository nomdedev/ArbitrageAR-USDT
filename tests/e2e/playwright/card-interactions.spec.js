const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * Tests E2E para verificar la estructura del popup y navegación
 * Flujos probados:
 * 1. Carga inicial del popup
 * 2. Navegación entre tabs
 * 3. Estructura HTML de componentes
 * 4. Estilos CSS aplicados
 */

const POPUP_PATH = `file://${path.resolve(__dirname, '../../../src/popup.html')}`;

test.describe('Flujo E2E: Estructura del Popup', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          sendMessage: (msg, callback) => callback && callback({ routes: [] }),
          onMessage: { addListener: () => {} },
          lastError: null
        },
        storage: {
          local: { get: (k, cb) => cb && cb({}), set: (i, cb) => cb && cb() },
          sync: { get: (k, cb) => cb && cb({}), set: (i, cb) => cb && cb() }
        }
      };
    });
    
    await page.goto(POPUP_PATH);
    await page.waitForLoadState('domcontentloaded');
  });

  test.describe('1. Carga Inicial', () => {
    test('El popup debe cargar sin errores críticos de JavaScript', async ({ page }) => {
      const criticalErrors = [];
      page.on('pageerror', error => {
        if (error.message.includes('SyntaxError') || 
            error.message.includes('ReferenceError') ||
            error.message.includes('TypeError')) {
          criticalErrors.push(error.message);
        }
      });
      
      await page.waitForTimeout(1000);
      
      // No debe haber errores críticos de sintaxis/referencia
      expect(criticalErrors.length).toBe(0);
    });

    test('Los estilos CSS deben estar cargados', async ({ page }) => {
      const cssLoaded = await page.evaluate(() => {
        return document.styleSheets.length > 0;
      });
      
      expect(cssLoaded).toBe(true);
    });

    test('El viewport debe ser de 400x600 (tamaño de extensión)', async ({ page }) => {
      const viewport = page.viewportSize();
      expect(viewport.width).toBe(400);
      expect(viewport.height).toBe(600);
    });
  });

  test.describe('2. Header del Popup', () => {
    test('El header debe ser visible', async ({ page }) => {
      const header = page.locator('.header-content, header').first();
      await expect(header).toBeVisible();
    });

    test('El título de la app debe mostrarse correctamente', async ({ page }) => {
      const title = page.locator('.app-title, h1').first();
      await expect(title).toBeVisible();
      await expect(title).toContainText('arbitrar');
    });

    test('El botón de configuración debe existir y ser clickeable', async ({ page }) => {
      const settingsBtn = page.locator('#settings, [aria-label*="configuración"]').first();
      await expect(settingsBtn).toBeVisible();
      
      const cursor = await settingsBtn.evaluate(el => 
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');
    });

    test('El botón de refresh debe existir y ser clickeable', async ({ page }) => {
      const refreshBtn = page.locator('#refresh, [aria-label*="Actualizar"]').first();
      await expect(refreshBtn).toBeVisible();
      
      const cursor = await refreshBtn.evaluate(el => 
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');
    });
  });

  test.describe('3. Navegación por Tabs', () => {
    test('Deben existir las 4 tabs principales', async ({ page }) => {
      const fiatTab = page.locator('[data-tab="routes"]');
      const cryptoTab = page.locator('[data-tab="crypto-arbitrage"]');
      const simulatorTab = page.locator('[data-tab="simulator"]');
      const exchangesTab = page.locator('[data-tab="banks"]');

      await expect(fiatTab).toBeVisible();
      await expect(cryptoTab).toBeVisible();
      await expect(simulatorTab).toBeVisible();
      await expect(exchangesTab).toBeVisible();
    });

    test('La tab Fiat debe estar activa por defecto', async ({ page }) => {
      const fiatTab = page.locator('[data-tab="routes"]');
      await expect(fiatTab).toHaveClass(/active/);
    });

    test('Click en tab Crypto debe activarla', async ({ page }) => {
      const cryptoTab = page.locator('[data-tab="crypto-arbitrage"]');
      const fiatTab = page.locator('[data-tab="routes"]');

      await cryptoTab.click();
      await page.waitForTimeout(300);

      await expect(cryptoTab).toHaveClass(/active/);
      await expect(fiatTab).not.toHaveClass(/active/);
    });

    test('Click en tab Simulador debe activarla', async ({ page }) => {
      const simulatorTab = page.locator('[data-tab="simulator"]');
      
      await simulatorTab.click();
      await page.waitForTimeout(300);

      await expect(simulatorTab).toHaveClass(/active/);
    });

    test('Flujo completo: navegar por todas las tabs', async ({ page }) => {
      const tabs = [
        page.locator('[data-tab="routes"]'),
        page.locator('[data-tab="crypto-arbitrage"]'),
        page.locator('[data-tab="simulator"]'),
        page.locator('[data-tab="banks"]')
      ];

      for (const tab of tabs) {
        await tab.click();
        await page.waitForTimeout(200);
        await expect(tab).toHaveClass(/active/);
        
        // Solo una tab activa a la vez
        const activeCount = await page.locator('.tab.active').count();
        expect(activeCount).toBe(1);
      }
    });
  });

  test.describe('4. Footer con Filtros', () => {
    test('El footer debe ser visible', async ({ page }) => {
      const footer = page.locator('.footer-content, footer').first();
      await expect(footer).toBeVisible();
    });

    test('Los botones de filtro deben estar en el footer', async ({ page }) => {
      const filterContainer = page.locator('.footer-filters');
      await expect(filterContainer).toBeVisible();

      const filterButtons = filterContainer.locator('.filter-btn-footer');
      await expect(filterButtons).toHaveCount(3);
    });
  });

  test.describe('5. Estilos CSS de Cards', () => {
    test('Las clases de cards deben tener cursor pointer', async ({ page }) => {
      // Inyectar card para verificar estilos CSS
      await page.evaluate(() => {
        const card = document.createElement('div');
        card.className = 'route-card fiat-route-card clickable';
        card.id = 'css-test-card';
        card.style.cssText = 'position:fixed;top:10px;left:10px;width:100px;height:50px;z-index:9999;';
        document.body.appendChild(card);
      });

      const card = page.locator('#css-test-card');
      const cursor = await card.evaluate(el => 
        window.getComputedStyle(el).cursor
      );
      
      expect(cursor).toBe('pointer');
    });

    test('Las cards deben tener transiciones CSS definidas', async ({ page }) => {
      await page.evaluate(() => {
        const card = document.createElement('div');
        card.className = 'route-card';
        card.id = 'transition-test-card';
        document.body.appendChild(card);
      });

      const card = page.locator('#transition-test-card');
      const transition = await card.evaluate(el => 
        window.getComputedStyle(el).transition
      );
      
      // Debe tener alguna transición definida
      expect(transition).not.toBe('all 0s ease 0s');
    });
  });

  test.describe('6. Design System', () => {
    test('Las variables CSS del design system deben existir', async ({ page }) => {
      const variables = await page.evaluate(() => {
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        
        return {
          brandPrimary: styles.getPropertyValue('--color-brand-primary').trim(),
          bgPrimary: styles.getPropertyValue('--color-bg-primary').trim(),
          radiusMd: styles.getPropertyValue('--radius-md').trim(),
          space2: styles.getPropertyValue('--space-2').trim()
        };
      });
      
      // Al menos algunas variables deben estar definidas
      const definedVars = Object.values(variables).filter(v => v !== '');
      expect(definedVars.length).toBeGreaterThan(0);
    });
  });
});
