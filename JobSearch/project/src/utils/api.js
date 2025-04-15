import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Создаем экземпляр axios с конфигурацией по умолчанию
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config._retry
    ) {
      error.config._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          await refreshAccessToken(refreshToken);
          return api(error.config);
        }
      } catch (refreshError) {
        const authStore = useAuthStore();
        authStore.clearAuth();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

async function apiCall(method, url, data = null, config = {}) {
  try {
    const response = await api[method](url, data, config);
    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    const errorResponse = {
      success: false,
      error: {
        message: "Произошла непредвиденная ошибка",
        status: error.response?.status || 500,
      },
    };

    if (error.response && error.response.data) {
      errorResponse.error = {
        ...errorResponse.error,
        ...error.response.data,
        message:
          error.response.data.detail ||
          error.response.data.message ||
          errorResponse.error.message,
      };
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
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/token/refresh/`,
    { refresh: refreshToken }
  );
  if (response.data.access) {
    localStorage.setItem("token", response.data.access);
    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${response.data.access}`;
    return response.data.access;
  } else {
    throw new Error("Не удалось обновить токен");
  }
}

export default api;
