// Вспомогательные функции для обработки API-запросов и ошибок
import axios from "axios";

/**
 * Вспомогательная функция для выполнения API-запросов с единой обработкой ошибок
 * @param {string} method - HTTP метод (get, post, put, delete)
 * @param {string} url - URL запроса
 * @param {Object} data - Данные для отправки (для POST, PUT запросов)
 * @param {Object} options - Дополнительные опции запроса
 * @returns {Promise} - Промис с результатом запроса
 */
export const apiRequest = async (method, url, data = null, options = {}) => {
  try {
    const safeMethod = (method || "get").toLowerCase();
    const token = localStorage.getItem("token");
    const headers = options.headers || {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Формируем полный URL
    const baseURL = axios.defaults.baseURL || "http://localhost:8000";
    const fullUrl = url.startsWith("http") ? url : `${baseURL}${url}`;

    let response;

    const requestConfig = {
      url: fullUrl,
      method: safeMethod,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...options,
    };

    if (["post", "put", "patch"].includes(safeMethod) && data) {
      requestConfig.data = data;
    } else if (safeMethod === "get" && data) {
      requestConfig.params = data;
    }

    response = await axios(requestConfig);

    return response.data;
  } catch (error) {
    console.error(`API Error (${url}):`, error);

    // Если запрос не выполнен из-за ошибки авторизации (401)
    if (error.response && error.response.status === 401) {
      const authStore = await import("@/stores/auth");
      try {
        await authStore.default().refreshToken();
        return apiRequest(method, url, data, options);
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        throw error;
      }
    }
    throw error;
  }
};

// Вспомогательные функции для разных типов запросов
export const get = (url, params = null, options = {}) =>
  apiRequest("get", url, params, options);
export const post = (url, data = null, options = {}) =>
  apiRequest("post", url, data, options);
export const put = (url, data = null, options = {}) =>
  apiRequest("put", url, data, options);
export const del = (url, options = {}) =>
  apiRequest("delete", url, null, options);

/**
 * Проверяет соединение с API
 * @returns {Promise<boolean>} Результат проверки
 */
export const checkApiConnection = async () => {
  try {
    const baseURL = axios.defaults.baseURL || "http://localhost:8000";
    await axios.get(`${baseURL}/api/health-check/`, { timeout: 5000 });
    return true;
  } catch (error) {
    console.error("API connection check failed:", error);
    return false;
  }
};

export default {
  apiRequest,
  get,
  post,
  put,
  del,
  checkApiConnection,
};
