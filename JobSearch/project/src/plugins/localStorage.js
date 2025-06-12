/**
 * Плагин для работы с localStorage
 * Обеспечивает надежное сохранение и восстановление данных
 * независимо от браузера
 */

// Безопасная обертка для работы с localStorage
const safeLocalStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Ошибка при чтении ${key} из localStorage:`, error);
      return null;
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Ошибка при записи ${key} в localStorage:`, error);
      return false;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Ошибка при удалении ${key} из localStorage:`, error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error(`Ошибка при очистке localStorage:`, error);
      return false;
    }
  },

  keys() {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error(`Ошибка при получении ключей из localStorage:`, error);
      return [];
    }
  },

  // Сохранить объект в localStorage с автоматической сериализацией
  setObject(key, obj) {
    try {
      const serialized = JSON.stringify(obj);
      this.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Ошибка при сохранении объекта в localStorage:`, error);
      return false;
    }
  },

  // Получить объект из localStorage с автоматической десериализацией
  getObject(key, defaultValue = null) {
    try {
      const serialized = this.getItem(key);
      if (!serialized) return defaultValue;
      return JSON.parse(serialized);
    } catch (error) {
      console.error(`Ошибка при получении объекта из localStorage:`, error);
      return defaultValue;
    }
  },
};

// Плагин Vue для добавления инструментов localStorage в компоненты
export default {
  install(app) {
    // Добавляем свойство $localStorage в глобальный объект
    app.config.globalProperties.$localStorage = safeLocalStorage;

    // Добавляем свойство $storage для более краткой записи
    app.config.globalProperties.$storage = safeLocalStorage;

    // Экспортируем как самостоятельный объект для импорта в скриптах
    app.provide("localStorage", safeLocalStorage);
  },
};

// Экспортируем напрямую для использования в скриптах
export { safeLocalStorage };
