export const getApiBaseUrl = () => {
  // В продакшн-режиме использовать относительные URL или переменную окружения
  if (import.meta.env.PROD) {
    const envUrl = import.meta.env.VITE_API_URL;
    // Если переменная окружения задана, использовать её
    if (envUrl) return envUrl;

    try {
      return window.location.origin || "";
    } catch (e) {
      console.warn("Не удалось получить доступ к window.location.origin:", e);
      return "";
    }
  }

  // В режиме разработки использовать сервер разработки или пустую строку для относительных URL
  return import.meta.env.VITE_API_URL || "";
};

// Создать полный URL для API эндпоинтов
export const createApiUrl = (endpoint) => {
  if (!endpoint) {
    console.warn("Передан некорректный эндпоинт в createApiUrl");
    return "/api";
  }
  const cleanEndpoint = endpoint.trim();

  const normalizedEndpoint = cleanEndpoint.startsWith("/api")
    ? cleanEndpoint
    : `/api${
        cleanEndpoint.startsWith("/") ? cleanEndpoint : `/${cleanEndpoint}`
      }`;

  // В режиме разработки используем относительные URL для прокси Vite
  if (import.meta.env.DEV) {
    return normalizedEndpoint;
  }

  const baseUrl = getApiBaseUrl();

  if (!baseUrl) return normalizedEndpoint;

  const finalUrl = `${
    baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  }${normalizedEndpoint}`;

  return finalUrl;
};

// Вспомогательный метод для обнаружения проблем с CORS
export const detectCorsIssues = async (url) => {
  try {
    const testUrl = `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`;

    const response = await fetch(testUrl, {
      method: "OPTIONS",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      mode: "cors",
      credentials: "include",
      cache: "no-cache",
    });

    return {
      status: response.status,
      ok: response.ok,
      corsEnabled: !!response.headers.get("access-control-allow-origin"),
      headers: {
        "access-control-allow-origin":
          response.headers.get("access-control-allow-origin") || "none",
        "access-control-allow-credentials":
          response.headers.get("access-control-allow-credentials") || "none",
      },
    };
  } catch (error) {
    console.error("Проверка CORS не удалась:", error);
    return {
      status: 0,
      ok: false,
      corsEnabled: false,
      error: error.message,
    };
  }
};

// Вспомогательный метод для определения браузера
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  return {
    isChrome:
      /chrome/.test(userAgent) &&
      !/edge|edg/.test(userAgent) &&
      !/opr/.test(userAgent),
    isFirefox: /firefox/.test(userAgent),
    isSafari:
      /safari/.test(userAgent) && !/chrome|chromium|edge|edg/.test(userAgent),
    isEdge: /edge|edg/.test(userAgent),
    isOpera: /opr/.test(userAgent) || /opera/.test(userAgent),
    isIE: /msie|trident/.test(userAgent),
    isMobile:
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
        userAgent
      ),
    userAgent: userAgent,
  };
};

export default {
  getApiBaseUrl,
  createApiUrl,
  detectCorsIssues,
  getBrowserInfo,
};
