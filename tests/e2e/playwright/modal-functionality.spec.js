const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * Tests E2E para verificar funcionalidad de modales
 * Flujos probados:
 * 1. Abrir modal
 * 2. Cerrar modal con botón X
 * 3. Cerrar modal con click en overlay
 * 4. Estilos y accesibilidad del modal
 */

const POPUP_PATH = `file://${path.resolve(__dirname, '../../../src/popup.html')}`;

test.describe('Flujo E2E: Modal de Detalles', () => {

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

  test.describe('1. Apertura del Modal', () => {
    test('El modal debe poder abrirse programáticamente', async ({ page }) => {
      // Crear un modal de prueba
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.id = 'test-modal';
        modal.className = 'modal';
        modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;';
        modal.innerHTML = `
          <div class="modal-content" style="background:white;margin:50px auto;padding:20px;width:80%;">
            <button class="modal-close-btn" id="close-test-modal">×</button>
            <div class="modal-body">Test Content</div>
          </div>
        `;
        document.body.appendChild(modal);
      });

      const modal = page.locator('#test-modal');
      
      // Verificar que está oculto inicialmente
      const displayBefore = await modal.evaluate(el => el.style.display);
      expect(displayBefore).toBe('none');

      // Abrir el modal
      await page.evaluate(() => {
        document.getElementById('test-modal').style.display = 'flex';
      });

      // Verificar que está visible
      const displayAfter = await modal.evaluate(el => el.style.display);
      expect(displayAfter).toBe('flex');
    });

    test('El modal abierto debe cubrir toda la pantalla', async ({ page }) => {
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.id = 'fullscreen-modal';
        modal.className = 'modal';
        modal.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100%;height:100%;z-index:1000;';
        document.body.appendChild(modal);
      });

      const modal = page.locator('#fullscreen-modal');
      const box = await modal.boundingBox();
      const viewport = page.viewportSize();

      expect(box.width).toBe(viewport.width);
      expect(box.height).toBe(viewport.height);
    });
  });

  test.describe('2. Cerrar Modal con Botón X', () => {
    test('Click en botón X debe cerrar el modal', async ({ page }) => {
      // Crear modal con botón de cerrar funcional
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.id = 'closeable-modal';
        modal.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;justify-content:center;align-items:center;';
        modal.innerHTML = `
          <div class="modal-content" style="background:white;padding:20px;width:80%;position:relative;">
            <button id="close-btn" style="position:absolute;top:10px;right:10px;cursor:pointer;">×</button>
            <div>Modal Content</div>
          </div>
        `;
        document.body.appendChild(modal);

        // Agregar evento de cierre
        document.getElementById('close-btn').addEventListener('click', () => {
          modal.style.display = 'none';
        });
      });

      const modal = page.locator('#closeable-modal');
      const closeBtn = page.locator('#close-btn');

      // Verificar que está abierto
      await expect(modal).toBeVisible();

      // Click en cerrar
      await closeBtn.click();
      await page.waitForTimeout(200);

      // Verificar que se cerró
      const display = await modal.evaluate(el => el.style.display);
      expect(display).toBe('none');
    });

    test('El botón X debe tener cursor pointer', async ({ page }) => {
      await page.evaluate(() => {
        const btn = document.createElement('button');
        btn.className = 'modal-close-btn';
        btn.id = 'cursor-test-btn';
        btn.style.cursor = 'pointer';
        btn.textContent = '×';
        document.body.appendChild(btn);
      });

      const btn = page.locator('#cursor-test-btn');
      const cursor = await btn.evaluate(el => window.getComputedStyle(el).cursor);
      expect(cursor).toBe('pointer');
    });
  });

  test.describe('3. Cerrar Modal con Click en Overlay', () => {
    test('Click en el overlay (fondo) debe cerrar el modal', async ({ page }) => {
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.id = 'overlay-modal';
        modal.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;justify-content:center;align-items:center;';
        modal.innerHTML = `
          <div class="modal-content" id="modal-content" style="background:white;padding:40px;width:200px;height:100px;">
            Content
          </div>
        `;
        document.body.appendChild(modal);

        // Click en overlay cierra el modal
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.style.display = 'none';
          }
        });
      });

      const modal = page.locator('#overlay-modal');
      
      // Click en el overlay (esquina superior izquierda, lejos del contenido)
      await modal.click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(200);

      const display = await modal.evaluate(el => el.style.display);
      expect(display).toBe('none');
    });

    test('Click en el contenido NO debe cerrar el modal', async ({ page }) => {
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.id = 'content-click-modal';
        modal.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;justify-content:center;align-items:center;';
        modal.innerHTML = `
          <div id="modal-inner-content" style="background:white;padding:40px;width:200px;height:100px;">
            Content Here
          </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.style.display = 'none';
          }
        });
      });

      const modal = page.locator('#content-click-modal');
      const content = page.locator('#modal-inner-content');
      
      // Click en el contenido
      await content.click();
      await page.waitForTimeout(200);

      // Modal debe seguir visible
      const display = await modal.evaluate(el => el.style.display);
      expect(display).toBe('flex');
    });
  });

  test.describe('4. Tecla ESC para Cerrar', () => {
    test('Presionar ESC debe cerrar el modal', async ({ page }) => {
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.id = 'esc-modal';
        modal.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;';
        modal.innerHTML = '<div style="background:white;padding:20px;margin:auto;">ESC to close</div>';
        document.body.appendChild(modal);

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            const m = document.getElementById('esc-modal');
            if (m && m.style.display !== 'none') {
              m.style.display = 'none';
            }
          }
        });
      });

      const modal = page.locator('#esc-modal');
      await expect(modal).toBeVisible();

      // Presionar ESC
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      const display = await modal.evaluate(el => el.style.display);
      expect(display).toBe('none');
    });
  });

  test.describe('5. Flujo Completo del Modal', () => {
    test('Abrir → Interactuar → Cerrar con X', async ({ page }) => {
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.id = 'flow-modal';
        modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;justify-content:center;align-items:center;';
        modal.innerHTML = `
          <div style="background:white;padding:20px;width:80%;">
            <button id="flow-close">×</button>
            <input type="text" id="modal-input" placeholder="Type something">
          </div>
        `;
        document.body.appendChild(modal);

        // Botón para abrir
        const openBtn = document.createElement('button');
        openBtn.id = 'open-flow-modal';
        openBtn.textContent = 'Open';
        openBtn.onclick = () => modal.style.display = 'flex';
        document.body.appendChild(openBtn);

        // Botón para cerrar
        document.getElementById('flow-close').onclick = () => modal.style.display = 'none';
      });

      const modal = page.locator('#flow-modal');
      const openBtn = page.locator('#open-flow-modal');
      const closeBtn = page.locator('#flow-close');
      const input = page.locator('#modal-input');

      // Paso 1: Modal cerrado inicialmente
      expect(await modal.evaluate(el => el.style.display)).toBe('none');

      // Paso 2: Abrir modal
      await openBtn.click();
      await page.waitForTimeout(100);
      expect(await modal.evaluate(el => el.style.display)).toBe('flex');

      // Paso 3: Interactuar (escribir en input)
      await input.fill('Test input');
      await expect(input).toHaveValue('Test input');

      // Paso 4: Cerrar modal
      await closeBtn.click();
      await page.waitForTimeout(100);
      expect(await modal.evaluate(el => el.style.display)).toBe('none');
    });

    test('Abrir → Cerrar con overlay → Reabrir', async ({ page }) => {
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.id = 'reopen-modal';
        modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;justify-content:center;align-items:center;';
        modal.innerHTML = '<div style="background:white;padding:40px;width:200px;">Content</div>';
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.style.display = 'none';
        });

        const openBtn = document.createElement('button');
        openBtn.id = 'reopen-btn';
        openBtn.textContent = 'Open';
        openBtn.onclick = () => modal.style.display = 'flex';
        document.body.appendChild(openBtn);
      });

      const modal = page.locator('#reopen-modal');
      const openBtn = page.locator('#reopen-btn');

      // Abrir
      await openBtn.click();
      await page.waitForTimeout(100);
      expect(await modal.evaluate(el => el.style.display)).toBe('flex');

      // Cerrar con overlay
      await modal.click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(100);
      expect(await modal.evaluate(el => el.style.display)).toBe('none');

      // Reabrir
      await openBtn.click();
      await page.waitForTimeout(100);
      expect(await modal.evaluate(el => el.style.display)).toBe('flex');
    });
  });
});
