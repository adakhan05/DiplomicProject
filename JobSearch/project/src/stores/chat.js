import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";
import { ref } from "vue";
import { apiRequest } from "@/utils/api-helper";

export const useChatStore = defineStore("chat", {
  state: () => {
    const isDev = ref(import.meta.env.DEV);
    return {
      conversations: JSON.parse(
        localStorage.getItem("chatConversations") || "[]"
      ),
      messages: JSON.parse(localStorage.getItem("chatMessages") || "{}"),
      loading: false,
      error: null,
      unreadCount: 0,
      isDev: isDev.value,
    };
  },

  getters: {
    getConversations: (state) => state.conversations,
    getMessages: (state) => (conversationId) =>
      state.messages[conversationId] || [],
    hasUnread: (state) => state.unreadCount > 0,
  },

  actions: {
    // Helper method for safe API calls
    async safeFetch(url, options = {}) {
      try {
        // Ensure method is always a valid string
        const method = options.method || "get";

        return await apiRequest({
          method: method,
          url: url,
          data: options.data,
          params: options.params,
          mockResponse: options.mockResponse,
        });
      } catch (error) {
        console.error(`Ошибка при получении ${url}:`, error);
        if (this.isDev) {
          console.log(
            `РЕЖИМ РАЗРАБОТКИ: Возвращаем запасные данные для ${url}`
          );
          return options.fallback || [];
        }
        throw error;
      }
    },

    persistState() {
      localStorage.setItem(
        "chatConversations",
        JSON.stringify(this.conversations)
      );
      localStorage.setItem("chatMessages", JSON.stringify(this.messages));
      console.log("Данные чата сохранены в localStorage");
    },

    addMockConversation(conversation, messagesList) {
      const existingIndex = this.conversations.findIndex(
        (c) => c.id === conversation.id
      );

      if (existingIndex >= 0) {
        this.conversations[existingIndex] = {
          ...this.conversations[existingIndex],
          ...conversation,
        };
      } else {
        this.conversations = [conversation, ...this.conversations];
      }

      if (messagesList && messagesList.length > 0) {
        this.messages[conversation.id] = messagesList;
      }

      this.unreadCount = this.conversations.reduce(
        (count, conv) => count + (conv.unread || 0),
        0
      );

      this.persistState();

      console.log("Тестовый диалог добавлен в хранилище:", conversation.id);
      return conversation;
    },

    async fetchConversations(forceRefresh = false) {
      this.loading = true;
      this.error = null;
      try {
        console.log("Загрузка диалогов из API");

        // Пытаемся получить диалоги из API
        let apiConversations = [];
        let apiSuccess = false;

        // Создаем моковый ответ для режима разработки или при ошибках
        const mockConversations = JSON.parse(
          localStorage.getItem("chatConversations") || "[]"
        );

        if (forceRefresh || this.conversations.length === 0) {
          try {
            // Используем safeFetch с явным указанием метода и моковыми данными
            apiConversations = await this.safeFetch(
              "/api/jobs/messages/conversations/",
              {
                method: "get",
                fallback: mockConversations,
                mockResponse: mockConversations,
              }
            );
            apiSuccess =
              Array.isArray(apiConversations) && apiConversations.length > 0;
            console.log("Диалоги успешно загружены через основной API");
          } catch (error) {
            console.log("Первый эндпоинт не сработал, пробуем альтернативный");
            try {
              // Используем safeFetch с явным указанием метода и моковыми данными
              apiConversations = await this.safeFetch(
                "/api/chat/conversations/",
                {
                  method: "get",
                  fallback: mockConversations,
                  mockResponse: mockConversations,
                }
              );
              apiSuccess =
                Array.isArray(apiConversations) && apiConversations.length > 0;
              console.log("Диалоги успешно загружены через альтернативный API");
            } catch (secondError) {
              if (this.isDev) {
                console.log(
                  "РЕЖИМ РАЗРАБОТКИ: Используем существующие диалоги"
                );
                apiSuccess = false;
                // Используем диалоги из localStorage в режиме разработки
                if (mockConversations.length > 0) {
                  apiConversations = mockConversations;
                  apiSuccess = true;
                }
              } else {
                throw secondError;
              }
            }
          }
        } else {
          console.log("Используем кэшированные диалоги");
          apiSuccess = true;
          apiConversations = this.conversations;
        }

        // Если API вернул диалоги, обновляем хранилище
        if (apiSuccess && apiConversations.length > 0) {
          this.conversations = apiConversations;
          console.log(`Загружено ${apiConversations.length} диалогов из API`);
        }

        // Проверяем наличие созданного диалога в localStorage
        const lastChatId = localStorage.getItem("lastCreatedChatId");
        if (lastChatId) {
          console.log(`Найден ID последнего созданного диалога: ${lastChatId}`);

          // Проверяем, есть ли этот диалог уже в списке
          const existingChat = this.conversations.find(
            (c) => String(c.id) === String(lastChatId)
          );
          if (!existingChat) {
            console.log(
              `Диалог ${lastChatId} не найден в списке, ищем в localStorage`
            );

            // Ищем сохраненные диалоги в localStorage
            const storedConversations = JSON.parse(
              localStorage.getItem("chatConversations") || "[]"
            );
            const storedChat = storedConversations.find(
              (c) => String(c.id) === String(lastChatId)
            );

            if (storedChat) {
              console.log(
                `Диалог ${lastChatId} найден в localStorage, добавляем в список`
              );
              // Добавляем в начало списка
              this.conversations = [storedChat, ...this.conversations];
            }
          } else {
            console.log(`Диалог ${lastChatId} уже существует в списке`);
          }
        }

        // Сохраняем обновленный список диалогов
        localStorage.setItem(
          "chatConversations",
          JSON.stringify(this.conversations)
        );

        // Обновляем счетчик непрочитанных
        this.unreadCount = this.conversations.reduce(
          (count, conv) => count + (conv.unread || 0),
          0
        );

        console.log(
          `Итоговое количество диалогов: ${this.conversations.length}`
        );
        return this.conversations;
      } catch (error) {
        this.error =
          error.response?.data?.detail ||
          "Ошибка при получении списка диалогов";
        console.error("Ошибка при загрузке диалогов:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchMessages(conversationId, forceRefresh = false) {
      this.loading = true;
      this.error = null;
      try {
        console.log(`Загрузка сообщений для диалога ${conversationId}`);

        if (
          !forceRefresh &&
          this.messages[conversationId] &&
          this.messages[conversationId].length > 0
        ) {
          console.log(
            "Используем кэшированные сообщения для диалога:",
            conversationId
          );
          return this.messages[conversationId];
        }

        // Создаем моковый ответ или используем кэшированные сообщения
        const cachedMessages = this.messages[conversationId] || [];
        const mockMessages =
          JSON.parse(localStorage.getItem("chatMessages") || "{}")[
            conversationId
          ] || [];

        // Используем или кэшированные, или моковые сообщения, в зависимости от наличия
        const fallbackMessages =
          cachedMessages.length > 0 ? cachedMessages : mockMessages;

        let messagesData = [];

        try {
          messagesData = await this.safeFetch(
            `/api/jobs/messages/${conversationId}/messages/`,
            {
              method: "get",
              fallback: fallbackMessages,
              mockResponse: fallbackMessages,
            }
          );
        } catch (error) {
          console.log("Первый эндпоинт не сработал, пробуем альтернативный");
          try {
            messagesData = await this.safeFetch(
              `/api/chat/conversations/${conversationId}/messages/`,
              {
                method: "get",
                fallback: fallbackMessages,
                mockResponse: fallbackMessages,
              }
            );
          } catch (secondError) {
            if (this.isDev) {
              console.log(
                "РЕЖИМ РАЗРАБОТКИ: Используем пустой массив сообщений для нового диалога"
              );

              // В режиме разработки проверяем наличие сообщений в localStorage
              if (fallbackMessages.length > 0) {
                messagesData = fallbackMessages;
                console.log(
                  `Найдено ${fallbackMessages.length} сообщений в localStorage для диалога ${conversationId}`
                );
              } else {
                // Создаем пустой массив сообщений, если их нет
                if (!this.messages[conversationId]) {
                  this.messages[conversationId] = [];
                }
                messagesData = this.messages[conversationId];
              }

              this.persistState();
              return messagesData;
            } else {
              throw secondError;
            }
          }
        }

        // Убедимся, что messagesData всегда массив
        if (!Array.isArray(messagesData)) {
          console.warn(
            `Получены невалидные данные сообщений для ${conversationId}, использую пустой массив`
          );
          messagesData = [];
        }

        // Сохраняем сообщения в хранилище
        this.messages[conversationId] = messagesData;
        this.persistState();

        return messagesData;
      } catch (error) {
        this.error =
          error.response?.data?.detail || "Ошибка при получении сообщений";
        console.error("Ошибка при загрузке сообщений:", error);

        // Return empty array in case of error to prevent further errors
        if (this.isDev) {
          // Используем сообщения из localStorage в случае ошибки
          const storedMessages =
            JSON.parse(localStorage.getItem("chatMessages") || "{}")[
              conversationId
            ] || [];

          if (storedMessages.length > 0) {
            console.log(
              `В режиме разработки: Использую ${storedMessages.length} сообщений из localStorage`
            );
            this.messages[conversationId] = storedMessages;
          } else {
            this.messages[conversationId] = this.messages[conversationId] || [];
          }

          return this.messages[conversationId];
        }

        throw error;
      } finally {
        this.loading = false;
      }
    },

    async sendMessage(messageData) {
      this.loading = true;
      this.error = null;

      try {
        if (this.isDev) {
          console.log("РЕЖИМ РАЗРАБОТКИ: Создаем реалистичное сообщение");
          const authStore = useAuthStore();

          const newMessageId = Math.floor(Math.random() * 10000) + 2000;
          const now = new Date().toISOString();
          const isEmployer = authStore.isEmployer;

          const employerId = 1;
          const jobseekerId = 2;

          // Если пользователь не работодатель, попробуем добавить информацию о резюме в сообщения
          let messageText = messageData.text;
          if (!isEmployer && !messageText.includes("Моё резюме:")) {
            try {
              const resumes = JSON.parse(
                localStorage.getItem("resumes") || "[]"
              );
              if (
                resumes &&
                resumes.length > 0 &&
                messageText.toLowerCase().includes("резюме")
              ) {
                const resume = resumes[0];
                messageText += `\n\nМоё резюме:\nОпыт: ${
                  resume.experience || "5+ лет"
                }\nНавыки: ${
                  resume.skills?.join(", ") || "JavaScript, Vue.js, Node.js"
                }`;
              }
            } catch (err) {
              console.error("Ошибка при получении информации о резюме:", err);
            }
          }

          const mockResponse = {
            id: newMessageId,
            conversation_id: messageData.conversation_id,
            text: messageText,
            sender: isEmployer ? employerId : jobseekerId,
            sender_id:
              authStore.user?.id || (isEmployer ? employerId : jobseekerId),
            created_at: now,
            is_read: false,
          };

          console.log(
            "РЕЖИМ РАЗРАБОТКИ: Создано тестовое сообщение:",
            mockResponse
          );

          if (this.messages[messageData.conversation_id]) {
            this.messages[messageData.conversation_id].push(mockResponse);
          } else {
            this.messages[messageData.conversation_id] = [mockResponse];
          }

          const conversationIndex = this.conversations.findIndex(
            (c) => c.id === messageData.conversation_id
          );

          if (conversationIndex >= 0) {
            this.conversations[conversationIndex].last_message =
              messageData.text;
            this.conversations[conversationIndex].last_message_time = now;
          }

          this.persistState();

          return mockResponse;
        }

        let response;
        try {
          response = await this.safeFetch("/api/jobs/messages/send/", {
            method: "post",
            data: {
              conversation_id: messageData.conversationId,
              text: messageData.text,
            },
            fallback: {
              id: Math.floor(Math.random() * 10000) + 2000,
              created_at: new Date().toISOString(),
              sender: { id: 1 },
            },
          });
        } catch (error) {
          console.log("Первый эндпоинт не сработал, пробуем альтернативный");
          response = await this.safeFetch(
            `/api/chat/conversations/${messageData.conversationId}/messages/`,
            {
              method: "post",
              data: {
                text: messageData.text,
              },
              fallback: {
                id: Math.floor(Math.random() * 10000) + 2000,
                created_at: new Date().toISOString(),
                sender: { id: 1 },
              },
            }
          );
        }

        const message = response.data;

        if (this.messages[messageData.conversation_id]) {
          this.messages[messageData.conversation_id].push(message);
        } else {
          this.messages[messageData.conversation_id] = [message];
        }

        this.persistState();

        return message;
      } catch (error) {
        this.error =
          error.response?.data?.detail || "Ошибка при отправке сообщения";
        console.error("Ошибка при отправке сообщения:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async markAsRead(conversationId) {
      try {
        if (!conversationId) return;

        console.log(`Отмечаем диалог ${conversationId} как прочитанный`);

        try {
          await this.safeFetch(
            `/api/jobs/messages/${conversationId}/mark_read/`,
            {
              method: "post",
              fallback: { success: true },
            }
          );
          console.log(
            `Диалог ${conversationId} отмечен как прочитанный через основной API`
          );
        } catch (error) {
          console.log(
            "Первый эндпоинт mark_read не сработал, пробуем альтернативный"
          );

          try {
            await this.safeFetch(
              `/api/chat/conversations/${conversationId}/mark_read/`,
              {
                method: "post",
                fallback: { success: true },
              }
            );
            console.log(
              `Диалог ${conversationId} отмечен как прочитанный через альтернативный API`
            );
          } catch (secondError) {
            if (!this.isDev) {
              throw secondError;
            }
          }
        }

        // Обновляем локальное состояние
        const index = this.conversations.findIndex(
          (c) => String(c.id) === String(conversationId)
        );
        if (index !== -1) {
          this.conversations[index].unread = 0;

          // Обновляем счетчик непрочитанных
          this.unreadCount = this.conversations.reduce(
            (count, conv) => count + (conv.unread || 0),
            0
          );

          // Сохраняем изменения
          this.persistState();
        }

        return true;
      } catch (error) {
        console.error("Ошибка при отметке диалога как прочитанного:", error);
        return false;
      }
    },

    async fetchUnreadCount() {
      try {
        if (this.isDev) {
          return this.unreadCount || 0;
        }

        const response = await this.safeFetch(
          "/api/jobs/messages/unread_count/",
          {
            fallback: { count: 0 },
          }
        );

        this.unreadCount = response.count || 0;
        return this.unreadCount;
      } catch (error) {
        console.error("Ошибка при получении непрочитанных сообщений:", error);
        return 0;
      }
    },

    async startChatWithEmployer(jobId, employerId) {
      try {
        console.log(
          `СОЗДАНИЕ ЧАТА: Начинаем создание чата для вакансии #${jobId}`
        );

        // Convert IDs to strings for consistent comparison
        jobId = String(jobId);
        employerId = String(employerId);

        // First check if conversation already exists
        console.log("СОЗДАНИЕ ЧАТА: Проверяем существующие диалоги");
        const existingConversation = this.conversations.find(
          (c) => String(c.job_id) === jobId
        );

        if (existingConversation) {
          console.log(
            `СОЗДАНИЕ ЧАТА: Найден существующий диалог ${existingConversation.id}`
          );
          // Save ID to localStorage for reliability
          localStorage.setItem("lastCreatedChatId", existingConversation.id);
          return existingConversation;
        }

        // Guaranteed dialog creation in development mode
        if (this.isDev) {
          // Generate unique ID
          const uniqueId = `job-${jobId}-${Date.now()}`;
          console.log(`СОЗДАНИЕ ЧАТА: Генерируем ID диалога: ${uniqueId}`);

          // Get job data for better display
          let jobTitle = "Вакансия";
          try {
            const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
            const jobData = storedJobs.find((j) => String(j.id) === jobId);
            if (jobData && jobData.title) jobTitle = jobData.title;
          } catch (e) {
            console.error("Ошибка при получении данных вакансии:", e);
          }

          // Create new conversation
          const newConversation = {
            id: uniqueId,
            job_id: jobId,
            job: {
              id: jobId,
              title: jobTitle,
            },
            unread: 0,
            last_message: "Здравствуйте, я заинтересован в вашей вакансии.",
            last_message_text:
              "Здравствуйте, я заинтересован в вашей вакансии.",
            last_message_time: new Date().toISOString(),
            last_message_date: new Date().toISOString(),
            employer_name: "Работодатель",
            jobseeker_name: "Соискатель",
          };

          // Initial messages
          const messages = [
            {
              id: Date.now(),
              conversation_id: uniqueId,
              sender: 1, // Employer ID
              sender_name: "Работодатель",
              text: "Здравствуйте! Спасибо за интерес к нашей вакансии.",
              created_at: new Date().toISOString(),
              is_read: true,
            },
            {
              id: Date.now() + 1,
              conversation_id: uniqueId,
              sender: 2, // Jobseeker ID
              sender_name: "Вы",
              text: "Здравствуйте, я заинтересован в вашей вакансии.",
              created_at: new Date(Date.now() + 1000).toISOString(),
              is_read: true,
            },
          ];

          // IMPORTANT: Insert dialog at beginning of array
          this.conversations = [newConversation, ...this.conversations];
          this.messages[uniqueId] = messages;

          console.log(`СОЗДАНИЕ ЧАТА: Диалог создан с ID ${uniqueId}`);

          // Ensure changes are saved to localStorage
          localStorage.setItem(
            "chatConversations",
            JSON.stringify(this.conversations)
          );
          localStorage.setItem("chatMessages", JSON.stringify(this.messages));
          localStorage.setItem("lastCreatedChatId", uniqueId);

          // Double-check conversation was saved
          const checkConversations = JSON.parse(
            localStorage.getItem("chatConversations") || "[]"
          );
          if (!checkConversations.some((c) => c.id === uniqueId)) {
            console.error(`СОЗДАНИЕ ЧАТА: Диалог ${uniqueId} не был сохранен!`);
            // Force save again
            localStorage.setItem(
              "chatConversations",
              JSON.stringify([newConversation, ...checkConversations])
            );
          }

          return newConversation;
        }

        // Production mode - try API
        let apiResponse;
        try {
          console.log("СОЗДАНИЕ ЧАТА: Пробуем создать через API");

          apiResponse = await this.safeFetch("/api/jobs/messages/start_chat/", {
            method: "post",
            data: {
              job_id: jobId,
              employer_id: employerId,
              initial_message:
                "Здравствуйте, я заинтересован в вашей вакансии.",
            },
            fallback: {
              id: `fallback-${Date.now()}`,
              conversation_id: `fallback-${Date.now()}`,
            },
          });

          console.log("СОЗДАНИЕ ЧАТА: Ответ API:", apiResponse);

          // Immediately update conversations list
          await this.fetchConversations(true);

          // Check if conversation appeared in list
          const conversationId =
            apiResponse?.id || apiResponse?.conversation_id;
          if (conversationId) {
            const existingConversation = this.conversations.find(
              (c) => String(c.id) === String(conversationId)
            );
            if (existingConversation) {
              console.log(
                `СОЗДАНИЕ ЧАТА: Диалог ${conversationId} найден в списке`
              );
              localStorage.setItem("lastCreatedChatId", conversationId);
              return existingConversation;
            }
          }
        } catch (error) {
          console.error("СОЗДАНИЕ ЧАТА: Ошибка API:", error);
        }

        // Create fallback conversation if API failed or conversation wasn't found
        return this.createFallbackConversation(jobId, employerId);
      } catch (error) {
        console.error("СОЗДАНИЕ ЧАТА: Критическая ошибка:", error);
        return this.createFallbackConversation(jobId, employerId);
      }
    },

    // Вспомогательный метод для создания резервного диалога
    createFallbackConversation(jobId, employerId) {
      console.log("СОЗДАНИЕ ЧАТА: Создаем резервный диалог");

      // Генерируем уникальный ID
      const fallbackId = `job-${jobId}-fallback-${Date.now()}`;

      // Создаем диалог
      const fallbackConversation = {
        id: fallbackId,
        job_id: jobId,
        job: { id: jobId, title: "Вакансия" },
        unread: 0,
        last_message: "Здравствуйте, я заинтересован в вашей вакансии.",
        last_message_text: "Здравствуйте, я заинтересован в вашей вакансии.",
        last_message_time: new Date().toISOString(),
        last_message_date: new Date().toISOString(),
        employer_name: "Работодатель",
        jobseeker_name: "Соискатель",
      };

      // Добавляем диалог в начало списка
      this.conversations = [fallbackConversation, ...this.conversations];

      // Добавляем сообщения
      this.messages[fallbackId] = [
        {
          id: Date.now(),
          conversation_id: fallbackId,
          sender: 1,
          sender_name: "Работодатель",
          text: "Здравствуйте! Спасибо за интерес к нашей вакансии.",
          created_at: new Date().toISOString(),
          is_read: true,
        },
      ];

      // Сохраняем изменения
      localStorage.setItem(
        "chatConversations",
        JSON.stringify(this.conversations)
      );
      localStorage.setItem("chatMessages", JSON.stringify(this.messages));
      localStorage.setItem("lastCreatedChatId", fallbackId);

      console.log(`СОЗДАНИЕ ЧАТА: Резервный диалог ${fallbackId} создан`);
      return fallbackConversation;
    },

    async deleteMessage(conversationId, messageId) {
      try {
        if (!conversationId || !messageId) {
          return false;
        }

        console.log(
          `Удаление сообщения ${messageId} из диалога ${conversationId}`
        );

        if (this.isDev) {
          console.log("РЕЖИМ РАЗРАБОТКИ: Локальное удаление сообщения");

          // Находим сообщение в localStorage
          if (this.messages[conversationId]) {
            this.messages[conversationId] = this.messages[
              conversationId
            ].filter((msg) => msg.id !== messageId);

            // Сохраняем изменения
            this.persistState();
            return true;
          }
        }

        // В обычном режиме удаляем через API
        try {
          await this.safeFetch(`/api/jobs/messages/${messageId}/`, {
            method: "delete",
            fallback: { success: true },
          });
          console.log("Сообщение успешно удалено через основной API");
        } catch (error) {
          console.log("Первый эндпоинт не сработал, пробуем альтернативный");

          await this.safeFetch(`/api/chat/messages/${messageId}/`, {
            method: "delete",
            fallback: { success: true },
          });
          console.log("Сообщение успешно удалено через альтернативный API");
        }

        // Обновляем локальное хранилище
        if (this.messages[conversationId]) {
          this.messages[conversationId] = this.messages[conversationId].filter(
            (msg) => msg.id !== messageId
          );
          this.persistState();
        }

        return true;
      } catch (error) {
        console.error("Ошибка при удалении сообщения:", error);
        return false;
      }
    },

    async deleteConversation(conversationId) {
      try {
        if (!conversationId) {
          return false;
        }

        console.log(`Удаление диалога ${conversationId}`);

        if (this.isDev) {
          console.log("РЕЖИМ РАЗРАБОТКИ: Локальное удаление диалога");

          // Удаляем диалог из списка
          this.conversations = this.conversations.filter(
            (c) => c.id !== conversationId
          );

          // Удаляем сообщения диалога
          delete this.messages[conversationId];

          // Сохраняем изменения
          this.persistState();
          return true;
        }

        // В обычном режиме удаляем через API
        try {
          await this.safeFetch(
            `/api/jobs/messages/conversations/${conversationId}/`,
            {
              method: "delete",
              fallback: { success: true },
            }
          );
          console.log("Диалог успешно удален через основной API");
        } catch (error) {
          console.log("Первый эндпоинт не сработал, пробуем альтернативный");

          await this.safeFetch(`/api/chat/conversations/${conversationId}/`, {
            method: "delete",
            fallback: { success: true },
          });
          console.log("Диалог успешно удален через альтернативный API");
        }

        // Обновляем локальное хранилище
        this.conversations = this.conversations.filter(
          (c) => c.id !== conversationId
        );
        delete this.messages[conversationId];
        this.persistState();

        return true;
      } catch (error) {
        console.error("Ошибка при удалении диалога:", error);
        return false;
      }
    },
  },
});
