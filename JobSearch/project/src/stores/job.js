import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";

export const useJobStore = defineStore("job", {
  state: () => ({
    jobs: [],
    applications: [],
    loading: false,
    error: null,
  }),

  actions: {
    async createJob(jobData) {
      try {
        // Всегда сохраняем в localStorage для обеспечения резервного копирования данных
        try {
          // Получаем существующие вакансии
          const existingJobs = JSON.parse(localStorage.getItem("jobs") || "[]");

          // Создание новой вакансии с уникальным ID на основе временной метки
          const newJob = {
            ...jobData,
            id: Date.now(), // Используем временную метку в качестве ID
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
            employer_id: useAuthStore().user?.id || "default_employer",
          };

          // Сохраняем в localStorage
          localStorage.setItem(
            "jobs",
            JSON.stringify([...existingJobs, newJob])
          );
          console.log("Job saved to localStorage", newJob);
        } catch (storageError) {
          console.error("Error saving job to localStorage", storageError);
        }

        // Всегда пытаемся сохранить на сервере
        try {
          const response = await axios.post("/api/jobs/", jobData);
          this.jobs.push(response.data);
          return response.data;
        } catch (apiError) {
          console.error("API error while creating job:", apiError);
          throw apiError;
        }
      } catch (error) {
        console.error("Error creating job:", error);
        throw error;
      }
    },

    async updateJob(jobId, jobData) {
      try {
        const response = await axios.put(`/api/jobs/${jobId}/`, jobData);
        const index = this.jobs.findIndex((job) => job.id === jobId);
        if (index !== -1) {
          this.jobs[index] = response.data;
        }
        return response.data;
      } catch (error) {
        console.error(
          "Ошибка обновления вакансии:",
          error.response?.data || error.message
        );
        throw error;
      }
    },

    async deleteJob(jobId) {
      this.loading = true;
      this.error = null;

      // Преобразуем jobId в число для сравнения
      jobId = Number(jobId);
      console.log(`Начало удаления вакансии с ID: ${jobId}`);

      try {
        // Обработка удаления в режиме разработки с надежной обработкой ошибок
        if (import.meta.env.DEV) {
          console.log(
            `РЕЖИМ РАЗРАБОТКИ: Удаление вакансии ${jobId} из localStorage`
          );

          // Сначала очистим все кэшированные данные, которые могут быть связаны с этой вакансией
          try {
            // 1. Обрабатываем основной массив вакансий в localStorage
            const jobsJson = localStorage.getItem("jobs");
            if (jobsJson) {
              let jobs = JSON.parse(jobsJson);

              // Отслеживаем начальное количество для проверки удаления
              const initialCount = jobs.length;
              const jobToDelete = jobs.find((job) => Number(job.id) === jobId);

              if (!jobToDelete) {
                console.warn(
                  `РЕЖИМ РАЗРАБОТКИ: Вакансия ${jobId} не найдена в localStorage, нечего удалять`
                );
              } else {
                console.log(
                  `РЕЖИМ РАЗРАБОТКИ: Найдена вакансия для удаления: "${jobToDelete.title}"`
                );

                // Фильтруем вакансию для удаления
                jobs = jobs.filter((job) => Number(job.id) !== jobId);

                // Сохраняем обратно в localStorage
                localStorage.setItem("jobs", JSON.stringify(jobs));
                console.log(
                  `РЕЖИМ РАЗРАБОТКИ: Вакансия удалена из localStorage. До: ${initialCount}, После: ${jobs.length}`
                );

                // Показываем подтверждение
                alert(`Вакансия "${jobToDelete.title}" успешно удалена`);
              }
            }

            // 2. Очищаем заявки
            try {
              const applicationsJson = localStorage.getItem(
                "mockJobApplications"
              );
              if (applicationsJson) {
                let applications = JSON.parse(applicationsJson);
                if (Array.isArray(applications)) {
                  const initialApps = applications.length;
                  applications = applications.filter(
                    (app) => Number(app.job) !== jobId
                  );
                  localStorage.setItem(
                    "mockJobApplications",
                    JSON.stringify(applications)
                  );
                  console.log(
                    `РЕЖИМ РАЗРАБОТКИ: Removed applications for job. Before: ${initialApps}, After: ${applications.length}`
                  );
                }
              }
            } catch (appError) {
              console.error(
                `РЕЖИМ РАЗРАБОТКИ: Ошибка при очистке откликов для вакансии ${jobId}:`,
                appError
              );
            }

            // 3. Удаляем из сохраненных вакансий
            try {
              const savedJobsJson = localStorage.getItem("savedJobs");
              if (savedJobsJson) {
                let savedJobs = JSON.parse(savedJobsJson);
                if (Array.isArray(savedJobs)) {
                  const initialSaved = savedJobs.length;
                  savedJobs = savedJobs.filter((job) => {
                    // Обрабатываем разные форматы сохраненных вакансий
                    if (typeof job === "object") {
                      if (job.id) return Number(job.id) !== jobId;
                      if (job.job && job.job.id)
                        return Number(job.job.id) !== jobId;
                    }
                    return true;
                  });
                  localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
                  console.log(
                    `РЕЖИМ РАЗРАБОТКИ: Removed job from saved jobs. Before: ${initialSaved}, After: ${savedJobs.length}`
                  );
                }
              }
            } catch (savedError) {
              console.error(
                `РЕЖИМ РАЗРАБОТКИ: Ошибка при очистке сохраненных вакансий для вакансии ${jobId}:`,
                savedError
              );
            }

            // 4. Обновляем массив вакансий в хранилище
            this.jobs = this.jobs.filter((job) => Number(job.id) !== jobId);

            console.log(
              `РЕЖИМ РАЗРАБОТКИ: Вакансия ${jobId} полностью удалена из всех хранилищ`
            );
            this.loading = false;
            return true;
          } catch (error) {
            console.error(
              `РЕЖИМ РАЗРАБОТКИ: Ошибка при удалении вакансии ${jobId}:`,
              error
            );
            alert(`Ошибка при удалении вакансии: ${error.message}`);
            throw error;
          }
        }

        // Обработка продакшн-режима
        await axios.delete(`/api/jobs/${jobId}/`);
        console.log(`Режим продакшн: Вакансия ${jobId} удалена через API`);

        // Обновляем локальное состояние
        this.jobs = this.jobs.filter((job) => Number(job.id) !== jobId);

        return true;
      } catch (error) {
        console.error(`Ошибка при удалении вакансии ${jobId}:`, error);
        const errorMessage =
          error.response?.data?.detail || error.message || "Unknown error";
        this.error = `Failed to delete job: ${errorMessage}`;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getJobs(filters = {}) {
      try {
        this.loading = true;
        console.log("Store getJobs: получение вакансий с фильтрами:", filters);

        // По умолчанию получаем только активные вакансии в публичном списке
        const defaultFilters = { is_active: true };
        const mergedFilters = { ...defaultFilters, ...filters };

        // Создаем параметры запроса из фильтров
        const queryParams = new URLSearchParams();
        Object.entries(mergedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value);
          }
        });

        const queryString = queryParams.toString();
        const url = `/api/jobs/${queryString ? `?${queryString}` : ""}`;

        console.log(`Store getJobs: вызов API ${url}`);
        const response = await axios.get(url);

        let jobs = [];
        if (response.data.results) {
          jobs = response.data.results;
        } else if (Array.isArray(response.data)) {
          jobs = response.data;
        }

        // Дополнительная фильтрация на стороне клиента для гарантии
        jobs = jobs.filter((job) => job.is_active === true);

        console.log(`Store getJobs: получено ${jobs.length} вакансий`);
        this.jobs = jobs;
        return jobs;
      } catch (error) {
        console.error("Store getJobs: ошибка получения вакансий:", error);
        // В случае ошибки API просто возвращаем пустой массив
        return [];
      } finally {
        this.loading = false;
      }
    },

    async getEmployerJobs() {
      this.loading = true;
      this.error = null;
      try {
        console.log("getEmployerJobs: Получение вакансий работодателя");

        // Получаем информацию о текущем пользователе из хранилища авторизации
        const authStore = useAuthStore();
        const currentUser = authStore.user;

        if (!currentUser || !currentUser.id) {
          console.warn(
            "getEmployerJobs: Пользователь не авторизован или не имеет ID"
          );
          this.jobs = [];
          return [];
        }

        // Делаем запрос к API для получения вакансий текущего работодателя
        try {
          const response = await axios.get("/api/jobs/my/");
          console.log("Получены вакансии работодателя:", response.data);

          if (response.data) {
            if (Array.isArray(response.data.results)) {
              this.jobs = response.data.results;
            } else if (Array.isArray(response.data)) {
              this.jobs = response.data;
            } else {
              console.warn(
                "Неожиданный формат данных в ответе API",
                response.data
              );
              this.jobs = [];
            }
          } else {
            this.jobs = [];
          }

          return this.jobs;
        } catch (apiError) {
          console.error("Ошибка при запросе вакансий работодателя:", apiError);

          // Если в localStorage есть данные, используем их как запасной вариант
          const localJobs = localStorage.getItem("jobs");
          if (localJobs) {
            try {
              const parsedJobs = JSON.parse(localJobs);
              if (Array.isArray(parsedJobs)) {
                // Фильтруем только вакансии текущего работодателя
                const employerJobs = parsedJobs.filter(
                  (job) => job.employer_id === currentUser.id
                );
                console.log(
                  `Найдено ${employerJobs.length} вакансий работодателя в localStorage`
                );
                this.jobs = employerJobs;
                return employerJobs;
              }
            } catch (e) {
              console.error("Ошибка при парсинге данных из localStorage:", e);
            }
          }

          throw apiError;
        }
      } catch (error) {
        console.error("Ошибка при получении вакансий работодателя:", error);
        this.error =
          "Не удалось загрузить ваши вакансии. Пожалуйста, попробуйте снова позже.";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async applyForJob(jobId, applicationData) {
      try {
        // Проверяем, не является ли пользователь работодателем
        const authStore = useAuthStore();
        if (
          authStore.user?.profile?.role === "employer" ||
          authStore.isEmployer
        ) {
          throw new Error("Работодатели не могут откликаться на вакансии");
        }

        const response = await axios({
          method: "post",
          url: `/api/jobs/${jobId}/apply/`,
          data: applicationData,
        });
        this.applications.push(response.data);
        return response.data;
      } catch (error) {
        console.error(
          "Ошибка при отклике на вакансию:",
          error.response?.data || error.message
        );
        throw error;
      }
    },

    async getUserApplications() {
      try {
        const response = await axios.get("/api/applications/");
        this.applications = response.data;
        return response.data;
      } catch (error) {
        console.error(
          "Ошибка при получении откликов:",
          error.response?.data || error.message
        );
        throw error;
      }
    },

    async updateApplicationStatus(applicationId, status) {
      try {
        const response = await axios({
          method: "post",
          url: `/api/applications/${applicationId}/update-status/`,
          data: { status },
        });
        const index = this.applications.findIndex(
          (app) => app.id === applicationId
        );
        if (index !== -1) {
          this.applications[index] = response.data;
        }
        return response.data;
      } catch (error) {
        console.error(
          "Ошибка при обновлении статуса отклика:",
          error.response?.data || error.message
        );
        throw error;
      }
    },

    async getJob(jobId) {
      this.loading = true;
      this.error = null;
      try {
        console.log(`getJob: Загрузка вакансии с ID ${jobId}`);

        // Преобразуем jobId в число для согласованного сравнения
        const numericJobId = Number(jobId);

        // Используем API для получения вакансии из бэкенда напрямую
        const response = await axios.get(`/api/jobs/${jobId}/`, {
          timeout: 10000,
        });

        if (response.data) {
          this.selectedJob = response.data;
          return response.data;
        } else {
          console.error("Пустой ответ для вакансии", jobId);
          this.error = "Вакансия не найдена";
          throw new Error("Вакансия не найдена");
        }
      } catch (error) {
        console.error("Ошибка при загрузке деталей вакансии:", error);

        if (error.response && error.response.status === 404) {
          this.error = "Вакансия не найдена в базе данных";
        } else {
          this.error =
            error.message || "Не удалось загрузить вакансию. Попробуйте позже.";
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
