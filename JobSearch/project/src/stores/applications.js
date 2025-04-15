import { defineStore } from "pinia";
import axios from "axios";
import { useChatStore } from "@/stores/chat";

export const useApplicationsStore = defineStore("applications", {
  state: () => ({
    myApplications: [],
    jobApplications: {},
    loading: false,
    error: null,
  }),

  getters: {
    getMyApplications: (state) => state.myApplications,
    getJobApplications: (state) => (jobId) =>
      state.jobApplications[jobId] || [],
    isLoading: (state) => state.loading,
  },

  actions: {
    async fetchMyApplications() {
      this.loading = true;
      this.error = null;
      try {
        console.log("Загрузка моих откликов");
        const response = await axios.get("/api/jobs/applications/my/", {
          timeout: 10000,
        });

        if (!response.data) {
          console.error("Пустые данные ответа от API откликов");
          return [];
        }

        console.log(
          `Получено ${
            Array.isArray(response.data) ? response.data.length : "не массив"
          } откликов`
        );
        this.myApplications = response.data;
        return this.myApplications;
      } catch (error) {
        console.error("Ошибка при загрузке откликов:", error);

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
          this.error = error.message || "Не удалось загрузить отклики";
        }

        // Возвращаем пустой массив вместо выброса ошибки, чтобы предотвратить ошибки в UI
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

    async applyForJob(jobId, data) {
      this.loading = true;
      this.error = null;
      try {
        console.log(`Отклик на вакансию ${jobId} с данными:`, data);

        // В режиме разработки создаем имитацию заявки напрямую
        if (import.meta.env.DEV) {
          console.log(
            "РЕЖИМ РАЗРАБОТКИ: Создание отклика напрямую без вызова API"
          );

          // Добавляем оповещение для отладки
          alert(
            "РЕЖИМ РАЗРАБОТКИ: Создание mock отклика для вакансии " + jobId
          );

          // Получаем информацию о пользователе для имитационных данных
          let userData = {};
          try {
            const userJson = localStorage.getItem("user");
            if (userJson) {
              const authUser = JSON.parse(userJson);
              userData = {
                user_id: authUser.id || Date.now(),
                username: authUser.username || "user",
                role: authUser.profile?.role || "jobseeker",
              };
            } else {
              userData = {
                user_id: Date.now(),
                username: "testuser",
                role: "jobseeker",
              };
            }
          } catch (err) {
            console.error("Ошибка при получении данных пользователя:", err);
            userData = {
              user_id: Date.now(),
              username: "testuser",
              role: "jobseeker",
            };
          }

          // Получаем информацию о резюме для всех заявок
          let resumeInfo = "";
          let resumeLink = "";
          try {
            const resumes = JSON.parse(localStorage.getItem("resumes") || "[]");
            console.log("Доступные резюме:", JSON.stringify(resumes));

            // Всегда используем первое резюме по умолчанию
            if (resumes && resumes.length > 0) {
              const selectedResume = resumes[0];
              console.log(
                "Использование резюме:",
                JSON.stringify(selectedResume)
              );

              const resumeTitle =
                selectedResume.title ||
                selectedResume.name ||
                "Frontend frerfe";
              const resumeIdToUse = selectedResume.id || 1;

              // Получаем подробную информацию о резюме для отображения в сообщении
              let skills =
                selectedResume.skills && selectedResume.skills.length > 0
                  ? selectedResume.skills.join(", ")
                  : "JavaScript, Vue.js, Node.js";

              let experience = selectedResume.experience || "5+ лет";
              let education = selectedResume.education || "Высшее образование";

              resumeInfo = `\n\nРезюме: ${resumeTitle}\nОпыт работы: ${experience}\nНавыки: ${skills}\nОбразование: ${education}`;
              resumeLink = `\n\n👉 Открыть полное резюме: /resumes/${resumeIdToUse}`;

              console.log("Информация о резюме подготовлена:", resumeInfo);
            }
          } catch (err) {
            console.error("Ошибка при получении информации о резюме:", err);
          }

          // Создаем имитацию ответа заявки
          const mockApplication = {
            id: Date.now(),
            job: jobId,
            user_id: userData.user_id,
            username: userData.username,
            status: "pending",
            created_at: new Date().toISOString(),
            cover_letter: data.cover_letter || "",
            message: data.message || "",
            expected_salary: data.expected_salary || 0,
            contact_preference: data.contact_preference || "email",
            resume: data.resume || null,
          };

          console.log(
            "РЕЖИМ РАЗРАБОТКИ: Создан тестовый отклик:",
            mockApplication
          );

          // Добавляем в локальное состояние
          if (Array.isArray(this.myApplications)) {
            this.myApplications.unshift(mockApplication);
          } else {
            this.myApplications = [mockApplication];
          }

          // Сохраняем в localStorage
          this._persistMockApplications(mockApplication);

          // Запускаем обновление количества заявок
          this._triggerApplicationCountRefresh(jobId);

          console.log(
            "РЕЖИМ РАЗРАБОТКИ: Тестовый отклик успешно создан:",
            mockApplication
          );

          // Создаем беседу по вакансии в чате
          try {
            const chatStore = useChatStore();

            if (
              chatStore &&
              typeof chatStore.addMockConversation === "function"
            ) {
              console.log(
                "РЕЖИМ РАЗРАБОТКИ: Создание тестового диалога для отклика на вакансию"
              );

              // Генерируем ID беседы
              const conversationId = `job_${jobId}_${Date.now()}`;
              const now = new Date().toISOString();

              // Создаем объект беседы
              const conversation = {
                id: conversationId,
                job_id: jobId,
                job: {
                  id: jobId,
                  title: "Job #" + jobId,
                },
                unread: 1,
                unread_count: 1,
                last_message: data.message || "Я заинтересован в этой вакансии",
                last_message_text:
                  data.message || "Я заинтересован в этой вакансии",
                last_message_time: now,
                last_message_date: now,
                employer_name: "Работодатель",
                jobseeker_name: userData.username,
                participants: [
                  { id: 1, username: "Работодатель", is_employer: true },
                  {
                    id: userData.user_id,
                    username: userData.username,
                    is_employer: false,
                  },
                ],
              };

              // Создаем начальные сообщения с информацией о резюме
              const welcomeMessage = {
                id: Date.now(),
                conversation_id: conversationId,
                sender: 1, // От работодателя
                sender_name: "Работодатель",
                text: `Здравствуйте! Спасибо за отклик на нашу вакансию. Мы рассмотрим ваше резюме в ближайшее время.`,
                created_at: now,
                is_read: false,
              };

              // Всегда включаем информацию о резюме в сообщение заявки
              const applicationMessage = {
                id: Date.now() + 1,
                conversation_id: conversationId,
                sender: userData.user_id, // От соискателя
                sender_name: "Вы",
                text:
                  (data.message || "Здравствуйте, я заинтересован в вакансии") +
                  resumeInfo +
                  resumeLink,
                created_at: new Date(Date.now() + 1000).toISOString(),
                is_read: true,
              };

              // Получаем актуальное название вакансии из localStorage
              try {
                const storedJobs = JSON.parse(
                  localStorage.getItem("jobs") || "[]"
                );
                const jobData = storedJobs.find(
                  (j) => Number(j.id) === Number(jobId)
                );
                if (jobData && jobData.title) {
                  conversation.job.title = jobData.title;
                  console.log(
                    "РЕЖИМ РАЗРАБОТКИ: Найдено актуальное название вакансии:",
                    jobData.title
                  );
                }

                // Создаем беседу с фактическими деталями вакансии
                chatStore.addMockConversation(conversation, [
                  welcomeMessage,
                  applicationMessage,
                ]);
              } catch (error) {
                console.error(
                  "РЕЖИМ РАЗРАБОТКИ: Ошибка при получении названия вакансии или создании диалога:",
                  error
                );
                // Резервный вариант с оригинальной логикой
                chatStore.addMockConversation(conversation, [
                  welcomeMessage,
                  applicationMessage,
                ]);
              }

              console.log(
                "РЕЖИМ РАЗРАБОТКИ: Тестовый диалог создан:",
                conversationId
              );
            }
          } catch (chatErr) {
            console.error(
              "РЕЖИМ РАЗРАБОТКИ: Ошибка при создании тестового диалога:",
              chatErr
            );
          }

          return mockApplication;
        }

        // Для режима производства используем API
        const formattedData = {
          job: jobId,
          resume: data.resume,
          cover_letter: data.cover_letter || "",
          message: data.message || "",
          expected_salary: data.expected_salary || "",
          contact_preference: data.contact_preference || "email",
          start_chat: data.start_chat !== false,
        };

        console.log("Данные для отправки:", formattedData);

        // Явно добавляем заголовок авторизации
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.post(
          "/api/jobs/applications/",
          formattedData,
          {
            headers,
            timeout: 15000,
          }
        );

        console.log("Отклик успешно отправлен:", response.data);

        if (Array.isArray(this.myApplications)) {
          this.myApplications.unshift(response.data);
        } else {
          this.myApplications = [response.data];
        }

        // В режиме разработки сохраняем заявки в localStorage для сохранения между сессиями
        if (import.meta.env.DEV) {
          this._persistMockApplications(response.data);
        }

        // Сигнализируем о необходимости обновления количества заявок
        this._triggerApplicationCountRefresh(jobId);

        // Обновляем список бесед в чате сразу после отправки заявки
        try {
          const chatStore = useChatStore();
          await chatStore.fetchConversations(true);
          console.log("Список бесед обновлен после отправки заявки");
        } catch (chatError) {
          console.error("Ошибка при обновлении списка бесед:", chatError);
        }

        return response.data;
      } catch (error) {
        console.error(`Ошибка при отклике на вакансию ${jobId}:`, error);

        // В режиме разработки не завершаемся полным сбоем - создаем имитацию заявки
        if (import.meta.env.DEV) {
          console.log(
            "РЕЖИМ РАЗРАБОТКИ: API не отвечает, используем тестовый отклик"
          );
          alert(
            "РЕЖИМ РАЗРАБОТКИ: API не отвечает, создаем резервный тестовый отклик"
          );

          // Создаем запасную имитацию заявки
          const mockApplication = {
            id: Date.now(),
            job: jobId,
            status: "pending",
            created_at: new Date().toISOString(),
            cover_letter: data.cover_letter || "",
            message:
              data.message || "Fallback application created after API error",
            resume: data.resume || null,
          };

          // Добавляем в состояние
          if (Array.isArray(this.myApplications)) {
            this.myApplications.unshift(mockApplication);
          } else {
            this.myApplications = [mockApplication];
          }

          // Сохраняем в localStorage
          this._persistMockApplications(mockApplication);

          // Запускаем обновление количества заявок
          this._triggerApplicationCountRefresh(jobId);

          console.log(
            "РЕЖИМ РАЗРАБОТКИ: Создан резервный тестовый отклик:",
            mockApplication
          );
          return mockApplication;
        }

        // Для производства устанавливаем подробную информацию об ошибке
        if (error.response && error.response.data) {
          this.error = error.response.data;
        } else if (error.message) {
          this.error = { general: error.message };
        } else {
          this.error = { general: "Произошла ошибка при отправке заявки" };
        }

        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Приватный метод для сохранения имитационных заявок в localStorage
    _persistMockApplications(applicationData) {
      try {
        console.log(
          "РЕЖИМ РАЗРАБОТКИ: Сохранение отклика в localStorage:",
          applicationData
        );

        // Убедимся, что у нас есть все необходимые данные
        if (!applicationData.job) {
          console.error(
            "Отсутствует ID вакансии в данных отклика",
            applicationData
          );
          return;
        }

        // Получаем существующие заявки
        let applications = [];
        try {
          const stored = localStorage.getItem("mockJobApplications");
          if (stored) {
            applications = JSON.parse(stored);
            console.log(
              `РЕЖИМ РАЗРАБОТКИ: Найдено ${applications.length} существующих откликов в localStorage`
            );
          }
        } catch (err) {
          console.error("Ошибка при разборе сохраненных откликов:", err);
          // Если произошла ошибка, начинаем с чистого массива
          applications = [];
        }

        // Получаем информацию о пользователе из хранилища аутентификации
        let userData = {};
        try {
          const authStore = JSON.parse(localStorage.getItem("user")) || {};
          userData = {
            user_id: authStore.id || Date.now(),
            username: authStore.username || "user",
            role: authStore.role || "jobseeker",
          };
        } catch (err) {
          console.error("Ошибка при получении данных пользователя:", err);
          userData = {
            user_id: Date.now(),
            username: "user",
            role: "jobseeker",
          };
        }

        // Убедимся, что у нас правильный формат вакансии
        const jobId =
          typeof applicationData.job === "object"
            ? applicationData.job.id
            : applicationData.job;

        // Подготавливаем данные заявки со всеми необходимыми полями
        const completeApplicationData = {
          id: applicationData.id || Date.now(),
          job: jobId,
          user_id: userData.id || applicationData.user_id || Date.now(),
          username:
            userData.username || applicationData.username || "Пользователь",
          status: applicationData.status || "pending",
          created_at: applicationData.created_at || new Date().toISOString(),
          ...applicationData, // Включаем все остальные поля
        };

        // Проверяем, существует ли уже эта заявка
        const existingIndex = applications.findIndex(
          (a) =>
            a.id === completeApplicationData.id ||
            (a.job == jobId && a.user_id == userData.user_id)
        );

        if (existingIndex >= 0) {
          // Обновляем существующую заявку
          applications[existingIndex] = {
            ...applications[existingIndex],
            ...completeApplicationData,
          };
          console.log(
            "РЕЖИМ РАЗРАБОТКИ: Обновлен существующий отклик в localStorage"
          );
        } else {
          // Добавляем новую заявку
          applications.push(completeApplicationData);
          console.log("РЕЖИМ РАЗРАБОТКИ: Добавлен новый отклик в localStorage");
        }

        // Сохраняем обратно в localStorage
        localStorage.setItem(
          "mockJobApplications",
          JSON.stringify(applications)
        );

        console.log(
          "РЕЖИМ РАЗРАБОТКИ: Отклик сохранен в localStorage:",
          applications.length,
          "откликов всего"
        );

        // Принудительно обновляем количество заявок в хранилище вакансий
        setTimeout(() => {
          this._triggerApplicationCountRefresh(jobId);
        }, 500);

        // Также обновляем хранилище вакансий напрямую, если возможно
        try {
          // Обновляем хранилище вакансий
          const { useJobsStore } = require("./jobs");
          const jobsStore = useJobsStore();
          if (jobsStore) {
            console.log(
              "РЕЖИМ РАЗРАБОТКИ: Прямое обновление счетчика откликов в хранилище вакансий"
            );

            // Получаем вакансии
            const jobsJson = localStorage.getItem("jobs");
            if (jobsJson) {
              try {
                let jobs = JSON.parse(jobsJson);

                // Увеличиваем количество заявок
                const targetJob = jobs.find((j) => j.id == jobId);
                if (targetJob) {
                  targetJob.applications_count =
                    (targetJob.applications_count || 0) + 1;
                  console.log(
                    `РЕЖИМ РАЗРАБОТКИ: Увеличено количество откликов для вакансии ${jobId} до ${targetJob.applications_count}`
                  );

                  // Сохраняем обратно в localStorage
                  localStorage.setItem("jobs", JSON.stringify(jobs));
                }
              } catch (err) {
                console.error(
                  "Ошибка при обновлении вакансий в localStorage:",
                  err
                );
              }
            }

            // Обновляем хранилище, если возможно
            if (typeof jobsStore.refreshApplicationCounts === "function") {
              jobsStore.refreshApplicationCounts();
            }
          }
        } catch (err) {
          console.error("Ошибка при обновлении хранилища вакансий:", err);
        }
      } catch (err) {
        console.error("Ошибка при сохранении отклика в localStorage:", err);
      }
    },

    // Приватный метод для запуска обновления количества заявок
    _triggerApplicationCountRefresh(jobId) {
      try {
        // Используем хранилище вакансий для обновления количества заявок
        const { useJobsStore } = require("@/stores/jobs");
        const jobsStore = useJobsStore();
        if (
          jobsStore &&
          typeof jobsStore.refreshApplicationCounts === "function"
        ) {
          console.log("Запуск обновления счетчика откликов");
          jobsStore.refreshApplicationCounts();
        }
      } catch (err) {
        console.error("Ошибка при запуске обновления счетчика откликов:", err);
      }
    },

    // Получение заявок для конкретной вакансии
    async getApplicationsByJob(jobId) {
      if (!jobId) {
        console.error("getApplicationsByJob: Не указан ID вакансии");
        return [];
      }

      console.log(
        `getApplicationsByJob: Загрузка откликов для вакансии ${jobId}`
      );

      try {
        // Сначала пробуем получить из API
        await this.fetchJobApplications(jobId);
        const apiApplications = this.jobApplications[jobId] || [];

        // Получаем заявки из localStorage
        const storedApplications = this._getStoredApplicationsForJob(jobId);

        // Объединяем результаты
        const combinedApplications = this._mergeJobApplications(
          apiApplications,
          storedApplications
        );

        return combinedApplications;
      } catch (error) {
        console.error(
          `Ошибка в getApplicationsByJob для вакансии ${jobId}:`,
          error
        );

        // В случае ошибки, используем только localStorage
        return this._getStoredApplicationsForJob(jobId);
      }
    },

    // Вспомогательный метод для получения заявок из localStorage для конкретной вакансии
    _getStoredApplicationsForJob(jobId) {
      try {
        const storedJson = localStorage.getItem("mockJobApplications");
        if (!storedJson) return [];

        const storedApps = JSON.parse(storedJson);
        return storedApps.filter(
          (app) => app.job == jobId || (app.job && app.job.id == jobId)
        );
      } catch (err) {
        console.error("Ошибка при получении сохраненных откликов:", err);
        return [];
      }
    },

    // Объединение заявок из API и localStorage для вакансии
    _mergeJobApplications(apiApps, storedApps) {
      const mergedApps = [...apiApps];
      // Обновляем статусы из localStorage
      for (let i = 0; i < mergedApps.length; i++) {
        const app = mergedApps[i];
        const storedApp = storedApps.find(
          (sa) =>
            String(sa.id) === String(app.id) ||
            (String(sa.job) === String(app.job) && sa.user_id === app.user_id)
        );

        if (storedApp && storedApp.status) {
          app.status = storedApp.status;
        }
      }

      // Добавляем недостающие заявки из localStorage
      for (const storedApp of storedApps) {
        const exists = mergedApps.some(
          (app) =>
            String(app.id) === String(storedApp.id) ||
            (String(app.job) === String(storedApp.job) &&
              app.user_id === storedApp.user_id)
        );

        if (!exists) {
          mergedApps.push(storedApp);
        }
      }

      return mergedApps;
    },

    async updateApplicationStatus(applicationId, status) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.patch(
          `/api/jobs/applications/${applicationId}/`,
          {
            status: status,
          }
        );

        // Обновляем в списках заявок на вакансии
        Object.keys(this.jobApplications).forEach((jobId) => {
          const index = this.jobApplications[jobId].findIndex(
            (app) => app.id === applicationId
          );
          if (index !== -1) {
            this.jobApplications[jobId][index] = response.data;
          }
        });

        // Обновляем в моих заявках, если присутствуют
        const myIndex = this.myApplications.findIndex(
          (app) => app.id === applicationId
        );
        if (myIndex !== -1) {
          this.myApplications[myIndex] = response.data;
        }

        return response.data;
      } catch (error) {
        this.error =
          error.response?.data || "Не удалось обновить статус отклика";
        console.error("Ошибка при обновлении статуса отклика:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async withdrawApplication(applicationId) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`/api/jobs/applications/${applicationId}/`);

        // Удаляем из моих заявок
        this.myApplications = this.myApplications.filter(
          (app) => app.id !== applicationId
        );

        // Удаляем из списков заявок на вакансии
        Object.keys(this.jobApplications).forEach((jobId) => {
          this.jobApplications[jobId] = this.jobApplications[jobId].filter(
            (app) => app.id !== applicationId
          );
        });

        return true;
      } catch (error) {
        this.error = error.response?.data || "Не удалось отозвать отклик";
        console.error("Ошибка при отзыве отклика:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async startChatWithEmployer(jobId) {
      try {
        // Ищем заявку для этой вакансии
        const application = this.myApplications.find(
          (app) => app.job.id === Number(jobId)
        );
        let message = "";

        if (application) {
          // Используем сообщение из заявки, если доступно
          message =
            application.message ||
            application.cover_letter ||
            "Здравствуйте, я отправил отклик на вашу вакансию и хотел бы обсудить детали.";
        } else {
          message =
            "Здравствуйте, я заинтересован в вашей вакансии и хотел бы обсудить детали.";
        }

        // Получаем детали вакансии
        let jobData = null;
        try {
          const jobResponse = await axios.get(`/api/jobs/${jobId}/`);
          jobData = jobResponse.data;
        } catch (err) {
          console.warn(`Не удалось получить детали вакансии ${jobId}`, err);
        }

        const employerId = jobData?.employer?.id || jobData?.user?.id || null;

        const response = await axios.post("/api/jobs/messages/start_chat/", {
          job_id: jobId,
          employer_id: employerId,
          initial_message: message,
        });

        return response.data;
      } catch (error) {
        console.error(`Ошибка при начале чата для вакансии ${jobId}:`, error);
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

        // Запускаем обновление всех вакансий
        this._triggerApplicationCountRefresh();
      } catch (err) {
        console.error("Ошибка при исправлении хранилища откликов:", err);
      }
    },
  },
});
