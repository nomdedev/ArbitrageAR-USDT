// ============================================
// UPDATE CHECKER - updateChecker.js
// Responsabilidad: Verificar actualizaciones desde GitHub
// ============================================

import { log } from './config.js';

class UpdateChecker {
  constructor() {
    this.CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 horas
    this.GITHUB_REPO = 'nomdedev/ArbitrageAR-USDT';
    this.currentVersion = null;
    this.lastCheck = null;
  }

  // Inicializar checker de actualizaciones
  async initialize() {
    try {
      // Obtener versión actual del manifest
      const manifest = chrome.runtime.getManifest();
      this.currentVersion = manifest.version;
      log(`🔄 [UPDATE] Versión actual: ${this.currentVersion}`);

      // Verificar inmediatamente al iniciar
      await this.checkForUpdates();

      // Configurar verificación periódica
      setInterval(() => this.checkForUpdates(), this.CHECK_INTERVAL);
      
      log(`✅ [UPDATE] Checker inicializado (verificación cada 6 horas)`);
    } catch (error) {
      console.error('❌ [UPDATE] Error inicializando checker:', error);
    }
  }

  // Verificar si hay actualizaciones disponibles
  async checkForUpdates() {
    try {
      log('🔍 [UPDATE] Verificando actualizaciones en GitHub...');

      // Obtener información del último commit
      const latestCommit = await this.getLatestCommit();
      
      if (!latestCommit) {
        log('⚠️ [UPDATE] No se pudo obtener información del repositorio');
        return;
      }

      // Obtener última versión verificada por el usuario
      const storage = await chrome.storage.local.get('updateInfo');
      const dismissedVersion = storage.updateInfo?.dismissedVersion;
      const lastCommitSha = storage.updateInfo?.lastCommitSha;

      // Si es un commit nuevo (diferente SHA)
      if (latestCommit.sha !== lastCommitSha) {
        log(`✨ [UPDATE] Nueva actualización detectada: ${latestCommit.sha.substring(0, 7)}`);
        log(`📝 [UPDATE] Mensaje: ${latestCommit.message}`);

        // Verificar si el usuario ya descartó este commit específico
        if (dismissedVersion === latestCommit.sha) {
          log('ℹ️ [UPDATE] Usuario ya vio esta actualización');
          return;
        }

        // Guardar información de la actualización
        await chrome.storage.local.set({
          updateAvailable: {
            available: true,
            version: latestCommit.sha,
            message: latestCommit.message,
            date: latestCommit.date,
            author: latestCommit.author,
            url: latestCommit.url,
            timestamp: Date.now()
          }
        });

        log('✅ [UPDATE] Actualización disponible guardada');
      } else {
        log('✅ [UPDATE] Ya tienes la última versión');
        
        // Limpiar notificación si existía
        await chrome.storage.local.set({
          updateAvailable: {
            available: false
          }
        });
      }

      this.lastCheck = Date.now();
    } catch (error) {
      console.error('❌ [UPDATE] Error verificando actualizaciones:', error);
    }
  }

  // Obtener información del último commit desde GitHub
  async getLatestCommit() {
    try {
      const url = `https://api.github.com/repos/${this.GITHUB_REPO}/commits/main`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ArbitrageAR-Extension'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        sha: data.sha,
        message: data.commit.message.split('\n')[0], // Primera línea del mensaje
        date: data.commit.author.date,
        author: data.commit.author.name,
        url: data.html_url
      };
    } catch (error) {
      console.error('❌ [UPDATE] Error obteniendo último commit:', error);
      return null;
    }
  }

  // Marcar actualización como vista/descartada
  async dismissUpdate(commitSha) {
    try {
      await chrome.storage.local.set({
        updateInfo: {
          dismissedVersion: commitSha,
          lastCommitSha: commitSha,
          dismissedAt: Date.now()
        },
        updateAvailable: {
          available: false
        }
      });

      log(`✅ [UPDATE] Actualización ${commitSha.substring(0, 7)} marcada como vista`);
    } catch (error) {
      console.error('❌ [UPDATE] Error descartando actualización:', error);
    }
  }

  // Forzar verificación manual
  async forceCheck() {
    log('🔄 [UPDATE] Verificación manual forzada');
    await this.checkForUpdates();
  }
}

// Exportar instancia singleton
const updateChecker = new UpdateChecker();

// Hacer disponible globalmente en service worker
if (typeof self !== 'undefined') {
  self.updateChecker = updateChecker;
}

export { updateChecker };
