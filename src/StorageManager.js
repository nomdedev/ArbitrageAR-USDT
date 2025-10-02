// ============================================
// GESTOR DE ALMACENAMIENTO - StorageManager.js
// Responsabilidad: Manejar persistencia de datos
// ============================================

class StorageManager {
  async get(key) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } catch (error) {
      console.error('Error leyendo storage:', error);
      return null;
    }
  }

  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error('Error escribiendo storage:', error);
      return false;
    }
  }

  async getSettings() {
    const data = await this.get('notificationSettings');
    return data || {};
  }

  async saveSettings(settings) {
    return await this.set('notificationSettings', settings);
  }

  async getArbitrages() {
    const data = await this.get('currentData');
    return data || {};
  }

  async saveArbitrages(data) {
    return await this.set('currentData', data);
  }

  async getBanks() {
    const data = await this.get('banks');
    return data || [];
  }

  async saveBanks(banks, lastUpdate) {
    const success1 = await this.set('banks', banks);
    const success2 = await this.set('banksLastUpdate', lastUpdate);
    return success1 && success2;
  }
}

// Exportar instancia singleton
const storageManager = new StorageManager();
export default storageManager;