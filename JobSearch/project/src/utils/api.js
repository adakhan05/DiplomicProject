import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { createApiUrl, getBrowserInfo } from "./proxy";

const browserInfo = getBrowserInfo();
console.log("Browser detection:", browserInfo);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: browserInfo.isMobile ? 30000 : 15000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

api.interceptors.request.use(
  (config) => {
    let token;
    try {
      token = localStorage.getItem("token");
    } catch (e) {
      console.warn("Ошибка доступа к localStorage:", e);
      try {
        token = sessionStorage.getItem("token");
      } catch (e2) {
        console.warn("Ошибка доступа к sessionStorage:", e2);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["User-Agent"] = navigator.userAgent;

    if (browserInfo.isIE || browserInfo.isSafari) {
      config.headers["Cache-Control"] = "no-cache, no-store";
      config.headers["Pragma"] = "no-cache";
      const separator = config.url.includes("?") ? "&" : "?";
      config.url = `${config.url}${separator}_=${new Date().getTime()}`;
    }

    return config;
  },
  (error) => {
    console.error("Ошибка запроса API:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      console.error("Сетевая ошибка - нет ответа");
      return Promise.reject({
        ...error,
        message: "Сетевая ошибка. Проверьте подключение к интернету.",
      });
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        let refreshToken;
        try {
          refreshToken = localStorage.getItem("refreshToken");
        } catch (e) {
          try {
            refreshToken = sessionStorage.getItem("refreshToken");
          } catch (e2) {
            console.warn("Не удалось получить refresh token из хранилища:", e2);
          }
        }

        if (refreshToken) {
          console.log("Попытка обновить токен...");
          const newToken = await refreshAccessToken(refreshToken);
          if (newToken) {
            console.log("Обновление токена прошло успешно");
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } else {
          console.warn("Недоступен refresh token");
        }
      } catch (refreshError) {
        console.error("Обновление токена не удалось:", refreshError);
        try {
          const authStore = useAuthStore();
          authStore.clearAuth();
        } catch (storeError) {
          console.error("Не удалось очистить store:", storeError);
          // Ручной откат, если не удается очистить store
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("refreshToken");
            sessionStorage.removeItem("user");
          } catch (e) {
            console.error("Не удалось очистить хранилище:", e);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

async function apiCall(method, url, data = null, config = {}) {
  try {
    if (!url) {
      console.error("Ошибка вызова API: URL требуется");
      return {
        success: false,
        error: { message: "URL требуется" },
      };
    }

    const apiUrl = createApiUrl(url);
    console.log(`API ${method.toUpperCase()} request to: ${apiUrl}`);

    let safeData = data;
    if (data && typeof data === "object") {
      try {
        JSON.stringify(data);
      } catch (e) {
        console.warn("Неверный объект данных (циклическая ссылка?):", e);
        safeData = {};
        for (const key in data) {
          if (typeof data[key] !== "object" || data[key] === null) {
            safeData[key] = data[key];
          }
        }
      }
    }

    const startTime = new Date().getTime();

    const response = await api[method](apiUrl, safeData, {
      ...config,
      metadata: { startTime },
    });

    const endTime = new Date().getTime();
    console.log(`Вызов API завершен за ${endTime - startTime}мс`);

    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    console.error(`Ошибка API (${method.toUpperCase()}) ${url}:`, error);

    const errorResponse = {
      success: false,
      error: {
        message: "Произошла непредвиденная ошибка",
        status: error.response?.status || 500,
        code: error.code,
      },
    };

    if (error.response && error.response.data) {
      errorResponse.error = {
        ...errorResponse.error,
        ...error.response.data,
        message:
          error.response.data.detail ||
          error.response.data.message ||
          error.response.data.error ||
          errorResponse.error.message,
      };
    } else if (error.request) {
      errorResponse.error.message =
        "Сервер не отвечает. Проверьте подключение к интернету.";
    }

    return errorResponse;
  }
}

export const get = (url, config = {}) => apiCall("get", url, null, config);
export const post = (url, data = {}, config = {}) =>
  apiCall("post", url, data, config);
export const put = (url, data = {}, config = {}) =>
  apiCall("put", url, data, config);
export const patch = (url, data = {}, config = {}) =>
  apiCall("patch", url, data, config);
export const del = (url, config = {}) => apiCall("delete", url, null, config);

async function refreshAccessToken(refreshToken) {
  try {
    const tokenUrl = createApiUrl("/api/token/refresh/");
    console.log("Обновление токена в:", tokenUrl);

    const response = await axios.post(
      tokenUrl,
      { refresh: refreshToken },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    if (response.data && response.data.access) {
      const token = response.data.access;

      try {
        localStorage.setItem("token", token);
      } catch (e) {
        console.warn("Не удалось сохранить токен в localStorage:", e);
        try {
          sessionStorage.setItem("token", token);
        } catch (e2) {
          console.warn("Не удалось сохранить токен в sessionStorage:", e2);
        }
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return token;
    } else {
      throw new Error("Не удалось обновить токен: неверный формат ответа");
    }
  } catch (error) {
    console.error("Ошибка обновления токена:", error);
    throw error;
  }
}

export const browser = browserInfo;

export default api;
