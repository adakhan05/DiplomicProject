import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";
import { ref } from "vue";
import { apiRequest } from "@/utils/api-helper";

export const useChatStore = defineStore("chat", {
  state: () => {
    const isDev = ref(import.meta.env.DEV);

    return {
      conversations: [], // Список диалогов, загружаемый с сервера
      messages: {}, // Кэш сообщений по ID диалога
      loading: false,
      error: null,
      unreadCount: 0,
      isDev: isDev.value,
      pollingInterval: null,
      currentConversationId: null,
      isPollingActive: false,
      lastMessageTimestamps: {},
      networkErrorCount: 0,
      maxRetries: 5,
      basePollingDelay: 3000,
      wsConnection: null,
      wsConnected: false,
      heartbeatInterval: null,
    };
  },

  getters: {
    // Получает сообщения для конкретного диалога
    getMessages: (state) => (conversationId) => {
      if (!conversationId) return [];
      const dialogId = String(conversationId);
      return state.messages[dialogId] || [];
    },

    // Получает конкретный диалог по ID
    getConversation: (state) => (conversationId) => {
      if (!conversationId) return null;
      const dialogId = String(conversationId);
      return state.conversations.find((c) => String(c.id) === dialogId);
    },

    // Определяем, есть ли непрочитанные сообщения
    hasUnread: (state) => {
      return state.unreadCount > 0;
    },
  },

  actions: {
    /**
     * Инициализирует хранилище чатов.
     * В текущей версии загружает данные чатов из базы данных вместо localStorage.
     * @param {Boolean} force - Если true, принудительно обновляет данные даже при наличии кэша
     */
    async init(force = false) {
      try {
        const authStore = useAuthStore();
        const isAuth = authStore.isAuthenticated;
        const token = authStore.token;
        const user = authStore.user;
        const role = user?.role; // Получаем роль пользователя (работодатель или соискатель)

        console.log(
          `[DEBUG] chatStore.init: проверка авторизации. token=${
            token ? "есть" : "нет"
          }, isAuth=${isAuth}, роль=${role || "неизвестна"}`
        );

        // Если у пользователя есть токен или он авторизован, загружаем данные
        if (isAuth || token) {
          console.log(
            `[DEBUG] chatStore.init: начинаем инициализацию для ${
              role || "пользователя"
            }`
          );

          // Загружаем список диалогов, если пользователь авторизован
          try {
            console.log(`[DEBUG] chatStore.init: загрузка списка диалогов...`);
            const conversations = await this.fetchConversations(force);
            console.log(
              `[DEBUG] chatStore.init: загружено ${conversations.length} диалогов`
            );

            // Если мы работодатель, делаем ещё одну попытку загрузки через 3 секунды
            // Это гарантирует, что мы получим все новые диалоги, даже если они были созданы только что
            if (role === "employer") {
              console.log(
                `[DEBUG] chatStore.init: запланирована дополнительная загрузка диалогов для работодателя через 3 секунды`
              );
              setTimeout(async () => {
                try {
                  console.log(
                    `[DEBUG] chatStore.init: выполняем дополнительную загрузку диалогов для работодателя`
                  );
                  const refreshedConversations = await this.fetchConversations(
                    true
                  ); // Принудительное обновление
                  console.log(
                    `[DEBUG] chatStore.init: дополнительно загружено ${refreshedConversations.length} диалогов`
                  );
                } catch (retryError) {
                  console.error(
                    "[DEBUG] chatStore.init: ошибка при дополнительной загрузке диалогов:",
                    retryError
                  );
                }
              }, 3000);
            }
          } catch (convError) {
            console.error(
              "[DEBUG] chatStore.init: ошибка при загрузке диалогов:",
              convError
            );
          }

          // Получаем количество непрочитанных сообщений
          try {
            console.log(
              `[DEBUG] chatStore.init: загрузка количества непрочитанных сообщений...`
            );
            await this.fetchUnreadCount();
            console.log(
              `[DEBUG] chatStore.init: количество непрочитанных сообщений: ${this.unreadCount}`
            );
          } catch (unreadError) {
            console.error(
              "[DEBUG] chatStore.init: ошибка при загрузке количества непрочитанных сообщений:",
              unreadError
            );
          }

          console.log(
            "[DEBUG] chatStore.init: инициализация завершена успешно"
          );

          // Инициализируем WebSocket соединение
          console.log(
            `[DEBUG] chatStore.init: начинаем подключение WebSocket...`
          );
          this.connectWebSocket();
        } else {
          console.log(
            "[DEBUG] chatStore.init: инициализация пропущена - пользователь не авторизован"
          );
        }
      } catch (error) {
        console.error(
          "[DEBUG] chatStore.init: ошибка при инициализации хранилища чата:",
          error
        );
      }
    },

    /**
     * Загружает список диалогов для текущего пользователя.
     * Всегда берет данные из API, а не из localStorage.
     * @param {Boolean} force - Если true, игнорирует сохраненный URL и пробует все URL
     */
    async fetchConversations(force = false) {
      console.log("[DEBUG] fetchConversations: начало загрузки диалогов");
      try {
        this.loading = true;
        this.error = null;

        // Получаем токен аутентификации из хранилища auth
        const authStore = useAuthStore();

        // Проверяем авторизацию двумя способами: через токен и через флаг авторизации
        const token = authStore.token;
        const isAuth = authStore.isAuthenticated;

        console.log(
          `[DEBUG] fetchConversations: токен ${
            token ? "получен" : "не получен"
          }, isAuthenticated: ${isAuth}`
        );

        // Если пользователь не авторизован, возвращаем пустой список
        if (!token && !isAuth) {
          console.warn("fetchConversations: Пользователь не авторизован");
          this.conversations = [];
          return [];
        }

        // Формируем заголовки запроса с токеном
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Запрашиваем список диалогов с бэкенда
        console.log(
          "[DEBUG] fetchConversations: отправка запроса к API",
          headers
        );

        // Сначала проверяем, есть ли успешный URL в localStorage
        let savedUrl = localStorage.getItem("conversations_api_url");

        // Список возможных URL-адресов для получения диалогов с приоритетом на /api/jobs/conversations/
        let possibleUrls = [
          "/api/jobs/conversations/", // Основной URL согласно конфигурации Django
          "/api/conversations/", // Альтернативный вариант с API префиксом
          "/jobs/conversations/", // Вариант без API префикса
          "/conversations/", // Еще один вариант без API префикса
        ];

        // Если есть сохраненный рабочий URL и не указан force, помещаем его в начало списка
        if (savedUrl && !force) {
          possibleUrls = [
            savedUrl,
            ...possibleUrls.filter((url) => url !== savedUrl),
          ];
          console.log(
            `[DEBUG] fetchConversations: использую сохраненный URL: ${savedUrl}`
          );
        } else if (force) {
          console.log(
            `[DEBUG] fetchConversations: принудительное обновление, игнорирую сохраненный URL`
          );
        }

        let response;
        let successUrl = null;

        // Попытка использовать каждый URL из списка
        for (const url of possibleUrls) {
          try {
            console.log(
              `[DEBUG] fetchConversations: попытка использовать URL: ${url}`
            );
            response = await axios.get(url, {
              headers: headers,
              // Добавляем маркер времени для предотвращения кэширования
              params: { _t: Date.now() },
            });

            // Логируем тип содержимого ответа для отладки
            const contentType =
              (response.headers && response.headers["content-type"]) ||
              "unknown";
            console.log(
              `[DEBUG] fetchConversations: ответ имеет content-type: ${contentType}, status: ${response.status}`
            );

            // Если ответ - строка, логируем первые 100 символов для отладки
            if (typeof response.data === "string") {
              const preview = response.data.slice(0, 100);
              console.log(
                `[DEBUG] fetchConversations: ответ (первые 100 символов): ${preview}...`
              );
            } else {
              console.log(
                `[DEBUG] fetchConversations: ответ имеет тип: ${typeof response.data}, и содержит ${
                  Array.isArray(response.data)
                    ? response.data.length + " элементов"
                    : "объект"
                }`
              );
            }

            // Проверяем, что ответ содержит JSON, а не HTML
            const isHtml =
              typeof response.data === "string" &&
              (response.data.trim().startsWith("<!DOCTYPE") ||
                response.data.trim().startsWith("<html"));

            const isValidJson =
              Array.isArray(response.data) ||
              (typeof response.data === "object" && response.data !== null);

            if (isHtml) {
              console.log(
                `[DEBUG] fetchConversations: ответ от ${url} содержит HTML вместо JSON, пробую следующий URL`
              );
              continue; // Пропускаем этот URL и пробуем следующий
            }

            if (!isValidJson) {
              console.log(
                `[DEBUG] fetchConversations: ответ от ${url} не является валидным JSON, пробую следующий URL. Тип: ${typeof response.data}`
              );
              continue;
            }

            // Если запрос успешен и вернул валидный JSON, запоминаем рабочий URL
            successUrl = url;
            console.log(`[DEBUG] fetchConversations: успешный запрос к ${url}`);

            // Сохраняем успешный URL в localStorage для будущих запросов
            localStorage.setItem("conversations_api_url", url);

            break;
          } catch (err) {
            console.log(
              `[DEBUG] fetchConversations: ошибка при использовании URL ${url}:`,
              err.message
            );
            // Детальная информация об ошибке для диагностики
            if (err.response) {
              console.log(
                `[DEBUG] fetchConversations: статус ошибки ${url}: ${err.response.status}`
              );
              if (err.response.data) {
                const errorData =
                  typeof err.response.data === "string"
                    ? err.response.data.slice(0, 100) + "..."
                    : err.response.data;
                console.log(
                  `[DEBUG] fetchConversations: данные ошибки ${url}:`,
                  errorData
                );
              }
            } else if (err.request) {
              console.log(
                `[DEBUG] fetchConversations: нет ответа от сервера для ${url}`
              );
            }
            // Продолжаем со следующим URL
          }
        }

        // Если ни один URL не сработал, вызываем исключение
        if (!successUrl) {
          throw new Error(
            "[DEBUG] fetchConversations: ни один URL не работает для получения диалогов"
          );
        }

        console.log(
          `[DEBUG] fetchConversations: получен ответ от API`,
          response.data
        );

        // Поддержка пагинации DRF: если приходит объект с results, используем его
        const convs = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.results)
          ? response.data.results
          : [];
        this.conversations = convs;

        // Получаем общее количество непрочитанных сообщений
        let totalUnread = 0;
        this.conversations.forEach((conv) => {
          totalUnread += conv.unread_count || 0;
        });
        this.unreadCount = totalUnread;
        console.log(
          `[DEBUG] fetchConversations: найдено ${this.conversations.length} диалогов, непрочитанных: ${totalUnread}`
        );

        return this.conversations;
      } catch (error) {
        // Добавляем более информативное сообщение об ошибке
        let errorMessage = "Ошибка при загрузке диалогов";

        if (error.response) {
          // Есть ответ от сервера, но с ошибкой
          console.log(
            `[DEBUG] fetchConversations: ошибка ответа ${error.response.status}`,
            error.response.data
          );
          if (error.response.status === 401) {
            errorMessage = "Необходима авторизация для доступа к диалогам";
          } else if (error.response.status === 404) {
            errorMessage = "API диалогов не найден";
          } else {
            errorMessage = `Ошибка сервера: ${error.response.status}`;
          }
        } else if (error.request) {
          // Запрос отправлен, но нет ответа
          console.log(
            `[DEBUG] fetchConversations: нет ответа от сервера`,
            error.request
          );
          errorMessage = "Не удалось получить ответ от сервера";
        } else {
          console.log(
            `[DEBUG] fetchConversations: ошибка запроса`,
            error.message
          );
        }

        this.error = errorMessage;
        console.error("Ошибка при загрузке диалогов:", error);

        // Очищаем данные при ошибке
        this.conversations = [];
        return [];
      } finally {
        this.loading = false;
        console.log("[DEBUG] fetchConversations: завершение загрузки диалогов");
      }
    },

    /**
     * Создает новый диалог или возвращает существующий.
     * @param {Number} userId - ID пользователя-собеседника
     * @param {Number|null} jobId - ID вакансии (опционально)
     * @param {String} initialMessage - Начальное сообщение (если создается новый диалог)
     */
    async createOrGetConversation(userId, jobId = null, initialMessage = null) {
      try {
        console.log(
          `[ОТЛАДКА ЧАТА] createOrGetConversation: userId=${userId}, jobId=${jobId}`
        );
        this.loading = true;
        this.error = null;

        // Получаем токен аутентификации и проверяем авторизацию
        const authStore = useAuthStore();
        const token = authStore.token;
        const isAuth = authStore.isAuthenticated;
        const userId = authStore.user?.id;

        console.log(
          `[ОТЛАДКА ЧАТА] Статус авторизации: token=${
            token ? "есть" : "нет"
          }, isAuth=${isAuth}, userId=${userId || "не определен"}`
        );

        // Проверяем авторизацию пользователя любым доступным способом
        if ((!token && !isAuth) || !userId) {
          throw new Error("Необходима авторизация для создания диалога");
        }

        // Создаем ключ для WebSocket соединения - УПРОЩЕННЫЙ ФОРМАТ
        // Важно: используем формат, который соответствует роутингу Django Channels
        const wsKey = jobId ? `job-${jobId}` : `user-${userId}`;
        console.log(`[ОТЛАДКА ЧАТА] Создан WebSocket ключ: ${wsKey}`);

        // Подготавливаем данные для запроса
        const data = {
          user_id: userId,
          ws_key: wsKey, // Добавляем ключ WebSocket
        };

        if (jobId) {
          data.job_id = jobId;
        }

        // Готовим заголовки для запроса
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Делаем запрос на создание или получение диалога
        console.log(
          `[ОТЛАДКА ЧАТА] Отправка запроса на создание/получение диалога:`,
          data
        );

        // Список возможных URL-адресов для создания или получения диалога
        const possibleBaseUrls = [
          "/jobs/conversations/", // Основной URL согласно реальной конфигурации
          "/conversations/", // Еще один вариант
          "/api/jobs/conversations/", // Возможный альтернативный URL
          "/api/conversations/", // Еще один возможный альтернативный URL
        ];

        // Маршруты для создания или получения диалога
        const actionPaths = [
          "create_or_get/", // Специализированный endpoint
          "", // Основной endpoint для POST
        ];

        let response;
        let successUrl = null;

        // Перебираем все возможные комбинации базовых URL и маршрутов
        for (const baseUrl of possibleBaseUrls) {
          for (const actionPath of actionPaths) {
            // Формируем полный URL
            const fullUrl =
              baseUrl + (baseUrl.endsWith("/") ? "" : "/") + actionPath;

            try {
              console.log(
                `[ОТЛАДКА ЧАТА] Пробуем создать диалог с URL: ${fullUrl}`
              );

              response = await axios.post(fullUrl, data, {
                headers: headers,
                // Добавляем случайный параметр для предотвращения кэширования
                params: { _t: Date.now() },
              });

              // Если запрос успешен, запоминаем базовый URL и прерываем цикл
              successUrl = baseUrl;
              console.log(
                `[ОТЛАДКА ЧАТА] Успешный запрос на создание диалога с URL: ${fullUrl}`
              );

              // Сохраняем рабочий базовый URL в localStorage
              localStorage.setItem("conversations_api_url", baseUrl);

              // Прерываем внутренний цикл
              break;
            } catch (error) {
              console.log(
                `[ОТЛАДКА ЧАТА] Ошибка при использовании URL ${fullUrl}:`,
                error.message
              );
              // Детальная информация об ошибке для диагностики
              if (error.response) {
                console.log(
                  `[ОТЛАДКА ЧАТА] Статус ошибки ${fullUrl}: ${error.response.status}`
                );
                if (error.response.data) {
                  const errorData =
                    typeof error.response.data === "string"
                      ? error.response.data.slice(0, 100) + "..."
                      : error.response.data;
                  console.log(
                    `[ОТЛАДКА ЧАТА] Данные ошибки ${fullUrl}:`,
                    errorData
                  );
                }
              } else if (error.request) {
                console.log(
                  `[ОТЛАДКА ЧАТА] Нет ответа от сервера для ${fullUrl}`
                );
              }
              // Продолжаем со следующим URL
            }
          }

          // Если нашли рабочий URL, прерываем внешний цикл
          if (successUrl) {
            break;
          }
        }

        // Если ни один URL не работает, вызываем исключение
        if (!successUrl) {
          throw new Error(
            "[ОТЛАДКА ЧАТА] Не удалось найти рабочий URL для создания/получения диалога"
          );
        }

        console.log(`[ОТЛАДКА ЧАТА] Ответ API:`, response.data);
        const conversationId =
          response.data.id || response.data.conversation_id;

        if (conversationId) {
          // Сохраняем ключ WebSocket в localStorage
          localStorage.setItem(`ws_conversation_${conversationId}`, wsKey);
          console.log(
            `[ОТЛАДКА ЧАТА] WebSocket ключ сохранен для диалога ${conversationId}`
          );

          // Сохраняем ID чата для вакансии, если указан jobId
          if (jobId) {
            localStorage.setItem(`job_conversation_${jobId}`, conversationId);
            localStorage.setItem("lastCreatedChatId", conversationId);
            console.log(
              `[ОТЛАДКА ЧАТА] ID диалога сохранен для вакансии ${jobId}`
            );
          }
        }

        // Если был создан новый диалог и есть начальное сообщение, отправляем его
        if (response.data.created && initialMessage) {
          console.log(
            `[ОТЛАДКА ЧАТА] Отправка начального сообщения в новый диалог`
          );
          await this.sendMessage(conversationId, initialMessage);
        }

        // Обновляем список диалогов
        await this.fetchConversations();

        return {
          ...response.data,
          ws_key: wsKey,
        };
      } catch (error) {
        this.error = error.message || "Ошибка при создании диалога";
        console.error("[ОТЛАДКА ЧАТА] Ошибка при создании диалога:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Загружает сообщения для указанного диалога.
     * @param {Number} conversationId - ID диалога
     */
    async fetchMessages(conversationId) {
      try {
        this.loading = true;
        this.error = null;

        // Получаем токен аутентификации
        const authStore = useAuthStore();
        const token = authStore.token;
        const isAuth = authStore.isAuthenticated;

        console.log(
          `[DEBUG] fetchMessages: проверка авторизации. token=${
            token ? "есть" : "нет"
          }, isAuth=${isAuth}`
        );

        // Проверяем наличие токена и ID диалога, разрешаем запрос если хотя бы один признак авторизации существует
        if (!token && !isAuth) {
          console.warn("fetchMessages: Пользователь не авторизован");
          this.messages[conversationId] = [];
          return [];
        }

        if (!conversationId) {
          console.warn("fetchMessages: Не указан ID диалога");
          return [];
        }

        // Готовим заголовки для запроса
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Загружаем сообщения с бэкенда
        console.log(
          `[DEBUG] fetchMessages: запрос сообщений для диалога ${conversationId}`
        );
        // Список возможных URL для получения сообщений
        const possibleMsgUrls = [
          `/api/jobs/conversations/${conversationId}/messages/`,
          `/api/conversations/${conversationId}/messages/`,
          `/jobs/conversations/${conversationId}/messages/`,
          `/conversations/${conversationId}/messages/`,
        ];

        // Поиск рабочего URL для получения сообщений
        let response;
        let successMsgUrl = null;

        for (const url of possibleMsgUrls) {
          try {
            console.log(`[DEBUG] fetchMessages: пробуем URL: ${url}`);
            response = await axios.get(url, {
              headers: headers,
              params: { _t: Date.now() },
            });
            successMsgUrl = url;
            console.log(`[DEBUG] fetchMessages: успешный запрос к ${url}`);
            break;
          } catch (err) {
            console.log(
              `[DEBUG] fetchMessages: ошибка при использовании URL ${url}:`,
              err.message
            );
          }
        }

        // Если ни один URL не сработал
        if (!successMsgUrl) {
          throw new Error(
            "[DEBUG] fetchMessages: ни один URL не работает для получения сообщений"
          );
        }

        console.log(
          `[DEBUG] fetchMessages: получен ответ для диалога ${conversationId}`,
          response.data ? `${response.data.length} сообщений` : "нет данных"
        );

        // Сохраняем сообщения в хранилище
        this.messages[conversationId] = response.data;

        // Обновляем статус непрочитанных сообщений
        this.updateUnreadCount();

        return this.messages[conversationId];
      } catch (error) {
        // Добавляем более информативное сообщение об ошибке
        let errorMessage = "Ошибка при загрузке сообщений";

        if (error.response) {
          // Есть ответ от сервера, но с ошибкой
          if (error.response.status === 401) {
            errorMessage = "Необходима авторизация для доступа к сообщениям";
          } else if (error.response.status === 404) {
            errorMessage = "Диалог не найден";
          } else {
            errorMessage = `Ошибка сервера: ${error.response.status}`;
          }
        } else if (error.request) {
          // Запрос отправлен, но нет ответа
          errorMessage = "Не удалось получить ответ от сервера";
        }

        this.error = errorMessage;
        console.error("Ошибка при загрузке сообщений:", error);

        // Очищаем данные при ошибке или инициализируем пустым массивом
        if (conversationId) {
          this.messages[conversationId] = [];
        }
        return [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * Отправляет сообщение в диалог
     * @param {Object} messageData - Данные сообщения (conversation_id, content)
     * @returns {Promise} - Результат операции
     */
    async sendMessage(messageData) {
      console.log(
        "[DEBUG] chatStore.sendMessage: начало отправки сообщения",
        messageData
      );
      try {
        // Проверяем наличие данных
        if (
          !messageData ||
          !messageData.conversation_id ||
          !messageData.content
        ) {
          throw new Error("Неверные данные сообщения");
        }

        // Получаем токен аутентификации
        const authStore = useAuthStore();
        const token = authStore.token;
        const isAuth = authStore.isAuthenticated;

        console.log(
          `[DEBUG] sendMessage: проверка авторизации. token=${
            token ? "есть" : "нет"
          }, isAuth=${isAuth}`
        );

        if (!token && !isAuth) {
          throw new Error("Необходима авторизация");
        }

        // Готовим заголовки для запроса
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Список возможных URL для отправки сообщений
        const possibleMessageUrls = [
          "/api/jobs/messages/",
          "/api/messages/",
          "/jobs/messages/",
          "/messages/",
        ];

        // Поиск рабочего URL для отправки сообщений
        let response;
        let successMessageUrl = null;

        for (const url of possibleMessageUrls) {
          try {
            console.log(`[DEBUG] sendMessage: пробуем URL: ${url}`);
            response = await axios.post(
              url,
              {
                conversation_id: messageData.conversation_id,
                content: messageData.content,
                is_system_message: messageData.is_system_message || false,
              },
              {
                headers: headers,
              }
            );
            successMessageUrl = url;
            console.log(`[DEBUG] sendMessage: успешный запрос к ${url}`);
            break;
          } catch (err) {
            console.log(
              `[DEBUG] sendMessage: ошибка при использовании URL ${url}:`,
              err.message
            );
          }
        }

        // Если ни один URL не сработал, выбрасываем ошибку
        if (!successMessageUrl) {
          throw new Error(
            "[DEBUG] sendMessage: ни один URL не работает для отправки сообщений"
          );
        }

        console.log(
          "[DEBUG] chatStore.sendMessage: ответ от API",
          response.data
        );

        // Создаем объект сообщения на основе ответа сервера
        const sentMessage = response.data;

        // Добавляем сообщение в локальный кэш
        const conversationId = messageData.conversation_id;

        // Инициализируем массив сообщений для диалога, если он еще не существует
        if (!this.messages[conversationId]) {
          this.messages[conversationId] = [];
        }

        // Добавляем отправленное сообщение в массив сообщений
        this.messages[conversationId].push(sentMessage);

        // Обновляем информацию о последнем сообщении в диалоге
        this.updateConversationLastMessage(conversationId, sentMessage);

        // Возвращаем отправленное сообщение
        return sentMessage;
      } catch (error) {
        console.error(
          "[DEBUG] chatStore.sendMessage: ошибка при отправке сообщения",
          error
        );

        // Формируем информативное сообщение об ошибке
        let errorMessage = "Ошибка при отправке сообщения";

        if (error.response) {
          console.log(
            `[DEBUG] chatStore.sendMessage: ошибка ответа ${error.response.status}`,
            error.response.data
          );

          if (error.response.status === 401) {
            errorMessage = "Необходима авторизация";
          } else if (error.response.status === 404) {
            errorMessage = "Диалог не найден";
          } else {
            errorMessage = `Ошибка сервера: ${error.response.status}`;
          }
        } else if (error.request) {
          console.log("[DEBUG] chatStore.sendMessage: нет ответа от сервера");
          errorMessage = "Не удалось получить ответ от сервера";
        }

        this.error = errorMessage;

        // Повторно выбрасываем ошибку для обработки в компоненте
        throw error;
      }
    },

    /**
     * Отмечает сообщения в диалоге как прочитанные.
     * @param {Number} conversationId - ID диалога
     */
    async markMessagesAsRead(conversationId) {
      try {
        // Получаем токен аутентификации
        const token = useAuthStore().token;
        if (!token) {
          return false;
        }

        // Отправляем запрос на отметку сообщений как прочитанных
        // Список возможных URL для отметки сообщений как прочитанных
        const possibleMarkReadUrls = [
          "/jobs/messages/mark_read/",
          "/messages/mark_read/",
          "/api/jobs/messages/mark_read/",
          "/api/messages/mark_read/",
        ];

        // Поиск рабочего URL для отметки сообщений как прочитанных
        let response;
        let successMarkReadUrl = null;

        for (const url of possibleMarkReadUrls) {
          try {
            console.log(`[DEBUG] markMessagesAsRead: пробуем URL: ${url}`);
            response = await axios.post(
              url,
              {
                conversation_id: conversationId,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            successMarkReadUrl = url;
            console.log(`[DEBUG] markMessagesAsRead: успешный запрос к ${url}`);
            break;
          } catch (err) {
            console.log(
              `[DEBUG] markMessagesAsRead: ошибка при использовании URL ${url}:`,
              err.message
            );
          }
        }

        // Если ни один URL не сработал, возвращаем ошибку
        if (!successMarkReadUrl) {
          console.error(
            "[DEBUG] markMessagesAsRead: ни один URL не работает для отметки сообщений как прочитанных"
          );
          return false;
        }

        // Обновляем статус непрочитанных сообщений
        if (response.data.marked_read > 0) {
          this.updateUnreadCount();
        }

        return true;
      } catch (error) {
        console.error("Ошибка при отметке сообщений как прочитанных:", error);
        return false;
      }
    },

    /**
     * Обновляет счетчик непрочитанных сообщений.
     */
    async updateUnreadCount() {
      try {
        const token = useAuthStore().token;
        if (!token) {
          return;
        }

        const response = await axios.get(
          "/api/jobs/conversations/unread_count/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        this.unreadCount = response.data.unread_count;
        return this.unreadCount;
      } catch (error) {
        console.error(
          "Ошибка при обновлении счетчика непрочитанных сообщений:",
          error
        );
      }
    },

    /**
     * Получает новое сообщение от WebSocket.
     * @param {Object} messageData - Данные сообщения
     */
    receiveMessage(messageData) {
      const { message_id, sender_id, message, created_at } = messageData;
      const userId = useAuthStore().user?.id;

      // Если это сообщение от другого пользователя, увеличиваем счетчик непрочитанных сообщений
      if (sender_id !== userId) {
        this.unreadCount++;
      }

      // Ищем диалог, к которому относится сообщение
      let foundConversation = null;
      for (const conversation of this.conversations) {
        const otherUser = conversation.participants_info.find(
          (p) => p.id === sender_id
        );
        if (otherUser) {
          foundConversation = conversation;
          break;
        }
      }

      if (foundConversation) {
        // Обновляем последнее сообщение в диалоге
        foundConversation.last_message = {
          content: message,
          sender_id: sender_id,
          created_at: created_at,
          is_read: false,
        };

        // Если сообщение от другого пользователя, увеличиваем счетчик непрочитанных для этого диалога
        if (sender_id !== userId) {
          foundConversation.unread_count =
            (foundConversation.unread_count || 0) + 1;
        }

        // Если сообщения для этого диалога уже загружены, добавляем новое сообщение
        if (this.messages[foundConversation.id]) {
          this.messages[foundConversation.id].push({
            id: message_id,
            sender: sender_id,
            content: message,
            created_at: created_at,
            is_read: false,
          });
        }
      }

      // После получения сообщения, сортируем диалоги по времени последнего сообщения
      this.conversations.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.updated_at;
        const bTime = b.last_message?.created_at || b.updated_at;
        return new Date(bTime) - new Date(aTime);
      });
    },

    // Удаление диалога
    async deleteConversation(conversationId) {
      if (!conversationId) {
        console.error("deleteConversation: не указан ID диалога");
        return false;
      }

      const dialogId = String(conversationId);
      console.log(`[DEBUG] deleteConversation: удаление диалога ${dialogId}`);

      try {
        const authStore = useAuthStore();
        const token = authStore.token;

        if (!token) {
          console.error("deleteConversation: Пользователь не авторизован");
          this.error = "Необходима авторизация для удаления диалога.";
          return false;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Список возможных URL для удаления диалога
        const possibleDeleteUrls = [
          `/api/jobs/conversations/${dialogId}/`,
          `/api/conversations/${dialogId}/`,
          `/jobs/conversations/${dialogId}/`,
          `/conversations/${dialogId}/`,
        ];

        let response;
        let success = false;

        for (const url of possibleDeleteUrls) {
          try {
            console.log(
              `[DEBUG] deleteConversation: попытка использовать URL: ${url}`
            );
            response = await axios.delete(url, { headers });

            if (response.status >= 200 && response.status < 300) {
              console.log(
                `[DEBUG] deleteConversation: успешно удалено через URL ${url}`
              );
              success = true;
              break; // Прерываем цикл при успешном удалении
            }
          } catch (urlError) {
            console.log(
              `[DEBUG] deleteConversation: ошибка для URL ${url}:`,
              urlError.message
            );
            if (urlError.response && urlError.response.status === 404) {
              // Если 404, возможно, это не тот URL, пробуем следующий
              continue;
            }
            // Для других ошибок API или сетевых проблем, можем прервать или логировать и продолжить
            // В данном случае, продолжим пробовать другие URL
          }
        }

        if (!success) {
          console.error(
            "[DEBUG] deleteConversation: не удалось удалить диалог через API ни по одному из URL."
          );
          this.error = "Не удалось удалить диалог на сервере.";
          return false;
        }

        // Если удаление на сервере успешно, обновляем локальное состояние
        const index = this.conversations.findIndex(
          (c) => String(c.id) === dialogId
        );
        if (index !== -1) {
          const unreadInConv = this.conversations[index].unread_count || 0;
          this.unreadCount = Math.max(0, this.unreadCount - unreadInConv);
          this.conversations.splice(index, 1);
        }

        if (this.messages[dialogId]) {
          delete this.messages[dialogId];
        }

        if (this.currentConversationId === dialogId) {
          this.currentConversationId = null;
        }

        this.error = null; // Сбрасываем ошибку при успехе
        console.log(
          `[DEBUG] deleteConversation: диалог ${dialogId} успешно удален локально и на сервере.`
        );
        return true;
      } catch (error) {
        console.error(
          `[DEBUG] deleteConversation: общая ошибка при удалении диалога ${dialogId}:`,
          error
        );
        this.error = "Произошла ошибка при удалении диалога.";
        // Не выбрасываем ошибку дальше, чтобы компонент мог обработать false
        return false;
      }
    },

    /**
     * Удаляет сообщение по ID
     * @param {String|Number} conversationId - ID диалога
     * @param {String|Number} messageId - ID сообщения
     * @returns {Promise<Boolean>} - Успешно ли выполнено удаление
     */
    async deleteMessage(conversationId, messageId) {
      if (!conversationId || !messageId) {
        console.error("deleteMessage: не указан ID диалога или сообщения");
        return false;
      }

      const dialogId = String(conversationId);
      console.log(
        `[DEBUG] deleteMessage: удаление сообщения ${messageId} из диалога ${dialogId}`
      );

      try {
        // Получаем токен аутентификации
        const authStore = useAuthStore();
        const token = authStore.token;

        if (!token) {
          console.error("deleteMessage: Пользователь не авторизован");
          return false;
        }

        // Формируем заголовки запроса с токеном
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Список возможных URL для удаления сообщения
        const possibleDeleteUrls = [
          `/api/jobs/messages/${messageId}/`,
          `/api/messages/${messageId}/`,
          `/jobs/messages/${messageId}/`,
          `/messages/${messageId}/`,
        ];

        let response;
        let success = false;

        // Пробуем каждый URL
        for (const url of possibleDeleteUrls) {
          try {
            console.log(
              `[DEBUG] deleteMessage: попытка использовать URL: ${url}`
            );
            response = await axios.delete(url, { headers });

            if (response.status >= 200 && response.status < 300) {
              console.log(
                `[DEBUG] deleteMessage: успешно удалено через URL ${url}`
              );
              success = true;
              break;
            }
          } catch (urlError) {
            console.log(
              `[DEBUG] deleteMessage: ошибка для URL ${url}:`,
              urlError.message
            );
          }
        }

        if (!success) {
          console.error(
            "[DEBUG] deleteMessage: не удалось удалить сообщение через API"
          );
          return false;
        }

        // Удаляем сообщение из кэша
        if (this.messages[dialogId]) {
          const messageIndex = this.messages[dialogId].findIndex(
            (m) => String(m.id) === String(messageId)
          );

          if (messageIndex !== -1) {
            this.messages[dialogId].splice(messageIndex, 1);
            console.log(`[DEBUG] deleteMessage: сообщение удалено из кэша`);
          }
        }

        return true;
      } catch (error) {
        console.error(`[DEBUG] deleteMessage: ошибка при удалении:`, error);
        return false;
      }
    },

    // Новый метод: Добавляет новое сообщение, полученное через WebSocket, в хранилище
    addMessageToConversation(conversationId, message) {
      if (!conversationId || !message) {
        console.warn(
          "[DEBUG] chatStore.addMessageToConversation: conversationId или message отсутствуют."
        );
        return;
      }

      const dialogId = String(conversationId);
      console.log(
        `[DEBUG] chatStore.addMessageToConversation: Попытка добавить сообщение в диалог ${dialogId}:`,
        message
      );

      // Убеждаемся, что массив сообщений существует
      if (!this.messages[dialogId]) {
        console.log(
          `[DEBUG] chatStore.addMessageToConversation: Массив сообщений для диалога ${dialogId} не существует, создаю.`
        );
        this.messages[dialogId] = [];
      }

      // Проверяем, не существует ли уже сообщение, чтобы избежать дубликатов
      if (
        !this.messages[dialogId].some(
          (m) => String(m.id) === String(message.id)
        )
      ) {
        console.log(
          `[DEBUG] chatStore.addMessageToConversation: Сообщение с ID ${message.id} не найдено в кэше, добавляю.`
        );
        this.messages[dialogId].push(message); // Возвращаем push
        // Сортировка сообщений по дате создания (от старых к новым)
        this.messages[dialogId].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        console.log(
          `[DEBUG] chatStore.addMessageToConversation: Сообщение добавлено. Текущее кол-во сообщений в диалоге ${dialogId}: ${this.messages[dialogId].length}`
        );
      } else {
        console.log(
          `[DEBUG] chatStore.addMessageToConversation: Сообщение с ID ${message.id} уже существует в кэше, не добавляю.`
        );
      }
    },

    // Новый метод: Обновляет последнее сообщение диалога при получении через WebSocket
    updateConversationLastMessage(conversationId, message) {
      if (!conversationId || !message) return;

      const dialogId = String(conversationId);

      // Находим диалог в списке
      const conversationIndex = this.conversations.findIndex(
        (c) => String(c.id) === dialogId
      );

      if (conversationIndex === -1) {
        console.log(
          `Диалог ${dialogId} не найден в списке, невозможно обновить последнее сообщение`
        );
        return;
      }

      // Обновляем детали последнего сообщения
      this.conversations[conversationIndex].last_message =
        message.text || message.content;
      this.conversations[conversationIndex].last_message_time =
        message.created_at;

      // Если сообщение от другого пользователя, увеличиваем счетчик непрочитанных
      const authStore = useAuthStore();
      if (message.sender !== authStore.userId) {
        this.conversations[conversationIndex].unread_count =
          (this.conversations[conversationIndex].unread_count || 0) + 1;
        // Обновляем общий счетчик непрочитанных
        this.unreadCount = this.conversations.reduce(
          (count, conv) => count + (conv.unread_count || 0),
          0
        );
      }

      // Перемещаем диалог в начало списка (как самый последний)
      if (conversationIndex > 0) {
        const [conversation] = this.conversations.splice(conversationIndex, 1);
        this.conversations.unshift(conversation);
      }
    },

    // Новый метод: Отмечает сообщения как прочитанные, когда другой пользователь их прочитал
    markMessagesAsReadByRecipient(conversationId, readerId) {
      if (!conversationId) return;

      const dialogId = String(conversationId);

      // Проверяем, есть ли у нас сообщения для этого диалога
      if (!this.messages[dialogId] || this.messages[dialogId].length === 0) {
        return;
      }

      // Отмечаем сообщения, отправленные текущим пользователем, как прочитанные
      const authStore = useAuthStore();
      const currentUserId = authStore.userId;

      let updated = false;

      // Обновляем статус is_read для сообщений, отправленных текущим пользователем
      this.messages[dialogId].forEach((message) => {
        if (message.sender === currentUserId && !message.is_read) {
          message.is_read = true;
          updated = true;
        }
      });

      if (updated) {
        console.log(
          `Отмечены сообщения в диалоге ${dialogId} как прочитанные получателем ${readerId}`
        );
      }
    },

    /**
     * Подключается к WebSocket серверу для получения обновлений в реальном времени
     */
    connectWebSocket() {
      console.log(
        "[DEBUG] chatStore.connectWebSocket: инициализация WebSocket"
      );
      try {
        // Проверяем наличие WebSocket API
        if (typeof WebSocket === "undefined") {
          console.error("WebSocket API не поддерживается в этом браузере");
          return;
        }

        // Закрываем существующее соединение, если оно открыто
        this.disconnectWebSocket();

        // Получаем токен аутентификации и ID пользователя
        const authStore = useAuthStore();
        const token = authStore.token;
        const isAuth = authStore.isAuthenticated;
        const userId = authStore.user?.id;

        console.log(
          `[DEBUG] connectWebSocket: проверка авторизации. token=${
            token ? "есть" : "нет"
          }, isAuth=${isAuth}, userId=${userId || "не определен"}`
        );

        // Проверяем авторизацию пользователя любым доступным способом
        if ((!token && !isAuth) || !userId) {
          console.warn(
            "WebSocket: Пользователь не авторизован, подключение невозможно"
          );
          return;
        }

        // Формируем URL для подключения с токеном
        const wsProtocol =
          window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.host;
        const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/?token=${
          token || "no-token"
        }&user_id=${userId}`;

        console.log(
          `[DEBUG] chatStore.connectWebSocket: подключение к ${wsUrl}`
        );

        // Создаем новое WebSocket соединение
        this.wsConnection = new WebSocket(wsUrl);

        // Обработчик открытия соединения
        this.wsConnection.onopen = () => {
          console.log(
            "[DEBUG] chatStore.connectWebSocket: соединение установлено"
          );
          this.wsConnected = true;

          // Запускаем периодическую отправку сообщений для поддержания соединения
          this.startHeartbeat();
        };

        // Обработчик сообщения
        this.wsConnection.onmessage = async (event) => {
          console.log(
            "[DEBUG] chatStore.connectWebSocket: получено сообщение",
            event.data
          );
          try {
            const data = JSON.parse(event.data);

            // Обработка различных типов сообщений
            if (data.type === "chat_message") {
              this.handleWebSocketMessage(data);
            } else if (data.type === "new_conversation") {
              console.log(
                "[DEBUG] chatStore.connectWebSocket: новый диалог",
                data
              );
              // Обновляем список диалогов при создании нового чата
              await this.fetchConversations();
            } else if (data.type === "notification") {
              this.handleWebSocketNotification(data);
            }
          } catch (error) {
            console.error("Ошибка при обработке WebSocket сообщения:", error);
          }
        };

        // Обработчик ошибки
        this.wsConnection.onerror = (error) => {
          console.error(
            "[DEBUG] chatStore.connectWebSocket: ошибка соединения",
            error
          );
          this.wsConnected = false;
        };

        // Обработчик закрытия соединения
        this.wsConnection.onclose = (event) => {
          console.log(
            `[DEBUG] chatStore.connectWebSocket: соединение закрыто (код ${event.code})`
          );
          this.wsConnected = false;

          this.stopHeartbeat();

          // Если соединение закрыто не по нашей инициативе, пытаемся переподключиться
          if (event.code !== 1000) {
            console.log(
              "[DEBUG] chatStore.connectWebSocket: попытка переподключения через 5 секунд"
            );
            setTimeout(() => this.connectWebSocket(), 5000);
          }
        };
      } catch (error) {
        console.error("Ошибка при подключении к WebSocket:", error);
      }
    },

    /**
     * Отключается от WebSocket сервера
     */
    disconnectWebSocket() {
      console.log("[DEBUG] chatStore.disconnectWebSocket: закрытие соединения");
      try {
        // Останавливаем отправку heartbeat
        this.stopHeartbeat();

        // Закрываем WebSocket соединение, если оно открыто
        if (this.wsConnection) {
          if (
            this.wsConnection.readyState === WebSocket.OPEN ||
            this.wsConnection.readyState === WebSocket.CONNECTING
          ) {
            this.wsConnection.close(1000, "Закрыто пользователем");
          }
          this.wsConnection = null;
        }

        this.wsConnected = false;
      } catch (error) {
        console.error("Ошибка при отключении от WebSocket:", error);
      }
    },

    /**
     * Запускает периодическую отправку ping сообщений для поддержания соединения
     */
    startHeartbeat() {
      this.stopHeartbeat();

      this.heartbeatInterval = setInterval(() => {
        if (
          this.wsConnection &&
          this.wsConnection.readyState === WebSocket.OPEN
        ) {
          this.wsConnection.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000); // каждые 30 секунд
    },

    /**
     * Останавливает отправку ping сообщений
     */
    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    },

    /**
     * Обрабатывает входящее сообщение из WebSocket
     */
    handleWebSocketMessage(data) {
      console.log(
        "[DEBUG] chatStore.handleWebSocketMessage: обработка сообщения",
        data
      );

      // Проверяем наличие необходимых данных
      if (!data.conversation_id || !data.message) {
        console.warn(
          "[DEBUG] chatStore.handleWebSocketMessage: Получено неполное WebSocket сообщение, нет conversation_id или message"
        );
        return;
      }
      if (!data.message_id || !data.sender_id || !data.created_at) {
        console.warn(
          "[DEBUG] chatStore.handleWebSocketMessage: Получено неполное WebSocket сообщение, нет message_id, sender_id или created_at",
          data
        );
        // Можно не прерывать, если основные данные есть, но логировать важно
      }

      // Добавляем сообщение в соответствующий диалог
      const conversationId = String(data.conversation_id); // Убедимся, что это строка
      const message = {
        id: data.message_id, // ID самого сообщения
        conversation_id: conversationId, // ID диалога, к которому оно относится
        sender: data.sender_id, // ID отправителя (число)
        sender_id: data.sender_id, // Дублируем для совместимости, если где-то используется sender_id
        sender_name: data.sender_name, // Имя отправителя (строка)
        content: data.message, // Текст сообщения
        created_at: data.created_at, // Время создания
        is_read: false, // Новые сообщения по умолчанию не прочитаны
      };

      console.log(
        `[DEBUG] chatStore.handleWebSocketMessage: Сформированный объект сообщения для диалога ${conversationId}:`,
        message
      );

      // Добавляем сообщение в хранилище
      this.addMessageToConversation(conversationId, message);

      // Обновляем информацию о последнем сообщении в диалоге
      this.updateConversationLastMessage(conversationId, message);

      // Увеличиваем счетчик непрочитанных сообщений, если отправитель - не текущий пользователь
      const authStore = useAuthStore();
      if (String(data.sender_id) !== String(authStore.user?.id)) {
        console.log(
          "[DEBUG] chatStore.handleWebSocketMessage: Сообщение от другого пользователя, увеличиваем unreadCount."
        );
        this.unreadCount++;
      } else {
        console.log(
          "[DEBUG] chatStore.handleWebSocketMessage: Сообщение от текущего пользователя, не увеличиваем unreadCount."
        );
      }
    },

    /**
     * Обрабатывает уведомление из WebSocket
     */
    handleWebSocketNotification(data) {
      console.log(
        "[DEBUG] chatStore.handleWebSocketNotification: обработка уведомления",
        data
      );

      // Обновляем количество непрочитанных сообщений
      if (data.unread_count !== undefined) {
        this.unreadCount = data.unread_count;
      }

      // Если это уведомление о новом диалоге
      if (data.type === "new_conversation") {
        console.log("[DEBUG] Получено уведомление о новом диалоге:", data);

        // Проверяем наличие необходимых данных
        if (data.conversation_id && data.other_user) {
          // Проверяем, существует ли уже этот диалог в списке
          const existingConversation = this.conversations.find(
            (conv) => String(conv.id) === String(data.conversation_id)
          );

          if (!existingConversation) {
            console.log("[DEBUG] Добавление нового диалога в список:", data);

            // Создаем объект работодателя или соискателя
            const otherUser = {
              id: data.other_user.id,
              first_name: data.other_user.first_name || "",
              last_name: data.other_user.last_name || "",
              company_name: data.other_user.company_name || "",
              position: data.other_user.position || "",
            };

            // Формируем объект диалога, адаптированный к интерфейсу Chat.vue
            const newConversation = {
              id: data.conversation_id,
              other_user: otherUser,
              unread: 0, // Используем имя поля, которое ожидается в шаблоне
              job: data.job,
              last_message: data.initial_message || "",
              last_message_time: new Date().toISOString(),
            };

            // Добавляем новый диалог в начало списка для моментального отображения
            this.conversations.unshift(newConversation);
            console.log(
              "[DEBUG] Новый диалог добавлен локально:",
              newConversation
            );
          }
        }

        // Затем обновляем список с сервера для получения полных данных
        this.fetchConversations();
      }
    },

    // Get unread messages count
    async fetchUnreadCount() {
      try {
        const response = await apiRequest(
          "GET",
          "/api/jobs/conversations/unread_count/"
        );

        if (response && response.data) {
          this.unreadCount = response.data.unread_count;
          return this.unreadCount;
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }

      return 0;
    },

    async initiateDirectChat(recipientId, initialMessage = null) {
      console.log(
        `[CHAT_STORE] initiateDirectChat: recipientId=${recipientId}, initialMessage=${initialMessage}`
      );
      this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated || authStore.user?.role !== "employer") {
          this.error = "Только авторизованные работодатели могут начинать чат.";
          console.error("[CHAT_STORE] initiateDirectChat: " + this.error);
          return null;
        }

        const payload = { recipient_id: recipientId };
        if (initialMessage) {
          payload.message = initialMessage;
        }
        // Можно добавить опциональную передачу job_id, если работодатель хочет привязать чат к вакансии
        // payload.job_id = selectedJobId.value;

        // Используем прямой вызов axios вместо apiRequest для детального контроля
        const token = localStorage.getItem("token");
        const config = {
          headers: {
            "Content-Type": "application/json",
          },
        };

        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }

        console.log(
          `[CHAT_STORE] initiateDirectChat: отправка запроса с данными:`,
          JSON.stringify(payload)
        );

        const response = await axios.post(
          "/api/jobs/conversations/initiate_chat/",
          payload,
          config
        );

        console.log(
          "[CHAT_STORE] initiateDirectChat: получен ответ статус:",
          response.status,
          "данные:",
          JSON.stringify(response.data)
        );

        // Структурируем ответ в новый объект
        if (response && response.data && response.data.id) {
          const conversation = {
            id: response.data.id,
            conversation_id: response.data.conversation_id,
            // Только необходимые поля для навигации
          };

          console.log(
            "[CHAT_STORE] initiateDirectChat: создан объект диалога:",
            JSON.stringify(conversation)
          );

          // Обновляем список диалогов, чтобы новый чат отобразился
          await this.fetchConversations(true); // Force refresh

          return conversation;
        }

        console.error(
          "[CHAT_STORE] initiateDirectChat: в ответе нет ID диалога:",
          response?.data
        );
        this.error = "Сервер вернул некорректные данные диалога";
        return null;
      } catch (error) {
        console.error("[CHAT_STORE] initiateDirectChat: ошибка", error);
        this.error =
          error.response?.data?.error ||
          error.message ||
          "Ошибка при инициации чата";
        return null;
      } finally {
        this.loading = false;
      }
    },
  },
});
