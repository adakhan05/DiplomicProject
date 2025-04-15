import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import "./assets/main.css";
import { useAuthStore } from "@/stores/auth";
import { useSavedJobsStore } from "@/stores/saved-jobs";
import { useChatStore } from "@/stores/chat";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const authStore = useAuthStore();
const chatStore = useChatStore();

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

    axios.defaults.baseURL =
      import.meta.env.VITE_API_URL || "http://localhost:8000";

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
      console.log("РЕЖИМ РАЗРАБОТКИ: Хранилища Auth и Chat доступны в window");
    }

    axios.defaults.withCredentials = true;

    if (import.meta.env.DEV) {
      localStorage.removeItem("dev_employer_bypass");
      localStorage.removeItem("dev_refresh_needed");

      console.log("РЕЖИМ РАЗРАБОТКИ: Удалены все флаги обхода работодателя");
    }

    if (import.meta.env.DEV) {
      console.log(
        "РЕЖИМ РАЗРАБОТКИ: Проверка ролей пользователей на основе имени пользователя"
      );

      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (user && user.username) {
        const username = user.username.toLowerCase();

        if (
          username === "klin" &&
          (user.role === "employer" ||
            user.profile?.role === "employer" ||
            user.is_employer)
        ) {
          console.log("РЕЖИМ РАЗРАБОТКИ: Исправление роли");

          user.role = "jobseeker";
          if (user.profile) user.profile.role = "jobseeker";
          user.is_employer = false;
          user.user_type = "jobseeker";

          localStorage.setItem("user", JSON.stringify(user));

          if (authStore && authStore.setUser) {
            authStore.setUser(user);
          }
        } else if (
          username === "employer" &&
          !(
            user.role === "employer" ||
            user.profile?.role === "employer" ||
            user.is_employer
          )
        ) {
          console.log(
            "РЕЖИМ РАЗРАБОТКИ: Исправление роли для работодателя (должна быть employer)"
          );

          user.role = "employer";
          if (!user.profile) user.profile = {};
          user.profile.role = "employer";
          user.is_employer = true;
          user.user_type = "employer";

          localStorage.setItem("user", JSON.stringify(user));

          if (authStore && authStore.setUser) {
            authStore.setUser(user);
          }
        }
      }
    }

    if (import.meta.env.DEV) {
      const mockJobApplications = [];
      const mockChatConversations = [];
      const mockChatMessages = [];

      const generateConversationId = () =>
        Math.floor(Math.random() * 100000).toString();

      const logMockData = () => {
        console.log("==== ОТЛАДКА ТЕСТОВЫХ ДАННЫХ ====");
        console.log(
          "Диалоги:",
          mockChatConversations.length,
          mockChatConversations
        );
        console.log("Сообщения:", mockChatMessages.length, mockChatMessages);
        console.log(
          "Отклики:",
          mockJobApplications.length,
          mockJobApplications
        );
        console.log("=========================");
      };

      axios.interceptors.request.use(
        async (config) => {
          if (
            config.url === "/api/jobs/applications/" &&
            config.method === "post"
          ) {
            console.log(
              "Перехват отклика на вакансию в режиме разработки:",
              config.data
            );

            try {
              const mockResponse = {
                id: Math.floor(Math.random() * 10000),
                job: config.data.job,
                resume: config.data.resume,
                cover_letter: config.data.cover_letter || "",
                message: config.data.message || "",
                expected_salary: config.data.expected_salary || "",
                status: "pending",
                created_at: new Date().toISOString(),
              };

              mockJobApplications.push(mockResponse);

              const conversationId = generateConversationId();
              const now = new Date().toISOString();
              const jobId = config.data.job;

              const conversation = {
                id: conversationId,
                job_id: jobId,
                job: {
                  id: jobId,
                },
                unread: 1,
                unread_count: 1,
                last_message:
                  config.data.message || "Я заинтересован в этой вакансии",
                last_message_text:
                  config.data.message || "Я заинтересован в этой вакансии",
                last_message_time: now,
                last_message_date: now,
                employer_name: "Работодатель",
                jobseeker_name: "Вы",
                participants: [
                  { id: 1, username: "Работодатель", is_employer: true },
                  { id: 2, username: "Вы", is_employer: false },
                ],
              };

              const welcomeMessage = {
                id: Math.floor(Math.random() * 10000),
                conversation_id: conversationId,
                sender: 1,
                sender_id: 1,
                text: `Здравствуйте! Мы получили ваш отклик на вакансию. Спасибо за интерес!`,
                created_at: now,
                is_read: false,
              };

              const applicationMessage = {
                id: Math.floor(Math.random() * 10000),
                conversation_id: conversationId,
                sender: 2,
                sender_id: 2,
                text: config.data.message || "Я заинтересован в этой вакансии",
                created_at: now,
                is_read: true,
              };

              mockChatConversations.push(conversation);
              mockChatMessages.push(welcomeMessage, applicationMessage);

              console.log("Создан тестовый диалог:", conversation);
              console.log("Созданы тестовые сообщения:", mockChatMessages);
              logMockData();

              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    status: 200,
                    statusText: "OK",
                    data: { ...mockResponse, conversation_id: conversationId },
                    headers: { "content-type": "application/json" },
                    config,
                    request: {},
                  });
                }, 500);
              });
            } catch (error) {
              console.error("Ошибка в тестовом перехватчике:", error);
              return config;
            }
          }

          if (
            (config.url === "/api/chat/conversations/" ||
              config.url === "/api/jobs/messages/conversations/") &&
            config.method === "get"
          ) {
            console.log("Перехват запроса диалогов чата");
            logMockData();

            return new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  status: 200,
                  statusText: "OK",
                  data: mockChatConversations,
                  headers: { "content-type": "application/json" },
                  config,
                  request: {},
                });
              }, 300);
            });
          }

          if (
            (config.url.includes("/api/chat/conversations/") ||
              config.url.includes("/api/jobs/messages/")) &&
            config.url.includes("/messages") &&
            config.method === "get"
          ) {
            console.log("Перехват запроса сообщений чата:", config.url);

            let conversationId;
            if (config.url.includes("/api/chat/conversations/")) {
              conversationId = config.url.split("/")[3];
            } else if (config.url.includes("/api/jobs/messages/")) {
              conversationId = config.url.split("/")[3];
            }

            console.log("Поиск сообщений для диалога:", conversationId);
            const messages = mockChatMessages.filter(
              (msg) => msg.conversation_id === conversationId
            );
            console.log("Найдено сообщений:", messages.length);

            return new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  status: 200,
                  statusText: "OK",
                  data: messages,
                  headers: { "content-type": "application/json" },
                  config,
                  request: {},
                });
              }, 300);
            });
          }

          return config;
        },
        (error) => Promise.reject(error)
      );

      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.config && error.config.url.includes("/api/")) {
            console.error("Детали ошибки API:", {
              url: error.config.url,
              status: error.response?.status,
              data: error.response?.data,
              method: error.config.method,
            });

            // Не создаем мок-данные при ошибках API, чтобы использовать реальные данные из бэкенда
          }
          return Promise.reject(error);
        }
      );

      window.debugMockData = logMockData;

      console.log(
        "Запуск в режиме разработки - добавление отладки маршрутизатора"
      );

      router.beforeEach((to, from, next) => {
        console.log(`Навигация маршрутизатора: ${from.path} → ${to.path}`);
        next();
      });

      router.afterEach((to) => {
        console.log(`Маршрутизатор завершил навигацию к: ${to.path}`);
      });

      router.onError((error) => {
        console.error(`Ошибка маршрутизатора: ${error.message}`);
      });
    }

    if (import.meta.env.DEV) {
      app.mixin({
        created() {
          console.log(`Компонент создан: ${this.$options.name || "Анонимный"}`);
        },
      });
    }

    if (import.meta.env.DEV) {
      console.log("РЕЖИМ РАЗРАБОТКИ: Хранилища Auth и Chat доступны в window");
    }

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", error.response || error);
        return Promise.reject(error);
      }
    );

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
    });

    window.addEventListener("beforeunload", () => {
      console.log("Page unloading");
    });

    document.addEventListener("DOMContentLoaded", () => {
      console.log("DOM fully loaded and parsed");
    });

    // Добавление кода инициализации для исправления хранилища заявок
    if (import.meta.env.DEV) {
      // Импорт и исправление хранилища заявок
      try {
        const { useApplicationsStore } = require("./stores/applications");
        const appStore = useApplicationsStore();

        if (appStore && typeof appStore.fixApplicationStorage === "function") {
          console.log("Running application storage fix...");
          appStore.fixApplicationStorage();
        }
      } catch (err) {
        console.error(
          "Error fixing application storage during initialization:",
          err
        );
      }
    }
  })
  .catch((error) => {
    console.error("Failed to initialize auth state:", error);
    app.use(router);
    app.mount("#app");
  });
