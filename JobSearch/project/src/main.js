import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import "./assets/main.css";
import { useAuthStore } from "@/stores/auth";
import { useSavedJobsStore } from "@/stores/saved-jobs";
import { useChatStore } from "@/stores/chat";
import { useApplicationsStore } from "./stores/applications";
import LocalStoragePlugin from "./plugins/localStorage";
import { showNotification } from "./utils/notifications";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(LocalStoragePlugin);

// Добавляем глобальное свойство $notify для доступа в браузерной консоли в режиме разработки
if (import.meta.env.DEV) {
  window.$notify = showNotification;
}

const authStore = useAuthStore();
const chatStore = useChatStore(pinia);
const applicationsStore = useApplicationsStore(pinia);

authStore
  .initAuth()
  .then(() => {
    app.use(router);
    app.mount("#app");

    // Запуск состояния готовности приложения для удаления прелоадера
    if (typeof window.appReady === "function") {
      window.appReady();
    }

    console.log(
      "Приложение смонтировано, DOM элемент найден:",
      !!document.getElementById("app")
    );

    router.beforeResolve(async (to, from, next) => {
      console.log(`Происходит навигация: ${from.path} -> ${to.path}`);

      if (to.path === "/" || to.path.startsWith("/jobs")) {
        console.log("Подготовка данных для страницы вакансий");
      } else if (to.path.startsWith("/chat") || to.path === "/chat") {
        try {
          console.log("Обновление данных чата");
          if (authStore.isAuthenticated) {
            await chatStore.fetchConversations();
          }
        } catch (error) {
          console.error(
            "Ошибка при обновлении данных чата при навигации:",
            error
          );
        }
      }

      next();
    });

    router.afterEach((to, from) => {
      console.log(`Навигация завершена: ${from.path} -> ${to.path}`);

      setTimeout(() => {
        document.body.style.display = "none";
        document.body.offsetHeight;
        document.body.style.display = "";
      }, 0);
    });

    const savedJobsStore = useSavedJobsStore();
    savedJobsStore.loadSavedJobsFromStorage();

    if (authStore.isAuthenticated) {
      savedJobsStore.fetchSavedJobs().catch((err) => {
        console.error("Не удалось загрузить сохраненные вакансии:", err);
      });
    }

    if (import.meta.env.DEV) {
      // В режиме разработки используем относительный путь для использования Vite proxy для /api
      axios.defaults.baseURL = "";

      // Логирование дополнительной отладочной информации в режиме разработки
      console.log("[DEBUG] Работаем в режиме разработки");
      console.log("[DEBUG] Запросы API будут использовать Vite proxy");
      console.log(
        "[DEBUG] API URL: " + (axios.defaults.baseURL || "/' (относительный)")
      );
    } else {
      // В production используем переменную окружения или по умолчанию пустую строку
      axios.defaults.baseURL = import.meta.env.VITE_API_URL || "";
    }

    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // Добавляем настройку перехватчика для обработки 401 ошибок
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const originalRequest = error.config;

          if (!originalRequest._retry) {
            originalRequest._retry = true;

            try {
              await authStore.refreshToken();
              originalRequest.headers.Authorization = `Bearer ${authStore.token}`;
              return axios(originalRequest);
            } catch (refreshError) {
              console.error("Ошибка обновления токена:", refreshError);
              await authStore.logout();
              router.push("/login");
              return Promise.reject(refreshError);
            }
          }
        }

        if (error.config && error.config.url.includes("/api/")) {
          console.error("Детали ошибки API:", {
            url: error.config.url,
            status: error.response?.status,
            data: error.response?.data,
            method: error.config.method,
          });

          // Проверяем, существует ли локальная версия данных для этого запроса
          if (error.config.method.toLowerCase() === "get") {
            // Пытаемся найти кэшированные данные в localStorage
            const endpoint = error.config.url.split("/api/")[1]?.split("/")[0];
            if (endpoint) {
              const cachedDataKey = `${endpoint}Cache`;
              const cachedData = localStorage.getItem(cachedDataKey);
              if (cachedData) {
                console.log(`Используем кэшированные данные для ${endpoint}`);
                return Promise.resolve({
                  data: JSON.parse(cachedData),
                  _fromCache: true,
                });
              }
            }
          }
        }

        return Promise.reject(error);
      }
    );

    if (import.meta.env.DEV) {
      window.authStore = authStore;
      window.chatStore = chatStore;
      console.log("Хранилища Auth и Chat доступны в window");
    }

    axios.defaults.withCredentials = true;

    if (import.meta.env.DEV) {
      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.config && error.config.url.includes("/api/")) {
            console.error("Детали ошибки API:", {
              url: error.config.url,
              status: error.response?.status,
              data: error.response?.data,
            });
          }
          return Promise.reject(error);
        }
      );
    }

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Необработанное отклонение промиса:", event.reason);
    });

    window.addEventListener("beforeunload", () => {
      console.log("Страница разгружается");
    });

    document.addEventListener("DOMContentLoaded", () => {
      console.log("DOM полностью загружен и проанализирован");
    });

    // Добавление кода инициализации для исправления хранилища заявок
    if (import.meta.env.DEV) {
      // Импорт и исправление хранилища заявок
      try {
        import("./stores/applications").then(({ useApplicationsStore }) => {
          const appStore = useApplicationsStore();
          if (
            appStore &&
            typeof appStore.fixApplicationStorage === "function"
          ) {
            console.log("Выполнение исправления хранилища заявок...");
            appStore.fixApplicationStorage();
          }
        });
      } catch (err) {
        console.error(
          "Ошибка при исправлении хранилища заявок при инициализации:",
          err
        );
      }
    }
    // Инициализируем чаты из localStorage
    chatStore.init();
    // Синхронизируем отклики с localStorage
    applicationsStore.syncWithLocalStorage();
  })
  .catch((error) => {
    console.error("Ошибка при инициализации аутентификации:", error);
    app.use(router);
    app.mount("#app");
  });
