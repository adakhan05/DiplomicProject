// Вспомогательные функции для обработки API-запросов и ошибок
import axios from "axios";

/**
 * Обрабатывает ошибки axios и возвращает понятное сообщение
 * @param {Error} error - Объект ошибки axios
 * @returns {string} - Пользовательское сообщение об ошибке
 */
export const handleAxiosError = (error) => {
  console.debug("API Error Details:", error);

  // Проверяем наличие ответа
  if (error.response) {
    // Сервер ответил с кодом ошибки
    const status = error.response.status;
    console.debug(`API Error Status: ${status}, URL: ${error.config?.url}`);

    // Обработка распространенных кодов ошибок
    switch (status) {
      case 400:
        if (error.response.data && typeof error.response.data === "object") {
          // Собираем все ошибки из объекта данных
          let errorMessage = "Ошибка в запросе: ";
          Object.keys(error.response.data).forEach((key) => {
            const value = error.response.data[key];
            if (Array.isArray(value)) {
              errorMessage += `${key}: ${value.join(", ")}; `;
            } else if (typeof value === "string") {
              errorMessage += `${key}: ${value}; `;
            }
          });
          return errorMessage;
        }
        return "Некорректный запрос";
      case 401:
        return "Требуется авторизация";
      case 403:
        return "Доступ запрещен";
      case 404:
        return `Ресурс не найден: ${error.config?.url || "неизвестный URL"}`;
      case 500:
        return "Внутренняя ошибка сервера";
      default:
        return `Ошибка сервера (код ${status})`;
    }
  } else if (error.request) {
    // Запрос был сделан, но ответа не получено
    console.debug("No response received for request:", error.config?.url);
    return "Сервер не отвечает. Проверьте подключение к интернету.";
  } else {
    // Произошла ошибка при настройке запроса
    console.debug("Request setup error:", error.message);
    return error.message || "Произошла непредвиденная ошибка";
  }
};

/**
 * Вспомогательная функция для сохранения данных, совместимая со всеми браузерами
 * @param {string} key - Ключ для хранения
 * @param {any} value - Значение для хранения
 */
export const safeStorage = {
  setItem: (key, value) => {
    try {
      // Добавляем префикс для предотвращения конфликтов
      const prefixedKey = `jobsearch_${key}`;
      localStorage.setItem(prefixedKey, value);
      console.log(`Успешно сохранено ${key} в localStorage`);
    } catch (e) {
      console.warn(`Не удалось сохранить ${key} в localStorage:`, e);
      try {
        const prefixedKey = `jobsearch_${key}`;
        sessionStorage.setItem(prefixedKey, value);
        console.log(
          `Успешно сохранено ${key} в sessionStorage (резервное хранилище)`
        );
      } catch (e2) {
        console.warn(`Не удалось сохранить ${key} в sessionStorage:`, e2);
      }
    }
  },

  getItem: (key) => {
    try {
      // Проверяем оба варианта ключа (с префиксом и без) для обратной совместимости
      const prefixedKey = `jobsearch_${key}`;

      // Сначала проверяем ключ с префиксом
      let value = localStorage.getItem(prefixedKey);

      // Если не найдено, проверяем без префикса для обратной совместимости
      if (value === null) {
        value = localStorage.getItem(key);
        // Если нашли по старому ключу, мигрируем на новый формат
        if (value !== null) {
          localStorage.setItem(prefixedKey, value);
          console.log(`Миграция ${key} на новый формат ключа`);
        }
      }

      if (value !== null) {
        console.log(`Получено ${key} из localStorage`);
        return value;
      }
    } catch (e) {
      console.warn(`Не удалось получить ${key} из localStorage:`, e);
    }

    try {
      const prefixedKey = `jobsearch_${key}`;
      // Проверяем оба варианта в sessionStorage
      let value = sessionStorage.getItem(prefixedKey);
      if (value === null) {
        value = sessionStorage.getItem(key);
      }

      if (value !== null) {
        console.log(`Получено ${key} из sessionStorage`);
      }
      return value;
    } catch (e) {
      console.warn(`Не удалось получить ${key} из sessionStorage:`, e);
      return null;
    }
  },

  removeItem: (key) => {
    const prefixedKey = `jobsearch_${key}`;
    try {
      localStorage.removeItem(prefixedKey);
      localStorage.removeItem(key); // Удаляем и по старому ключу
    } catch (e) {
      console.warn(`Не удалось удалить ${key} из localStorage:`, e);
    }

    try {
      sessionStorage.removeItem(prefixedKey);
      sessionStorage.removeItem(key); // Удаляем и по старому ключу
    } catch (e) {
      console.warn(`Не удалось удалить ${key} из sessionStorage:`, e);
    }
  },
};

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
    // Проверяем наличие метода и обрабатываем ошибки валидации
    if (!method) {
      console.error("API Error: HTTP method is undefined or null");
      throw new Error("HTTP method is required for API requests");
    }

    // Убедимся, что метод - это строка перед вызовом toLowerCase
    const safeMethod =
      typeof method === "string"
        ? method.toLowerCase()
        : (console.error(`Invalid method type: ${typeof method}`), "get");

    const token = safeStorage.getItem("token");
    const headers = options.headers || {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Добавляем заголовки для лучшей кроссбраузерной совместимости
    headers["X-Requested-With"] = "XMLHttpRequest";

    // Формируем полный URL
    const baseURL = axios.defaults.baseURL || "http://localhost:8000";
    const fullUrl = url.startsWith("http") ? url : `${baseURL}${url}`;

    // Добавляем параметр для предотвращения кэширования в проблемных браузерах
    const nocacheUrl = fullUrl.includes("?")
      ? `${fullUrl}&_=${Date.now()}`
      : `${fullUrl}?_=${Date.now()}`;

    let response;

    const requestConfig = {
      url: nocacheUrl,
      method: safeMethod,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      withCredentials: true, // Важно для кук и CORS
      ...options,
    };

    console.log(`API Request: ${safeMethod.toUpperCase()} ${url}`, {
      requestConfig,
      data,
    });

    if (["post", "put", "patch"].includes(safeMethod) && data) {
      requestConfig.data = data;
    } else if (safeMethod === "get" && data) {
      requestConfig.params = data;
    }

    response = await axios(requestConfig);

    // Особая обработка для инициирования чата
    if (url.includes("/initiate_chat/")) {
      console.log(`API initiate_chat Response details:`, {
        status: response.status,
        headers: response.headers,
        data: JSON.stringify(response.data),
        hasId: response.data && response.data.id !== undefined,
        dataType: typeof response.data,
      });

      // Если это запрос на создание чата, проверяем целостность данных
      if (response.data) {
        // Создаем новый объект для возврата, чтобы избежать проблем с ссылками/прототипами
        const responseData = {
          id: response.data.id,
          conversation_id: response.data.conversation_id,
        };

        // Добавляем другие свойства, если есть
        if (response.data.participants) {
          responseData.participants = response.data.participants;
        }
        if (response.data.participants_info) {
          responseData.participants_info = response.data.participants_info;
        }
        if (response.data.job !== undefined) {
          responseData.job = response.data.job;
        }

        console.log(
          `Ответ на запрос на создание чата:`,
          JSON.stringify(responseData)
        );
        return responseData;
      }
    }

    console.log(`Успешный ответ от API: ${url}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Ошибка API (${url}):`, error);

    // Если запрос не выполнен из-за ошибки авторизации (401)
    if (error.response && error.response.status === 401) {
      const authStore = await import("@/stores/auth");
      try {
        await authStore.default().refreshToken();
        return apiRequest(method, url, data, options);
      } catch (refreshError) {
        console.error("Не удалось обновить токен:", refreshError);
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
 * Улучшенная обработка запросов регистрации с поддержкой разных эндпоинтов
 * @param {Array<string>} endpoints - Массив URL эндпоинтов для попытки регистрации
 * @param {Object} data - Данные регистрации
 * @returns {Promise<Object>} - Промис с успешным ответом от первого работающего эндпоинта
 */
export const attemptMultipleEndpoints = async (endpoints, data) => {
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    throw new Error("Необходим минимум один эндпоинт для регистрации");
  }

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`Попытка запроса к эндпоинту: ${endpoint}`);
      // Используем прямой вызов axios вместо post для получения полного ответа
      const fullResponse = await axios.post(endpoint, data, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        withCredentials: true,
      });

      console.log(`Успешный ответ от ${endpoint}:`, fullResponse);

      // Возвращаем данные в ожидаемом формате
      return {
        success: true,
        data: fullResponse.data,
        endpoint,
        status: fullResponse.status,
      };
    } catch (error) {
      console.warn(`Ошибка при вызове ${endpoint}:`, error);
      lastError = error;
      // Продолжаем со следующим эндпоинтом
    }
  }

  // Если все эндпоинты завершились неудачей, возвращаем последнюю ошибку
  throw lastError || new Error("Все эндпоинты вернули ошибку");
};

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
    console.error("Проверка соединения с API не удалась:", error);
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
  handleAxiosError,
  safeStorage,
  attemptMultipleEndpoints,
};
