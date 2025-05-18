import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";
import { useChatStore } from "./chat";

export const useApplicationsStore = defineStore("applications", {
  state: () => ({
    myApplications: [],
    jobApplications: {},
    loading: false,
    error: null,
    applications: [],
    activeApplicationsMap: {},
  }),

  getters: {
    getMyApplications: (state) => state.myApplications,
    getJobApplications: (state) => (jobId) =>
      state.jobApplications[jobId] || [],
    isLoading: (state) => state.loading,
  },

  actions: {
    async fetchApplications() {
      this.loading = true;
      try {
        const response = await axios.get("/api/applications/");
        this.applications = response.data.results || response.data;

        // Обновляем карту активных откликов
        this.updateActiveApplicationsMap();
        return this.applications;
      } catch (error) {
        console.error("Error fetching applications:", error);
        this.error = error.message || "Failed to fetch applications";
        return [];
      } finally {
        this.loading = false;
      }
    },

    // Обновляем карту активных откликов
    updateActiveApplicationsMap() {
      // Сбросим текущую карту
      this.activeApplicationsMap = {};

      // Заполним из данных API
      for (const app of this.applications) {
        if (app.job_id || app.job?.id) {
          const jobId = app.job_id || app.job?.id;
          this.activeApplicationsMap[jobId] = app.id;
        }
      }

      // Обновляем также из localStorage для обеспечения синхронизации
      this.syncWithLocalStorage();
    },

    // Синхронизируем данные с localStorage
    syncWithLocalStorage() {
      try {
        const localStorageKeys = Object.keys(localStorage);
        for (const key of localStorageKeys) {
          if (key.startsWith("job_application_")) {
            const jobId = key.replace("job_application_", "");
            const applicationId = localStorage.getItem(key);

            if (jobId && applicationId) {
              this.activeApplicationsMap[jobId] = applicationId;
            }
          }
        }

        // Сохраняем обновленную карту обратно в localStorage
        localStorage.setItem(
          "applicationsMap",
          JSON.stringify(this.activeApplicationsMap)
        );
      } catch (e) {
        console.error("Ошибка синхронизации с localStorage:", e);
      }
    },

    // Проверка, откликнулся ли пользователь на вакансию
    hasApplied(jobId) {
      if (!jobId) {
        return false;
      }

      // Сначала проверим наличие флага отмены отклика
      const wasCanceled =
        localStorage.getItem(`job_application_${jobId}_canceled`) === "true";
      if (wasCanceled) {
        console.log(
          `[Store] Найден флаг отмены для job_application_${jobId}, возвращаем false`
        );
        return false;
      }

      // Сначала проверим в карте активных откликов
      if (this.activeApplicationsMap[jobId]) {
        return true;
      }

      // Затем проверим в localStorage
      const applicationId = localStorage.getItem(`job_application_${jobId}`);
      return !!applicationId;
    },

    // Получение ID отклика для вакансии
    getApplicationId(jobId) {
      // Проверим в карте активных откликов
      if (this.activeApplicationsMap[jobId]) {
        return this.activeApplicationsMap[jobId];
      }

      // Проверим в localStorage
      return localStorage.getItem(`job_application_${jobId}`);
    },

    async fetchMyApplications() {
      if (this.loading) return;
      this.loading = true;
      this.error = null;

      try {
        console.log("fetchMyApplications: Запрос откликов пользователя");
        // Используем обновленный URL для запроса, добавленный в urls.py
        const response = await axios.get(
          "/api/jobs/applications/my-applications/",
          {
            timeout: 10000,
          }
        );

        // Успешный ответ от API
        console.log("fetchMyApplications: Получены отклики:", response.data);
        this.myApplications = response.data;
        return response.data;
      } catch (error) {
        console.error("Ошибка при загрузке откликов пользователя:", error);
        this.error = "Не удалось загрузить ваши отклики";

        // Если получили 404, значит API не найден, используем резервный метод
        if (error.response && error.response.status === 404) {
          try {
            // Попробуем использовать метод my, который точно существует
            const myResponse = await axios.get("/api/jobs/applications/my/", {
              timeout: 10000,
            });
            console.log(
              "fetchMyApplications: Получены отклики через /my/:",
              myResponse.data
            );
            this.myApplications = myResponse.data;
            return myResponse.data;
          } catch (backupError) {
            console.error(
              "Ошибка при использовании резервного метода:",
              backupError
            );
          }
        }

        return [];
      } finally {
        this.loading = false;
      }
    },

    async fetchJobApplications(jobId) {
      this.loading = true;
      this.error = null;
      try {
        console.log(`Загрузка откликов для вакансии ${jobId}`);
        // Загружаем отклики через единый endpoint, передавая job для фильтрации
        const response = await axios.get(`/api/jobs/${jobId}/applications/`, {
          timeout: 10000,
        });
        if (!response.data) {
          console.error("Пустые данные ответа от API откликов на вакансию");
          return [];
        }
        console.log(
          `Получено ${
            Array.isArray(response.data) ? response.data.length : "не массив"
          } откликов для вакансии ${jobId}`
        );
        this.jobApplications[jobId] = response.data;
        return this.jobApplications[jobId];
      } catch (error) {
        console.error(
          `Ошибка при загрузке откликов для вакансии ${jobId}:`,
          error
        );

        // Улучшенная обработка ошибок с конкретными сообщениями в зависимости от типа ошибки
        if (error.response) {
          if (error.response.status === 404) {
            console.error("Эндпоинт откликов не найден");
            this.error =
              "API-эндпоинт для откликов не найден. Возможно, функция не реализована в бэкенде.";
          } else {
            this.error = `Ошибка сервера: ${error.response.status}`;
          }
        } else if (error.request) {
          this.error = "Не удалось соединиться с сервером";
        } else {
          this.error =
            error.message || "Не удалось загрузить отклики на вакансию";
        }

        // Возвращаем пустой массив вместо выброса ошибки, чтобы предотвратить ошибки в UI
        this.jobApplications[jobId] = [];
        return [];
      } finally {
        this.loading = false;
      }
    },

    async applyForJob(applicationData) {
      this.loading = true;
      this.error = null;

      try {
        console.log("Отправка отклика на вакансию:", applicationData);

        // Проверяем входные данные
        const jobId = applicationData.job_id || applicationData.job;
        if (!jobId) {
          console.error("Не указан ID вакансии:", applicationData);
          throw new Error("Не указан ID вакансии");
        }

        // Проверяем, является ли пользователь работодателем
        const authStore = useAuthStore();
        if (
          authStore.user?.profile?.role === "employer" ||
          authStore.isEmployer
        ) {
          throw new Error("Работодатели не могут откликаться на вакансии");
        }

        // Определяем ID вакансии
        const finalJobId = typeof jobId === "object" ? jobId.id : jobId;

        // Проверяем, был ли отклик отменен
        const wasCanceled =
          localStorage.getItem(`job_application_${finalJobId}_canceled`) ===
          "true";

        // Подготавливаем payload: бэкенд принимает 'resume' и 'cover_letter'
        const payload = {
          resume: applicationData.resume_id || applicationData.resume || null,
          cover_letter: applicationData.cover_letter || "",
          force: wasCanceled || applicationData.force || false, // Добавляем force=true, если отклик был отменен
          create_chat: true, // Всегда создаем чат при отклике
        };

        // Удаляем флаг отмены отклика перед отправкой запроса
        if (wasCanceled) {
          console.log(
            `Обнаружен флаг отмены для job_application_${finalJobId}, устанавливаем force=true`
          );
          localStorage.removeItem(`job_application_${finalJobId}_canceled`);
        }

        console.log("applyForJob payload:", payload);
        const response = await axios.post(
          `/api/jobs/${finalJobId}/apply/`,
          payload
        );

        // Обрабатываем успешный ответ API
        console.log("Отклик успешно отправлен, ответ:", response.data);

        // Проверим формат ответа
        if (!response.data) {
          console.warn("API вернул пустой ответ");
          return {
            success: true,
            message: "Отклик отправлен, но сервер вернул пустой ответ",
          };
        }

        // Адаптируем формат ответа для совместимости с разными версиями API
        const result = {
          success: true,
          applicationId: response.data.id || null,
          conversation_id: response.data.conversation_id || null,
          message: "Отклик успешно отправлен",
        };

        // Обновляем локальное состояние
        if (!Array.isArray(this.myApplications)) {
          this.myApplications = [];
        }

        this.myApplications.push(response.data);

        // Сохраняем ID отклика в localStorage для обеспечения постоянного состояния
        if (response.data.id && jobId) {
          this.activeApplicationsMap[jobId] = response.data.id;
          localStorage.setItem(`job_application_${jobId}`, response.data.id);
          localStorage.setItem(
            "applicationsMap",
            JSON.stringify(this.activeApplicationsMap)
          );
        }

        // Если чат не был создан автоматически сервером, создаем его вручную
        if (!response.data.conversation_id) {
          try {
            console.log("Автоматическое создание чата после отклика");

            // Явно устанавливаем флаг, что работа со стартом чата началась
            console.log("=== НАЧАЛО СОЗДАНИЯ ЧАТА ===");

            // Получаем информацию о вакансии для получения ID работодателя
            let jobData = null;
            try {
              const jobResponse = await axios.get(`/api/jobs/${finalJobId}/`);
              jobData = jobResponse.data;
              console.log("Получены данные о вакансии:", jobData);
            } catch (jobError) {
              console.warn("Не удалось получить данные о вакансии:", jobError);
            }

            const employerId = jobData?.employer?.id || jobData?.user?.id;
            console.log("ID работодателя:", employerId);

            if (employerId) {
              // Используем chatStore для создания беседы напрямую
              const chatStore = useChatStore();

              // Сначала обновим токен, чтобы точно быть авторизованными
              const token = authStore.token;
              console.log(
                "Текущий токен авторизации:",
                token ? "присутствует" : "отсутствует"
              );

              const initialMessage =
                applicationData.message ||
                applicationData.cover_letter ||
                "Здравствуйте, я отправил отклик на вашу вакансию и хотел бы обсудить детали.";

              console.log(
                `Создаем чат с работодателем ID: ${employerId} для вакансии ID: ${finalJobId}`
              );
              const chatResponse = await chatStore.createOrGetConversation(
                employerId,
                finalJobId,
                initialMessage
              );

              if (
                chatResponse &&
                (chatResponse.id || chatResponse.conversation_id)
              ) {
                const chatId = chatResponse.id || chatResponse.conversation_id;
                console.log(`Чат успешно создан с ID: ${chatId}`);
                result.conversation_id = chatId;

                // Сохраняем ID диалога в localStorage
                localStorage.setItem(`job_conversation_${finalJobId}`, chatId);
                localStorage.setItem("lastCreatedChatId", chatId);

                // Перезагружаем список диалогов после создания нового
                await chatStore.fetchConversations();
              } else {
                console.warn("Чат создан, но ID не получен:", chatResponse);
              }
            } else {
              console.warn(
                "Не удалось получить ID работодателя для создания чата"
              );
              // Пробуем запасной вариант через startChatWithEmployer
              const chatResult = await this.startChatWithEmployer(finalJobId);
              if (chatResult && (chatResult.conversation_id || chatResult.id)) {
                result.conversation_id =
                  chatResult.conversation_id || chatResult.id;
                console.log(
                  "Чат успешно создан через запасной метод, ID:",
                  result.conversation_id
                );
              }
            }

            // Обновляем данные в хранилище чатов в любом случае
            const chatStore = useChatStore();
            await chatStore.fetchConversations();
            console.log("=== ЗАВЕРШЕНИЕ СОЗДАНИЯ ЧАТА ===");
          } catch (err) {
            console.error("Не удалось автоматически создать чат:", err);
          }
        } else {
          console.log(
            "Чат создан автоматически сервером, ID:",
            response.data.conversation_id
          );
          result.conversation_id = response.data.conversation_id;

          // Сохраняем ID диалога в localStorage
          if (
            typeof response.data.conversation_id === "number" ||
            typeof response.data.conversation_id === "string"
          ) {
            localStorage.setItem(
              `job_conversation_${finalJobId}`,
              response.data.conversation_id
            );

            // Обновляем данные в хранилище чатов
            const chatStore = useChatStore();
            await chatStore.fetchConversations();
          }
        }

        return result;
      } catch (error) {
        console.error("Ошибка при отправке отклика:", error);
        this.error = "Не удалось отправить отклик на вакансию";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Получаем отклики для конкретной вакансии
    async getApplicationsByJob(jobId) {
      if (!jobId) {
        console.error("getApplicationsByJob: Не указан ID вакансии");
        return [];
      }

      console.log(
        `getApplicationsByJob: Загрузка откликов для вакансии ${jobId}`
      );

      try {
        // Получаем отклики из API
        await this.fetchJobApplications(jobId);
        return this.jobApplications[jobId] || [];
      } catch (error) {
        console.error(
          `Ошибка в getApplicationsByJob для вакансии ${jobId}:`,
          error
        );
        return [];
      }
    },

    // Обновление статуса отклика
    async updateApplicationStatus(applicationId, status) {
      this.loading = true;
      this.error = null;

      try {
        // Отправляем обновление статуса в API
        const response = await axios.post(
          `/api/applications/${applicationId}/update-status/`,
          { status }
        );

        console.log(
          `Обновлен статус отклика ${applicationId} на "${status}"`,
          response.data
        );

        // Обновляем в массиве myApplications
        const appIndex = this.myApplications.findIndex(
          (app) => app.id == applicationId
        );
        if (appIndex >= 0) {
          this.myApplications[appIndex] = {
            ...this.myApplications[appIndex],
            status,
          };
        }

        // Обновляем в объекте jobApplications
        for (const jobId in this.jobApplications) {
          const apps = this.jobApplications[jobId];
          const idx = apps.findIndex((app) => app.id == applicationId);
          if (idx >= 0) {
            apps[idx] = { ...apps[idx], status };
            break;
          }
        }

        return response.data;
      } catch (error) {
        console.error("Ошибка при обновлении статуса отклика:", error);
        this.error = "Не удалось обновить статус отклика";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Отзыв отклика на вакансию
    async withdrawApplication(applicationId) {
      if (!applicationId) {
        console.error("Не указан ID отклика для отзыва");
        throw new Error("Не указан ID отклика");
      }

      this.loading = true;
      this.error = null;

      try {
        console.log(`Отзыв отклика с ID ${applicationId}`);

        // Сохраняем данные о вакансии, связанной с этим откликом, для локальной очистки
        let jobId = null;
        for (const [jId, appId] of Object.entries(this.activeApplicationsMap)) {
          if (String(appId) === String(applicationId)) {
            jobId = jId;
            console.log(
              `Найден ID вакансии ${jobId} для отклика ${applicationId}`
            );
            break;
          }
        }

        // Проверяем, является ли это временным ID (начинается с temp_)
        const isTempId = String(applicationId).startsWith("temp_");
        let success = false;

        // Если ID временный, пропускаем запросы к серверу
        if (isTempId) {
          console.log(
            `Обнаружен временный ID отклика (${applicationId}), только очищаем локальное состояние`
          );
          success = true; // Считаем операцию успешной, так как нет нужды обращаться к серверу
        } else {
          // Если ID не временный, пробуем отменить отклик на сервере
          // Приоритетно используем новый эндпоинт withdraw, затем пробуем другие
          const possibleEndpoints = [
            `/api/jobs/applications/${applicationId}/withdraw/`,
            `/api/applications/${applicationId}/withdraw/`,
            `/api/applications/${applicationId}/`,
            `/api/jobs/applications/${applicationId}/`,
            `/api/job-applications/${applicationId}/`,
            `/api/job-applications/${applicationId}/withdraw/`,
            `/api/jobs/${jobId}/applications/${applicationId}/withdraw/`,
            `/api/jobs/${jobId}/applications/${applicationId}/`,
          ];

          let lastError = null;

          // Пробуем каждый эндпоинт по очереди
          for (const endpoint of possibleEndpoints) {
            try {
              console.log(
                `Пробуем отозвать отклик через эндпоинт: ${endpoint}`
              );
              if (endpoint.includes("/withdraw/")) {
                // Для withdraw эндпоинтов используем POST
                await axios.post(endpoint, {}, { timeout: 15000 });
              } else {
                // Для обычных эндпоинтов используем DELETE
                await axios.delete(endpoint, { timeout: 15000 });
              }
              console.log(`Успешно отозван отклик через эндпоинт: ${endpoint}`);
              success = true;
              break; // Выходим из цикла, если один из запросов успешен
            } catch (err) {
              console.warn(`Неудачная попытка через ${endpoint}:`, err.message);
              lastError = err;
              // Продолжаем попытки с другими эндпоинтами
            }
          }
        }

        // Всегда выполняем локальную очистку, даже если API запросы неудачны
        console.log(
          `${
            success
              ? isTempId
                ? "Временный ID:"
                : "API успешно:"
              : "API неудачно, но"
          } обновляем локальное состояние для отклика ${applicationId}`
        );

        // Удаляем отклик из списка моих откликов
        this.myApplications = this.myApplications.filter(
          (app) => String(app.id) !== String(applicationId)
        );

        // Удаляем отклик из списков откликов для каждой вакансии
        Object.keys(this.jobApplications).forEach((jobId) => {
          this.jobApplications[jobId] = this.jobApplications[jobId].filter(
            (app) => String(app.id) !== String(applicationId)
          );
        });

        // Удаляем связь между вакансией и откликом в localStorage
        let foundJobId = null;
        for (const [jId, appId] of Object.entries(this.activeApplicationsMap)) {
          if (String(appId) === String(applicationId)) {
            foundJobId = jId;
            delete this.activeApplicationsMap[jId];
            localStorage.removeItem(`job_application_${jId}`);
            // Устанавливаем флаг отмены отклика
            localStorage.setItem(`job_application_${jId}_canceled`, "true");
            console.log(`Удалена запись для job_application_${jId}`);
          }
        }

        // Обновляем карту в localStorage
        localStorage.setItem(
          "applicationsMap",
          JSON.stringify(this.activeApplicationsMap)
        );

        // Если API запросы не удались, но мы всё равно очистили локальное состояние
        if (!success && !isTempId) {
          console.log(
            "Все попытки удалить отклик через API завершились неудачей, но локальное состояние обновлено"
          );

          // Устанавливаем более понятное сообщение об ошибке
          if (
            lastError &&
            lastError.response &&
            lastError.response.status === 404
          ) {
            this.error =
              "Отклик не найден на сервере, локальное состояние обновлено";
          } else {
            this.error =
              "Не удалось отменить отклик на сервере, но локально он удален";
          }
        }

        return true;
      } catch (error) {
        console.error(`Ошибка при отзыве отклика ${applicationId}:`, error);

        // Улучшенное сообщение об ошибке
        if (error.response) {
          if (error.response.status === 404) {
            this.error = "Отклик не найден или уже был отозван";
          } else if (error.response.status === 403) {
            this.error = "У вас нет прав для отзыва этого отклика";
          } else {
            this.error = `Ошибка сервера: ${error.response.status}`;
          }
        } else if (error.request) {
          this.error = "Не удалось соединиться с сервером";
        } else {
          this.error = error.message || "Не удалось отозвать отклик";
        }

        // Очищаем локальное состояние даже при ошибке API
        this._cleanupLocalApplicationState(applicationId);

        // Возвращаем true вместо выброса ошибки, чтобы UI мог продолжить работу
        return true;
      } finally {
        this.loading = false;
      }
    },

    // Вспомогательный метод для очистки локального состояния при ошибках API
    _cleanupLocalApplicationState(applicationId) {
      try {
        console.log(
          `Выполняем очистку локального состояния для отклика ${applicationId}`
        );

        // Ищем jobId для этого applicationId и удаляем запись из localStorage
        for (const [jId, appId] of Object.entries(this.activeApplicationsMap)) {
          if (String(appId) === String(applicationId)) {
            delete this.activeApplicationsMap[jId];
            localStorage.removeItem(`job_application_${jId}`);
            // Устанавливаем флаг отмены отклика
            localStorage.setItem(`job_application_${jId}_canceled`, "true");
            console.log(
              `При ошибке API: удалена запись для job_application_${jId}`
            );
          }
        }

        // Удаляем отклик из списка моих откликов (оптимистичный подход)
        this.myApplications = this.myApplications.filter(
          (app) => String(app.id) !== String(applicationId)
        );

        // Обновляем карту в localStorage
        localStorage.setItem(
          "applicationsMap",
          JSON.stringify(this.activeApplicationsMap)
        );

        return true;
      } catch (e) {
        console.error("Ошибка при очистке localStorage:", e);
        return false;
      }
    },

    async startChatWithEmployer(jobId) {
      try {
        console.log(
          `[ОТЛАДКА СОЗДАНИЯ ЧАТА] ApplicationStore: Начинаем создание чата для вакансии ${jobId}`
        );

        // Корректный формат WebSocket ключа - просто используем ID вакансии без временной метки
        // Это критично для соответствия шаблону маршрутизации Django Channels
        const wsKey = `job-${jobId}`;
        console.log(`[ОТЛАДКА СОЗДАНИЯ ЧАТА] WebSocket ключ: ${wsKey}`);

        // Находим заявку для этой вакансии
        const application = this.myApplications.find(
          (app) =>
            app.job?.id === Number(jobId) ||
            app.job === Number(jobId) ||
            String(app.job) === String(jobId)
        );

        // Подготавливаем начальное сообщение
        let message = "";
        if (application) {
          message =
            application.message ||
            application.cover_letter ||
            "Здравствуйте, я отправил отклик на вашу вакансию и хотел бы обсудить детали.";
          console.log(
            `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Найдена заявка, используем сообщение из неё`
          );
        } else {
          message =
            "Здравствуйте, я заинтересован в вашей вакансии и хотел бы обсудить детали.";
          console.log(
            `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Заявка не найдена, используем стандартное сообщение`
          );
        }

        // Получаем ID работодателя из данных вакансии
        let employerId = null;
        try {
          console.log(
            `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Получаем данные о вакансии ${jobId}`
          );

          // Получаем токен авторизации
          const authStore = useAuthStore();
          const token = authStore.token;
          const headers = token ? { Authorization: `Token ${token}` } : {};

          const jobResponse = await axios.get(`/api/jobs/${jobId}/`, {
            headers,
          });
          const jobData = jobResponse.data;
          console.log(
            `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Получены данные о вакансии:`,
            jobData
          );

          employerId = jobData?.employer?.id || jobData?.user?.id || null;
          console.log(
            `[ОТЛАДКА СОЗДАНИЯ ЧАТА] ID работодателя из данных вакансии: ${employerId}`
          );
        } catch (err) {
          console.warn(
            `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Не удалось получить детали вакансии ${jobId}`,
            err
          );
        }

        // Попробуем использовать информацию о работодателе из заявки, если запрос на вакансию не удался
        if (!employerId && application && application.employer) {
          employerId = application.employer.id;
          console.log(
            `[ОТЛАДКА СОЗДАНИЯ ЧАТА] ID работодателя из заявки: ${employerId}`
          );
        }

        if (!employerId) {
          console.warn(
            `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Не удалось определить ID работодателя`
          );
        }

        // Создаем чат через chatStore
        const chatStore = useChatStore();
        let conversationId = null;

        // ПЕРВЫЙ ПОДХОД: Использование chatStore
        if (employerId) {
          try {
            console.log(
              `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Создаем чат через chatStore, employerId=${employerId}, jobId=${jobId}`
            );

            const chatResponse = await chatStore.createOrGetConversation(
              employerId,
              jobId,
              message
            );

            console.log(
              `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ответ chatStore:`,
              chatResponse
            );

            if (
              chatResponse &&
              (chatResponse.id || chatResponse.conversation_id)
            ) {
              conversationId = chatResponse.id || chatResponse.conversation_id;
              console.log(
                `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Чат успешно создан через chatStore, ID: ${conversationId}`
              );

              // Сохраняем ID диалога и WebSocket ключ
              localStorage.setItem(`job_conversation_${jobId}`, conversationId);
              localStorage.setItem("lastCreatedChatId", conversationId);

              // Обновляем список диалогов
              await chatStore.fetchConversations();

              return {
                id: conversationId,
                conversation_id: conversationId,
                success: true,
                ws_key: wsKey,
              };
            } else {
              console.warn(
                `[ОТЛАДКА СОЗДАНИЯ ЧАТА] chatStore не вернул ID диалога`
              );
            }
          } catch (chatStoreError) {
            console.warn(
              `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ошибка при создании чата через chatStore:`,
              chatStoreError
            );
          }
        }

        // Если мы здесь, все подходы не сработали
        if (!conversationId) {
          const authStore = useAuthStore();
          const token = authStore.getToken;
          const headers = token ? { Authorization: `Token ${token}` } : {};

          // Попробуем эти эндпоинты по очереди, пока один не сработает
          const endpoints = [
            // Создание чата/диалога для конкретной вакансии
            {
              url: `/api/jobs/${jobId}/chat/`,
              payload: { message },
            },
            // Общий чат/диалог создание
            {
              url: `/api/chats/`,
              payload: { employer_id: employerId, job_id: jobId, message },
            },
            // Создание диалога через API
            {
              url: `/api/messages/conversations/`,
              payload: { job_id: jobId, recipient_id: employerId },
            },
          ];

          for (const endpoint of endpoints) {
            try {
              console.log(
                `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Пробуем endpoint: ${endpoint.url}`
              );
              const response = await axios.post(
                endpoint.url,
                endpoint.payload,
                { headers }
              );

              if (
                response.data &&
                (response.data.id || response.data.conversation_id)
              ) {
                conversationId =
                  response.data.id || response.data.conversation_id;
                console.log(
                  `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Диалог создан через ${endpoint.url}, ID: ${conversationId}`
                );

                // Сохраняем ID диалога
                localStorage.setItem(
                  `job_conversation_${jobId}`,
                  conversationId
                );
                localStorage.setItem("lastCreatedChatId", conversationId);

                // Отправляем первое сообщение, если мы создали диалог, но конечная точка не отправляет его автоматически
                if (endpoint.url === "/api/messages/conversations/") {
                  try {
                    await axios.post(
                      "/api/messages/",
                      {
                        conversation_id: conversationId,
                        content: message,
                      },
                      { headers }
                    );
                    console.log(
                      `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Отправлено первое сообщение в диалог ${conversationId}`
                    );
                  } catch (msgErr) {
                    console.error(
                      `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Ошибка отправки первого сообщения:`,
                      msgErr
                    );
                  }
                }

                // Обновляем список диалогов
                await chatStore.fetchConversations();

                return {
                  id: conversationId,
                  conversation_id: conversationId,
                  success: true,
                  ws_key: wsKey,
                };
              }
            } catch (err) {
              console.warn(
                `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Endpoint ${endpoint.url} не сработал:`,
                err.response?.status,
                err.response?.data
              );
            }
          }
        }

        // Если мы здесь, все подходы не сработали
        console.error(
          `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Не удалось создать диалог ни одним из способов`
        );
        throw new Error("Не удалось создать диалог с работодателем");
      } catch (error) {
        console.error(
          `[ОТЛАДКА СОЗДАНИЯ ЧАТА] Критическая ошибка при создании чата:`,
          error
        );
        throw error;
      }
    },

    // Добавляем метод для исправления существующих заявок
    fixApplicationStorage() {
      if (!import.meta.env.DEV) {
        return;
      }

      try {
        console.log("Проверка и исправление хранилища откликов...");
        const stored = localStorage.getItem("mockJobApplications");
        if (!stored) {
          console.log("В хранилище не найдены отклики.");
          return;
        }

        let applications = JSON.parse(stored);
        if (!Array.isArray(applications) || applications.length === 0) {
          console.log("Нет откликов для исправления.");
          return;
        }

        // Исправляем любые проблемы с заявками
        let modified = false;
        applications = applications.map((app) => {
          // Убедимся, что ID вакансии - число
          if (typeof app.job === "string") {
            app.job = parseInt(app.job, 10) || app.job;
            modified = true;
          }

          // Убедимся, что у нас есть ID пользователя
          if (!app.user_id) {
            app.user_id = Date.now();
            modified = true;
          }

          return app;
        });

        if (modified) {
          console.log(
            "Исправлены проблемы в хранилище откликов, сохранение изменений..."
          );
          localStorage.setItem(
            "mockJobApplications",
            JSON.stringify(applications)
          );
        } else {
          console.log("Проблем в хранилище откликов не обнаружено.");
        }

        // Вместо этого обновим список приложений
        this.fetchApplications();
      } catch (err) {
        console.error("Ошибка при исправлении хранилища откликов:", err);
      }
    },
  },
});
