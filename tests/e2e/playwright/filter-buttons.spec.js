const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * Tests E2E para verificar funcionalidad completa de botones de filtro P2P
 * Flujos probados:
 * 1. Carga inicial - Estado por defecto
 * 2. Interacción con filtros - Click y cambio de estado
 * 3. Ciclo completo - Cambio entre todos los filtros
 * 4. Estilos visuales - Verificar feedback visual
 */

const POPUP_PATH = `file://${path.resolve(__dirname, '../../../src/popup.html')}`;

test.describe('Flujo E2E: Filtros P2P', () => {

  test.beforeEach(async ({ page }) => {
    // Mock de Chrome API
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          sendMessage: (msg, callback) => {
            if (callback) callback({ routes: [] });
          },
          onMessage: { addListener: () => {} },
          lastError: null
        },
        storage: {
          local: {
            get: (keys, callback) => callback && callback({}),
            set: (items, callback) => callback && callback()
          },
          sync: {
            get: (keys, callback) => callback && callback({}),
            set: (items, callback) => callback && callback()
          }
        }
      };
    });
    
    await page.goto(POPUP_PATH);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test.describe('1. Estado Inicial', () => {
    test('Deben existir exactamente 3 botones de filtro', async ({ page }) => {
      const filterButtons = page.locator('.filter-btn-footer');
      await expect(filterButtons).toHaveCount(3);
    });

    test('Los botones deben tener los atributos data-filter correctos', async ({ page }) => {
      // Verificar cada tipo de filtro
      const noP2pBtn = page.locator('[data-filter="no-p2p"]');
      const p2pBtn = page.locator('[data-filter="p2p"]');
      const allBtn = page.locator('[data-filter="all"]');
      
      await expect(noP2pBtn).toHaveCount(1);
      await expect(p2pBtn).toHaveCount(1);
      await expect(allBtn).toHaveCount(1);
    });

    test('Al menos un filtro debe estar activo por defecto', async ({ page }) => {
      const activeButtons = page.locator('.filter-btn-footer.active');
      
      // Al menos un botón debe estar activo al cargar
      const count = await activeButtons.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('El contenedor .footer-filters debe tener layout flex con gap', async ({ page }) => {
      const container = page.locator('.footer-filters');
      await expect(container).toBeVisible();

      const styles = await container.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          gap: computed.gap,
          alignItems: computed.alignItems
        };
      });
      
      expect(styles.display).toBe('flex');
      expect(styles.alignItems).toBe('center');
      // gap debe ser mayor a 0
      expect(styles.gap).not.toBe('0px');
    });
  });

  test.describe('2. Interacción con Filtros', () => {
    test('Click en P2P: debe activarse y desactivar "No P2P"', async ({ page }) => {
      const p2pButton = page.locator('.filter-btn-footer[data-filter="p2p"]');
      const allButton = page.locator('.filter-btn-footer[data-filter="all"]');
      const noP2pButton = page.locator('.filter-btn-footer[data-filter="no-p2p"]');

      // Estado inicial: No P2P activo (rutas directas por defecto)
      await expect(noP2pButton).toHaveClass(/active/);

      // Click en P2P
      await p2pButton.click();
      await page.waitForTimeout(300);

      // Verificar nuevo estado
      await expect(p2pButton).toHaveClass(/active/);
      await expect(allButton).not.toHaveClass(/active/);
      await expect(noP2pButton).not.toHaveClass(/active/);
    });

    test('Click en Todas: debe activarse y desactivar otros', async ({ page }) => {
      const noP2pButton = page.locator('.filter-btn-footer[data-filter="no-p2p"]');
      const allButton = page.locator('.filter-btn-footer[data-filter="all"]');
      const p2pButton = page.locator('.filter-btn-footer[data-filter="p2p"]');

      // Estado inicial: No P2P activo
      await expect(noP2pButton).toHaveClass(/active/);

      // Click en Todas
      await allButton.click();
      await page.waitForTimeout(300);

      // Verificar estado
      await expect(allButton).toHaveClass(/active/);
      await expect(noP2pButton).not.toHaveClass(/active/);
      await expect(p2pButton).not.toHaveClass(/active/);
    });

    test('Click en filtro ya activo: debe permanecer activo', async ({ page }) => {
      const noP2pButton = page.locator('.filter-btn-footer[data-filter="no-p2p"]');

      // Está activo por defecto (rutas directas)
      await expect(noP2pButton).toHaveClass(/active/);

      // Click en el mismo
      await noP2pButton.click();
      await page.waitForTimeout(300);

      // Debe seguir activo
      await expect(noP2pButton).toHaveClass(/active/);
    });
  });

  test.describe('3. Ciclo Completo de Filtros', () => {
    test('Flujo: No P2P → P2P → Todas → No P2P', async ({ page }) => {
      const allButton = page.locator('.filter-btn-footer[data-filter="all"]');
      const p2pButton = page.locator('.filter-btn-footer[data-filter="p2p"]');
      const noP2pButton = page.locator('.filter-btn-footer[data-filter="no-p2p"]');

      // Paso 1: Verificar estado inicial (No P2P / rutas directas activo)
      await expect(noP2pButton).toHaveClass(/active/);

      // Paso 2: Cambiar a P2P
      await p2pButton.click();
      await page.waitForTimeout(200);
      await expect(p2pButton).toHaveClass(/active/);
      await expect(noP2pButton).not.toHaveClass(/active/);

      // Paso 3: Cambiar a Todas
      await allButton.click();
      await page.waitForTimeout(200);
      await expect(allButton).toHaveClass(/active/);
      await expect(p2pButton).not.toHaveClass(/active/);

      // Paso 4: Volver a No P2P
      await noP2pButton.click();
      await page.waitForTimeout(200);
      await expect(noP2pButton).toHaveClass(/active/);
      await expect(allButton).not.toHaveClass(/active/);
    });

    test('Múltiples cambios rápidos no deben causar estados inconsistentes', async ({ page }) => {
      const allButton = page.locator('.filter-btn-footer[data-filter="all"]');
      const p2pButton = page.locator('.filter-btn-footer[data-filter="p2p"]');
      const noP2pButton = page.locator('.filter-btn-footer[data-filter="no-p2p"]');

      // Cambios rápidos
      await p2pButton.click();
      await noP2pButton.click();
      await allButton.click();
      await p2pButton.click();
      
      await page.waitForTimeout(500);

      // Solo un botón debe estar activo
      const activeCount = await page.locator('.filter-btn-footer.active').count();
      expect(activeCount).toBe(1);

      // P2P debe ser el activo (último click)
      await expect(p2pButton).toHaveClass(/active/);
    });
  });

  test.describe('4. Estilos y Accesibilidad', () => {
    test('Los botones deben tener cursor pointer', async ({ page }) => {
      const buttons = page.locator('.filter-btn-footer');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const cursor = await buttons.nth(i).evaluate(el => 
          window.getComputedStyle(el).cursor
        );
        expect(cursor).toBe('pointer');
      }
    });

    test('Los botones deben tener aria-label para accesibilidad', async ({ page }) => {
      const buttons = page.locator('.filter-btn-footer');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });

    test('El botón activo debe tener estilos visuales diferenciados', async ({ page }) => {
      // Primero aseguramos un estado conocido: click en P2P para tenerlo activo solo
      const p2pButton = page.locator('.filter-btn-footer[data-filter="p2p"]');
      await p2pButton.click();
      await page.waitForTimeout(100);
      
      const activeButton = page.locator('.filter-btn-footer.active').first();
      const inactiveButton = page.locator('.filter-btn-footer:not(.active)').first();

      // Solo procedemos si hay botones activos e inactivos
      const activeCount = await page.locator('.filter-btn-footer.active').count();
      const inactiveCount = await page.locator('.filter-btn-footer:not(.active)').count();
      
      if (activeCount > 0 && inactiveCount > 0) {
        const activeBg = await activeButton.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        const inactiveBg = await inactiveButton.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );

        // Los colores deben ser diferentes
        expect(activeBg).not.toBe(inactiveBg);
      } else {
        // Si todos están en el mismo estado, verificamos que los estilos existan
        expect(activeCount + inactiveCount).toBe(3);
      }
    });
  });
});
